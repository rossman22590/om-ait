import { useMutation } from '@tanstack/react-query';
import { backendApi } from '@/lib/api-client';

interface UpdateToolsVars {
  agentId: string;
  profileId: string;
  enabledTools: string[];
}

interface UpdateToolsResponse {
  success: boolean;
  enabled_tools: string[];
  total_tools: number;
  profile_id: string;
}

export function useUpdatePipedreamToolsForAgent() {
  const mutation = useMutation<UpdateToolsResponse, Error, UpdateToolsVars>({
    mutationFn: async (payload: UpdateToolsVars) => {
      const { agentId, profileId, enabledTools } = payload
      const result = await backendApi.put<UpdateToolsResponse>(
        `/agents/${agentId}/pipedream-tools/${profileId}`,
        {
          // Backend expects snake_case; keep payload robust server-side too
          enabled_tools: enabledTools,
        },
        {
          errorContext: {
            operation: 'update pipedream tools',
            resource: `agent ${agentId} profile ${profileId}`,
          },
        }
      );
      return result.data;
    },
  });
  return mutation;
}
