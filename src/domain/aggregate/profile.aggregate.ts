export type ProfileEventType = 'ProfileCreated' | 'ProfilePatched';

export interface ProfileCreated {
  type: 'ProfileCreated';
  payload: {
    username: string;
    display_name: string;
    bio?: string;
    locale?: string;
    avatar_url?: string;
    created_at: string;
  };
}

export interface ProfilePatched {
  type: 'ProfilePatched';
  payload: {
    username?: string;
    display_name?: string;
    bio?: string;
    locale?: string;
    avatar_url?: string;
    updated_at: string;
  };
}

export type ProfileEvent = ProfileCreated | ProfilePatched;

export interface ProfileState {
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  locale?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  phone_e164?: string | null;
  birth_date?: string | null;
  version: number;
}

export function reduce(state: ProfileState | null, event: ProfileEvent, userId: string, seq: number): ProfileState {
  if (event.type === 'ProfileCreated') {
    return {
      user_id: userId,
      username: event.payload.username,
      display_name: event.payload.display_name,
      bio: event.payload.bio,
      locale: event.payload.locale,
      avatar_url: event.payload.avatar_url,
      created_at: event.payload.created_at,
      updated_at: event.payload.created_at,
      phone_e164: null,
      birth_date: null,
      version: seq,
    };
  }
  if (!state) throw new Error('state not initialized');
  if (event.type === 'ProfilePatched') {
    return {
      ...state,
      username: event.payload.username ?? state.username,
      display_name: event.payload.display_name ?? state.display_name,
      bio: event.payload.bio ?? state.bio,
      locale: event.payload.locale ?? state.locale,
      avatar_url: event.payload.avatar_url ?? state.avatar_url,
      updated_at: event.payload.updated_at,
      version: seq,
    };
  }
  return state;
}
