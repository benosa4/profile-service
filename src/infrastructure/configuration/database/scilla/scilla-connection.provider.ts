// src/infrastructure/configuration/database/scilla/scilla-connection.provider.ts

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, DynamoDBClientConfig, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent } from "https";
import { Config, ILogger, Init, Inject, Logger, Scope, ScopeEnum } from '@midwayjs/core';
import { Provide } from '@midwayjs/decorator';
import { ConfigService } from '../../config.service';

@Provide()
@Scope(ScopeEnum.Singleton)
export class ScyllaConnectionProvider {
  private client: DynamoDBDocumentClient;

  @Inject()
  private readonly configService: ConfigService;

  @Logger()
  private logger: ILogger;

  @Config('scyllaCa')
  private scyllaCa: Buffer;

  constructor() { }

  async getConnection(): Promise<DynamoDBDocumentClient> {
    if (!this.client) {
      const region = this.configService.get<string>('scylla.region');
      const endpoint = this.configService.get<string>('scylla.endpoint');
      const accessKey = this.configService.get<string>('scylla.accessKey');
      const secretKey = this.configService.get<string>('scylla.secretKey');
      if (!region || !endpoint) {
        throw new Error('ScyllaDB configuration is missing');
      }

      const clientConfig: DynamoDBClientConfig = {
        region: region,
        endpoint: endpoint,
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 2000,
          requestTimeout: 1000,
          httpsAgent: new Agent({
            ca: this.scyllaCa,
            rejectUnauthorized: false,
          }),
        }),
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      };
      
      const dynamoClient = new DynamoDBClient(clientConfig);
      this.client = DynamoDBDocumentClient.from(dynamoClient);
      this.logger.info('✅ Connected to ScyllaDB (DynamoDB API)');
    }
    await this.listTables();
    return this.client;
  }

  async listTables(): Promise<void> {
    try {
      const command = new ListTablesCommand({});
      const result = await this.client.send(command);
      this.logger.info('📋 Available tables in ScyllaDB:', result.TableNames);
    } catch (error) {
      this.logger.error('❌ Failed to list tables:', error);
      throw error;
    }
  }

  @Init()
  async init() {
    await this.getConnection();
    this.logger.info('✅ [ ScyllaConnectionProvider ] Loaded');
  }

}

