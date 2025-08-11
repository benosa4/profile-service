import { Controller, Get, Param, Query, Put, Patch, Body, Headers } from '@midwayjs/decorator';
import { Inject } from '@midwayjs/core';
import { ProfileService } from '../../domain/services/profile.service';
import { ProfileCreateInput, ProfilePatchInput } from '../dtos/profile.dto';

@Controller('/api/v1')
export class ProfileController {
  @Inject()
  profileService: ProfileService;

  @Get('/profiles/:userId')
  async getById(@Param('userId') userId: string, @Query('version') version?: number) {
    const v = typeof version === 'string' ? parseInt(version) : undefined;
    try {
      return await this.profileService.getByUserId(userId, v);
    } catch (e) {
      return { error: 'NOT_FOUND' };
    }
  }

  @Get('/profiles/by-username/:username')
  async getByUsername(@Param('username') username: string) {
    try {
      return await this.profileService.getByUsername(username);
    } catch (e) {
      return { error: 'NOT_FOUND' };
    }
  }

  @Put('/profiles/:userId')
  async create(
    @Param('userId') userId: string,
    @Body() body: ProfileCreateInput,
    @Headers('x-idempotency-key') idem?: string
  ) {
    try {
      const profile = await this.profileService.create(userId, body, idem);
      return profile;
    } catch (e) {
      if ((e as Error).message === 'username taken') {
        return { error: 'CONFLICT' };
      }
      return { error: 'VALIDATION_ERROR' };
    }
  }

  @Patch('/profiles/:userId')
  async patch(
    @Param('userId') userId: string,
    @Body() body: ProfilePatchInput,
    @Headers('if-match') ifMatch: string
  ) {
    const match = /\d+/.exec(ifMatch || '');
    const expected = match ? parseInt(match[0]) : NaN;
    try {
      return await this.profileService.patch(userId, body, expected);
    } catch (e) {
      if ((e as Error).message === 'version mismatch') {
        return { error: 'PRECONDITION_FAILED' };
      }
      if ((e as Error).message === 'username taken') {
        return { error: 'CONFLICT' };
      }
      return { error: 'NOT_FOUND' };
    }
  }
}
