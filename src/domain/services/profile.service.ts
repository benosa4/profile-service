import { Provide, Inject } from '@midwayjs/decorator';
import { ProfileServiceInterface } from '../ports/in/profile.service.interface';
import { ProfileEventStore } from '../ports/out/profile.eventstore.interface';
import { ProfileSnapshotStore } from '../ports/out/profile.snapshotstore.interface';
import { IdempotencyRepository } from '../ports/out/idempotency.repository.interface';
import { UsernameLockRepository } from '../ports/out/usernamelock.repository.interface';
import { ProfileDTO, ProfileCreateInput, ProfilePatchInput } from '../../application/dtos/profile.dto';
import { ProfileState, reduce, ProfileEvent } from '../aggregate/profile.aggregate';
import { validateCreateInput, validatePatchInput } from '../../application/dtos/validators';

const SNAPSHOT_EVERY = 100;
const IDEMP_TTL = 86400;

@Provide('ProfileService')
export class ProfileService implements ProfileServiceInterface {
  @Inject('EventStore')
  private eventStore: ProfileEventStore;

  @Inject('SnapshotStore')
  private snapshotStore: ProfileSnapshotStore;

  @Inject('IdempotencyRepo')
  private idempotencyRepo: IdempotencyRepository;

  @Inject('UsernameLockRepo')
  private usernameLockRepo: UsernameLockRepository;

  private async loadState(userId: string, version?: number): Promise<{ state: ProfileState | null; seq: number }> {
    const snapshot = await this.snapshotStore.getLatest(userId);
    let state: ProfileState | null = snapshot ? snapshot.state : null;
    let seq = snapshot ? snapshot.last_seq : 0;
    const events = await this.eventStore.loadAfter(userId, seq);
    for (const { seq: s, event } of events) {
      if (version && s > version) break;
      state = reduce(state, event, userId, s);
      seq = s;
    }
    return { state, seq };
  }

  async getByUserId(userId: string, version?: number): Promise<ProfileDTO> {
    const { state } = await this.loadState(userId, version);
    if (!state) throw new Error('not found');
    return state;
  }

  async getByUsername(username: string): Promise<ProfileDTO> {
    // naive search through snapshots
    const allUserIds = await this.usernameLockRepo.getOwner(username);
    if (!allUserIds) throw new Error('not found');
    return this.getByUserId(allUserIds);
  }

  async create(userId: string, input: ProfileCreateInput, idempotencyKey?: string): Promise<ProfileDTO> {
    const validation = validateCreateInput(input);
    if (validation) throw new Error(validation);
    if (idempotencyKey) {
      const existed = await this.idempotencyRepo.checkAndPut('profile:create', idempotencyKey, IDEMP_TTL);
      if (existed) {
        const { state } = await this.loadState(userId);
        if (state) return state;
      }
    }
    await this.usernameLockRepo.acquire(input.username, userId);
    const now = new Date().toISOString();
    const event: ProfileEvent = {
      type: 'ProfileCreated',
      payload: { ...input, created_at: now }
    };
    const last = await this.eventStore.loadLast(userId);
    const seq = (last?.seq ?? 0) + 1;
    await this.eventStore.append(userId, event, last?.seq);
    let state = reduce(null, event, userId, seq);
    if (seq % SNAPSHOT_EVERY === 0) {
      await this.snapshotStore.put(userId, state, seq, seq);
    }
    return state;
  }

  async patch(userId: string, input: ProfilePatchInput, expectedVersion: number): Promise<ProfileDTO> {
    const validation = validatePatchInput(input);
    if (validation) throw new Error(validation);
    const { state: current, seq } = await this.loadState(userId);
    if (!current) throw new Error('not found');
    if (current.version !== expectedVersion) {
      throw new Error('version mismatch');
    }
    if (input.username && input.username !== current.username) {
      await this.usernameLockRepo.switch(current.username, input.username, userId);
    }
    const now = new Date().toISOString();
    const event: ProfileEvent = { type: 'ProfilePatched', payload: { ...input, updated_at: now } };
    const nextSeq = seq + 1;
    await this.eventStore.append(userId, event, seq);
    const newState = reduce(current, event, userId, nextSeq);
    if (nextSeq % SNAPSHOT_EVERY === 0) {
      await this.snapshotStore.put(userId, newState, nextSeq, nextSeq);
    }
    return newState;
  }
}
