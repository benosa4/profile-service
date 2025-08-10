// src/infrastructure/configuration/iam/keycloak/keycloak-connection.provider.ts

import { Provide } from '@midwayjs/core';
import axios from 'axios';
import { ConfigService } from '../../config.service';

@Provide()
export class KeycloakConnectionProvider {
  private readonly keycloakUrl: string;

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
  }

  async getJWKS(): Promise<any> {
    const jwksUri = `${this.keycloakUrl}/protocol/openid-connect/certs`;
    const response = await axios.get(jwksUri);
    return response.data;
  }
}