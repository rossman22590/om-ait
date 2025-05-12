# Thread Management Features Implementation Guide

This developer documentation outlines how to implement three key thread management features:
1. Thread Timer (conversation duration tracking)
2. Sidebar Thread Rename
3. Sidebar Thread Delete

## 1. Thread Timer Implementation

### Overview
The Thread Timer feature tracks and displays the duration of active conversations, providing users with visibility into how long their threads have been running.

### Backend Implementation

#### 1.1 Database Schema Updates

Add the following fields to the `threads` table:

```sql
ALTER TABLE threads 
ADD COLUMN start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN active_duration INTEGER DEFAULT 0;
```

#### 1.2 Thread Duration Tracking Service

Create a new service in `backend/services/thread_timer.py`:

```python
import time
from datetime import datetime, timezone
from services.supabase import DBConnection

class ThreadTimer:
    def __init__(self):
        self.db = DBConnection()
        
    async def start_timer(self, thread_id):
        """Start the timer for a thread."""
        client = await self.db.client
        await client.table('threads').update({
            'start_time': datetime.now(timezone.utc).isoformat(),
            'active_duration': 0
        }).eq('thread_id', thread_id).execute()
        
    async def update_duration(self, thread_id):
        """Update the active duration of a thread."""
        client = await self.db.client
        
        # Get current thread start time
        result = await client.table('threads').select('start_time').eq('thread_id', thread_id).execute()
        if not result.data or not result.data[0]['start_time']:
            return
            
        # Calculate duration in seconds
        start_time = datetime.fromisoformat(result.data[0]['start_time'].replace('Z', '+00:00'))
        current_time = datetime.now(timezone.utc)
        duration_seconds = int((current_time - start_time).total_seconds())
        
        # Update the duration
        await client.table('threads').update({
            'active_duration': duration_seconds
        }).eq('thread_id', thread_id).execute()
```

#### 1.3 API Endpoint

Add an endpoint in `backend/api.py` to get and update thread duration:

```python
@app.get("/api/thread/{thread_id}/duration")
async def get_thread_duration(thread_id: str):
    """Get the current duration of a thread."""
    from services.thread_timer import ThreadTimer
    
    timer = ThreadTimer()
    await timer.update_duration(thread_id)
    
    client = await db.client
    result = await client.table('threads').select('active_duration').eq('thread_id', thread_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    return {"duration": result.data[0]['active_duration']}
```

### Frontend Implementation

#### 1.4 Thread Timer Component

Create a new component in `frontend/src/components/ThreadTimer.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { formatDuration } from '../utils/formatting';

const ThreadTimer = ({ threadId }) => {
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (!threadId) return;
    
    // Initial fetch
    fetchDuration();
    
    // Set up polling
    const intervalId = setInterval(fetchDuration, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [threadId]);
  
  const fetchDuration = async () => {
    try {
      const response = await fetch(`/api/thread/${threadId}/duration`);
      if (response.ok) {
        const data = await response.json();
        setDuration(data.duration);
      }
    } catch (error) {
      console.error('Failed to fetch thread duration:', error);
    }
  };
  
  return (
    <div className="thread-timer">
      <span className="timer-icon">⏱️</span>
      <span className="timer-value">{formatDuration(duration)}</span>
    </div>
  );
};

export default ThreadTimer;
```

#### 1.5 Add the Timer to Thread Interface

Update `frontend/src/components/ThreadView.jsx` to include the timer:

```jsx
import ThreadTimer from './ThreadTimer';

// Inside your component
return (
  <div className="thread-view">
    <div className="thread-header">
      <h2>{thread.name}</h2>
      <ThreadTimer threadId={thread.id} />
    </div>
    {/* Rest of your component */}
  </div>
);
```

#### 1.6 Formatting Utility

Add a formatting utility in `frontend/src/utils/formatting.js`:

```js
export const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
```

## 2. Sidebar Thread Rename Feature

### Overview
Allow users to rename their threads directly from the sidebar for better organization and context.

### Backend Implementation

#### 2.1 API Endpoint

Add a new endpoint in `backend/api.py`:

```python
@app.put("/api/thread/{thread_id}/rename")
async def rename_thread(thread_id: str, request: Request):
    """Rename a thread."""
    data = await request.json()
    new_name = data.get('name')
    
    if not new_name:
        raise HTTPException(status_code=400, detail="New name is required")
        
    client = await db.client
    result = await client.table('threads').update({
        'name': new_name
    }).eq('thread_id', thread_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    return {"success": True, "thread_id": thread_id, "name": new_name}
```

### Frontend Implementation

#### 2.2 Thread Rename Component

Create a component in `frontend/src/components/ThreadRename.jsx`:

```jsx
import { useState } from 'react';

const ThreadRename = ({ thread, onRenameComplete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(thread.name || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName === thread.name) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/thread/${thread.id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      if (response.ok) {
        onRenameComplete(thread.id, newName);
      } else {
        console.error('Failed to rename thread');
      }
    } catch (error) {
      console.error('Error renaming thread:', error);
    }
    
    setIsLoading(false);
    setIsEditing(false);
  };
  
  if (!isEditing) {
    return (
      <div className="thread-item" onClick={() => setIsEditing(true)}>
        <span className="thread-name">{thread.name || 'Unnamed Thread'}</span>
        <button 
          className="rename-button" 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
          ✏️
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleRename} className="thread-rename-form">
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        autoFocus
        placeholder="Thread name"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? '...' : '✓'}
      </button>
      <button 
        type="button" 
        onClick={() => { setNewName(thread.name); setIsEditing(false); }}
        disabled={isLoading}
      >
        ✕
      </button>
    </form>
  );
};

export default ThreadRename;
```

#### 2.3 Update Sidebar Component

Modify `frontend/src/components/Sidebar.jsx`:

```jsx
import ThreadRename from './ThreadRename';

// Inside your ThreadList component
const handleRenameComplete = (threadId, newName) => {
  // Update threads in state
  setThreads(threads.map(t => 
    t.id === threadId ? { ...t, name: newName } : t
  ));
};

// In your render method
return (
  <div className="thread-list">
    {threads.map(thread => (
      <ThreadRename
        key={thread.id}
        thread={thread}
        onRenameComplete={handleRenameComplete}
      />
    ))}
  </div>
);
```

## 3. Sidebar Thread Delete Feature

### Overview
Allow users to delete threads they no longer need directly from the sidebar.

### Backend Implementation

#### 3.1 API Endpoint

Add a delete endpoint in `backend/api.py`:

```python
@app.delete("/api/thread/{thread_id}")
async def delete_thread(thread_id: str, request: Request):
    """Delete a thread and all its associated messages."""
    # Get user information for authorization
    account_id = await get_account_id_from_request(request)
    
    # Check if user is authorized to delete this thread
    client = await db.client
    thread = await client.table('threads').select('*').eq('thread_id', thread_id).execute()
    
    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    if thread.data[0]['account_id'] != account_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this thread")
    
    # Begin transaction to delete thread and messages
    try:
        # Delete messages first (foreign key constraint)
        await client.table('messages').delete().eq('thread_id', thread_id).execute()
        
        # Delete thread
        result = await client.table('threads').delete().eq('thread_id', thread_id).execute()
        
        return {"success": True, "thread_id": thread_id}
    except Exception as e:
        logger.error(f"Error deleting thread {thread_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete thread")
```

### Frontend Implementation

#### 3.2 Thread Delete Component

Create a component in `frontend/src/components/ThreadDeleteButton.jsx`:

```jsx
import { useState } from 'react';

const ThreadDeleteButton = ({ threadId, onDeleteComplete }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/thread/${threadId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onDeleteComplete(threadId);
      } else {
        console.error('Failed to delete thread');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
    
    setIsDeleting(false);
    setIsConfirming(false);
  };
  
  const buttonClass = `thread-delete-button ${isConfirming ? 'confirming' : ''}`;
  
  return (
    <button 
      className={buttonClass}
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isConfirming ? 'Confirm?' : '🗑️'}
    </button>
  );
};

export default ThreadDeleteButton;
```

#### 3.3 Update Thread Item in Sidebar

Modify `frontend/src/components/Sidebar.jsx` to include the delete button:

```jsx
import ThreadDeleteButton from './ThreadDeleteButton';

// Add handler for delete
const handleDeleteComplete = (threadId) => {
  setThreads(threads.filter(t => t.id !== threadId));
};

// In your render method, update the thread item
return (
  <div className="thread-item">
    <ThreadRename
      thread={thread}
      onRenameComplete={handleRenameComplete}
    />
    <ThreadDeleteButton
      threadId={thread.id}
      onDeleteComplete={handleDeleteComplete}
    />
  </div>
);
```

#### 3.4 CSS Styling

Add styling in `frontend/src/styles/thread-controls.css`:

```css
.thread-delete-button {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.thread-delete-button:hover {
  opacity: 1;
  background-color: rgba(255, 0, 0, 0.1);
}

.thread-delete-button.confirming {
  background-color: #ff6b6b;
  color: white;
  opacity: 1;
}

.thread-rename-form {
  display: flex;
  align-items: center;
  padding: 4px;
}

.thread-rename-form input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
}

.thread-timer {
  display: flex;
  align-items: center;
  font-size: 0.9em;
  color: #666;
  margin-left: auto;
}

.timer-icon {
  margin-right: 4px;
}
```

## Integration Testing

After implementing these features, test them thoroughly to ensure they work correctly:

1. **Thread Timer Test**
   - Create a new thread and verify the timer starts at 0
   - Wait for 1-2 minutes and check if the timer updates correctly
   - Navigate away and back to the thread to ensure the timer persists

2. **Thread Rename Test**
   - Click the rename button and enter a new name
   - Submit the form and verify the thread name updates in the sidebar
   - Refresh the page to ensure the name change persists

3. **Thread Delete Test**
   - Click the delete button, then confirm the deletion
   - Verify the thread disappears from the sidebar
   - Try to navigate to the deleted thread URL directly to ensure it's truly deleted

## Performance Considerations

1. For the thread timer, consider caching duration values to reduce database load
2. The delete operation is potentially expensive for very large threads - consider implementing it as a background job for production
3. Implement rate limiting for rename and delete operations to prevent abuse

## Security Considerations

1. Ensure proper authorization checks are in place for all thread operations
2. Validate and sanitize thread names to prevent XSS attacks
3. Add CSRF protection to all state-changing endpoints (rename and delete)
