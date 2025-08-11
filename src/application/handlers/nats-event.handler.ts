// src/application/handlers/nats-event.handler.ts
import { Init, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { ILogger } from '@midwayjs/logger';
import { IMessageService } from '../../domain/ports/in/message.service.interface';
import { INatsAuthorizerService } from '../../domain/ports/in/nats-authorizer.service.interface';
import { ConfigService } from '../../infrastructure/configuration/config.service';

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class NatsEventHandler {

  @Inject()
  private readonly logger: ILogger;

  @Inject()
  private readonly messageService: IMessageService;

  @Inject('INatsAuthorizerService')
  private readonly natsAuthorizerService: INatsAuthorizerService;

  @Inject()
  private readonly configService: ConfigService;

  private topic: string;

  constructor() { }

  async handleUserAuthorization(message: string): Promise<string> {
    // this.logger.info(`Received message on ${subject}: ${JSON.stringify(message)}`);
    // const { token, userId } = message;
    const responseJwt = await this.natsAuthorizerService.authorizeUser(message);
    return responseJwt;
    // await this.messageService.publish(subject, result);
  }

  async subscribeToEvents(): Promise<void> {
    await this.messageService.subscribe(this.topic, this.handleUserAuthorization.bind(this));
  }

  @Init()
  async init() {
    if (process.env.NODE_ENV === 'unittest') {
      this.logger?.info('⚠️ Skipping NATS event handler initialization in unittest environment');
      return;
    }

    this.topic = this.configService.get<string>('nats.topic');
    this.logger.info(`✅ Подписка на топик: ${this.topic}`);
    if (!this.topic) {
      throw new Error('NATS topic is missing in configuration');
    }
    await this.subscribeToEvents();
    this.logger.info(`✅ [ NatsEventHandler ] loaded`);
  }

}
