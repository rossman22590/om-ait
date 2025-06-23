'use client';

import Image from 'next/image';

interface KortixLogoProps {
  size?: number;
}
export function KortixLogo({ size = 24 }: KortixLogoProps) {
  return (
    <Image
        src="/logo.png"
        alt="Kortix"
        width={size}
        height={size}
        className="flex-shrink-0"
      />
  );
}
