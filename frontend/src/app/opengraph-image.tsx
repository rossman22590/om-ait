import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'AI Tutor Machine';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  // Use the direct Vercel URL for the banner image
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'black',
        }}
      >
        <img 
          src="https://ai-tutor-machine.vercel.app/banner.png" 
          alt="AI Tutor Machine"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
