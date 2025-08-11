// src/infrastructure/adapters/broker/nats/nats.adapter.ts

import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { NatsConnection, StringCodec } from 'nats';
import { IMessageAdapter } from '../../../../domain/ports/out/message.adapter.interface';
import { NatsConnectionProvider } from '../../../configuration/broker/nats/nats-connection.provider';


@Provide("IMessageAdapter")
@Scope(ScopeEnum.Singleton)
export class NatsAdapter implements IMessageAdapter {

  @Logger()
  private logger: ILogger;

  @Inject()
  private readonly natsConnectionProvider: NatsConnectionProvider;

  private client: NatsConnection;
  private readonly sc = StringCodec();

  constructor() {
    
  }

  async publish(subject: string, message: any): Promise<void> {
    this.client.publish(subject, this.sc.encode(JSON.stringify(message)));
  }

  async subscribe(subject: string, handler: (msg: string) => Promise<string>): Promise<void> {
    const sub = this.client.subscribe(subject);
    (async () => {
      for await (const msg of sub) {
        const responseJwt = await handler(this.sc.decode(msg.data));
        this.logger.debug(responseJwt);
        msg.respond(this.sc.encode(responseJwt));
      }
    })();
  }

  @Init()
  async init(){
    if (process.env.NODE_ENV === 'unittest') {
      this.logger?.info('⚠️ Skipping NatsAdapter initialization in unittest environment');
      return;
    }

    this.client = await this.natsConnectionProvider.getConnection();
    this.logger.info('✅ [ NatsAdapter ] loaded');
  }
}
