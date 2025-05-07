'use client';

import Image from 'next/image';

interface MachineLogoProps {
  size?: number;
  className?: string;
}

/**
 * A standardized Machine logo component that prevents dark mode inversion
 */
export function MachineLogo({ size = 24, className = '' }: MachineLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Machine"
      width={size}
      height={size}
      className={`invert-0 object-contain ${className}`}
    />
  );
}
