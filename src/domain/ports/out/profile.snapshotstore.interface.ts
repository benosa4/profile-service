import { ProfileState } from '../../aggregate/profile.aggregate';

export interface ProfileSnapshotStore {
  getLatest(userId: string): Promise<{ state: ProfileState; last_seq: number; version: number } | null>;
  put(userId: string, state: ProfileState, version: number, last_seq: number): Promise<void>;
}
