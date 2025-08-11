import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { IdempotencyRepository } from '../../../../domain/ports/out/idempotency.repository.interface';

@Provide('IdempotencyRepo')
@Scope(ScopeEnum.Singleton)
export class InMemoryIdempotencyRepository implements IdempotencyRepository {
  private store: Map<string, number> = new Map();

  async checkAndPut(scope: string, key: string, ttlSec: number): Promise<boolean> {
    const composite = `${scope}:${key}`;
    const now = Date.now();
    const exists = this.store.get(composite);
    if (exists && exists > now) {
      return true;
    }
    this.store.set(composite, now + ttlSec * 1000);
    return false;
  }
}
