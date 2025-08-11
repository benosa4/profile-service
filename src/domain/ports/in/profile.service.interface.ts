import { ProfileDTO, ProfileCreateInput, ProfilePatchInput } from '../../../application/dtos/profile.dto';

export interface ProfileServiceInterface {
  getByUserId(userId: string, version?: number): Promise<ProfileDTO>;
  getByUsername(username: string): Promise<ProfileDTO>;
  create(userId: string, input: ProfileCreateInput, idempotencyKey?: string): Promise<ProfileDTO>;
  patch(userId: string, input: ProfilePatchInput, expectedVersion: number): Promise<ProfileDTO>;
}
