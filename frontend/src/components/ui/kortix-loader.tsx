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
   * Force a specific loader variant (overrides auto-detection)
   * - 'white': White loader (for dark backgrounds)
   * - 'black': Black loader (for light backgrounds)
   * - 'auto': Auto-detect based on theme (default)
   */
  variant?: 'white' | 'black' | 'auto';
  /**
   * @deprecated Use 'variant' instead
   * Force a specific loader variant (overrides auto-detection)
   * - 'white': White loader (for dark backgrounds)
   * - 'black': Black loader (for light backgrounds)
   * - 'auto': Auto-detect based on theme (default)
   */
  variant?: 'white' | 'black' | 'auto';
  /**
   * @deprecated Use 'variant' instead
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
 * Uses separate Lottie animations (white and black) that dynamically load
 * based on the current theme or can be explicitly set.
 * 
 * **Automatic Behavior:**
 * - Light mode → Black loader (for white backgrounds)
 * - Dark mode → White loader (for dark backgrounds)
 * 
 * **Manual Override (for special cases):**
 * Use the `variant` prop when the background doesn't match the theme.
 * For example, a dark button in light mode needs `variant="white"`.
 * Uses separate Lottie animations (white and black) that dynamically load
 * based on the current theme or can be explicitly set.
 * 
 * **Automatic Behavior:**
 * - Light mode → Black loader (for white backgrounds)
 * - Dark mode → White loader (for dark backgrounds)
 * 
 * **Manual Override (for special cases):**
 * Use the `variant` prop when the background doesn't match the theme.
 * For example, a dark button in light mode needs `variant="white"`.
 * 
 * **Files:**
 * - loading-white.json: White loader (for dark backgrounds)
 * - loading-black.json: Black loader (for light backgrounds)
 * **Files:**
 * - loading-white.json: White loader (for dark backgrounds)
 * - loading-black.json: Black loader (for light backgrounds)
 * 
 * @example
 * ```tsx
 * // Auto-themed (default)
 * // Auto-themed (default)
 * <KortixLoader />
 * 
 * // Always white (for dark backgrounds in any theme)
 * <KortixLoader variant="white" />
 * 
 * // Always black (for light backgrounds in any theme)
 * <KortixLoader variant="black" />
 * 
 * // Always white (for dark backgrounds in any theme)
 * <KortixLoader variant="white" />
 * 
 * // Always black (for light backgrounds in any theme)
 * <KortixLoader variant="black" />
 * 
 * // Custom size
 * <KortixLoader size="large" />
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
  variant = 'auto',
  forceTheme, // deprecated, but kept for backwards compatibility
  variant = 'auto',
  forceTheme, // deprecated, but kept for backwards compatibility
}: KortixLoaderProps) {
  const { resolvedTheme } = useTheme();
  const loaderSize = customSize || SIZE_MAP[size];
  
  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);

  // Set mounted on client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which variant to use
  let effectiveVariant: 'white' | 'black';
  
  if (variant !== 'auto') {
    // Explicit variant set
    effectiveVariant = variant;
  } else if (forceTheme) {
    // Backwards compatibility with forceTheme
    effectiveVariant = forceTheme === 'dark' ? 'white' : 'black';
  } else {
    // Auto-detect from theme
    const isDark = (resolvedTheme || 'dark') === 'dark';
    effectiveVariant = isDark ? 'white' : 'black';
  }
  // Determine which variant to use
  let effectiveVariant: 'white' | 'black';
  
  if (variant !== 'auto') {
    // Explicit variant set
    effectiveVariant = variant;
  } else if (forceTheme) {
    // Backwards compatibility with forceTheme
    effectiveVariant = forceTheme === 'dark' ? 'white' : 'black';
  } else {
    // Auto-detect from theme
    const isDark = (resolvedTheme || 'dark') === 'dark';
    effectiveVariant = isDark ? 'white' : 'black';
  }

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
        variant={effectiveVariant}
        variant={effectiveVariant}
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
  variant,
  variant,
  speed,
}: {
  loaderSize: number;
  loop: boolean;
  autoPlay: boolean;
  variant: 'white' | 'black';
  variant: 'white' | 'black';
  speed: number;
}) {
  const isDark = variant === 'white';
  // Elegant rotating gradient orb with machine.svg in center
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
      
      {/* Machine.svg in center - made white */}
      <img
        src="/machine.svg"
        alt=""
        style={{
          width: loaderSize * 0.5,
          height: loaderSize * 0.5,
          position: 'absolute',
          filter: 'brightness(0) invert(1)', // Makes the SVG white
          opacity: 0.9,
        }}
      />
    </div>
  );
}

