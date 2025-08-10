import { Provide, Logger, IMidwayLogger, Scope, ScopeEnum, Init } from '@midwayjs/core';
import * as kleur from 'kleur';

@Provide()
@Scope(ScopeEnum.Singleton)
export class LoggerService {
  @Logger()
  private logger: IMidwayLogger;

  @Init()
  async init() {
    console.log('✅ LoggerService initialized');
  }

  private formatMessage(level: string, className: string, message: string): string {
    const levelColor = this.getLevelColor(level);
    return `${kleur.gray(new Date().toISOString())} ${levelColor(`[${level.toUpperCase()}]`)} ${kleur.cyan(`[${className}]`)}: ${message}`;
  }

  private getLevelColor(level: string): (text: string) => string {
    switch (level) {
      case 'info': return kleur.blue;
      case 'warn': return kleur.yellow;
      case 'error': return kleur.red;
      case 'debug': return kleur.magenta;
      default: return kleur.white;
    }
  }

  createLogger(className: string) {
    return {
      info: (message: string) => this.logger.info(this.formatMessage('info', className, message)),
      warn: (message: string) => this.logger.warn(this.formatMessage('warn', className, message)),
      error: (message: string) => this.logger.error(this.formatMessage('error', className, message)),
      debug: (message: string) => this.logger.debug(this.formatMessage('debug', className, message)),
    };
  }
}
