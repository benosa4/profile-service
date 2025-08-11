// src/domain/services/nats-authorizer.service.ts

import { INatsAuthorizerService } from '../ports/in/nats-authorizer.service.interface';
import { IIAMService } from '../ports/in/iam.service.interface';
import { IUserPermissionsService } from '../ports/in/user-permissions.service.interface';
import {
  ILogger,
  Init,
  Inject,
  Logger,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import {
  encode,
  Algorithms,
  KeyPair,
  fromSeed,
} from '@nats-io/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '../../infrastructure/configuration/config.service';

@Provide('INatsAuthorizerService')
@Scope(ScopeEnum.Singleton)
export class NatsAuthorizerService implements INatsAuthorizerService {

  @Logger()
  private logger: ILogger;

  @Inject()
  private readonly configService: ConfigService;

  @Inject('IIAMService')
  private readonly iamService: IIAMService;

  @Inject('IUserPermissionsService')
  private readonly userPermissionsService: IUserPermissionsService;

  /**
   * Публичный ключ аккаунта (начинается на "A...").
   * Должен совпадать с auth_callout.issuer в конфиге NATS.
   */
  private ACCOUNT_PUBLIC_KEY: string;

  /**
   * Seed (приватный ключ) аккаунта (начинается на "SA...").
   * Им подписываем наши JWT через encode().
   */
  private NATS_AUTH_NKEY_SEED: string;
  private signingKeyPair: KeyPair;

  constructor() {}

  /**
   * Метод, который вызывается NATS при auth_callout.
   */
  async authorizeUser(authRequestStr: string): Promise<string> {
    try {
      // 1. Разбиваем пришедший JWT authRequestStr на части (header, payload, signature)
      const [headerB64, payloadB64] = authRequestStr.split('.', 3);
      if (!payloadB64 && !headerB64) {
        return await this.createErrorResponse({
          message: 'Invalid auth request format (missing payload)',
        });
      }

      const decodedPayload = Buffer.from(payloadB64, 'base64').toString('utf-8');
      const json = JSON.parse(decodedPayload);
      const { nats } = json;

      this.logger.debug(json);

      // Публичный ключ сервера (NATS), используем в aud
      const serverID = nats?.server_id?.id || '';
      // Публичный ключ клиента (userNKey)
      const userNKey = nats?.user_nkey || '';
      
      const user = nats?.connect_opts?.user;
      const passwd = nats?.connect_opts?.pass;
      let _permissions; 

      if( user && passwd) {
        const userItem = await this.userPermissionsService.getUserItemByLogin(user);

        if (!userItem) {
          // Ошибка: нет такого пользователя
        }

        // Из записи берем hashed пароль
        const storedHash = userItem.password_hash;

        if (!storedHash) {
          return await this.createErrorResponse({
            userNKey,
            serverID,
            message: 'Не заполнено поле пароля? (ошибка или политика)',
          });
        }

        // 2) Проверяем пароль (bcrypt.compare)
        const match = await bcrypt.compare(passwd, storedHash);
        if (!match) {
          return await this.createErrorResponse({
            userNKey,
            serverID,
            message: 'пароль неверный',
          });
        }

        const { permissions } = await this.userPermissionsService.getUserPermissionsByLogin(user);

        _permissions = permissions;
      } else {

        // В нашем случае auth_token — это Keycloak JWT
        const jwtToken = nats?.connect_opts?.auth_token;
        if (!jwtToken) {
          return await this.createErrorResponse({
            userNKey,
            serverID,
            message: 'Missing Keycloak JWT token',
          });
        }

        // 2. Проверяем Keycloak-токен
        const keycloakClaims = await this.iamService.verifyKeycloakJWT(jwtToken);
        if (!keycloakClaims) {
          return await this.createErrorResponse({
            userNKey,
            serverID,
            message: 'Invalid Keycloak JWT',
          });
        }

        // Допустим userId = user_id из токена
        const userId = keycloakClaims.user_id || '';
        if (!userId) {
          return await this.createErrorResponse({
            userNKey,
            serverID,
            message: 'No userId (email) in Keycloak claims',
          });
        }

        // 3. Загружаем разрешения пользователя из базы
        //    (индивидуальные права + групповые)
        const { permissions } = await this.userPermissionsService.getUserPermissions(userId);

        this.logger.debug("=============", permissions);



        _permissions = permissions;
      }

      if (!_permissions || _permissions.length === 0) {
        this.logger.debug("I'm here");
        return await this.createErrorResponse({
          userNKey,
          serverID,
          message: 'No permissions assigned to this user',
        });
      }
      this.logger.debug("I'm here 2");
      // Пример: permissions = ["publish:app.chat.123","subscribe:app.chat.456","subscribe:app.chat.>"]

      // 4. Формируем списки publishAllow / subscribeAllow на основе строк:
      //    без всяких if: просто фильтруем по префиксу
      const publishAllow = _permissions
        .filter(p => p.startsWith('publish:'))
        .map(p => p.replace('publish:', '').trim());

      const subscribeAllow = _permissions
        .filter(p => p.startsWith('subscribe:'))
        .map(p => p.replace('subscribe:', '').trim());

      // 5. Формируем user-JWT (type="user"), задаём пермишны
      const userNatsJwt = await this.createUserClaims({
        userNKey,
        accountName: 'mainAccount', // можно подставить userId, если нужно
        publish: publishAllow,
        subscribe: subscribeAllow,
      });

      // 6. Оборачиваем в authorization_response (type="authorization_response")
      return await this.createAuthorizationResponse({
        userNKey,
        serverID,
        userNatsJwt,
      });

    } catch (error) {
      this.logger.error('Auth Error:', error);
      // Любые сбои => возвращаем error_response
      return await this.createErrorResponse({
        message: error?.message || 'Internal Server Error',
      });
    }
  }

  /**
   * Создаёт "user" JWT для NATS с конкретными разрешениями.
   */
  private async createUserClaims(params: {
    userNKey: string;
    accountName: string;
    publish: string[];
    subscribe: string[];
  }): Promise<string> {
    const { userNKey, accountName, publish, subscribe } = params;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 30; // на пол минуты

    const userClaims = {
      jti: Math.random().toString(36).slice(2),
      iat: now,
      exp,
      iss: this.ACCOUNT_PUBLIC_KEY,  // публичный ключ аккаунта (A...)
      sub: userNKey,                 // публичный ключ пользователя (U...)

      name: accountName, // символическое имя (что угодно)
      aud: 'AUTH',       // audience

      nats: {
        type: 'user',
        version: 2,
        pub:{
          allow: [...publish],
          dany: [">"]
        },
        sub: {
          allow: [...subscribe],
          dany: [">"]
        },
        limits: {
          payload: 1024 * 1024,
        },
      },
    };

    return encode(Algorithms.v2, userClaims, this.signingKeyPair);
  }

  /**
   * Обёртка для отправки итогового ответа (authorization_response) NATS-серверу.
   */
  private async createAuthorizationResponse(params: {
    userNKey?: string;
    serverID?: string;
    userNatsJwt: string;
  }): Promise<string> {
    const { userNKey = '', serverID = '', userNatsJwt } = params;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    const authRespClaims = {
      jti: Math.random().toString(36).slice(2),
      iat: now,
      exp,
      iss: this.ACCOUNT_PUBLIC_KEY,
      sub: userNKey,
      name: 'authorization_response',
      aud: serverID,

      nats: {
        type: 'authorization_response',
        version: 1,
        jwt: userNatsJwt,
      },
    };

    return encode(Algorithms.v2, authRespClaims, this.signingKeyPair);
  }

  /**
   * Формируем JWT c nats.error, чтобы отказать клиенту.
   */
  private async createErrorResponse(params: {
    userNKey?: string;
    serverID?: string;
    message: string;
  }): Promise<string> {
    const { userNKey = '', serverID = '', message } = params;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    const errorClaims = {
      jti: Math.random().toString(36).slice(2),
      iat: now,
      exp,
      iss: this.ACCOUNT_PUBLIC_KEY,
      sub: userNKey,
      name: 'error_response',
      aud: serverID,

      nats: {
        type: 'authorization_response',
        version: 1,
        error: message,
      },
    };

    return encode(Algorithms.v2, errorClaims, this.signingKeyPair);
  }

  @Init()
  async init(): Promise<void> {
    if (process.env.NODE_ENV === 'unittest') {
      this.logger?.info('⚠️ Skipping NatsAuthorizerService initialization in unittest environment');
      return;
    }

    this.ACCOUNT_PUBLIC_KEY = this.configService.get<string>('nats.ACCOUNT_PUBLIC_KEY');
    this.NATS_AUTH_NKEY_SEED = this.configService.get<string>('nats.NATS_AUTH_NKEY_SEED');
    if (!this.ACCOUNT_PUBLIC_KEY || !this.NATS_AUTH_NKEY_SEED) {
      throw new Error('NATS_AUTH_NKEY_SEED or ACCOUNT_PUBLIC_KEY not set in config');
    }

    // Генерим KeyPair для подписи JWT
    this.signingKeyPair = fromSeed(Buffer.from(this.NATS_AUTH_NKEY_SEED));
    this.logger.info('✅ [ NatsAuthorizerService ] loaded');
  }
}
