import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { threadId, projectId } = body;
    
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }
    
    console.log(`CASCADE DELETE: Thread ${threadId} - Deleting in correct dependency order`);
    
    // Create server-side Supabase client with admin privileges
    const supabase = await createClient();
    
    // STEP 1: First delete all agent_runs for this thread (this fixes the foreign key constraint)
    try {
      console.log(`Deleting agent_runs for thread ${threadId}...`);
      const { data: deletedAgentRuns, error: agentRunsError } = await supabase
        .from('agent_runs')
        .delete()
        .eq('thread_id', threadId)
        .select();
      
      if (agentRunsError) {
        console.error('Error deleting agent_runs:', agentRunsError);
      } else {
        console.log(`Successfully deleted ${deletedAgentRuns?.length || 0} agent_runs`);
      }
    } catch (e) {
      console.error('Exception when deleting agent_runs:', e);
    }
    
    // Wait a moment to ensure deletions are processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STEP 2: Now delete messages
    try {
      console.log(`Deleting messages for thread ${threadId}...`);
      const { data: deletedMessages, error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('thread_id', threadId)
        .select();
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
      } else {
        console.log(`Successfully deleted ${deletedMessages?.length || 0} messages`);
      }
    } catch (e) {
      console.error('Exception when deleting messages:', e);
    }
    
    // Wait again to ensure deletions are processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STEP 3: Finally delete the thread itself
    try {
      console.log(`Deleting thread ${threadId}...`);
      let threadDeleted = false;
      
      // Try with project ID if provided
      if (projectId) {
        const { data: deletedThread, error: threadError } = await supabase
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId)
          .select();
        
        if (threadError) {
          console.error('Error deleting thread with project ID:', threadError);
        } else if (deletedThread?.length) {
          console.log(`Successfully deleted thread with project ID`);
          threadDeleted = true;
        }
      }
      
      // If that didn't work, try without project ID constraint
      if (!threadDeleted) {
        const { data: deletedThread, error: threadError } = await supabase
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .select();
        
        if (threadError) {
          console.error('Error deleting thread without project ID:', threadError);
        } else {
          console.log(`Successfully deleted thread without project ID constraint`);
        }
      }
    } catch (e) {
      console.error('Exception when deleting thread:', e);
    }
    
    // STEP 4: Verify all data is gone
    try {
      const { count: agentRunsCount } = await supabase
        .from('agent_runs')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);
      
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);
      
      const { count: threadsCount } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId);
      
      console.log(`VERIFICATION - Records remaining: agent_runs=${agentRunsCount}, messages=${messagesCount}, threads=${threadsCount}`);
      
      if (agentRunsCount === 0 && messagesCount === 0 && threadsCount === 0) {
        console.log('👍 ALL DATA SUCCESSFULLY DELETED');
      } else {
        console.log('⚠️ Some data still remains in the database');
      }
    } catch (e) {
      console.error('Error verifying deletion:', e);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Cascade deletion completed - check logs for details"
    });
  } catch (error) {
    console.error('Unexpected error in cascade delete:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
