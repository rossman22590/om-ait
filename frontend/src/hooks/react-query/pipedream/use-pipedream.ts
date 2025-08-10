import { useQuery } from '@tanstack/react-query';
import { pipedreamApi } from './utils';
import { pipedreamKeys } from './keys';

export const usePipedreamApps = (params?: { after?: string; q?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: pipedreamKeys.apps.list({ after: params?.after, q: params?.q }),
    queryFn: () => pipedreamApi.getApps(params?.after, params?.q),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
};

export const usePopularPipedreamApps = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: pipedreamKeys.apps.popular(),
    queryFn: () => pipedreamApi.getPopularApps(),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  });
};

export const usePipedreamAppIcon = (appSlug: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: pipedreamKeys.apps.icon(appSlug || ''),
    queryFn: () => pipedreamApi.getAppIcon(appSlug),
    enabled: !!appSlug && (options?.enabled ?? true),
    staleTime: 60 * 60 * 1000,
  });
};

export const usePipedreamAppTools = (appSlug: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: pipedreamKeys.apps.tools(appSlug || ''),
    queryFn: () => pipedreamApi.getAppTools(appSlug),
    enabled: !!appSlug && (options?.enabled ?? true),
    staleTime: 10 * 60 * 1000,
  });
};
