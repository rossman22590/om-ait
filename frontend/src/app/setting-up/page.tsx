'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useInitializeAccount } from '@/hooks/account';
import { createClient } from '@/lib/supabase/client';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Simple confetti component (no library)
function ConfettiBurst({ show }: { show: boolean }) {
  const colors = ['#34d399', '#60a5fa', '#fbbf24', '#f472b6', '#a78bfa', '#f87171'];
  const confetti = useRef(
    Array.from({ length: 24 }).map((_, i) => ({
      left: Math.random() * 100,
      duration: 1.2 + Math.random() * 0.8,
      delay: Math.random(),
      size: 8 + Math.random() * 8,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
    }))
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {confetti.current.map((cfg, i) => (
        <div
          key={i}
          style={{
            left: `${cfg.left}%`,
            width: cfg.size,
            height: cfg.size * 2,
            background: cfg.color,
            position: 'absolute',
            top: '-24px',
            borderRadius: '2px',
            transform: `rotate(${cfg.rotate}deg)`,
            opacity: 0.85,
            animation: `confetti-fall ${cfg.duration}s ${cfg.delay}s cubic-bezier(.62,.01,.5,1) forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          to {
            top: 100vh;
            opacity: 0.2;
            transform: translateY(0.5em) rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

export default function SettingUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'initializing' | 'success' | 'error'>('initializing');
  const [retryCount, setRetryCount] = useState(0);
  const initializeMutation = useInitializeAccount();
  const hasAttemptedInit = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (user && status === 'initializing' && !initializeMutation.isPending) {
      initializeMutation.mutate(undefined, {
        onSuccess: () => {
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        },
        onError: (error) => {
          console.error('Setup error:', error);
          // Retry up to 3 times with delay (in case account creation is still in progress)
          if (retryCount < 3) {
            console.log(`Retrying initialization... Attempt ${retryCount + 1}/3`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          } else {
            setStatus('error');
          }
        },
      });
    }
  }, [user, status, router, initializeMutation, retryCount]);

  return (
    <div className="relative flex flex-col items-center w-full px-4 sm:px-6 min-h-screen justify-center">
      <ConfettiBurst show={status === 'success'} />
      <AnimatedBg variant="hero" />
      <div className="relative z-10 w-full max-w-[456px] flex flex-col items-center gap-8">
        <KortixLogo size={32} />
        {status === 'initializing' && (
          <div className="animate-fade-in w-full">
            <h1 className="text-[43px] font-normal tracking-tight text-foreground leading-none text-center">
              Setting Up
            </h1>
            <p className="text-[16px] text-foreground/60 text-center leading-relaxed">
              We're setting up your account. This may take a few moments.
            </p>
            <Card className="w-full h-24 bg-card border border-border mt-4">
              <CardContent className="p-6 h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className='flex items-center gap-2'>
                        <div className="h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-base font-medium text-blue-400 animate-pulse">Initializing</span>
                      </div>
                      <p className="text-base text-gray-400 animate-fade-in">Setting up your account...</p>
                    </div>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center">
                    <KortixLoader size="large" customSize={48} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-[43px] font-normal tracking-tight text-foreground leading-none text-center">
              You're All Set!
            </h1>
            <p className="text-[16px] text-foreground/60 text-center leading-relaxed">
              Your account is ready. Redirecting you to the dashboard...
            </p>
            <Card className="w-full h-24 bg-card border border-border">
              <CardContent className="p-6 h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className='flex items-center gap-2'>
                        <div className="h-2.5 w-2.5 bg-green-500 rounded-full"></div>
                        <span className="text-base font-medium text-green-400">Ready</span>
                      </div>
                      <p className="text-base text-gray-400">Welcome to your workspace!</p>
                    </div>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 animate-bounce" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-[43px] font-normal tracking-tight text-foreground leading-none text-center">
              Setup Issue
            </h1>

            <p className="text-[16px] text-foreground/60 text-center leading-relaxed">
              {initializeMutation.error instanceof Error 
                ? initializeMutation.error.message 
                : 'An error occurred during setup. You can still continue to your dashboard.'}
            </p>

            <Card className="w-full min-h-24 bg-card border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <div className='flex items-center gap-2'>
                        <div className="h-2.5 w-2.5 bg-red-500 rounded-full"></div>
                        <span className="text-base font-medium text-red-400">Setup Error</span>
                      </div>
                      <p className="text-base text-gray-400">Don't worry, you can try again later.</p>
                    </div>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full mt-4"
                  variant="default"
                >
                  Continue to Dashboard
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-50"
        style={{
          backgroundImage: 'url(/grain-texture.png)',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  );
}
