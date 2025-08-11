export interface IdempotencyRepository {
  checkAndPut(scope: string, key: string, ttlSec: number): Promise<boolean>;
}
