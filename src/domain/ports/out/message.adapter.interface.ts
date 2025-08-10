// src/domain/ports/out/message.adapter.interface.ts
export abstract class IMessageAdapter {
    abstract publish(subject: string, message: any): Promise<void>;
    abstract subscribe(subject: string, handler: (msg: string) => Promise<string>): Promise<void>;
  }