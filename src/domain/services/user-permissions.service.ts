// src/domain/services/user-permissions.service.ts
import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { IUserPermissionsService } from '../ports/in/user-permissions.service.interface';
import { IPermissionsRepository } from '../ports/out/permissions.repository.interface';
import { ForbiddenException } from '../../application/Errors/forbidden.exception';


@Provide('IUserPermissionsService')
@Scope(ScopeEnum.Singleton)
export class UserPermissionsService implements IUserPermissionsService {

  @Logger()
  private logger: ILogger;

  @Inject('IPermissionsRepository')
  private readonly permissionsRepository: IPermissionsRepository;

  constructor() {}

  async getUserItemByLogin(login: string): Promise<any | undefined> {
    return this.permissionsRepository.getUserItemByLogin(login);
  }
  
  /**
   * Получает разрешения пользователя с учетом наследования групповых прав.
   */
  async getUserPermissions(userId: string): Promise<{ permissions: string[]; groups: string[] }> {
    return this.permissionsRepository.getUserPermissions(userId);
  }

  /**
   * Получает разрешения пользователя с учетом наследования групповых прав.
   */
  async getUserPermissionsByLogin(login: string): Promise<{ permissions: string[]; groups: string[] }> {
    return this.permissionsRepository.getUserPermissionsByLogin(login);
  }

  /**
   * Назначает пользователю индивидуальные права.
   */
  async setUserPermissions(userId: string, permissions: string[]): Promise<void> {
    await this.permissionsRepository.setUserPermissions(userId, permissions);
  }

  /**
   * Добавляет пользователя в группу.
   */
  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.permissionsRepository.addUserToGroup(userId, groupId);
  }

  /**
   * Удаляет пользователя из группы.
   */
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await this.permissionsRepository.removeUserFromGroup(userId, groupId);
  }

  async checkUserAccessToChannel(userId: string, channelId: string): Promise<void> {
    const hasAccess = await this.permissionsRepository.checkUserChannelPermission(userId, channelId);
    if (!hasAccess) {
      throw new ForbiddenException('Нет доступа к каналу.');
    }
  }

  @Init()
  async init(){
    this.logger.info('✅ [ UserPermissionsService ] loaded ');
  }
  
}
