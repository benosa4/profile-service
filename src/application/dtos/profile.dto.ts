export interface ProfileDTO {
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  locale?: string;
  avatar_url?: string;
  version: number;
  created_at: string;
  updated_at: string;
  phone_e164?: string | null;
  birth_date?: string | null;
}

export interface ProfileCreateInput {
  username: string;
  display_name: string;
  bio?: string;
  locale?: string;
  avatar_url?: string;
}

export interface ProfilePatchInput {
  username?: string;
  display_name?: string;
  bio?: string;
  locale?: string;
  avatar_url?: string;
}
