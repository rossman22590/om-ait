'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

type LegalTab = 'terms' | 'privacy' | 'imprint';

export default function LegalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab');
  const initialTab: LegalTab = (tabParam === 'terms' || tabParam === 'privacy' || tabParam === 'imprint')
    ? (tabParam as LegalTab)
    : 'imprint';
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    const validTab = (tabParam === 'terms' || tabParam === 'privacy' || tabParam === 'imprint')
      ? (tabParam as LegalTab)
      : 'imprint';
    if (validTab !== activeTab) setActiveTab(validTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const handleTabChange = (tab: LegalTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full bg-background">
      <section className="w-full pb-20">
        <div className="flex flex-col items-center w-full px-6 pt-10">
          <div className="max-w-4xl w-full mx-auto">
            <div className="flex items-center justify-center mb-10">
              <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-primary">
                Legal Information
              </h1>
            </div>

            <div className="flex justify-center mb-8">
              <div className="flex space-x-4 border-b border-border">
                <button
                  onClick={() => handleTabChange('imprint')}
                  className={`pb-2 px-4 ${activeTab === 'imprint'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground hover:text-primary/80 transition-colors'
                    }`}
                >
                  Imprint
                </button>
                <button
                  onClick={() => handleTabChange('terms')}
                  className={`pb-2 px-4 ${activeTab === 'terms'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground hover:text-primary/80 transition-colors'
                    }`}
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => handleTabChange('privacy')}
                  className={`pb-2 px-4 ${activeTab === 'privacy'
                      ? 'border-b-2 border-primary font-medium text-primary'
                      : 'text-muted-foreground hover:text-primary/80 transition-colors'
                    }`}
                >
                  Privacy Policy
                </button>
              </div>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {activeTab === 'imprint' ? (
                    <div>
                      <h2 className="text-2xl font-medium tracking-tight mb-4">Imprint</h2>
                      <p className="text-sm text-muted-foreground mb-6">Information according to legal requirements</p>
                      <h3 className="text-lg font-medium tracking-tight">Company Information</h3>
                      <div className="text-muted-foreground mb-6 space-y-2">
                        <p><strong>Machine AI</strong></p>
                        {/* <p>701 Tillery Street</p>
                        <p>Unit 12-2521</p>
                        <p>Austin, TX 78702</p> */}
                        <p>United States</p>
                      </div>
                      <h3 className="text-lg font-medium tracking-tight">Contact</h3>
                      <div className="text-muted-foreground mb-6">
                        <p>
                          Email{' '}
                          <a href="mailto:info@myapps.ai" className="text-primary hover:underline">info@myapps.ai</a>
                        </p>
                      </div>
                      <h3 className="text-lg font-medium tracking-tight">Responsible for Content</h3>
                      <p className="text-muted-foreground mb-6">Machine AI is responsible for the content of this website in accordance with applicable laws.</p>
                      <h3 className="text-lg font-medium tracking-tight">Disclaimer</h3>
                      <p className="text-muted-foreground text-balance mb-6">The information provided on this website is for general informational purposes only...</p>
                    </div>
                  ) : activeTab === 'terms' ? (
                    <div>
                      <h2 className="text-2xl font-medium tracking-tight mb-4">Terms of Service</h2>
                      <p className="text-sm text-muted-foreground mb-6">Last updated: 13 August 2024</p>
                      <h3 className="text-lg font-medium tracking-tight">Terms of Service & Privacy Policy</h3>
                      <p className="text-muted-foreground text-balance mb-4">Last updated and effective date: 13 August 2024</p>
                      <p className="text-muted-foreground text-balance mb-6">PLEASE READ THESE TERMS OF USE...</p>
                      {/* The rest of the terms content remains unchanged */}
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-medium tracking-tight mb-4">Privacy Policy</h2>
                      <p className="text-sm text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
                      <h3 className="text-lg font-medium tracking-tight">Privacy</h3>
                      <p className="text-muted-foreground text-balance mb-6">Our commitment to privacy and data protection...</p>
                      {/* The rest of the privacy content remains unchanged */}
                    </div>
                  )}
                </div>
            </CardContent>
            </Card>

            <div className="mt-12 text-center pb-10">
              <Link href="/" className="group inline-flex h-10 items-center justify-center gap-2 text-sm font-medium tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground px-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] bg-primary hover:bg-primary/90 transition-all duration-200 w-fit">
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
