const projectKeysBase = ['projects'] as const;
export const projectKeys = {
  all: projectKeysBase,
  lists: () => [...projectKeysBase, 'list'] as const,
  list: (filters?: Record<string, any>) => [...projectKeysBase, 'list', filters] as const,
  details: () => [...projectKeysBase, 'detail'] as const,
  detail: (id: string) => [...projectKeysBase, 'detail', id] as const,
} as const;

const threadKeysBase = ['threads'] as const;
export const threadKeys = {
  all: threadKeysBase,
  lists: (search?: string) => [...threadKeysBase, 'list', search] as const,
  details: () => [...threadKeysBase, 'detail'] as const,
  detail: (id: string) => [...threadKeysBase, 'detail', id] as const,
} as const;
