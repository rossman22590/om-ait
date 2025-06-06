// app/(dashboard)/scheduled-tasks/_components/create-scheduled-task-form.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ScheduledTask, ScheduledTaskCreatePayload, ScheduledTaskUpdatePayload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateScheduledTask, useUpdateScheduledTask } from '@/hooks/react-query/scheduled-tasks/use-scheduled-tasks';
import { useAvailableModels } from '@/hooks/react-query/subscriptions/use-model';
import { useAgent } from '@/hooks/react-query/agents/use-agents'; 
import { useThreads, useProjects } from '@/hooks/react-query/sidebar/use-sidebar'; // Add useProjects
import { useThreadQuery } from '@/hooks/react-query/threads/use-threads'; // Import useThreadQuery
import { toast } from 'sonner';
import { Loader2, Bot, LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Helper functions for timezone conversion
const convertUTCTimeToLocal = (utcTimeString: string): string => {
  if (!utcTimeString) return '';
  
  // Create a date object for today with the UTC time
  const today = new Date();
  const [hours, minutes] = utcTimeString.split(':').map(Number);
  
  // Create UTC date
  const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes));
  
  // Get local time
  const localHours = utcDate.getHours().toString().padStart(2, '0');
  const localMinutes = utcDate.getMinutes().toString().padStart(2, '0');
  
  return `${localHours}:${localMinutes}`;
};

const convertLocalTimeToUTC = (localTimeString: string): string => {
  if (!localTimeString) return '';
  
  // Create a date object for today with the local time
  const today = new Date();
  const [hours, minutes] = localTimeString.split(':').map(Number);
  
  // Create local date
  const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  
  // Get UTC time
  const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
  const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
  
  return `${utcHours}:${utcMinutes}`;
};

// Get user's timezone
const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Updated Zod schema
const scheduleSchema = z.object({
  targetType: z.literal('thread'), // Fixed to 'thread'
  thread_id: z.string({
    required_error: "Conversation (Thread) is required.",
  }).min(1, "Conversation (Thread) is required."), // Made required
  prompt: z.string().max(2000, "Prompt cannot exceed 2000 characters.").optional(),
  schedule_type: z.enum(['hourly', 'daily', 'weekly', 'monthly'], {
    required_error: "Schedule type is required."
  }),
  minute_of_hour: z.number().int().min(0).max(59).optional(),
  time_of_day: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time (HH:MM)").optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  days_of_week: z.array(z.number().min(0).max(6)).optional(),
  model_name: z.string({
    required_error: "Model is required."
  }).min(1, "Model is required."), // Made required
  is_active: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Conditional validations based on schedule_type
  if (data.schedule_type === 'hourly') {
    if (data.minute_of_hour === undefined || data.minute_of_hour === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Minute of the hour is required for hourly schedule.", path: ["minute_of_hour"] });
    }
  } else if (data.schedule_type === 'daily') {
    if (!data.time_of_day) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time of day is required for daily schedule.", path: ["time_of_day"] });
    }
  } else if (data.schedule_type === 'weekly') {
    if (!data.time_of_day) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time of day is required for weekly schedule.", path: ["time_of_day"] });
    }
    if (!data.days_of_week || data.days_of_week.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one day of the week is required for weekly schedule.", path: ["days_of_week"] });
    }
  } else if (data.schedule_type === 'monthly') {
    if (!data.time_of_day) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Time of day is required for monthly schedule.", path: ["time_of_day"] });
    }
    if (!data.day_of_month) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Day of the month is required for monthly schedule.", path: ["day_of_month"] });
    }
  }
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface CreateScheduledTaskFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: ScheduledTask | null;
  onTaskSaved?: () => void;
}

const daysOfWeekOptions = [
  { value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const CreateScheduledTaskForm: React.FC<CreateScheduledTaskFormProps> = ({
  isOpen,
  onOpenChange,
  taskToEdit,
  onTaskSaved,
}) => {
  // Moved declarations to the top of the component scope
  const { data: threadsData, isLoading: isLoadingThreads } = useThreads();
  const { data: projects, isLoading: isLoadingProjects } = useProjects(); // Add this line
  const threads = threadsData || [];
  const { data: availableModelsData, isLoading: isLoadingModels } = useAvailableModels();
  const models = availableModelsData?.models || [];

  // Get user's timezone
  const userTimezone = useMemo(() => getUserTimezone(), []);

  // Create display threads with project names
  const displayThreads = useMemo(() => {
    if (!threads || !projects) return [];
    
    const projectsById = new Map(projects.map(p => [p.id, p]));
    
    return threads
      .map(thread => {
        const project = projectsById.get(thread.project_id || '');
        return {
          threadId: thread.thread_id,
          projectName: project?.name || `Conversation ...${thread.thread_id.slice(-4)}`,
          agent_id: thread.agent_id,
        };
      })
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [threads, projects]);

  const isEditing = !!taskToEdit; 

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      targetType: 'thread', // Fixed to 'thread'
      is_active: true,
      days_of_week: [],
      minute_of_hour: 0,
      // model_name will be set by useEffect
    },
  });

  const scheduleType = watch('schedule_type');
  const selectedThreadId = watch('thread_id');

  // Fetch the full thread object for the selected thread_id
  const { data: fullSelectedThreadData, isLoading: isLoadingFullSelectedThread } = useThreadQuery(selectedThreadId);

  // Derive agentId from the full thread data
  const agentIdForSelectedThread = useMemo(() => {
    return fullSelectedThreadData?.agent_id || '';
  }, [fullSelectedThreadData]);

  // Use the useAgent hook with only the agentId, its internal logic handles 'enabled'
  const { data: selectedAgentData, isLoading: isLoadingSelectedAgent } = useAgent(agentIdForSelectedThread);

  const selectedThreadDetails = useMemo(() => {
    if (!selectedThreadId || isLoadingThreads || isLoadingFullSelectedThread) return null;
    const thread = displayThreads.find(t => t.threadId === selectedThreadId); // Use displayThreads
    if (!thread) return null;

    // Use projectName from the displayThreads
    const threadName = thread.projectName;
    const agentName = selectedAgentData?.name || 'nt'; // Use agent name from fetched data

    return {
      name: threadName,
      agentName: agentName,
      threadUrl: `/agents/${thread.threadId}`
    };
  }, [selectedThreadId, displayThreads, isLoadingThreads, isLoadingFullSelectedThread, selectedAgentData]); // Use displayThreads

  const createMutation = useCreateScheduledTask();
  const updateMutation = useUpdateScheduledTask();
  
  const isLoadingMutation = createMutation.isPending || updateMutation.isPending || isSubmitting;

  // Set default model_name when models load or taskToEdit changes
  useEffect(() => {
    if (models.length > 0) {
      if (taskToEdit) {
        // Editing existing task: use task's model_name or default to first available
        setValue('model_name', taskToEdit.model_name || models[0].id);
      } else {
        // Creating new task: default to first available model
        setValue('model_name', models[0].id);
      }
    }
  }, [models, taskToEdit, setValue]);

  useEffect(() => {
    if (taskToEdit) {
      reset({
        targetType: 'thread', // Always 'thread'
        thread_id: taskToEdit.thread_id || undefined,
        prompt: taskToEdit.prompt || '',
        schedule_type: taskToEdit.schedule_type,
        days_of_week: taskToEdit.days_of_week || [],
        // Convert UTC time to local time for display
        time_of_day: taskToEdit.time_of_day ? convertUTCTimeToLocal(taskToEdit.time_of_day) : undefined,
        minute_of_hour: taskToEdit.minute_of_hour === null ? undefined : taskToEdit.minute_of_hour,
        day_of_month: taskToEdit.day_of_month === null ? undefined : taskToEdit.day_of_month,
        is_active: taskToEdit.is_active,
        model_name: taskToEdit.model_name || undefined, // Initial value, will be overridden by models useEffect
      });
    } else {
      reset({
        targetType: 'thread', // Always 'thread'
        is_active: true,
        days_of_week: [],
        thread_id: undefined,
        prompt: '',
        schedule_type: undefined,
        time_of_day: undefined,
        minute_of_hour: 0,
        day_of_month: undefined,
        model_name: undefined, // Initial value, will be overridden by models useEffect
      });
    }
  }, [taskToEdit, reset]);

  const onSubmit = async (data: ScheduleFormData) => {
    const basePayload = {
      thread_id: data.thread_id, // Always thread_id
      prompt: data.prompt,
      schedule_type: data.schedule_type,
      is_active: data.is_active,
      model_name: data.model_name,
    };

    let specificPayload: Partial<ScheduledTaskCreatePayload> = {};

    if (data.schedule_type === 'hourly') {
      specificPayload.minute_of_hour = data.minute_of_hour ?? 0;
    } else if (data.schedule_type === 'daily') {
      // Convert local time to UTC before submitting
      specificPayload.time_of_day = data.time_of_day ? convertLocalTimeToUTC(data.time_of_day) : undefined;
    } else if (data.schedule_type === 'weekly') {
      // Convert local time to UTC before submitting
      specificPayload.time_of_day = data.time_of_day ? convertLocalTimeToUTC(data.time_of_day) : undefined;
      specificPayload.days_of_week = data.days_of_week;
    } else if (data.schedule_type === 'monthly') {
      // Convert local time to UTC before submitting
      specificPayload.time_of_day = data.time_of_day ? convertLocalTimeToUTC(data.time_of_day) : undefined;
      specificPayload.day_of_month = data.day_of_month;
    }
    
    const finalPayload = { ...basePayload, ...specificPayload } as ScheduledTaskCreatePayload | ScheduledTaskUpdatePayload;

    try {
      if (isEditing && taskToEdit) {
        await updateMutation.mutateAsync({ taskId: taskToEdit.id, payload: finalPayload as ScheduledTaskUpdatePayload });
        toast.success('Scheduled task updated successfully!');
      } else {
        await createMutation.mutateAsync(finalPayload as ScheduledTaskCreatePayload);
        toast.success('Scheduled task created successfully!');
      }
      onTaskSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} scheduled task.`);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Scheduled Task' : 'Create Scheduled Task'}</DialogTitle> 
          <DialogDescription>
            Configure a task to run automatically based on your preferred schedule. Times are shown in your local timezone ({userTimezone}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Thread Selector */}
          <div>
            <Label htmlFor="thread_id">Conversation (Thread)</Label>
            <Controller name="thread_id" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoadingThreads}>
                  <SelectTrigger><SelectValue placeholder={isLoadingThreads ? "Loading conversations..." : "Select a conversation"} /></SelectTrigger>
                  <SelectContent>
                    {displayThreads.map(thread => (
                      <SelectItem key={thread.threadId} value={thread.threadId}>
                        {thread.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            )}/>
            {errors.thread_id && <p className="text-xs text-red-500 mt-1">{errors.thread_id.message}</p>}
          </div>

          {/* Selected Thread Info */}
          {selectedThreadDetails && (
            <Card className="p-3 border-l-4 border-blue-500 shadow-none bg-blue-50/20">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {selectedThreadDetails.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                    <Bot className="h-3 w-3 mr-1" />
                    Agent: {isLoadingSelectedAgent ? 'Loading...' : selectedThreadDetails.agentName}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedThreadDetails.threadUrl} target="_blank" rel="noopener noreferrer">
                    View Thread
                  </a>
                </Button>
              </div>
            </Card>
          )}

          {/* Prompt */}
          <div>
            <Label htmlFor="prompt">Prompt (Optional)</Label>
            <Textarea id="prompt" {...register('prompt')} placeholder="Enter prompt to run... (e.g., 'Summarize today's news')" />
             {errors.prompt && <p className="text-xs text-red-500 mt-1">{errors.prompt.message}</p>}
          </div>

          {/* Model Selector */}
          <div>
            <Label htmlFor="model_name">Model</Label>
            <Controller
              name="model_name"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Value is now guaranteed to be a non-empty string
                  disabled={isLoadingModels}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model: any) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name || model.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              If not selected, the agent&apos;s preferred model or the system default will be used.
            </p>
            {errors.model_name && <p className="text-xs text-red-500 mt-1">{errors.model_name.message}</p>}
          </div>

          {/* Schedule Type */}
          <div>
            <Label htmlFor="schedule_type">Schedule Type</Label>
            <Controller name="schedule_type" control={control} render={({ field }) => (
                <Select onValueChange={(value) => {
                    field.onChange(value);
                    setValue('minute_of_hour', value === 'hourly' ? (watch('minute_of_hour') ?? 0) : undefined);
                    setValue('time_of_day', value !== 'hourly' ? watch('time_of_day') : undefined);
                    setValue('day_of_month', value === 'monthly' ? watch('day_of_month') : undefined);
                    setValue('days_of_week', value === 'weekly' ? watch('days_of_week') : []);
                  }} value={field.value || ''}>
                  <SelectTrigger><SelectValue placeholder="Select schedule type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
            )}/>
            {errors.schedule_type && <p className="text-xs text-red-500 mt-1">{errors.schedule_type.message}</p>}
          </div>

          {/* Minute of Hour (for Hourly) */}
          {scheduleType === 'hourly' && (
            <div>
              <Label htmlFor="minute_of_hour">Minute of the Hour (0-59)</Label>
              <Controller name="minute_of_hour" control={control} defaultValue={0}
                render={({ field }) => (
                  <Input id="minute_of_hour" type="number" min="0" max="59" 
                         value={field.value === undefined || field.value === null ? '' : String(field.value)}
                         onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                         placeholder="e.g., 0 for top of the hour, 15 for quarter past" />
                )} />
              {errors.minute_of_hour && <p className="text-xs text-red-500 mt-1">{errors.minute_of_hour.message}</p>}
            </div>
          )}

          {/* Time of Day (for Daily, Weekly, Monthly) */}
          {['daily', 'weekly', 'monthly'].includes(scheduleType || '') && (
            <div>
              <Label htmlFor="time_of_day">Time of Day ({userTimezone})</Label>
              <Input id="time_of_day" type="time" {...register('time_of_day')} />
              <p className="text-xs text-muted-foreground mt-1">
                Time shown in your local timezone. Will be converted to UTC for scheduling.
              </p>
              {errors.time_of_day && <p className="text-xs text-red-500 mt-1">{errors.time_of_day.message}</p>}
            </div>
          )}

          {/* Day of Month (for Monthly) */}
          {scheduleType === 'monthly' && (
            <div>
              <Label htmlFor="day_of_month">Day of the Month (1-31)</Label>
               <Controller name="day_of_month" control={control}
                render={({ field }) => (
                  <Input id="day_of_month" type="number" min="1" max="31" 
                         value={field.value === undefined || field.value === null ? '' : String(field.value)}
                         onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                         placeholder="e.g., 1 for 1st, 15 for 15th" />
                )} />
              {errors.day_of_month && <p className="text-xs text-red-500 mt-1">{errors.day_of_month.message}</p>}
            </div>
          )}

          {/* Days of Week (for Weekly) */}
          {scheduleType === 'weekly' && (
            <div>
              <Label>Days of the Week</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                {daysOfWeekOptions.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Controller name="days_of_week" control={control} render={({ field }) => (
                        <Checkbox id={`day-${day.value}`} checked={field.value?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            const currentDays = field.value || [];
                            const newDays = checked ? [...currentDays, day.value] : currentDays.filter(d => d !== day.value);
                            field.onChange(newDays.sort((a,b) => a-b));
                          }}/>
                    )}/>
                    <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer">{day.label}</Label>
                  </div>
                ))}
              </div>
              {errors.days_of_week && <p className="text-xs text-red-500 mt-1">{errors.days_of_week.message}</p>}
            </div>
          )}
          
          <div className="flex items-center space-x-2 pt-2">
            <Controller name="is_active" control={control} render={({ field }) => (<Checkbox id="is_active" checked={field.value} onCheckedChange={field.onChange} />)}/>
            <Label htmlFor="is_active" className="font-normal">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoadingMutation}>Cancel</Button>
            <Button type="submit" disabled={isLoadingMutation}>
              {isLoadingMutation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Task'} 
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
