import React from 'react';
import Image from 'next/image';

interface PlanLogoWithNameProps {
  name: string;
  size?: number;
}

export const PlanLogoWithName: React.FC<PlanLogoWithNameProps> = ({ name, size = 28 }) => (
  <div className="flex items-center gap-2">
    <Image src="/logo.png" alt="Plan Logo" width={size} height={size} className="rounded" />
    <span className="font-medium text-base">{name}</span>
  </div>
);

export default PlanLogoWithName;
