// src/bootstrap.service.ts
import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/core';
import { NatsConnectionProvider } from './infrastructure/configuration/broker/nats/nats-connection.provider';
import { NatsEventHandler } from './application/handlers/nats-event.handler';
import { ScyllaConnectionProvider } from './infrastructure/configuration/database/scilla/scilla-connection.provider';
import { NatsAdapter } from './infrastructure/adapters/broker/nats/nats.adapter';
import { ScyllaAdapter } from './infrastructure/adapters/database/scilla/scylla.adapter';
import { NatsAuthorizerService } from './domain/services/nats-authorizer.service';
import { UserPermissionsService } from './domain/services/user-permissions.service';
import { IAMService } from './domain/services/iam.service';
import { PermissionsRepository } from './infrastructure/repositories/scilla/permissions.repository';
// import { ConfigService } from './infrastructure/configuration/config.service';

@Provide()
@Scope(ScopeEnum.Singleton)
export class BootstrapService {

    @Inject()
    private natsConnectionProvider: NatsConnectionProvider;

    @Inject()
    private natsEventHandler: NatsEventHandler;

    @Inject()
    private scyllaConnectionProvider: ScyllaConnectionProvider;

    @Inject()
    private natsAdapter: NatsAdapter;

    @Inject()
    private scyllaAdapter: ScyllaAdapter;

    @Inject()
    private permissionsRepository: PermissionsRepository;

    @Inject()
    userPermissionsService: UserPermissionsService;

    @Inject()
    iAMService: IAMService;

    @Inject()
    private natsAuthorizerService: NatsAuthorizerService;



  constructor(
    
  ) {
    // Сохраняем их в свойства класса, даже если пока не используем
    // this.natsConnectionProvider = this.natsConnectionProvider;
    // this.natsEventHandler = this.natsEventHandler;
    // this.scyllaConnectionProvider = this.scyllaConnectionProvider;
    // this.natsAdapter = this.natsAdapter;
    // this.scyllaAdapter = this.scyllaAdapter;
    // this.natsAuthorizerService = this.natsAuthorizerService;
    // this.permissionsRepository = this.permissionsRepository;
  }

  async init() {
    void this.natsConnectionProvider;
    void this.natsEventHandler;
    void this.scyllaConnectionProvider;
    void this.natsAdapter;
    void this.scyllaAdapter;
    void this.permissionsRepository;
    void this.userPermissionsService;
    void this.iAMService;
    void this.natsAuthorizerService;
    // const container = getCurrentApplicationContext();
    // const configService = await container.getAsync(ConfigService);
    // await configService.ensureReady(); 
    // await container.getAsync(NatsConnectionProvider);
    // await container.getAsync(NatsEventHandler);
    // await container.getAsync(ScyllaConnectionProvider);
    // await container.getAsync(NatsAdapter);
    // await container.getAsync(ScyllaAdapter);
    // await container.getAsync(PermissionsRepository);
    // await container.getAsync(UserPermissionsService);
    // await container.getAsync(IAMService);
    // await container.getAsync(NatsAuthorizerService);
    console.log('✅ Всё нужное инициализировано автоматически!');
  }
}
