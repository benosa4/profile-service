// src/domain/ports/in/user-permissions.service.interface.ts
export abstract class IUserPermissionsService {

    abstract getUserItemByLogin(login: string): Promise<any | undefined>;
    
    abstract getUserPermissions(userId: string): Promise<any>;

    abstract getUserPermissionsByLogin(login: string): Promise<any>;

    abstract setUserPermissions(userId: string, permissions: string[]): Promise<void>;

    abstract addUserToGroup(userId: string, groupId: string): Promise<void>;

    abstract removeUserFromGroup(userId: string, groupId: string): Promise<void>;
  }