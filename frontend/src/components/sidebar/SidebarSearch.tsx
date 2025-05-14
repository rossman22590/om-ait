'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { SidebarGroup } from '@/components/ui/sidebar';
import { useSearch } from './search-context';

interface SidebarSearchProps {
  showOnlySearch?: boolean;
}

export function SidebarSearch({ showOnlySearch = false }: SidebarSearchProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const [query, setQuery] = useState(searchQuery);
  
  // Keep local state in sync with context
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);
  
  // Update both local state and context when query changes
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSearchQuery(newQuery);
  };
  
  // Clear the search query
  const clearQuery = () => {
    setQuery('');
    setSearchQuery('');
  };

  return (
    <SidebarGroup>
      <div className="relative px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search agents..."
            className="w-full rounded-md bg-background/80 border border-input py-2 pl-8 pr-10 text-sm
                     text-foreground focus:outline-none focus:ring-1
                     focus:ring-ring"
          />
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm
                        opacity-70 hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </button>
          )}
        </div>
      </div>
    </SidebarGroup>
  );
}
