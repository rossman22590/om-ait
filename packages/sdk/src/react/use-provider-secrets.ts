'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAccountSecretResources, listSessionProviderSecretPools, setSessionProviderSecretPool,
} from '../core/rest/projects-client/account-secret-resources';

export function useAccountSecretResources(accountId: string | null | undefined) {
  return useQuery({
    queryKey: ['account-secret-resources', accountId],
    queryFn: () => listAccountSecretResources(accountId!),
    enabled: Boolean(accountId),
  });
}

export function useSessionProviderSecretPools(projectId: string | null | undefined, sessionId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['session-provider-secret-pools', projectId, sessionId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => listSessionProviderSecretPools(projectId!, sessionId!),
    enabled: Boolean(projectId && sessionId),
  });
  const setPool = useMutation({
    mutationFn: ({ providerId, secretIds }: { providerId: string; secretIds: string[] | null }) => {
      if (!projectId || !sessionId) throw new Error('A project and session are required to select provider secrets');
      return setSessionProviderSecretPool(projectId, sessionId, providerId, secretIds);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['session-provider-secret-pool', projectId, sessionId] }),
      ]);
    },
  });
  return { ...query, setPool };
}
