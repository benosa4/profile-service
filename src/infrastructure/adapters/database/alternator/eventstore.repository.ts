import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ProfileEventStore } from '../../../../domain/ports/out/profile.eventstore.interface';
import { ProfileEvent } from '../../../../domain/aggregate/profile.aggregate';

@Provide('EventStore')
@Scope(ScopeEnum.Singleton)
export class InMemoryEventStore implements ProfileEventStore {
  private events: Map<string, { seq: number; event: ProfileEvent }[]> = new Map();

  async append(userId: string, event: ProfileEvent, expectedSeq?: number): Promise<{ seq: number }> {
    const list = this.events.get(userId) || [];
    const lastSeq = list.length > 0 ? list[list.length - 1].seq : 0;
    if (expectedSeq !== undefined && expectedSeq !== lastSeq) {
      throw new Error('wrong seq');
    }
    const nextSeq = lastSeq + 1;
    list.push({ seq: nextSeq, event });
    this.events.set(userId, list);
    return { seq: nextSeq };
  }

  async loadAfter(userId: string, lastSeq: number, limit = 100): Promise<{ seq: number; event: ProfileEvent }[]> {
    const list = this.events.get(userId) || [];
    return list.filter(e => e.seq > lastSeq).slice(0, limit);
  }

  async loadLast(userId: string): Promise<{ seq: number; event?: ProfileEvent } | null> {
    const list = this.events.get(userId) || [];
    if (list.length === 0) return null;
    return list[list.length - 1];
  }
}
