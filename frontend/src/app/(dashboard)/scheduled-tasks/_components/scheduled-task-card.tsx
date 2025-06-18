// app/(dashboard)/scheduled-tasks/_components/scheduled-task-card.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ScheduledTask, ScheduledTaskRun } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit3, Trash2, Play, AlertTriangle, CheckCircle, Loader2, LinkIcon, Bot } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useUpdateScheduledTask, useDeleteScheduledTask, useScheduledTaskRuns } from '@/hooks/react-query/scheduled-tasks/use-scheduled-tasks';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ScheduledTaskCardProps {
  task: ScheduledTask;
  onEdit: (task: ScheduledTask) => void;
}

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

// Get user's timezone
const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Format time with timezone
const formatTimeWithTimezone = (utcTimeString: string): string => {
  if (!utcTimeString) return 'midnight';
  const localTime = convertUTCTimeToLocal(utcTimeString);
  const timezone = getUserTimezone();
  return `${localTime} (${timezone})`;
};

const getScheduleDescription = (task: ScheduledTask): string => {
  switch (task.schedule_type) {
    case 'hourly':
      return `Runs every hour at minute ${task.minute_of_hour || 0}`;
    case 'daily':
      return `Runs daily at ${formatTimeWithTimezone(task.time_of_day || '')}`;
    case 'weekly':
      const days = task.days_of_week
        ?.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
        .join(', ');
      return `Runs weekly on ${days || 'selected days'} at ${formatTimeWithTimezone(task.time_of_day || '')}`;
    case 'monthly':
      return `Runs monthly on day ${task.day_of_month || 1} at ${formatTimeWithTimezone(task.time_of_day || '')}`;
    default:
      return 'Unknown schedule';
  }
};

const getNextRunDescription = (nextRunAt: string): string => {
  try {
    const nextRun = parseISO(nextRunAt);
    const userTimezone = getUserTimezone();
    
    // Format the next run time in user's timezone
    const localNextRun = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(nextRun);
    
    return `Next run: ${formatDistanceToNow(nextRun, { addSuffix: true })} (${localNextRun})`;
  } catch (error) {
    return 'Next run: Invalid date';
  }
};

const getLastRunStatus = (runs: ScheduledTaskRun[] | undefined): React.ReactNode => {
  if (!runs || runs.length === 0) {
    return <span className="text-xs text-muted-foreground">No runs yet</span>;
  }
  const lastRun = runs[0]; // Assuming runs are sorted by date desc
  let icon;
  let colorClass = '';
  switch (lastRun.status) {
    case 'completed':
      icon = <CheckCircle className="h-3 w-3" />;
      colorClass = 'text-green-600 dark:text-green-400';
      break;
    case 'failed':
      icon = <AlertTriangle className="h-3 w-3" />;
      colorClass = 'text-red-600 dark:text-red-400';
      break;
    case 'running':
      icon = <Loader2 className="h-3 w-3 animate-spin" />;
      colorClass = 'text-blue-600 dark:text-blue-400';
      break;
    default:
      icon = <Clock className="h-3 w-3" />;
      colorClass = 'text-muted-foreground';
  }
  
  try {
    const runTime = parseISO(lastRun.task_run_time);
    const userTimezone = getUserTimezone();
    
    // Format the run time in user's timezone
    const localRunTime = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(runTime);
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        {icon}
        Last run: {lastRun.status} ({localRunTime})
      </div>
    );
  } catch (error) {
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        {icon}
        Last run: {lastRun.status} (Invalid date)
      </div>
    );
  }
};

export const ScheduledTaskCard: React.FC<ScheduledTaskCardProps> = ({ task, onEdit }) => {
  const updateMutation = useUpdateScheduledTask();
  const deleteMutation = useDeleteScheduledTask();
  const { data: runs, isLoading: isLoadingRuns } = useScheduledTaskRuns(task.id, { enabled: task.is_active });

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        taskId: task.id,
        payload: { is_active: !task.is_active },
      });
      toast.success(`Task ${task.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDelete = async () => {
    setIsConfirmDeleteDialogOpen(false); // Close dialog before mutation
    try {
      await deleteMutation.mutateAsync(task.id);
      toast.success('Scheduled task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const targetLink = task.thread_id ? `/agents/${task.thread_id}` : (task.project_id ? `/projects/${task.project_id}` : '#');
  const targetType = task.thread_id ? 'Thread' : (task.agent_id ? 'Agent' : 'Task');
  const targetIcon = task.thread_id ? <LinkIcon className="h-3 w-3" /> : <Bot className="h-3 w-3" />;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
            {task.prompt ? `"${task.prompt}"` : `Scheduled Task ${task.id.substring(0, 6)}`}
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {getScheduleDescription(task)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <Badge variant={task.is_active ? "default" : "outline"} className={task.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}>
            {task.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {getNextRunDescription(task.next_run_at)}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {targetIcon}
          {targetLink !== '#' ? (
            <Link href={targetLink} className="hover:underline">
              View Target {targetType}
            </Link>
          ) : (
            <span>Target: {targetType}</span>
          )}
        </div>
        
        <div className="min-h-[18px]"> {/* Placeholder for last run status to prevent layout shift */}
          {isLoadingRuns ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading run status...
            </div>
          ) : (
            getLastRunStatus(runs)
          )}
        </div>

<div className='flex gap-4 mx-auto justify-center'>
         <Button
          variant="default"
          size="sm"
          onClick={() => onEdit(task)}
          disabled={updateMutation.isPending}
          className=""
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            task.is_active ? <Edit3 className="mr-2 h-4 w-4 transform fill-current" /> : <Edit3 className="mr-2 h-4 w-4" />
          )}
          {task.is_active ? 'Edit' : 'Edit'}
        </Button>
          <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsConfirmDeleteDialogOpen(true)}
          disabled={updateMutation.isPending}
          className=""
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            task.is_active ? <Trash2 className="mr-2 h-4 w-4 transform fill-current" /> : <Trash2 className="mr-2 h-4 w-4" />
          )}
          {task.is_active ? 'Delete' : 'Delete'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleActive}
          disabled={updateMutation.isPending}
          className=""
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            task.is_active ? <Play className="mr-2 h-4 w-4 transform rotate-90 fill-current" /> : <Play className="mr-2 h-4 w-4" />
          )}
          {task.is_active ? 'Deactivate' : 'Activate'}
        </Button>
        </div>
       </CardContent>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the scheduled task
              <span className="font-semibold"> &quot;{task.prompt ? task.prompt : `Task ${task.id.substring(0,6)}`}&quot;</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
