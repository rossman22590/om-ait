import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get parameters from query string
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const sort_by = url.searchParams.get("sort_by") || "created_at";
    const sort_order = url.searchParams.get("sort_order") || "desc";
    
    // Get the URL for the backend API
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents`;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by,
      sort_order,
    });
    
    if (search) {
      params.append("search", search);
    }
    
    const apiUrl = `${backendUrl}?${params.toString()}`;
    
    // Get authentication token from Supabase server client
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    // Set up headers for the backend request
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Check for authentication token
    if (session?.access_token) {
      console.log('Using Supabase session token');
      headers.set('Authorization', `Bearer ${session.access_token}`);
    } else {
      console.log('No Supabase session found, trying fallbacks');
      
      // Try to forward any existing authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        console.log('Using Authorization header from request');
        headers.set('Authorization', authHeader);
      }
      
      // As a last resort, check for API keys in environment
      const apiKey = process.env.OM_API_KEY || process.env.API_KEY;
      if (apiKey && !authHeader) {
        console.log('Using API key from environment');
        headers.set('Authorization', `Bearer ${apiKey}`);
      }
    }
    
    // Forward cookies that might be needed
    const cookie = req.headers.get('cookie');
    if (cookie) {
      // Only include auth-related cookies
      const authCookies = cookie
        .split(';')
        .filter(c => 
          c.trim().startsWith('sb-') || 
          c.trim().startsWith('om-')
        )
        .join(';');
      
      if (authCookies) {
        console.log('Forwarding auth cookies');
        headers.set('Cookie', authCookies);
      }
    }
    
    console.log(`Fetching agents from: ${apiUrl}`);
    
    // Make the request to the backend
    const response = await fetch(apiUrl, {
      headers,
      cache: 'no-store',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error("Failed to fetch agents from backend:", response.status, await response.text());
      return NextResponse.json({ 
        items: [], 
        total: 0,
        page: 1,
        limit,
        message: `Backend API error: ${response.status}` 
      });
    }
    
    // Process the response data
    const data = await response.json();
    
    // Format data for the NodePalette component
    if (data.agents) {
      return NextResponse.json({
        items: data.agents.map((agent: any) => ({
          ...agent,
          tools: agent.configured_mcps || [] // Map tools to the expected format
        })),
        total: data.pagination?.total || data.agents.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || limit
      });
    }
    
    // If response has a different structure, just pass it through
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error in /api/agents endpoint:", error);
    return NextResponse.json({ 
      items: [], 
      total: 0, 
      page: 1, 
      limit: 20,
      message: "Error processing agents request" 
    });
  }
}
