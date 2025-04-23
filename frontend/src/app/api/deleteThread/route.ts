import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { threadId, projectId } = body;
    
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Supabase client
    const supabase = createClient();
    
    // First, delete all messages in the thread
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('thread_id', threadId);
      
    if (messagesError) {
      console.error('Error deleting thread messages:', messagesError);
      return NextResponse.json({ error: 'Failed to delete thread messages' }, { status: 500 });
    }
    
    // Then delete the thread itself
    const { error: threadError } = await supabase
      .from('threads')
      .delete()
      .eq('thread_id', threadId)
      .eq('project_id', projectId);
      
    if (threadError) {
      console.error('Error deleting thread:', threadError);
      return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in thread deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
