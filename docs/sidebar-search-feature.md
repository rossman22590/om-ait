# Sidebar Search Feature

## Overview
The sidebar search feature allows users to quickly find and filter agents/threads in the left sidebar by project name. The feature is implemented with a clean, accessible UI that appears above the "Agents" header when the sidebar is expanded.

## Implementation Details

### Location
The search functionality is implemented in:
- `frontend/src/components/sidebar/nav-agents.tsx`

### Key Components
1. **Search Input**: 
   - Uses the existing `SidebarInput` component for consistent styling
   - Shows only when sidebar is expanded (not in collapsed state)
   - Includes search icon and clear button

2. **Filtering Logic**:
   - Uses React's `useMemo` for performance optimization
   - Case-insensitive matching against project names
   - Updates in real-time as the user types

3. **UI States**:
   - Empty state shows all agents
   - "No matches found" state shows when search returns no results
   - Clear button (X) appears only when search has content

### Code Implementation

#### State Management
```typescript
// Search state
const [searchTerm, setSearchTerm] = useState("")
const searchInputRef = useRef<HTMLInputElement>(null)

// Filtering logic with useMemo for performance
const filteredThreads = useMemo(() => {
  if (!searchTerm) return threads;
  
  return threads.filter(thread => 
    thread.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [threads, searchTerm]);
```

#### UI Components
```tsx
{state !== "collapsed" && (
  <div className="px-3 pt-2 pb-1">
    <div className="relative">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
      <SidebarInput
        ref={searchInputRef}
        type="text"
        placeholder="Search agents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        className="w-full pl-8"
      />
      {searchTerm && (
        <button 
          className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
          onClick={() => setSearchTerm('')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
)}
```

#### Rendering Filtered Results
```tsx
{filteredThreads.length > 0 ? (
  // Show filtered threads list
  <>
    {filteredThreads.map((thread) => {
      // Thread rendering logic
    })}
  </>
) : threads.length > 0 && searchTerm ? (
  // No search results state
  <SidebarMenuItem>
    <SidebarMenuButton className="text-sidebar-foreground/70">
      <MessagesSquare className="h-4 w-4" />
      <span>No matches found</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
) : (
  // Empty state (no threads at all)
  <SidebarMenuItem>
    <SidebarMenuButton className="text-sidebar-foreground/70">
      <MessagesSquare className="h-4 w-4" />
      <span>No agents yet</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
)}
```

## User Experience

### How to Use
1. Navigate to the main dashboard with the left sidebar visible
2. Locate the search input at the top of the sidebar, above the "Agents" header
3. Type to filter agents by project name
4. Press ESC key to clear the search
5. Click the X button to clear the search

### Keyboard Navigation
- `ESC`: Clear the search field and reset the agent list

## Future Enhancements
Potential improvements for the search feature:

1. **Advanced Filtering**: 
   - Add ability to search through message content
   - Filter by date, status, or other metadata

2. **Search Hotkeys**:
   - Add keyboard shortcut (e.g., CMD+K) to quickly focus the search

3. **Search History**:
   - Store recent searches for quick access

4. **Search Within Results**:
   - Allow narrowing search results with multiple filter criteria

## Performance Considerations
- The implementation uses `useMemo` to prevent unnecessary re-filtering on each render
- Filtering happens client-side for immediate feedback
- No additional dependencies were required for this implementation

# Feature Update: May 1, 2025

## Summary of Changes
Today's updates include two main features:

1. Sidebar search functionality for filtering threads by project name
2. Thread timer fix to properly show time for older threads
3. Chat renaming feature in the sidebar dropdown menu

## 1. Sidebar Search Feature

### Implementation Details
- **Location**: Added to `frontend/src/components/sidebar/nav-agents.tsx`
- **UI**: Search input positioned above the "AI Agents" header with clear button (X)
- **Functionality**:
  - Real-time filtering as the user types
  - Filters threads based on project name
  - Shows "No matches found" when there are no results
  - Keyboard support: ESC clears the search input
  - Visually integrates with existing sidebar style

### Verification
- Search filters threads correctly based on project name
- Clear button appears only when there's text and works correctly
- Empty state shows proper message
- ESC key clears the search input
- Does not interfere with other sidebar functionality

## 2. Thread Timer Fix

### Implementation Details
- **Files Modified**:
  - `frontend/src/components/thread/thread-timer.tsx` - UI component
  - `frontend/src/lib/api.ts` - API functions for data fetching

- **Core Changes**:
  - Modified `getThreadAgentRuns()` to fetch ALL agent runs for a thread (not just this month)
  - Improved `calculateThreadMinutes()` to handle various agent statuses properly
  - Updated timer component to prevent flickering during loading
  - Added logging to help with debugging

- **Why This Matters**:
  - Previously, older threads showed "0 min" even if they had activity
  - Now all threads correctly show their total time usage
  - Both thread-specific and monthly billing calculations remain intact

### Verification
- Older threads now show correct total time spent
- Monthly billing calculations still work correctly (different system)
- No flickering when navigating between threads
- Improved error handling prevents UI disruption

## 3. Chat Renaming Feature

### Implementation Details
- **Location**: Added to `frontend/src/components/sidebar/nav-agents.tsx`
- **API Used**: `updateProject()` from `frontend/src/lib/api.ts`
- **Database Impact**: Updates the existing `name` field in the projects table

- **UI Components Added**:
  - "Rename" option in the thread dropdown menu
  - Inline editing field with proper styling
  - Success/error toast notifications
  
- **User Flow**:
  1. User clicks three-dot menu on a thread
  2. Selects "Rename" option
  3. Inline input field appears with current name pre-selected
  4. User types new name and presses Enter (or clicks away to save)
  5. Name is updated in database and UI

### Verification
- Rename option appears in dropdown menu
- Inline editing works seamlessly
- Database update works correctly
- All threads with the same project ID get renamed
- Keyboard shortcuts work (Enter to save, Escape to cancel)
- Toast notifications provide feedback on success/failure
- Project-updated event fires so other components stay in sync

## Compatibility Notes
- The thread timer changes do not affect monthly billing calculations
- Chat renaming uses existing database fields and doesn't require schema changes
- All changes maintain backward compatibility with existing code
- Mobile and desktop views both work correctly with these changes

## Technical Implementation Details

### Sidebar Search:
```tsx
// Added state for search term
const [searchTerm, setSearchTerm] = useState("")

// Added filtering logic
const filteredThreads = useMemo(() => {
  if (!searchTerm) return threads;
  return threads.filter(thread => 
    thread.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [threads, searchTerm]);

// Added search input above header
<div className="px-2.5 pb-1">
  <SidebarInput
    ref={searchInputRef}
    placeholder="Search chats..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    onKeyDown={handleSearchKeyDown}
    leftIcon={<Search className="h-4 w-4" />}
    rightIcon={
      searchTerm && (
        <X
          className="h-4 w-4 cursor-pointer opacity-70 hover:opacity-100"
          onClick={() => setSearchTerm('')}
        />
      )
    }
  />
</div>
```

### Thread Timer Fix:
```typescript
// Modified to get ALL agent runs for accurate timing
export async function getThreadAgentRuns(threadId: string) {
  // ...
  const { data, error } = await supabase
    .from('agent_runs')
    .select('started_at, completed_at, status')
    .eq('thread_id', threadId);
  // No date filtering to ensure we get all runs
  // ...
}

// Improved time calculation with better status handling
export function calculateThreadMinutes(agentRuns: any[]) {
  // ...
  const totalAgentTime = agentRuns.reduce((total, run) => {
    // Added better handling for different statuses
    const endTime = run.completed_at 
      ? new Date(run.completed_at).getTime()
      : (run.status === 'completed' || run.status === 'stopped' || run.status === 'error')
        ? startTime  // If completed but no timestamp, count as 0
        : nowTimestamp;  // If still running, use current time
    
    // Safety check to avoid negative time values
    const duration = Math.max(0, endTime - startTime) / 1000;
    return total + duration;
  }, 0);
  // ...
}
```

### Chat Renaming:
```tsx
// State for editing
const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
const [editingName, setEditingName] = useState("")

// Save function
const saveProjectName = async () => {
  // ...
  // Update project name in database
  await updateProject(thread.projectId, {
    name: editingName.trim()
  });
  
  // Update local state
  setThreads(currentThreads => 
    currentThreads.map(t => 
      t.projectId === thread.projectId 
        ? { ...t, projectName: editingName.trim() }
        : t
    )
  );
  // ...
}

// Added to dropdown menu
<DropdownMenuItem onClick={(e) => startRenaming(thread, e)}>
  <Pencil className="text-muted-foreground" />
  <span>Rename</span>
</DropdownMenuItem>
```

## Testing Notes
All features have been tested in development and work as expected. Any edge cases have been handled with appropriate error handling to ensure a smooth user experience.
