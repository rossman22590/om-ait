// app/(dashboard)/scheduled-tasks/_components/scheduled-task-list.tsx
'use client';

import React from 'react';
import { ScheduledTask } from '@/lib/api';
import { ScheduledTaskCard } from './scheduled-task-card';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useScheduledTasks } from '@/hooks/react-query/scheduled-tasks/use-scheduled-tasks';

interface ScheduledTaskListProps {
  onEditTask: (task: ScheduledTask) => void;
}

export const ScheduledTaskList: React.FC<ScheduledTaskListProps> = ({ onEditTask }) => {
  const { data: tasks, isLoading, error } = useScheduledTasks();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading scheduled tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Tasks</AlertTitle>
        <AlertDescription>
          {error.message || 'An unexpected error occurred while fetching scheduled tasks.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-10">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-2 text-lg font-medium text-foreground">No Scheduled Tasks</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You haven&apos;t created any scheduled tasks yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <ScheduledTaskCard key={task.id} task={task} onEdit={onEditTask} />
      ))}
    </div>
  );
};
