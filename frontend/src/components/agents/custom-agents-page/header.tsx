'use client';

import React, { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';
import PixelBlast from '@/components/home/ui/PixelBlast';

export const AgentsPageHeader = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative overflow-hidden rounded-3xl flex items-center justify-center border bg-background/80 backdrop-blur-sm">
      {/* PixelBlast background clipped to header box */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="hidden sm:block absolute left-0 top-0 h-full w-1/3 overflow-hidden">
          {mounted && (
            <PixelBlast
              variant="circle"
              pixelSize={8}
              color="#EC4899"
              patternScale={2.5}
              patternDensity={1.5}
              pixelSizeJitter={0.3}
              enableRipples
              rippleSpeed={0.5}
              rippleThickness={0.15}
              rippleIntensityScale={2}
              liquid
              liquidStrength={0.15}
              liquidRadius={1.5}
              liquidWobbleSpeed={4}
              speed={0.8}
              edgeFade={0.2}
              transparent
            />
          )}
        </div>
        <div className="hidden sm:block absolute right-0 top-0 h-full w-1/3 overflow-hidden">
          {mounted && (
            <PixelBlast
              variant="circle"
              pixelSize={8}
              color="#A855F7"
              patternScale={2.5}
              patternDensity={1.5}
              pixelSizeJitter={0.3}
              enableRipples
              rippleSpeed={0.5}
              rippleThickness={0.15}
              rippleIntensityScale={2}
              liquid
              liquidStrength={0.15}
              liquidRadius={1.5}
              liquidWobbleSpeed={4}
              speed={0.8}
              edgeFade={0.2}
              transparent
            />
          )}
        </div>
      </div>

      <div className="relative px-8 py-16 text-center z-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center justify-center rounded-full bg-muted/80 backdrop-blur-sm p-3 border border-border/50">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            <span className="text-primary">AI Agents</span>
          </h1>
        </div>
      </div>
    </div>
  );
};
