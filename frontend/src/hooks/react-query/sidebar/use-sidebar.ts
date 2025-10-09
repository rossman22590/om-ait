'use client';

import { createMutationHook } from "@/hooks/use-query";
import { getProjects, getThreads, Project, Thread } from "@/lib/api";
import { createQueryHook } from '@/hooks/use-query';
import { threadKeys } from "./keys";
import { projectKeys } from "./keys";
import { deleteThread } from "../threads/utils";

export const useProjects = createQueryHook(
  projectKeys.lists(),
  async () => {
    const data = await getProjects();
    return data as Project[];
  },
  {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  }
);

export const useThreads = (searchQuery?: string) => createQueryHook(
  threadKeys.lists(searchQuery),
  async () => {
    // Start with 100 most recent threads to prevent performance issues
    // Can be increased if needed for power users
    // If searching, increase limit to 500 to find older matches
    const limit = searchQuery?.trim() ? 500 : 100;
    const data = await getThreads(undefined, limit, searchQuery);
    return data as Thread[];
  },
  {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  }
)();

interface DeleteThreadVariables {
  threadId: string;
  sandboxId?: string;
  isNavigateAway?: boolean;
}

export const useDeleteThread = createMutationHook(
  async ({ threadId, sandboxId }: DeleteThreadVariables) => {
    return await deleteThread(threadId, sandboxId);
  },
  {
    onSuccess: () => {
    },
  }
);

interface DeleteMultipleThreadsVariables {
  threadIds: string[];
  threadSandboxMap?: Record<string, string>;
  onProgress?: (completed: number, total: number) => void;
}

export const useDeleteMultipleThreads = createMutationHook(
  async ({ threadIds, threadSandboxMap, onProgress }: DeleteMultipleThreadsVariables) => {
    let completedCount = 0;
    const results = await Promise.all(
      threadIds.map(async (threadId) => {
        try {
          const sandboxId = threadSandboxMap?.[threadId];
          const result = await deleteThread(threadId, sandboxId);
          completedCount++;
          onProgress?.(completedCount, threadIds.length);
          return { success: true, threadId };
        } catch (error) {
          return { success: false, threadId, error };
        }
      })
    );
    
    return {
      successful: results.filter(r => r.success).map(r => r.threadId),
      failed: results.filter(r => !r.success).map(r => r.threadId),
    };
  },
  {
    onSuccess: () => {
    },
  }
);

export type ThreadWithProject = {
  threadId: string;
  projectId: string;
  projectName: string;
  url: string;
  updatedAt: string;
  // Icon system field for thread categorization
  iconName?: string | null;
};

export const processThreadsWithProjects = (
  threads: Thread[],
  projects: Project[]
): ThreadWithProject[] => {
  const projectsById = new Map<string, Project>();
  projects.forEach((project) => {
    projectsById.set(project.id, project);
  });

  const threadsWithProjects: ThreadWithProject[] = [];

  for (const thread of threads) {
    const projectId = thread.project_id;
    if (!projectId) continue;

    const project = projectsById.get(projectId);
    if (!project) {
      continue;
    }
    // Use dedicated icon_name field from backend
    let displayName = project.name || 'Unnamed Project';
    const iconName = project.icon_name; // Get icon from dedicated database field

    threadsWithProjects.push({
      threadId: thread.thread_id,
      projectId: projectId,
      projectName: displayName,
      url: `/projects/${projectId}/thread/${thread.thread_id}`,
      updatedAt:
        thread.updated_at || project.updated_at || new Date().toISOString(),
      // Use dedicated field or parsed embedded data
      iconName: iconName,
    });
  }

  return sortThreads(threadsWithProjects);
};

export const sortThreads = (
  threadsList: ThreadWithProject[],
): ThreadWithProject[] => {
  return [...threadsList].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

export type GroupedThreads = {
  [dateGroup: string]: ThreadWithProject[];
};

export const groupThreadsByDate = (
  threadsList: ThreadWithProject[]
): GroupedThreads => {
  const sortedThreads = sortThreads(threadsList);
  const grouped: GroupedThreads = {};
  const now = new Date();
  
  // Get today's date at midnight for proper comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  sortedThreads.forEach(thread => {
    const threadDate = new Date(thread.updatedAt);
    
    // Get thread date at midnight
    const threadDateOnly = new Date(threadDate.getFullYear(), threadDate.getMonth(), threadDate.getDate());
    
    let dateGroup: string;
    
    // Compare dates properly using date-only comparison
    if (threadDateOnly.getTime() === today.getTime()) {
      dateGroup = 'Today';
    } else if (threadDateOnly.getTime() === yesterday.getTime()) {
      dateGroup = 'Yesterday';
    } else {
      // For older dates, calculate difference in days from today
      const diffInMs = today.getTime() - threadDateOnly.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays <= 7) {
        dateGroup = 'This Week';
      } else if (diffInDays <= 30) {
        dateGroup = 'This Month';
      } else if (diffInDays <= 90) {
        dateGroup = 'Last 3 Months';
      } else {
        dateGroup = 'Older';
      }
    }
    
    if (!grouped[dateGroup]) {
      grouped[dateGroup] = [];
    }
    grouped[dateGroup].push(thread);
  });
  
  return grouped;
};