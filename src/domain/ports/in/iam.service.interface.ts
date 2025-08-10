// src/domain/ports/in/iam.service.interface.ts
export abstract class IIAMService {
  abstract verifyKeycloakJWT(token: string): Promise<any>;
}
