// // src/application/handlers/nats-authorizer-event.handler.ts
// import { Init, Inject, Provide } from '@midwayjs/core';
// import { ILogger } from '@midwayjs/logger';
// import { IMessageService } from '../../domain/ports/in/message.service.interface';
// import { INatsAuthorizerService } from '../../domain/ports/in/nats-authorizer.service.interface';
// import { ConfigService } from '../../infrastructure/configuration/config.service';

// @Provide()
// export class NatsAuthorizerEventHandler {
//   @Inject()
//   logger: ILogger;
//   private readonly topic: string;

//   constructor(
//     private readonly messageService: IMessageService,
//     private readonly natsAuthorizerService: INatsAuthorizerService,
//     private readonly configService: ConfigService,
//   ) {
//     this.topic = this.configService.get<string>('nats.topic');
//     if (!this.topic) {
//       throw new Error('NATS topic is missing in configuration');
//     }
//   }

//   async handleUserAuthorization(subject: string, message: any): Promise<void> {
//     this.logger.debug(`Received message on ${subject}: ${JSON.stringify(message)}`);
//     const { token, userId } = message;
//     const result = await this.natsAuthorizerService.authorizeUser(token, userId);
//     await this.messageService.publish(subject, result);
//   }

//   async subscribeToEvents(): Promise<void> {
//     await this.messageService.subscribe(this.topic, this.handleUserAuthorization.bind(this));
//   }

//   @Init()
//   async init() {
//     console.log(`✅ Подписка на топик: ${this.topic}`);
    
//     await this.subscribeToEvents();
//   }

// }
