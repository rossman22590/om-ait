/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add a fallback for the 'canvas' module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    
    // Handle binary files like canvas.node
    config.module.rules.push({
      test: /node_modules\/canvas\/build\/Release\/canvas\.node$/,
      use: 'null-loader',
    });
    
    return config;
  },
};

module.exports = nextConfig;
