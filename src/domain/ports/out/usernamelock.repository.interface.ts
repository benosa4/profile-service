export interface UsernameLockRepository {
  acquire(username: string, ownerUserId: string): Promise<void>;
  switch(oldUsername: string, newUsername: string, ownerUserId: string): Promise<void>;
  getOwner(username: string): Promise<string | null>;
  release(username: string): Promise<void>;
}
