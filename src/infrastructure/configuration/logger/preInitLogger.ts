import { loggers, ILogger } from '@midwayjs/logger';
import { Provide, Scope, ScopeEnum } from '@midwayjs/core';

@Provide()
@Scope(ScopeEnum.Singleton)
export class EarlyLogger {
  private logger: ILogger;

  constructor() {
    // Создаем логгер через фабрику
    this.logger = loggers.createLogger('earlyLogger', {
      level: 'debug',
      consoleLevel: 'debug'
    });
  }

  getLogger(): ILogger {
    return this.logger;
  }
}