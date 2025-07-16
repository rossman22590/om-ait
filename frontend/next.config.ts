import type { NextConfig } from 'next';

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pixiomedia.nyc3.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
});

export default nextConfig;
