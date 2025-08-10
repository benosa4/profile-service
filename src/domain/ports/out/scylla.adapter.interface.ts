// src/domain/ports/out/scylla.adapter.interface.ts
export abstract class IScyllaAdapter {

    // Получение списка групп, в которых состоит пользователь
    abstract getUserGroups(userId: string): Promise<string[]>;

    // Получение разрешений всех групп пользователя (BatchGet для оптимизации)
    abstract getGroupsPermissions(groupIds: string[]): Promise<string[][]>;

    // Добавление пользователя в группу
    abstract addUserToGroup(userId: string, groupId: string): Promise<void>;

    // Удаление пользователя из группы
    abstract removeUserFromGroup(userId: string, groupId: string): Promise<void>;

    abstract getUserPermissions(userId: string): Promise<any>;

    abstract getUserItemByLogin(login: string): Promise<any | undefined>;

    abstract setUserPermissions(userId: string, permissions: any): Promise<void>;

    abstract getUserChannelPermission(userId: string, channelId: string): Promise<boolean>;

    abstract getGroupChannelPermissions(groupIds: string[], channelId: string): Promise<boolean>;

  }