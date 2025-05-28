import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = {
  webpack: (config) => {
    // This rule prevents issues with pdf.js and canvas
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];

    // Ensure node native modules are ignored
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };

    // Ignore OpenTelemetry instrumentation warnings
    config.ignoreWarnings = [
      { module: /@opentelemetry\/instrumentation-.+\/node_modules\/@opentelemetry\/instrumentation\/build\/esm\/platform\/node\/instrumentation\.js$/ },
      { message: /Critical dependency: the request of a dependency is an expression/ }
    ];

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
