'use client';

import { Mail, Clock, Shield, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { AnimatedBg } from '@/components/ui/animated-bg';
import { useIsMobile } from '@/hooks/utils';
import { Button } from '@/components/ui/button';

const SectionHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-8 space-y-4">
      {children}
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 hover:bg-accent/20 transition-colors flex items-center justify-between gap-4"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <div className="text-muted-foreground leading-relaxed">{answer}</div>
        </div>
      )}
    </div>
  );
};

export default function SupportPage() {
  const isMobile = useIsMobile();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="w-full divide-y divide-border">
        <section className="w-full relative overflow-hidden">
          <AnimatedBg
            variant="hero"
            sizeMultiplier={isMobile ? 0.7 : 1}
            blurMultiplier={isMobile ? 0.6 : 1}
            customArcs={isMobile ? {
              left: [
                {
                  pos: { left: -150, top: 30 },
                  size: 380,
                  tone: 'medium' as const,
                  opacity: 0.15,
                  delay: 0.5,
                  x: [0, 15, -8, 0],
                  y: [0, 12, -6, 0],
                  scale: [0.82, 1.08, 0.94, 0.82],
                  blur: ['12px', '20px', '16px', '12px'],
                },
              ],
              right: [
                {
                  pos: { right: -120, top: 140 },
                  size: 300,
                  tone: 'dark' as const,
                  opacity: 0.2,
                  delay: 1.0,
                  x: [0, -18, 10, 0],
                  y: [0, 14, -8, 0],
                  scale: [0.86, 1.14, 1.0, 0.86],
                  blur: ['10px', '6px', '8px', '10px'],
                },
              ],
            } : undefined}
          />
          <div className="relative flex flex-col items-center w-full px-6">
            <div className="relative z-10 pt-32 mx-auto h-full w-full max-w-6xl flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-6 pt-12 max-w-4xl mx-auto pb-16">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-balance text-center">
                  <span className="text-primary">We're Here to Help</span>
                </h1>
                
                <p className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-2xl">
                  Get the support you need from our team. We typically respond within 24 hours on business days.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <Button asChild size="lg" className="text-base h-14 w-48 rounded-full px-8">
                    <a href="mailto:support@kortix.com">
                      <Mail className="w-5 h-5"/>
                      Email Support
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-base h-14 w-48 rounded-full px-8">
                    <a href="#faq">
                      Browse FAQs
                    </a>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Or email us directly at <a href="mailto:support@kortix.com" className="text-primary hover:underline font-medium">support@kortix.com</a>
                </p>
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Support</h1>
            <p className="text-muted-foreground mb-6">
              For support inquiries, please contact us at:
            </p>
            <a 
              href="mailto:support@myapps.ai" 
              className="text-lg font-medium text-primary hover:underline inline-flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              support@mytsi.org
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
