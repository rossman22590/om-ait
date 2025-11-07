'use client';

import { createMutationHook } from "@/hooks/use-query";
import { getProjects, Project } from "@/lib/api/projects";
import { getThreads, Thread } from "@/lib/api/threads";
import { createQueryHook } from '@/hooks/use-query';
import { threadKeys } from "./keys";
import { projectKeys } from "./keys";

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
    const data = await getThreads();
    return data as Thread[];
  },
  {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  }
)();

export type ThreadWithProject = {
  threadId: string;
  projectId: string;
  projectName: string;
  url: string;
  updatedAt: string;
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
    let displayName = project.name || 'Unnamed Project';
    const iconName = project.icon_name;

    threadsWithProjects.push({
      threadId: thread.thread_id,
      projectId: projectId,
      projectName: displayName,
      url: `/projects/${projectId}/thread/${thread.thread_id}`,
      updatedAt:
        thread.updated_at || project.updated_at || new Date().toISOString(),
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
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  sortedThreads.forEach(thread => {
    const threadDate = new Date(thread.updatedAt);
    const startOfThreadDate = new Date(threadDate);
    startOfThreadDate.setHours(0, 0, 0, 0);
    const threadDateOnly = new Date(
      threadDate.getFullYear(),
      threadDate.getMonth(),
      threadDate.getDate()
    );
    const diffInDays = Math.floor((startOfToday.getTime() - startOfThreadDate.getTime()) / (1000 * 60 * 60 * 24));
    let dateGroup: string;
    if (threadDateOnly.getTime() === today.getTime()) {
      dateGroup = 'Today';
    } else if (threadDateOnly.getTime() === yesterday.getTime()) {
      dateGroup = 'Yesterday';
    } else {
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