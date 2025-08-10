// src/domain/services/message.service.ts

import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { IMessageService } from '../ports/in/message.service.interface';
import { IMessageAdapter } from '../ports/out/message.adapter.interface';


@Provide()
@Scope(ScopeEnum.Singleton)
export class MessageService implements IMessageService {

  @Logger()
  private logger: ILogger;
  
  @Inject('IMessageAdapter')
  private readonly messageAdapter: IMessageAdapter
  
  constructor() {}

  async publish(subject: string, message: any): Promise<void> {
    await this.messageAdapter.publish(subject, message);
  }

  async subscribe(subject: string, handler: (msg: string) => Promise<string>): Promise<void> {
    await this.messageAdapter.subscribe(subject, handler);
  }

  @Init()
  async init(){
    this.logger.info('✅ [ MessageService ] Loaded');
  }
}
