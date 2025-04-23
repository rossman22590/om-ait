import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { threadId, projectId } = body;
    
    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }
    
    console.log(`SUPER DELETE: Thread ${threadId} from project ${projectId || 'any'}`);
    
    // Use server-side client (has higher permissions)
    const supabaseAdmin = await createClient();
    
    // Delete messages and threads in both schemas with better error handling
    
    // 1. Delete messages in both schemas
    try {
      // Try public schema messages first
      const { data: publicMessagesData, error: publicMessagesError } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('thread_id', threadId)
        .select();
      
      if (publicMessagesError) {
        console.error('Error deleting messages from public schema:', publicMessagesError);
      } else {
        console.log(`Deleted ${publicMessagesData?.length || 0} messages from public schema`);
      }
    } catch (e) {
      console.error('Exception when deleting public messages:', e);
    }
    
    try {
      // Try basejump schema messages
      const { data: basejumpMessagesData, error: basejumpMessagesError } = await supabaseAdmin
        .schema('basejump')
        .from('messages')
        .delete()
        .eq('thread_id', threadId)
        .select();
      
      if (basejumpMessagesError) {
        console.error('Error deleting messages from basejump schema:', basejumpMessagesError);
      } else {
        console.log(`Deleted ${basejumpMessagesData?.length || 0} messages from basejump schema`);
      }
    } catch (e) {
      console.error('Exception when deleting basejump messages:', e);
    }
    
    // Wait a bit for message deletion to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Delete threads in both schemas
    try {
      // Try with project ID if provided
      if (projectId) {
        const { data: publicThreadData, error: publicThreadError } = await supabaseAdmin
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId)
          .select();
        
        if (publicThreadError) {
          console.error('Error deleting thread from public schema with project ID:', publicThreadError);
        } else {
          console.log(`Deleted ${publicThreadData?.length || 0} threads from public schema with project ID`);
        }
      }
      
      // Also try without project ID constraint as fallback
      const { data: publicThreadNoProjectData, error: publicThreadNoProjectError } = await supabaseAdmin
        .from('threads')
        .delete()
        .eq('thread_id', threadId)
        .select();
      
      if (publicThreadNoProjectError) {
        console.error('Error deleting thread from public schema without project ID:', publicThreadNoProjectError);
      } else {
        console.log(`Deleted ${publicThreadNoProjectData?.length || 0} threads from public schema without project ID`);
      }
    } catch (e) {
      console.error('Exception when deleting public threads:', e);
    }
    
    try {
      // Try basejump schema threads with project ID if provided
      if (projectId) {
        const { data: basejumpThreadData, error: basejumpThreadError } = await supabaseAdmin
          .schema('basejump')
          .from('threads')
          .delete()
          .eq('thread_id', threadId)
          .eq('project_id', projectId)
          .select();
        
        if (basejumpThreadError) {
          console.error('Error deleting thread from basejump schema with project ID:', basejumpThreadError);
        } else {
          console.log(`Deleted ${basejumpThreadData?.length || 0} threads from basejump schema with project ID`);
        }
      }
      
      // Also try without project ID constraint as fallback
      const { data: basejumpThreadNoProjectData, error: basejumpThreadNoProjectError } = await supabaseAdmin
        .schema('basejump')
        .from('threads')
        .delete()
        .eq('thread_id', threadId)
        .select();
      
      if (basejumpThreadNoProjectError) {
        console.error('Error deleting thread from basejump schema without project ID:', basejumpThreadNoProjectError);
      } else {
        console.log(`Deleted ${basejumpThreadNoProjectData?.length || 0} threads from basejump schema without project ID`);
      }
    } catch (e) {
      console.error('Exception when deleting basejump threads:', e);
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Super delete completed"
    });
  } catch (error) {
    console.error('Critical error in super delete:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
