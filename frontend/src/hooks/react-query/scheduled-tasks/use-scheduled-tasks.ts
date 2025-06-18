// hooks/react-query/scheduled-tasks/use-scheduled-tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  getScheduledTaskRuns,
} from '@/lib/api';
import { scheduledTaskKeys } from './keys';
import type {
  ScheduledTask,
  ScheduledTaskCreatePayload,
  ScheduledTaskUpdatePayload,
  ScheduledTaskRun,
} from './utils';
import { handleApiSuccess } from '@/lib/error-handler';

// Hook to fetch all scheduled tasks for the current user
export const useScheduledTasks = (options?: { staleTime?: number, gcTime?: number }) => {
  return useQuery<ScheduledTask[], Error>({
    queryKey: scheduledTaskKeys.lists(),
    queryFn: getScheduledTasks,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000,    // 10 minutes
  });
};

// Hook to create a new scheduled task
export const useCreateScheduledTask = () => {
  const queryClient = useQueryClient();
  return useMutation<ScheduledTask, Error, ScheduledTaskCreatePayload>({
    mutationFn: createScheduledTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: scheduledTaskKeys.lists() });
      queryClient.setQueryData(scheduledTaskKeys.detail(data.id), data);
      handleApiSuccess('Scheduled task created successfully.');
    },
    // Error handling will be managed by the global error handler in createMutationHook if not overridden
  });
};

// Hook to update an existing scheduled task
export const useUpdateScheduledTask = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ScheduledTask,
    Error,
    { taskId: string; payload: ScheduledTaskUpdatePayload }
  >({
    mutationFn: ({ taskId, payload }) => updateScheduledTask(taskId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: scheduledTaskKeys.lists() });
      queryClient.setQueryData(scheduledTaskKeys.detail(variables.taskId), data);
      // Optimistically update the list
      queryClient.setQueryData<ScheduledTask[]>(
        scheduledTaskKeys.lists(),
        (oldData) =>
          oldData?.map((task) =>
            task.id === variables.taskId ? data : task
          ) ?? []
      );
      handleApiSuccess('Scheduled task updated.');
    },
  });
};

// Hook to delete a scheduled task
export const useDeleteScheduledTask = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { deleted: boolean },
    Error,
    string // taskId
  >({
    mutationFn: deleteScheduledTask,
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: scheduledTaskKeys.lists() });
      queryClient.removeQueries({ queryKey: scheduledTaskKeys.detail(taskId) });
      // Optimistically remove from the list
      queryClient.setQueryData<ScheduledTask[]>(
        scheduledTaskKeys.lists(),
        (oldData) => oldData?.filter((task) => task.id !== taskId) ?? []
      );
      handleApiSuccess('Scheduled task deleted.');
    },
  });
};

// Hook to fetch runs for a specific scheduled task
export const useScheduledTaskRuns = (taskId: string, options?: { enabled?: boolean, staleTime?: number }) => {
  return useQuery<ScheduledTaskRun[], Error>({
    queryKey: scheduledTaskKeys.runs(taskId),
    queryFn: () => getScheduledTaskRuns(taskId),
    enabled: options?.enabled ?? !!taskId, // Enable only if taskId is provided
    staleTime: options?.staleTime ?? 1 * 60 * 1000, // 1 minute
  });
};
