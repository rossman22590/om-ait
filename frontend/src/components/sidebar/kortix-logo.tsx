'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface KortixLogoProps {
  size?: number;
  variant?: 'symbol' | 'logomark';
  className?: string;
}

export function KortixLogo({ size = 24, variant = 'symbol', className }: KortixLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvert = false;

  // For logomark variant, use logomark-white.svg which is already white
  // and invert it for light mode instead
  if (variant === 'logomark') {
    return (
      <Image
        src="/logo.png"
        alt="Kortix"
        width={size}
        height={size}
        className={cn(`flex-shrink-0`, className)}
        style={{ height: size, width: 'auto' }}
      />
    );
  }

  // Default symbol variant behavior
  return (
    <Image
      src="/logo.png"
      alt="Machine"
      width={size}
      height={size}
      className={cn(`flex-shrink-0`, className)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
