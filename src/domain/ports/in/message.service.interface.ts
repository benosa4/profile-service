// src/domain/ports/in/message.service.interface.ts
export abstract class IMessageService {
  abstract publish(subject: string, message: any): Promise<void>;
  abstract subscribe(subject: string, handler: (msg: string) => Promise<string>): Promise<void>;
}