export const pipedreamKeys = {
  root: ['pipedream'] as const,
  all: () => [...pipedreamKeys.root] as const,
  apps: {
    list: (params?: { after?: string; q?: string }) => [
      ...pipedreamKeys.root,
      'apps',
      params?.after ?? '',
      params?.q ?? '',
    ] as const,
    popular: () => [...pipedreamKeys.root, 'apps', 'popular'] as const,
    tools: (appSlug: string) => [...pipedreamKeys.root, 'apps', appSlug, 'tools'] as const,
    icon: (appSlug: string) => [...pipedreamKeys.root, 'apps', appSlug, 'icon'] as const,
  },
  profiles: {
    all: () => [...pipedreamKeys.root, 'profiles'] as const,
    list: (params?: { app_slug?: string; is_active?: boolean }) => [
      ...pipedreamKeys.root,
      'profiles',
      params?.app_slug ?? '',
      params?.is_active ?? '',
    ] as const,
    detail: (profileId: string) => [...pipedreamKeys.root, 'profiles', profileId] as const,
    connections: (profileId: string) => [
      ...pipedreamKeys.root,
      'profiles',
      profileId,
      'connections',
    ] as const,
  },
  connections: () => [...pipedreamKeys.root, 'connections'] as const,
};
