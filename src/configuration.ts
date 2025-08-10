//configuration.ts
console.log('🚀 Midway Configuration Loaded');

import { Configuration, App, IMidwayContainer, Inject, ObjectCreatedOptions} from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import { join } from 'path';
import { BootstrapService } from './bootstrap.service';
// import { readFileSync } from 'fs';
import { ConfigService } from './infrastructure/configuration/config.service';
import { EarlyLogger } from './infrastructure/configuration/logger/preInitLogger';

@Configuration({
  imports: [
    koa,
    validate,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {

  @Inject()
  service: BootstrapService;

  @App('koa')
  app: koa.Application;

  // async onConfigLoad(container: IMidwayContainer) {
  //   const scyllaCa = readFileSync(join(__dirname, '../scylla-ca.crt'));
  //   container.registerObject('scyllaCa', scyllaCa);
  //   console.log('✅ Scylla CA certificate loaded before service creation!');
  // }

  async onReady(container: IMidwayContainer) {
    // add middleware
    // this.app.useMiddleware([ReportMiddleware]);
    // add filter
    // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
    // this.service = this.service;
    const earlyLogger = new EarlyLogger();
    container.registerObject('logger', earlyLogger.getLogger());
    // Проверяем работу
    earlyLogger.getLogger().info('==== ЛОГГЕР ГОТОВ К РАБОТЕ ====');
    // const scyllaCa = readFileSync(join(__dirname, '../scylla-ca.crt'));
    // container.registerObject('scyllaCa', scyllaCa);
    // earlyLogger.getLogger().info('✅ Scylla CA certificate loaded before service creation!');
    await container.getAsync(ConfigService);
    const bootstrap = await container.getAsync(BootstrapService);
    await bootstrap.init();
  }

  async onObjectInit(instance: any, options: ObjectCreatedOptions<any>) {
    // console.log(`🔥 onObjectInit() called for ${instance.constructor.name}`);
  
    // if ('logger' in instance) {
    //   console.log(`=== [Lifecycle] Injecting logger into ${instance.constructor.name}`);
    //   const container = options.context;
    //   const loggerService = await container.getAsync(LoggerService);
    //   instance.logger = loggerService.createLogger(instance.constructor.name);
    //   console.log(`=== [Lifecycle] Logger assigned to ${instance.constructor.name}`);
    // }
  }

  async onServerReady(container: IMidwayContainer): Promise<void> {
    // Obtain the exposed Framework in koa
    // await container.getAsync(BootstrapService);

  }
}
