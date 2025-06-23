import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = {
  // Configure allowed image domains for next/image
  images: {
    domains: ['pixiomedia.nyc3.digitaloceanspaces.com', 'images.unsplash.com', 'argildotai.s3-accelerate.amazonaws.com'],
  },
  webpack: (config) => {
    // This rule prevents issues with pdf.js and canvas
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];

    // Ensure node native modules are ignored
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };

    return config;
  },
};

if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
  nextConfig = withSentryConfig(nextConfig, {
    org: 'kortix-ai',
    project: 'suna-nextjs',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}

export default nextConfig;
