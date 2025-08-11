import { ProfileCreateInput, ProfilePatchInput } from './profile.dto';

const USERNAME_REGEX = /^[a-z0-9._-]{3,32}$/;

export function validateCreateInput(input: ProfileCreateInput): string | null {
  if (!USERNAME_REGEX.test(input.username)) {
    return 'invalid username';
  }
  if (!input.display_name || input.display_name.length < 1 || input.display_name.length > 64) {
    return 'invalid display_name';
  }
  if (input.bio && input.bio.length > 2048) {
    return 'invalid bio';
  }
  if (input.locale && input.locale.length > 16) {
    return 'invalid locale';
  }
  if (input.avatar_url && !/^https?:\/\//.test(input.avatar_url)) {
    return 'invalid avatar_url';
  }
  return null;
}

export function validatePatchInput(input: ProfilePatchInput): string | null {
  if (input.username && !USERNAME_REGEX.test(input.username)) {
    return 'invalid username';
  }
  if (input.display_name && (input.display_name.length < 1 || input.display_name.length > 64)) {
    return 'invalid display_name';
  }
  if (input.bio && input.bio.length > 2048) {
    return 'invalid bio';
  }
  if (input.locale && input.locale.length > 16) {
    return 'invalid locale';
  }
  if (input.avatar_url && !/^https?:\/\//.test(input.avatar_url)) {
    return 'invalid avatar_url';
  }
  return null;
}
