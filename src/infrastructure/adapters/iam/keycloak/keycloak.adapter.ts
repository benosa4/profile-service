// src/infrastructure/adapters/iam/keycloak/keycloak.adapter.ts

import { Provide } from '@midwayjs/core';
import * as jwt from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import { IIAMAdapter } from '../../../../domain/ports/out/iam.adapter.interface';
import { KeycloakConnectionProvider } from '../../../configuration/iam/keycloak/keycloak-connection.provider';

@Provide()
export class KeycloakAdapter implements IIAMAdapter {
  constructor(private readonly keycloakConnectionProvider: KeycloakConnectionProvider) {}

  async verifyToken(token: string): Promise<any> {
    try {
      const jwks = await this.keycloakConnectionProvider.getJWKS();
      const decodedToken = jwt.decode(token, { complete: true });
      if (!decodedToken || !decodedToken.header.kid) {
        throw new Error('Invalid JWT format');
      }
      const key = jwks.keys.find(k => k.kid === decodedToken.header.kid);
      if (!key) {
        throw new Error('Key not found in JWKS');
      }
      const publicKey = jwkToPem(key);
      return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }
}
