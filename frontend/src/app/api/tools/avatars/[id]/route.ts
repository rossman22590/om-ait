import { NextRequest, NextResponse } from 'next/server';

// Setting this export fixes the "sync-dynamic-apis" error
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

// Using correct Next.js API route pattern for App Router
export async function GET(
  request: NextRequest,
) {
  try {
    // Extract id from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // Get API key from environment variable
    const ARGIL_API_KEY = process.env.ARGIL_API_KEY;
    
    if (!ARGIL_API_KEY) {
      return NextResponse.json(
        { error: 'ARGIL_API_KEY environment variable not set' }, 
        { status: 500 }
      );
    }

    // Call Argil API directly
    const response = await fetch(`https://api.argil.ai/v1/avatars/${id}`, {
      headers: {
        'x-api-key': ARGIL_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error fetching avatar ${id}:`, response.status, errorData);
      return NextResponse.json(
        { error: `API request failed with status ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the avatar data as-is
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in avatar API:`, error);
    return NextResponse.json(
      { error: `Failed to process request` }, 
      { status: 500 }
    );
  }
}
