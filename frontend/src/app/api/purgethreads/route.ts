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
    
    console.log(`EMERGENCY PURGE: Thread ${threadId}`);
    
    // Use server-side client with full admin permissions
    const supabase = await createClient();
    
    // Direct SQL query to delete messages
    const { error: messagesError } = await supabase.rpc('force_delete_messages', {
      thread_id_param: threadId
    });
    
    if (messagesError) {
      console.error('RPC error when deleting messages:', messagesError);
    } else {
      console.log('Messages purged successfully via RPC');
    }
    
    // Direct SQL query to delete thread
    const { error: threadError } = await supabase.rpc('force_delete_thread', {
      thread_id_param: threadId
    });
    
    if (threadError) {
      console.error('RPC error when deleting thread:', threadError);
    } else {
      console.log('Thread purged successfully via RPC');
    }
    
    // Return success even if there were issues
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in thread purge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
