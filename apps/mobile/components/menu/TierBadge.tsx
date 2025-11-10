import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import LogoPng from '@/assets/logo.png';
import { useColorScheme } from 'nativewind';
import type { TierType } from './types';

interface TierBadgeProps {
  tier: TierType;
  size?: 'small' | 'large';
}

/**
 * TierBadge Component
 * 
 * Displays tier badge SVG which includes both icon and tier name.
 * Four variants: Basic (gray), Plus (pink gradient), Pro (orange gradient), Ultra (rainbow gradient).
 * 
 * The SVG badges are pre-designed and contain:
 * - Kortix icon
 * - Tier name text
 * - Background styling
 * 
 * Size variants:
 * - Small: Height 20px (for pricing cards, billing page)
 * - Large: Height 24px (for larger displays)
 */
export function TierBadge({ tier, size = 'small' }: TierBadgeProps) {
  const isSmall = size === 'small';
  // Figma specs: Small size: 12x10px icon, 13.33px text
  const iconSize = isSmall ? { width: 12, height: 10 } : { width: 104, height: 87 };
  const textSize = isSmall ? 'text-[13.33px]' : 'text-[116px]';
  const gapSize = isSmall ? 'gap-1' : 'gap-[35px]';

  // Select appropriate icon
  const TierIcon = LogoPng;

  // Calculate width based on original SVG aspect ratio
  const getWidth = () => {
    const aspectRatios = {
      Basic: 50 / 24,
      Plus: 59 / 24,
      Pro: 55 / 24,
      Ultra: 63 / 24,
    };
    return Math.round(height * aspectRatios[tier]);
  };

  const width = getWidth();

  return (
    <View style={{ height, width }}>
      <TierIcon width={width} height={height} />
    </View>
  );
}

