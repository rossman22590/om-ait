import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'pixiomedia.nyc3.digitaloceanspaces.com',
      'plus.unsplash.com',
      'images.unsplash.com',
      'unsplash.com'
    ],
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

export default nextConfig;