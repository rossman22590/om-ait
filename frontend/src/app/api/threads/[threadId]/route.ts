import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// DELETE /api/threads/[threadId]
export async function DELETE(
  request: NextRequest,
  context: { params: { threadId: string } }
) {
  try {
    const threadId = context.params.threadId;
    
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }
    
    // Parse request body for the projectId
    const body = await request.json();
    const { projectId } = body;
    
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
