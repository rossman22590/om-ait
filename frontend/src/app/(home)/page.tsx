"use client";

import { useEffect, useState } from 'react';
import Script from "next/script";
// import { CTASection } from '@/components/home/sections/cta-section';
import { FooterSection } from '@/components/home/sections/footer-section';
import { HeroSection } from '@/components/home/sections/hero-section';
import { OpenSourceSection } from '@/components/home/sections/open-source-section';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { UseCasesSection } from '@/components/home/sections/use-cases-section';
import { ModalProviders } from '@/providers/modal-providers';
import { BackgroundAALChecker } from '@/components/auth/background-aal-checker';
import { BentoSection } from '@/components/home/sections/bento-section';
import { CompanyShowcase } from '@/components/home/sections/company-showcase';
import { FeatureSection } from '@/components/home/sections/feature-section';
import { QuoteSection } from '@/components/home/sections/quote-section';
import { TestimonialSection } from '@/components/home/sections/testimonial-section';
import { FAQSection } from '@/components/home/sections/faq-section';
import { AgentShowcaseSection } from '@/components/home/sections/agent-showcase-section';
import { DeliverablesSection } from '@/components/home/sections/deliverables-section';
import { CapabilitiesSection } from '@/components/home/sections/capabilities-section';
import { IntegrationsSection } from '@/components/home/sections/integrations-section';
import { InteractiveDemo } from '@/components/home/sections/interactive-demo';

export default function Home() {
  return (
    <>
      <ModalProviders />
      <BackgroundAALChecker>
        <main className="flex flex-col items-center justify-center min-h-screen w-full">
          <div className="w-full divide-y divide-border">
            <HeroSection />
            <InteractiveDemo />
            {/* Senja testimonials embed (after Watch Machine Work section) */}
            <Script
              src="https://widget.senja.io/widget/698903f7-82e1-43c9-a1e4-507b33742e0a/platform.js"
              async
              strategy="afterInteractive"
            />
            <div className="w-full py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div
                  className="senja-embed"
                  data-id="698903f7-82e1-43c9-a1e4-507b33742e0a"
                  data-mode="shadow"
                  data-lazyload="false"
                  style={{ display: 'block', width: '100%' }}
                />
              </div>
            </div>
            <CapabilitiesSection />
            <BentoSection />
            <IntegrationsSection />
            <UseCasesSection />
            <OpenSourceSection />
            <PricingSection />
        
            <FooterSection />
          </div>
        </main>
      </BackgroundAALChecker>
    </>
  );
}