/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
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
};

module.exports = nextConfig;
