import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { UsernameLockRepository } from '../../../../domain/ports/out/usernamelock.repository.interface';

@Provide('UsernameLockRepo')
@Scope(ScopeEnum.Singleton)
export class InMemoryUsernameLockRepository implements UsernameLockRepository {
  private locks: Map<string, string> = new Map();

  async acquire(username: string, ownerUserId: string): Promise<void> {
    const existing = this.locks.get(username);
    if (existing && existing !== ownerUserId) {
      throw new Error('username taken');
    }
    this.locks.set(username, ownerUserId);
  }

  async switch(oldUsername: string, newUsername: string, ownerUserId: string): Promise<void> {
    const owner = this.locks.get(oldUsername);
    if (owner !== ownerUserId) {
      throw new Error('lock mismatch');
    }
    const existing = this.locks.get(newUsername);
    if (existing && existing !== ownerUserId) {
      throw new Error('username taken');
    }
    this.locks.delete(oldUsername);
    this.locks.set(newUsername, ownerUserId);
  }

  async getOwner(username: string): Promise<string | null> {
    return this.locks.get(username) || null;
  }

  async release(username: string): Promise<void> {
    this.locks.delete(username);
  }
}
