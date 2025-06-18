// hooks/react-query/scheduled-tasks/keys.ts
import { createQueryKeys } from '@/hooks/use-query';

export const scheduledTaskKeys = createQueryKeys({
  all: ['scheduled-tasks'] as const,
  lists: () => [...scheduledTaskKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...scheduledTaskKeys.lists(), filters] as const,
  details: () => [...scheduledTaskKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduledTaskKeys.details(), id] as const,
  runs: (taskId: string) => [...scheduledTaskKeys.all, 'runs', taskId] as const,
});
