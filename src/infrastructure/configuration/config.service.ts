import { Provide, Init, ScopeEnum, Scope } from '@midwayjs/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

@Provide()
@Scope(ScopeEnum.Singleton)
export class ConfigService {
  private config: any;
  private isReady = false;

  @Init()
  async init() {
    console.log('🚀 ConfigService @Init');
    const configPath = join(__dirname, '../../../configuration.yml');
    this.config = yaml.load(readFileSync(configPath, 'utf8')) as Record<string, any>;
    this.isReady = true;
    console.log(this.isReady);
  }

  get<T>(path: string): T {
    return path.split('.').reduce((acc, key) => acc?.[key], this.config);
  }

  async ensureReady() {
    if (!this.isReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.ensureReady();
    }
  }
}
