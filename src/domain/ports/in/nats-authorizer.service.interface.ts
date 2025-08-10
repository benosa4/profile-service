// src/domain/ports/in/nats-authorizer.service.interface.ts
export abstract class INatsAuthorizerService {
  abstract authorizeUser(authRequestStr: string): Promise<string>;
}