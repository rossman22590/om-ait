import { backendApi } from '../api-client';

export interface AllAvatarsItem {
  avatar_id: string | null;
  voice_id: string | null;
  avatar_name?: string | null;
  voice_name?: string | null;
  avatar_thumbnail?: string | null;
  avatar_status?: string | null;
  voice_sample?: string | null;
  voice_status?: string | null;
  has_voice: boolean;
}

export interface AllAvatarsResponse {
  success: boolean;
  message: string;
  items: AllAvatarsItem[];
  total_count: number;
  excluded_owned?: boolean;
}

export interface UserAvatar {
  avatar_id: string;
  voice_id: string;
  avatar_name: string;
  voice_name: string;
  subscription_id: string;
  tier: string;
  balance: string;
  avatar_thumbnail?: string;
  voice_sample?: string;
  voice_status?: string;
}

export interface AvatarResponse {
  success: boolean;
  message: string;
  avatars: UserAvatar[];
  subscription_id?: string;
}

export async function fetchUserAvatars(): Promise<AvatarResponse> {
  const response = await backendApi.get<AvatarResponse>('/avatars/my-avatars');
  if (response.error) throw response.error;
  return response.data!;
}

export async function fetchAllAvatars(): Promise<AllAvatarsResponse> {
  const response = await backendApi.get<AllAvatarsResponse>('/avatars/all');
  if (response.error) throw response.error;
  return response.data!;
}
