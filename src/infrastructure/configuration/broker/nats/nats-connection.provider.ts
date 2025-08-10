import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { NatsConnection, ServerInfo, connect } from 'nats';
import { ConfigService } from '../../config.service';
// import { Loggable } from '../../../decorators/loggable.decorator';

@Provide()
@Scope(ScopeEnum.Singleton)
export class NatsConnectionProvider {
  private client: NatsConnection;
  private serverInfo: ServerInfo;

  @Logger()
  private logger: ILogger;

  @Inject()
  private readonly configService: ConfigService;

  constructor() { }

  async getConnection(): Promise<NatsConnection> {
    if (!this.client) {
      throw new Error('NATS connection has not been initialized');
    }
    return this.client;
  }

  private async connectToNats(): Promise<void> {

    const servers = this.configService.get<string>('nats.servers');
    const username = this.configService.get<string>('nats.auth.username');
    const password = this.configService.get<string>('nats.auth.password');

    if (!servers) {
      throw new Error('NATS_SERVERS is missing in configuration');
    }

    try {
      this.client = await connect({
        servers: servers.split(','),
        user: username,
        pass: password,
      });

      // Выводим информацию о сервере
      await this.logNatsServerInfo();
      
      // Выводим список стримов (если JetStream включен)
      await this.listStreams();
      this.logger.info(`✅ Connected to NATS at ${servers}`);
    } catch (error) {
      this.logger.error(`❌ Unable to connect to NATS ${error.message}`);
      throw new Error(`Failed to connect to NATS: ${error.message}`);
    }
  }

  private async logNatsServerInfo(): Promise<void> {
    if (!this.serverInfo) return;
    
    this.logger.info('ℹ️ NATS Server Info:', {
      server_id: this.serverInfo.server_id,
      version: this.serverInfo.version,
      go: this.serverInfo.go,
      host: this.serverInfo.host,
      port: this.serverInfo.port,
      auth_required: this.serverInfo.auth_required,
      tls_required: this.serverInfo.tls_required,
      max_payload: this.serverInfo.max_payload,
      proto: this.serverInfo.proto,
      client_id: this.serverInfo.client_id,
      client_ip: this.serverInfo.client_ip
    });
  }

  private async listStreams(): Promise<void> {
    if (!this.client) return;
    
    try {
      const jsm = await this.client.jetstreamManager();
      const streams = await jsm.streams.list().next();
      this.logger.info('📋 Available JetStream streams:', streams);
    } catch (error) {
      // Если JetStream не включен или нет прав, просто логируем как debug
      this.logger.debug('ℹ️ JetStream not available or no streams found');
    }
  }

  @Init()
  async init() {
    // this.logger = this.loggerService.getLogger(NatsConnectionProvider.name);
    this.logger.info(`✅ Подключение к NATS`);
    await this.connectToNats();
    this.logger.info(`✅ [ NatsConnectionProvider ] loaded`);
  }

}


