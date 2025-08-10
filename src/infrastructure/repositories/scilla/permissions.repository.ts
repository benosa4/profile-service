// src/infrastructure/repositories/permissions.repository.ts
import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { IPermissionsRepository } from '../../../domain/ports/out/permissions.repository.interface';
import { IScyllaAdapter } from '../../../domain/ports/out/scylla.adapter.interface';


export interface UserEffectivePermissions {
  permissions: string[];
  groups: string[];
}

@Provide('IPermissionsRepository')
@Scope(ScopeEnum.Singleton)
export class PermissionsRepository implements IPermissionsRepository {

  @Logger()
  private logger: ILogger;

  @Inject("IScyllaAdapter")
  private readonly scyllaAdapter: IScyllaAdapter;
  
  constructor() {}

  async getUserItemByLogin(login: string): Promise<any | undefined> {
    return this.scyllaAdapter.getUserItemByLogin(login);
  }

  async getUserPermissions(userId: string): Promise<UserEffectivePermissions> {
    // Получаем индивидуальные права пользователя
    const userPerms = await this.scyllaAdapter.getUserPermissions(userId);

    this.logger.debug("1: ", userPerms);

    // Получаем список групп пользователя
    const groups = await this.scyllaAdapter.getUserGroups(userId);

    this.logger.debug("2: ", groups);

    // Получаем разрешения всех этих групп
    const groupPermissions = await this.scyllaAdapter.getGroupsPermissions(groups);

    this.logger.debug("3: ", groupPermissions);

    // Объединяем индивидуальные права и права от групп
    const mergedPermissions = this.mergePermissions(userPerms, groupPermissions);

    this.logger.debug("4: ", mergedPermissions);

    return {
      permissions: mergedPermissions,
      groups: groups,
    };
  }

  // src/domain/services/user-permissions.service.ts
  // или src/infrastructure/repositories/permissions.repository.ts
  // (в зависимости от вашей структуры)

  async getUserPermissionsByLogin(login: string): Promise<{ permissions: string[]; groups: string[] }> {
    // 1) Находим запись по login
    const userItem = await this.scyllaAdapter.getUserItemByLogin(login);

    if (!userItem) {
      // Можете вернуть пустой массив или бросить ошибку
      return { permissions: [], groups: [] };
      // throw new Error(`No user found with login = ${login}`);
    }

    // 2) Извлекаем user_id
    // DynamoDB хранит поля в виде { S: '...' }, { L: [...] } и т.д.
    const userId = userItem.user_id;
    if (!userId) {
      // Неверная структура
      return { permissions: [], groups: [] };
    }

    // 3) Как прежде, берём индивидуальные права:
    const userPerms = await this.scyllaAdapter.getUserPermissions(userId);

    // 4) Получаем список групп
    const groups = await this.scyllaAdapter.getUserGroups(userId);

    // 5) Получаем права групп
    const groupPermissionsList = await this.scyllaAdapter.getGroupsPermissions(groups);
    // groupPermissionsList – это массив массивов, например [["publish:..."], ["subscribe:..."]]

    // 6) Объединяем индивидуальные права + все групповые
    const mergedPermissions = this.mergePermissions(userPerms, groupPermissionsList);

    // 7) Возвращаем в том же формате
    return {
      permissions: mergedPermissions,
      groups: groups,
    };
  }

  async setUserPermissions(userId: string, permissions: string[]): Promise<void> {
    await this.scyllaAdapter.setUserPermissions(userId, permissions);
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.scyllaAdapter.addUserToGroup(userId, groupId);
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await this.scyllaAdapter.removeUserFromGroup(userId, groupId);
  }

  // // Получение индивидуального разрешения на канал
  // async getUserChannelPermission(userId: string, channelId: string): Promise<boolean> {
  //   if (channelId.length === 0) return false;

  //   const result = await this.scyllaAdapter.getUserChannelPermission(userId, channelId);
  //   return result;
  // }

  // // Получение групповых разрешений на канал (BatchGet)
  // async getGroupChannelPermissions(groupIds: string[], channelId: string): Promise<boolean> {
  //   if (groupIds.length === 0) return false;

  //   const result = await this.scyllaAdapter.getGroupChannelPermissions(groupIds, channelId);
  //   return result;
  // }

  async checkUserChannelPermission(userId: string, channelId: string): Promise<boolean> {
    const userHasPermission = await this.scyllaAdapter.getUserChannelPermission(userId, channelId);
    if (userHasPermission) return true;

    const groups = await this.scyllaAdapter.getUserGroups(userId);
    return await this.scyllaAdapter.getGroupChannelPermissions(groups, channelId);
  }

  private mergePermissions(userPermissions: string[], groupPermissions: string[][]): string[] {
    const permsSet = new Set(userPermissions); // Уникальный список прав
    groupPermissions.forEach(groupPerms => groupPerms.forEach(p => permsSet.add(p)));
    return Array.from(permsSet);
  }

  @Init()
  async init(){
    this.logger.info('✅ [ PermissionsRepository ] loaded ');
  }
}
