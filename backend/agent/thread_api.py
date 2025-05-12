from fastapi import APIRouter, HTTPException, Depends, Request
from utils.auth_utils import get_current_user_id_from_jwt, verify_thread_access
from services.supabase import DBConnection
from services.thread_timer import ThreadTimer
from utils.logger import logger

router = APIRouter()
db = DBConnection()

@router.get("/thread/{thread_id}/duration")
async def get_thread_duration(
    thread_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the current duration of a thread."""
    # Verify access
    client = await db.client
    access_verified = await verify_thread_access(client, thread_id, user_id)
    if not access_verified:
        raise HTTPException(status_code=403, detail="Not authorized to access this thread")
    
    # Update and get the current duration from thread's active_duration field
    timer = ThreadTimer()
    active_duration = await timer.update_duration(thread_id)
    
    logger.info(f"Thread {thread_id} active_duration: {active_duration} seconds")
    
    # Get thread details to verify we have data
    try:
        thread_result = await client.table('threads').select('*').eq('thread_id', thread_id).execute()
        thread_data = thread_result.data[0] if thread_result.data else None
        logger.info(f"Thread data: {thread_data}")
    except Exception as e:
        logger.error(f"Error fetching thread data: {e}")
        thread_data = None
    
    # Calculate agent run durations (this is how billing is calculated)
    try:
        from datetime import datetime
        
        # Get all completed agent runs for this thread
        result = await client.table('agent_runs').select(
            'id', 'started_at', 'completed_at', 'status'
        ).eq('thread_id', thread_id).eq('status', 'completed').execute()
        
        logger.info(f"Found {len(result.data)} completed agent runs for thread {thread_id}")
        
        agent_runs_duration = 0
        run_details = []
        
        for run in result.data:
            if run.get('started_at') and run.get('completed_at'):
                try:
                    # Handle potential format issues
                    started_str = run['started_at']
                    completed_str = run['completed_at']
                    
                    # Remove Z or add timezone if needed
                    if started_str.endswith('Z'):
                        started_str = started_str[:-1] + '+00:00'
                    if completed_str.endswith('Z'):
                        completed_str = completed_str[:-1] + '+00:00'
                    
                    started = datetime.fromisoformat(started_str)
                    completed = datetime.fromisoformat(completed_str)
                    
                    # Calculate duration in seconds and add to total
                    run_duration = (completed - started).total_seconds()
                    
                    # Only count positive durations
                    if run_duration > 0:
                        run_duration_int = int(run_duration)
                        agent_runs_duration += run_duration_int
                        run_details.append({
                            "id": run.get('id'),
                            "duration_seconds": run_duration_int
                        })
                except Exception as e:
                    logger.error(f"Error parsing timestamps for run {run.get('id')}: {e}")
        
        logger.info(f"Agent runs duration: {agent_runs_duration} seconds from runs: {run_details}")
    except Exception as e:
        logger.error(f"Error calculating agent run durations: {e}")
        agent_runs_duration = 0
    
    # Total duration combines both active time and agent run time
    total_duration = active_duration + agent_runs_duration
    logger.info(f"Total thread duration: {total_duration} seconds")
    
    return {"duration": total_duration}

@router.put("/thread/{thread_id}/rename")
async def rename_thread(
    thread_id: str,
    request: Request,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Rename a thread."""
    # Verify access
    client = await db.client
    access_verified = await verify_thread_access(client, thread_id, user_id)
    if not access_verified:
        raise HTTPException(status_code=403, detail="Not authorized to access this thread")
    
    # Get the new name from request body
    data = await request.json()
    new_name = data.get('name')
    
    if not new_name:
        raise HTTPException(status_code=400, detail="New name is required")
    
    # Update the thread name in the database
    try:
        result = await client.table('threads').update({
            'name': new_name
        }).eq('thread_id', thread_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        logger.info(f"Thread {thread_id} renamed to '{new_name}'")
        return {"success": True, "thread_id": thread_id, "name": new_name}
    except Exception as e:
        logger.error(f"Error renaming thread {thread_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to rename thread: {str(e)}")
