'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface KortixLoaderProps {
  /**
   * Size preset for the loader
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /**
   * Animation speed multiplier
   * @default 1.2
   */
  speed?: number;
  /**
   * Custom size in pixels (overrides size preset)
   */
  customSize?: number;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Additional style for the container
   */
  style?: React.CSSProperties;
  /**
   * Whether the animation should autoPlay
   * @default true
   */
  autoPlay?: boolean;
  /**
   * Whether the animation should loop
   * @default true
   */
  loop?: boolean;
  /**
   * Force a specific color (overrides theme)
   * Use 'light' or 'dark' to force a specific theme color
   */
  forceTheme?: 'light' | 'dark';
}

const SIZE_MAP = {
  small: 20,
  medium: 40,
  large: 80,
  xlarge: 120,
} as const;

/**
 * KortixLoader - A unified loading animation component
 * 
 * Uses the Lottie animation for consistent loading indicators across the app.
 * Automatically adapts to light/dark mode with appropriate colors.
 * Can be used as a replacement for Loader2 with better visual appeal.
 * 
 * **Theme Support:**
 * - Light mode: Black loader
 * - Dark mode: White loader
 * 
 * @example
 * ```tsx
 * // Simple usage (auto-themed)
 * <KortixLoader />
 * 
 * // Custom size
 * <KortixLoader size="large" />
 * 
 * // Force dark theme (white loader)
 * <KortixLoader forceTheme="dark" />
 * 
 * // With custom styling
 * <KortixLoader className="my-4" customSize={60} />
 * ```
 */
export function KortixLoader({
  size = 'medium',
  speed = 1.2,
  customSize,
  className,
  style,
  autoPlay = true,
  loop = true,
  forceTheme,
}: KortixLoaderProps) {
  const { resolvedTheme } = useTheme();
  const loaderSize = customSize || SIZE_MAP[size];
  
  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);

  // Set mounted on client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine effective theme only after mount
  const effectiveTheme = forceTheme || resolvedTheme || 'dark';
  const isDark = effectiveTheme === 'dark';

  // Don't render Lottie during SSR - render a simple placeholder instead
  // This prevents any hydration mismatches
  if (!mounted) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)} 
        style={style}
      >
        <div 
          style={{ 
            width: loaderSize, 
            height: loaderSize 
          }} 
        />
      </div>
    );
  }

  // Dynamically import Lottie only on client-side
  return (
    <div className={cn('flex items-center justify-center', className)} style={style}>
      <LottieAnimation
        loaderSize={loaderSize}
        loop={loop}
        autoPlay={autoPlay}
        isDark={isDark}
        speed={speed}
      />
    </div>
  );
}

// Separate client-only Lottie component
function LottieAnimation({
  loaderSize,
  loop,
  autoPlay,
  isDark,
  speed,
}: {
  loaderSize: number;
  loop: boolean;
  autoPlay: boolean;
  isDark: boolean;
  speed: number;
}) {
  // Elegant rotating gradient orb
  return (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ 
        width: loaderSize, 
        height: loaderSize 
      }}
    >
      <style jsx>{`
        @keyframes rotate-gradient {
          0% { 
            transform: rotate(0deg);
          }
          100% { 
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.1);
          }
        }
      `}</style>
      
      {/* Glow effect */}
      <svg
        viewBox="0 0 100 100"
        style={{ 
          width: loaderSize * 1.4, 
          height: loaderSize * 1.4,
          position: 'absolute',
          animation: `pulse-glow ${1.5 / speed}s ease-in-out infinite`,
          filter: 'blur(8px)',
        }}
      >
        <defs>
          <radialGradient id="glowGradient">
            <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#A855F7', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill={isDark ? "url(#glowGradient)" : "rgba(0,0,0,0.2)"} />
      </svg>
      
      {/* Main rotating gradient orb */}
      <svg
        viewBox="0 0 100 100"
        style={{ 
          width: loaderSize * 1.2, 
          height: loaderSize * 1.2,
          position: 'absolute',
          animation: `rotate-gradient ${2 / speed}s linear infinite`,
        }}
      >
        <defs>
          <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F472B6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          fill="url(#orbGradient)"
          opacity={1}
        />
      </svg>
    </div>
  );
}

