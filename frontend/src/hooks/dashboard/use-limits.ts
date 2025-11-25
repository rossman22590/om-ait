import { backendApi } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./keys";

export const useLimits = () => {
  return useQuery({
    queryKey: dashboardKeys.limits(),
    queryFn: async () => {
      const response = await backendApi.get('/limits', { showErrors: false });
      if (!response.success) {
        throw response.error || new Error('Failed to fetch limits');
      }
      return response.data ?? {};
    },
  });
};