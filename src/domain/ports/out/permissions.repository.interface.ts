// src/domain/ports/out/permissions.repository.interface.ts
export abstract class IPermissionsRepository {

    abstract getUserItemByLogin(login: string): Promise<any | undefined>;
  
    abstract getUserPermissions(userId: string): Promise<any>;

    abstract getUserPermissionsByLogin(login: string): Promise<any>;

    abstract setUserPermissions(userId: string, permissions: any): Promise<void>;
  
    abstract addUserToGroup(userId: string, groupId: string): Promise<void>;
  
    abstract removeUserFromGroup(userId: string, groupId: string): Promise<void>;

    abstract checkUserChannelPermission(userId: string, channelId: string): Promise<boolean>;
  
  }