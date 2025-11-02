import { readFile } from 'fs/promises';
import { join } from 'path';

// Configuration exports
export const runtime = 'nodejs';
export const alt = 'Machine - Generalist AI Agent';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Read the banner.png file from the public directory
  const imageBuffer = await readFile(join(process.cwd(), 'public', 'banner.png'));
  
  return new Response(imageBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
