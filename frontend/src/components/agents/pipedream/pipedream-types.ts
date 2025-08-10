export interface PipedreamProfile {
  profile_id: string;
  profile_name: string;
  is_default?: boolean;
  is_connected?: boolean;
  is_active?: boolean;
  external_user_id?: string;
  app_slug?: string;
  app_name?: string;
  enabledTools?: string[];
  toolsCount?: number;
  mcp_qualified_name?: string;
}

export interface CreateProfileRequest {
  profile_name: string;
  app_slug: string;
  app_name: string;
  is_default?: boolean;
}

export interface UpdateProfileRequest {
  profile_name?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export interface ProfileConnectionResponse {
  success: boolean;
  link?: string;
  token?: string;
  profile_id: string;
}

export interface ProfileConnectionsResponse {
  success: boolean;
  profile_id: string;
  connections: Array<{
    id: string;
    app: string;
    name: string;
    status: 'connected' | 'disconnected' | 'error';
  }>;
}
