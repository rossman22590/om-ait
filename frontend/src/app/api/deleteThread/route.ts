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
    
    console.log(`Deleting thread ${threadId} from project ${projectId}`);
    
    // First try to delete messages from public schema
    const { error: publicMessagesError } = await supabase
      .from('messages')
      .delete()
      .eq('thread_id', threadId);
      
    if (publicMessagesError) {
      console.log('Could not delete messages from public schema:', publicMessagesError);
      
      // Try basejump schema
      const { error: basejumpMessagesError } = await supabase
        .schema('basejump')
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
        
      if (basejumpMessagesError) {
        console.error('Error deleting thread messages from both schemas:', basejumpMessagesError);
        return NextResponse.json({ error: 'Failed to delete thread messages' }, { status: 500 });
      }
    }
    
    // Then delete the thread from public schema
    const { error: publicThreadError } = await supabase
      .from('threads')
      .delete()
      .eq('thread_id', threadId)
      .eq('project_id', projectId);
      
    if (publicThreadError) {
      console.log('Could not delete thread from public schema:', publicThreadError);
      
      // Try basejump schema
      const { error: basejumpThreadError } = await supabase
        .schema('basejump')
        .from('threads')
        .delete()
        .eq('thread_id', threadId)
        .eq('project_id', projectId);
        
      if (basejumpThreadError) {
        console.error('Error deleting thread from both schemas:', basejumpThreadError);
        return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
      }
    }
    
    console.log(`Successfully deleted thread ${threadId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in thread deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
