import type { NextConfig } from 'next';

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  images: {
    domains: ['pixiomedia.nyc3.digitaloceanspaces.com'],
  },
});

export default nextConfig;
