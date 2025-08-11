// src/domain/services/iam.service.ts

import * as jwt from 'jsonwebtoken';
import axios from 'axios';
const jwkToPem = require('jwk-to-pem');
import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { IIAMService } from '../ports/in/iam.service.interface';
import { IIAMAdapter } from '../ports/out/iam.adapter.interface';
import { ConfigService } from '../../infrastructure/configuration/config.service';

@Provide('IIAMService')
@Scope(ScopeEnum.Singleton)
export class IAMService implements IIAMService {

  @Logger()
  private logger: ILogger;

  @Inject()
  private readonly configService: ConfigService;

  private jwksUri: string;
  
  constructor(private readonly iamAdapter: IIAMAdapter) {}

  async verifyToken(token: string): Promise<any> {
    return this.iamAdapter.verifyToken(token);
  }

  async verifyKeycloakJWT(token: string) {
    try {
      this.logger.debug('Keycloak Token: ', token);

      console.log('Keycloak Uri ', this.jwksUri);

      const { data } = await axios.get(this.jwksUri);
      console.log(data);

      const decodedToken = jwt.decode(token, { complete: true });
      console.log('decodedToken Uri ', decodedToken);

      if (!decodedToken || !decodedToken.header.kid) {
        throw new Error("Invalid JWT format");
      }

      const key = data.keys.find(k => k.kid === decodedToken.header.kid);
      if (!key) {
        throw new Error("Key not found in JWKS");
      }

      const publicKey = jwkToPem(key);
      console.log('key !!! ', publicKey);

      return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
      console.error("JWT Verification Error:", error);
      throw error; // Пробрасываем ошибку дальше
    }
  }

  @Init()
  async init(){
    if (process.env.NODE_ENV === 'unittest') {
      this.logger?.info('⚠️ Skipping IAMService initialization in unittest environment');
      return;
    }

    this.jwksUri = this.configService.get<string>("keycloak.jwksUri");

    if (!this.jwksUri) {
      this.logger.error("JwksURL not set");
      throw new Error("JwksURL not set");
    }

    this.logger.info('✅ [ IAMService ] loaded ');
  }
  
}