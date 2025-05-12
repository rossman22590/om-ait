import time
from datetime import datetime, timezone
from services.supabase import DBConnection

class ThreadTimer:
    """
    Service for tracking and updating thread durations.
    Uses the active_duration field in the threads table.
    """
    
    def __init__(self):
        self.db = DBConnection()
    
    async def update_duration(self, thread_id: str) -> int:
        """
        Updates the active duration for a thread.
        
        Args:
            thread_id: The thread ID to update
            
        Returns:
            The updated duration in seconds
        """
        try:
            client = await self.db.client
            
            # First get the current thread info
            result = await client.table('threads').select('*').eq('thread_id', thread_id).execute()
            
            if not result.data:
                return 0
                
            thread = result.data[0]
            
            # Get the current timestamp
            now = datetime.now(timezone.utc)
            
            # If this is the first time we're updating, set last_active to now
            if not thread.get('last_active'):
                await client.table('threads').update({
                    'last_active': now.isoformat()
                }).eq('thread_id', thread_id).execute()
                return thread.get('active_duration', 0)
            
            # Calculate time difference since last active
            last_active = datetime.fromisoformat(thread['last_active'])
            time_diff = (now - last_active).total_seconds()
            
            # Update only if significant time has passed (more than 1 second)
            if time_diff > 1:
                current_duration = thread.get('active_duration', 0)
                new_duration = current_duration + int(time_diff)
                
                # Update the thread with new duration and timestamp
                await client.table('threads').update({
                    'active_duration': new_duration,
                    'last_active': now.isoformat()
                }).eq('thread_id', thread_id).execute()
                
                return new_duration
            
            return thread.get('active_duration', 0)
            
        except Exception as e:
            print(f"Error updating thread duration: {e}")
            # Return the existing duration or 0 if we couldn't update
            return thread.get('active_duration', 0) if 'thread' in locals() else 0
