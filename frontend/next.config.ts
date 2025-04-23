import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Add a fallback for the 'canvas' module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    
    // Ignore canvas.node binary files
    config.externals.push({
      'canvas': 'commonjs canvas',
      'pdfjs-dist/build/pdf.worker.min': 'pdfjs-dist/build/pdf.worker.min',
    });
    
    return config;
  },
  images: {
    domains: ['pixiomedia.nyc3.digitaloceanspaces.com'],
  },
};

export default nextConfig;
