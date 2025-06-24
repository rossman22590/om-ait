'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSidebar } from "@/components/ui/sidebar";

// Simple search component that just provides a search input
// The filtering will be done in the NavAgents component
export function SidebarSearch() {
  const { state } = useSidebar();
  const [query, setQuery] = useState('');

  // Handle keyboard shortcut to focus search (CMD+K or CTRL+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        document.getElementById('sidebar-search-input')?.focus();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // When search query changes, dispatch a custom event so NavAgents can listen
  useEffect(() => {
    // Broadcast the search query as a custom event
    window.dispatchEvent(
      new CustomEvent('sidebar-search-query-changed', {
        detail: { query }
      })
    );
  }, [query]);

  // Only render the search when sidebar is not collapsed
  if (state === 'collapsed') return null;
  
  return (
    <div className="flex items-center px-2 pt-3 pb-2">
      <div className="relative w-full">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="sidebar-search-input"
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-8 pr-8
                    text-sm transition-colors placeholder:text-muted-foreground
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm
                      opacity-70 hover:opacity-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}
