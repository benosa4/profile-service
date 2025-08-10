// src/domain/ports/out/iam.adapter.interface.ts
export abstract class IIAMAdapter {
    abstract verifyToken(token: string): Promise<any>;
  }
  