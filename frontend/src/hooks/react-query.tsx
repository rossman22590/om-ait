'use client';

import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Type definitions
export type Project = {
  id: string;
  name: string;
  description?: string;
  updated_at?: string;
  created_at?: string;
};

export type Thread = {
  thread_id: string;
  project_id: string;
  updated_at?: string;
  created_at?: string;
};

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      return data as Project[];
    },
  });
}

/**
 * Hook to fetch all threads for the current user
 */
export function useAllThreads() {
  return useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching threads:', error);
        return [];
      }

      return data as Thread[];
    },
  });
}
