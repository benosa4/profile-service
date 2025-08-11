import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ProfileSnapshotStore } from '../../../../domain/ports/out/profile.snapshotstore.interface';
import { ProfileState } from '../../../../domain/aggregate/profile.aggregate';

@Provide('SnapshotStore')
@Scope(ScopeEnum.Singleton)
export class InMemorySnapshotStore implements ProfileSnapshotStore {
  private snapshots: Map<string, { state: ProfileState; last_seq: number; version: number }> = new Map();

  async getLatest(userId: string): Promise<{ state: ProfileState; last_seq: number; version: number } | null> {
    return this.snapshots.get(userId) || null;
  }

  async put(userId: string, state: ProfileState, version: number, last_seq: number): Promise<void> {
    this.snapshots.set(userId, { state, version, last_seq });
  }
}
