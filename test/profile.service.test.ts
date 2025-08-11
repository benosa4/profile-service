import { ProfileService } from '../src/domain/services/profile.service';
import { ProfileCreateInput } from '../src/application/dtos/profile.dto';
import { ProfileEvent } from '../src/domain/aggregate/profile.aggregate';
import { ProfileEventStore } from '../src/domain/ports/out/profile.eventstore.interface';
import { ProfileSnapshotStore } from '../src/domain/ports/out/profile.snapshotstore.interface';
import { IdempotencyRepository } from '../src/domain/ports/out/idempotency.repository.interface';
import { UsernameLockRepository } from '../src/domain/ports/out/usernamelock.repository.interface';

class MemoryEventStore implements ProfileEventStore {
  private data = new Map<string, { seq: number; event: ProfileEvent }[]>();
  async append(userId: string, event: ProfileEvent, expectedSeq?: number) {
    const list = this.data.get(userId) ?? [];
    const lastSeq = list.length ? list[list.length - 1].seq : 0;
    if (expectedSeq !== undefined && expectedSeq !== lastSeq) {
      throw new Error('seq mismatch');
    }
    const seq = lastSeq + 1;
    list.push({ seq, event });
    this.data.set(userId, list);
    return { seq };
  }
  async loadAfter(userId: string, lastSeq: number) {
    const list = this.data.get(userId) ?? [];
    return list.filter(r => r.seq > lastSeq);
  }
  async loadLast(userId: string) {
    const list = this.data.get(userId) ?? [];
    if (list.length === 0) return null;
    return list[list.length - 1];
  }
}

class MemorySnapshotStore implements ProfileSnapshotStore {
  private data = new Map<string, { state: any; last_seq: number; version: number }>();
  async getLatest(userId: string) {
    return this.data.get(userId) ?? null;
  }
  async put(userId: string, state: any, version: number, last_seq: number) {
    this.data.set(userId, { state, version, last_seq });
  }
}

class MemoryIdempotencyRepo implements IdempotencyRepository {
  private keys = new Set<string>();
  async checkAndPut(scope: string, key: string, ttlSec: number) {
    const composite = scope + ':' + key;
    if (this.keys.has(composite)) return true;
    this.keys.add(composite);
    return false;
  }
}

class MemoryUsernameLockRepo implements UsernameLockRepository {
  private locks = new Map<string, string>();
  async acquire(username: string, ownerUserId: string) {
    const owner = this.locks.get(username);
    if (owner && owner !== ownerUserId) throw new Error('locked');
    this.locks.set(username, ownerUserId);
  }
  async switch(oldUsername: string, newUsername: string, ownerUserId: string) {
    await this.acquire(newUsername, ownerUserId);
    this.locks.delete(oldUsername);
  }
  async getOwner(username: string) {
    return this.locks.get(username) ?? null;
  }
  async release(username: string) {
    this.locks.delete(username);
  }
}

function createService() {
  const svc = new ProfileService();
  (svc as any).eventStore = new MemoryEventStore();
  (svc as any).snapshotStore = new MemorySnapshotStore();
  (svc as any).idempotencyRepo = new MemoryIdempotencyRepo();
  (svc as any).usernameLockRepo = new MemoryUsernameLockRepo();
  return svc;
}

describe('ProfileService snapshot logic', () => {
  it('creates snapshot on first event', async () => {
    const svc = createService();
    const input: ProfileCreateInput = { username: 'john', display_name: 'John' };
    const state = await svc.create('u1', input);
    expect(state.version).toBe(1);
    const snap = await (svc as any).snapshotStore.getLatest('u1');
    expect(snap).not.toBeNull();
    expect(snap.version).toBe(1);
  });

  it('creates snapshot every 10 events', async () => {
    const svc = createService();
    const input: ProfileCreateInput = { username: 'john', display_name: 'John' };
    await svc.create('u1', input);
    let version = 1;
    for (let i = 0; i < 9; i++) {
      version++;
      await svc.patch('u1', { display_name: 'John' + i }, version - 1);
    }
    const snap = await (svc as any).snapshotStore.getLatest('u1');
    expect(snap.version).toBe(10);
    expect(snap.last_seq).toBe(10);
  });

  it('returns snapshot state when no events after snapshot', async () => {
    const svc = createService();
    const input: ProfileCreateInput = { username: 'jack', display_name: 'Jack' };
    await svc.create('u2', input);
    const state = await svc.getByUserId('u2');
    expect(state.username).toBe('jack');
    const snap = await (svc as any).snapshotStore.getLatest('u2');
    expect(snap.version).toBe(1);
  });
});

