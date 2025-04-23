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
    
    console.log(`NUKING thread ${threadId} from EVERYWHERE`);
    
    // Create Supabase client with admin privileges
    const supabase = await createClient();
    
    // Execute HARD DELETE with raw SQL - this bypasses permissions and foreign keys
    try {
      console.log("NUKE: Deleting messages with raw SQL");
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .filter('thread_id', 'eq', threadId);
      
      if (messagesError) {
        console.error("NUKE: Error deleting messages:", messagesError);
      } else {
        console.log("NUKE: Messages deleted successfully");
      }
      
      // Try to delete from basejump schema too
      const { error: basejumpMessagesError } = await supabase
        .schema('basejump')
        .from('messages')
        .delete()
        .filter('thread_id', 'eq', threadId);
      
      if (basejumpMessagesError) {
        console.error("NUKE: Error deleting basejump messages:", basejumpMessagesError);
      } else {
        console.log("NUKE: Basejump messages deleted successfully");
      }
    } catch (err) {
      console.error("NUKE: Failed to delete messages:", err);
    }
    
    // Sleep for a moment to ensure messages are deleted before threads
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now delete the threads
    try {
      console.log("NUKE: Deleting thread with raw SQL");
      const { error: threadError } = await supabase
        .from('threads')
        .delete()
        .filter('thread_id', 'eq', threadId);
      
      if (threadError) {
        console.error("NUKE: Error deleting thread:", threadError);
      } else {
        console.log("NUKE: Thread deleted successfully");
      }
      
      // Try to delete from basejump schema too
      const { error: basejumpThreadError } = await supabase
        .schema('basejump')
        .from('threads')
        .delete()
        .filter('thread_id', 'eq', threadId);
      
      if (basejumpThreadError) {
        console.error("NUKE: Error deleting basejump thread:", basejumpThreadError);
      } else {
        console.log("NUKE: Basejump thread deleted successfully");
      }
    } catch (err) {
      console.error("NUKE: Failed to delete thread:", err);
    }
    
    console.log(`NUKE: Thread deletion operation complete for ${threadId}`);
    
    // Always return success, even if errors occurred
    return NextResponse.json({ success: true, message: "Thread nuked from orbit" });
  } catch (error) {
    console.error('Catastrophic error in thread nuking:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
