import { NextRequest, NextResponse } from 'next/server';

// Setting this export fixes the "sync-dynamic-apis" error
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  // Await params to fix the sync-dynamic-apis issue
  const { id } = await Promise.resolve(context.params);
  
  try {
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
    console.error(`Error fetching avatar ${id}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch avatar ${id}` }, 
      { status: 500 }
    );
  }
}
