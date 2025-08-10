// src/infrastructure/adapters/scilla.adapter.ts

import { GetCommand, PutCommand, QueryCommand, DeleteCommand, BatchGetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { IScyllaAdapter } from '../../../../domain/ports/out/scylla.adapter.interface';
import { ScyllaConnectionProvider } from '../../../configuration/database/scilla/scilla-connection.provider';

@Provide("IScyllaAdapter")
@Scope(ScopeEnum.Singleton)
export class ScyllaAdapter implements IScyllaAdapter {

  @Logger()
  private logger: ILogger;

  @Inject()
  private readonly scyllaConnectionProvider: ScyllaConnectionProvider
  
  private client;

  constructor() {}

  @Init()
  async init() {
    this.client = await this.scyllaConnectionProvider.getConnection();
    this.logger.info("✅ [ ScyllaAdapter ] loaded");
  }

  // Получение индивидуальных прав пользователя
  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await this.client.send(new GetCommand({
      TableName: 'user_permissions',
      Key: { user_id: userId },
    }));
    this.logger.debug("[ScyllaAdapter -> getUserPermissions -> userId: ]", userId);
    this.logger.debug("[ScyllaAdapter -> getUserPermissions -> result: ]", result);

    return result.Item?.permissions || [];
  }

  /**
   * Ищем запись в user_permissions по login
   * Возвращаем полный объект Item (включая user_id, permissions и т.д.),
   * либо undefined, если ничего не нашли.
   */
  async getUserItemByLogin(login: string): Promise<any | undefined> {

    console.log("login: ", login);

    const response1 = await this.client.send(new ScanCommand({
      TableName: 'user_permissions',
    }));
    console.log(response1);

    const result2 = await this.client.send(new GetCommand({
      TableName: 'user_permissions',
      Key: { user_id: "d91ec0f1-0500-11f0-ac67-f430b9595c98" },
    }));

    console.log(result2);

    // Предполагаем, что GSI называется "login-index"
    const response = await this.client.send(new QueryCommand({
      TableName: 'user_permissions',
      IndexName: 'login-index',
      KeyConditionExpression: '#login = :v_login',
      ExpressionAttributeValues: {
        ':v_login': login,
      },
      ExpressionAttributeNames: {
        '#login': 'login'
      },
      Limit: 1,
    }));

    if (!response?.Items || response.Items.length === 0) {
      return undefined;
    }

    // Берём первую запись (ожидаем, что login уникален)
    return response.Items[0];
  }

  // Установка индивидуальных прав пользователя
  async setUserPermissions(userId: string, permissions: string[]): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: 'user_permissions',
      Item: {
        user_id: userId,
        permissions,
        updated_at: Date.now(),
      },
    }));
  }

  // Получение списка групп, в которых состоит пользователь
  async getUserGroups(userId: string): Promise<string[]> {
    const response = await this.client.send(new QueryCommand({
      TableName: 'group_members',
      IndexName: 'user_id-index',
      KeyConditionExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));

    return response.Items.map(item => item.group_id);
  }

  // Получение разрешений всех групп пользователя (BatchGet для оптимизации)
  async getGroupsPermissions(groupIds: string[]): Promise<string[][]> {
    if (groupIds.length === 0) return [];

    const keys = groupIds.map(group_id => ({ group_id }));

    const response = await this.client.send(new BatchGetCommand({
      RequestItems: {
        group_permissions: {
          Keys: keys,
        },
      },
    }));

    return response.Responses?.group_permissions?.map(g => g.permissions) || [];
  }

  // Добавление пользователя в группу
  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: 'group_members',
      Item: {
        group_id: groupId,
        user_id: userId,
        joined_at: Date.now(),
      },
    }));
  }

  // Удаление пользователя из группы
  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: 'group_members',
      Key: { group_id: groupId, user_id: userId },
    }));
  }

  // // Проверка разрешения пользователя на канал
  // async checkUserChannelPermission(userId: string, channelId: string): Promise<boolean> {
  //   // Проверяем индивидуальное разрешение
  //   const userPermission = await this.client.send(new GetCommand({
  //     TableName: 'channel_permissions',
  //     Key: { channel_id: channelId, entity: `USER#${userId}` },
  //   }));

  //   if (userPermission?.Item) return true;

  //   // Проверяем разрешения групп пользователя
  //   const groups = await this.getUserGroups(userId);
  //   const keys = groups.map(group => ({
  //     channel_id: channelId,
  //     entity: `GROUP#${group}`,
  //   }));

  //   if (keys.length === 0) return false;

  //   const response = await this.client.send(new BatchGetCommand({
  //     RequestItems: {
  //       channel_permissions: { Keys: keys },
  //     },
  //   }));

  //   return response.Responses?.channel_permissions?.length > 0;
  // }

  // Получение индивидуального разрешения на канал
  async getUserChannelPermission(userId: string, channelId: string): Promise<boolean> {
    const result = await this.client.send(new GetCommand({
      TableName: 'channel_permissions',
      Key: { channel_id: channelId, entity: `USER#${userId}` },
    }));
    return !!result.Item;
  }

  // Получение групповых разрешений на канал (BatchGet)
  async getGroupChannelPermissions(groupIds: string[], channelId: string): Promise<boolean> {
    if (groupIds.length === 0) return false;

    const keys = groupIds.map(group => ({
      channel_id: channelId,
      entity: `GROUP#${group}`,
    }));

    const response = await this.client.send(new BatchGetCommand({
      RequestItems: {
        channel_permissions: { Keys: keys },
      },
    }));

    return response.Responses?.channel_permissions?.length > 0;
  }
}
