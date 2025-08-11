import { ProfileEvent } from '../../aggregate/profile.aggregate';

export interface ProfileEventStore {
  append(userId: string, event: ProfileEvent, expectedSeq?: number): Promise<{ seq: number }>;
  loadAfter(userId: string, lastSeq: number, limit?: number): Promise<{ seq: number; event: ProfileEvent }[]>;
  loadLast(userId: string): Promise<{ seq: number; event?: ProfileEvent } | null>;
}
