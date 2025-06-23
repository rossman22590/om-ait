import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // No caching

export async function GET(request: NextRequest) {
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
    const response = await fetch('https://api.argil.ai/v1/voices', {
      headers: {
        'x-api-key': ARGIL_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error from Argil API:', response.status, errorData);
      return NextResponse.json(
        { error: `API request failed with status ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the voice data as-is
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' }, 
      { status: 500 }
    );
  }
}
