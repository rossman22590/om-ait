// app/(dashboard)/scheduled-tasks/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'; // Added AlertCircle, Loader2
import { CreateScheduledTaskForm } from './_components/create-scheduled-task-form';
import type { ScheduledTask } from '@/lib/api';
import { useScheduledTasks } from '@/hooks/react-query/scheduled-tasks/use-scheduled-tasks';
import { ScheduledTaskCard } from './_components/scheduled-task-card'; // Import the card
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'; // Import Alert components

export default function ScheduledTasksPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ScheduledTask | null>(null);
  const { data: tasks, isLoading, error, refetch } = useScheduledTasks();

  const handleOpenCreateForm = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (task: ScheduledTask) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setTaskToEdit(null);
  };

  const handleTaskSaved = () => {
    refetch(); // Refetch the list of tasks
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Scheduled Tasks
              </h1>
            </div>
            <p className="text-md text-muted-foreground max-w-2xl">
              Automate your agent workflows by scheduling tasks to run at specific times or intervals.
            </p>
          </div>
          <Button
            onClick={handleOpenCreateForm}
            className="self-start sm:self-center"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            New Scheduled Task
          </Button>
        </div>

        {/* This is where the list of tasks will be rendered */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading scheduled tasks...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Tasks</AlertTitle>
            <AlertDescription>
              {error.message || 'An unexpected error occurred while fetching scheduled tasks.'}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (!tasks || tasks.length === 0) && (
          <div className="text-center py-10">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-2 text-lg font-medium text-foreground">No Scheduled Tasks</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You haven&apos;t created any scheduled tasks yet. Click "New Scheduled Task" to get started.
            </p>
          </div>
        )}

        {!isLoading && !error && tasks && tasks.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <ScheduledTaskCard key={task.id} task={task} onEdit={handleOpenEditForm} />
            ))}
          </div>
        )}
        {/* End of task list rendering */}

        <CreateScheduledTaskForm
          isOpen={isFormOpen}
          onOpenChange={handleFormClose}
          taskToEdit={taskToEdit}
          onTaskSaved={handleTaskSaved}
        />
      </div>
    </div>
  );
}
