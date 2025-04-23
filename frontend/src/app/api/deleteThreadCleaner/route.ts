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
    
    console.log(`THOROUGH DELETE: Thread ${threadId} from project ${projectId}`);
    
    // Create Supabase admin client
    const supabase = await createClient();
    
    // STEP 1: Get all message IDs for this thread to ensure we delete them ALL
    let messageIds: string[] = [];
    
    try {
      // Check public schema
      const { data: publicMessages } = await supabase
        .from('messages')
        .select('message_id')
        .eq('thread_id', threadId);
        
      if (publicMessages?.length) {
        messageIds = [...messageIds, ...publicMessages.map(m => m.message_id)];
        console.log(`Found ${publicMessages.length} messages in public schema`);
      }
    } catch (e) {
      console.log('Error checking public messages:', e);
    }
    
    try {
      // Check basejump schema
      const { data: basejumpMessages } = await supabase
        .schema('basejump')
        .from('messages')
        .select('message_id')
        .eq('thread_id', threadId);
        
      if (basejumpMessages?.length) {
        messageIds = [...messageIds, ...basejumpMessages.map(m => m.message_id)];
        console.log(`Found ${basejumpMessages.length} messages in basejump schema`);
      }
    } catch (e) {
      console.log('Error checking basejump messages:', e);
    }
    
    console.log(`Total messages to delete: ${messageIds.length}`);
    
    // STEP 2: Delete messages directly by IDs
    if (messageIds.length > 0) {
      try {
        // Try public schema with precise IDs
        const { error: publicDeleteError } = await supabase
          .from('messages')
          .delete()
          .in('message_id', messageIds);
          
        if (publicDeleteError) {
          console.log('Error deleting public messages by ID:', publicDeleteError);
        } else {
          console.log('Successfully deleted messages from public schema');
        }
      } catch (e) {
        console.log('Exception deleting public messages:', e);
      }
      
      try {
        // Try basejump schema with precise IDs
        const { error: basejumpDeleteError } = await supabase
          .schema('basejump')
          .from('messages')
          .delete()
          .in('message_id', messageIds);
          
        if (basejumpDeleteError) {
          console.log('Error deleting basejump messages by ID:', basejumpDeleteError);
        } else {
          console.log('Successfully deleted messages from basejump schema');
        }
      } catch (e) {
        console.log('Exception deleting basejump messages:', e);
      }
    }
    
    // STEP 3: Delete thread by threadId (redundant cleanup)
    try {
      // Try public schema
      const { error: publicThreadError } = await supabase
        .from('threads')
        .delete()
        .eq('thread_id', threadId);
        
      if (publicThreadError) {
        console.log('Error deleting thread from public schema:', publicThreadError);
      } else {
        console.log('Successfully deleted thread from public schema');
      }
    } catch (e) {
      console.log('Exception deleting public thread:', e);
    }
    
    try {
      // Try basejump schema
      const { error: basejumpThreadError } = await supabase
        .schema('basejump')
        .from('threads')
        .delete()
        .eq('thread_id', threadId);
        
      if (basejumpThreadError) {
        console.log('Error deleting thread from basejump schema:', basejumpThreadError);
      } else {
        console.log('Successfully deleted thread from basejump schema');
      }
    } catch (e) {
      console.log('Exception deleting basejump thread:', e);
    }
    
    // STEP 4: One more pass on messages by thread_id for any we missed
    try {
      // Try public schema (redundant cleanup)
      await supabase
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
    } catch (e) {
      console.log('Error in final message cleanup (public):', e);
    }
    
    try {
      // Try basejump schema (redundant cleanup)
      await supabase
        .schema('basejump')
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
    } catch (e) {
      console.log('Error in final message cleanup (basejump):', e);
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Thread deletion completed",
      messagesDeleted: messageIds.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}
