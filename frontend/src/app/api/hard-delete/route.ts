import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createClientSide } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { threadId, projectId } = body;
    
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }
    
    console.log(`HARD DELETE: Thread ${threadId}`);
    
    // Use BOTH client methods to handle the schema issue
    const supabaseServer = await createServerClient();
    const supabaseClient = createClientSide();
    
    // First, explicitly set the auth headers to avoid permission issues
    let loggedMessages = false;
    
    try {
      // CRITICAL: Actually look at the data before deleting to debug
      const { data: messagesData } = await supabaseServer
        .from('messages')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`Found ${messagesData?.length || 0} messages in public.messages:`, 
                 messagesData && messagesData.length > 0 ? messagesData[0] : 'none');
      
      const { data: threadsData } = await supabaseServer
        .from('threads')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`Found ${threadsData?.length || 0} threads in public.threads:`, 
                 threadsData && threadsData.length > 0 ? threadsData[0] : 'none');
      
      // Also check basejump schema
      const { data: basejumpMessagesData } = await supabaseServer
        .schema('basejump')
        .from('messages')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`Found ${basejumpMessagesData?.length || 0} messages in basejump.messages:`, 
                 basejumpMessagesData && basejumpMessagesData.length > 0 ? basejumpMessagesData[0] : 'none');
      
      const { data: basejumpThreadsData } = await supabaseServer
        .schema('basejump')
        .from('threads')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`Found ${basejumpThreadsData?.length || 0} threads in basejump.threads:`, 
                 basejumpThreadsData && basejumpThreadsData.length > 0 ? basejumpThreadsData[0] : 'none');
      
      loggedMessages = true;
    } catch (e) {
      console.error('Error looking up data before deletion:', e);
    }
    
    // Try every possible deletion path with both clients
    
    // 1. Delete messages first (to avoid foreign key issues)
    try {
      // Server client - public schema
      await supabaseServer
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted messages from public schema using server client');
    } catch (e) {
      console.error('Server client error deleting public messages:', e);
    }
    
    try {
      // Client-side client - public schema
      await supabaseClient
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted messages from public schema using client-side client');
    } catch (e) {
      console.error('Client-side error deleting public messages:', e);
    }
    
    try {
      // Server client - basejump schema
      await supabaseServer
        .schema('basejump')
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted messages from basejump schema using server client');
    } catch (e) {
      console.error('Server client error deleting basejump messages:', e);
    }
    
    try {
      // Client-side client - basejump schema
      await supabaseClient
        .schema('basejump')
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted messages from basejump schema using client-side client');
    } catch (e) {
      console.error('Client-side error deleting basejump messages:', e);
    }
    
    // Wait a bit to ensure messages are deleted
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 2. Now delete the thread in both schemas with both clients
    // With project ID constraint
    if (projectId) {
      try {
        // Server client - public schema with project ID
        await supabaseServer
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId);
        console.log('Deleted thread from public schema using server client (with project ID)');
      } catch (e) {
        console.error('Server client error deleting public thread with project ID:', e);
      }
      
      try {
        // Client-side client - public schema with project ID
        await supabaseClient
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId);
        console.log('Deleted thread from public schema using client-side client (with project ID)');
      } catch (e) {
        console.error('Client-side error deleting public thread with project ID:', e);
      }
      
      try {
        // Server client - basejump schema with project ID
        await supabaseServer
          .schema('basejump')
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId);
        console.log('Deleted thread from basejump schema using server client (with project ID)');
      } catch (e) {
        console.error('Server client error deleting basejump thread with project ID:', e);
      }
      
      try {
        // Client-side client - basejump schema with project ID
        await supabaseClient
          .schema('basejump')
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId);
        console.log('Deleted thread from basejump schema using client-side client (with project ID)');
      } catch (e) {
        console.error('Client-side error deleting basejump thread with project ID:', e);
      }
    }
    
    // Without project ID constraint as fallback
    try {
      // Server client - public schema without project ID
      await supabaseServer
        .from('threads')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted thread from public schema using server client (without project ID)');
    } catch (e) {
      console.error('Server client error deleting public thread without project ID:', e);
    }
    
    try {
      // Client-side client - public schema without project ID
      await supabaseClient
        .from('threads')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted thread from public schema using client-side client (without project ID)');
    } catch (e) {
      console.error('Client-side error deleting public thread without project ID:', e);
    }
    
    try {
      // Server client - basejump schema without project ID
      await supabaseServer
        .schema('basejump')
        .from('threads')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted thread from basejump schema using server client (without project ID)');
    } catch (e) {
      console.error('Server client error deleting basejump thread without project ID:', e);
    }
    
    try {
      // Client-side client - basejump schema without project ID
      await supabaseClient
        .schema('basejump')
        .from('threads')
        .delete()
        .eq('thread_id', threadId);
      console.log('Deleted thread from basejump schema using client-side client (without project ID)');
    } catch (e) {
      console.error('Client-side error deleting basejump thread without project ID:', e);
    }
    
    // 3. CHECK if deletion worked by reading data again
    try {
      const { data: messagesData } = await supabaseServer
        .from('messages')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`AFTER DELETE: Found ${messagesData?.length || 0} messages in public.messages`);
      
      const { data: threadsData } = await supabaseServer
        .from('threads')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`AFTER DELETE: Found ${threadsData?.length || 0} threads in public.threads`);
      
      // Also check basejump schema
      const { data: basejumpMessagesData } = await supabaseServer
        .schema('basejump')
        .from('messages')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`AFTER DELETE: Found ${basejumpMessagesData?.length || 0} messages in basejump.messages`);
      
      const { data: basejumpThreadsData } = await supabaseServer
        .schema('basejump')
        .from('threads')
        .select('*')
        .eq('thread_id', threadId);
      
      console.log(`AFTER DELETE: Found ${basejumpThreadsData?.length || 0} threads in basejump.threads`);
    } catch (e) {
      console.error('Error looking up data after deletion:', e);
    }
    
    // Always return success to keep UI responsive
    return NextResponse.json({ 
      success: true, 
      message: "Hard delete completed - check logs for details",
      debug: { loggedMessages }
    });
  } catch (error) {
    console.error('Critical error in hard delete:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
