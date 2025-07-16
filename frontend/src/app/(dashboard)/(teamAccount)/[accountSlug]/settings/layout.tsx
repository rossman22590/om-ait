'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users, CreditCard } from 'lucide-react';

type LayoutParams = {
  accountSlug: string;
};

export default function TeamSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LayoutParams>;
}) {
  const unwrappedParams = React.use(params);
  const { accountSlug } = unwrappedParams;
  const pathname = usePathname();
  const items = [
    { name: 'Account', href: `/${accountSlug}/settings`, icon: Settings },
    { name: 'Members', href: `/${accountSlug}/settings/members`, icon: Users },
    { name: 'Billing', href: `/${accountSlug}/settings/billing`, icon: CreditCard },
  ];
  return (
    <div className="space-y-6 w-full">
      <Separator className="border-subtle dark:border-white/10" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 w-full max-w-6xl mx-auto px-4">
        <aside className="lg:w-48 p-1">
          <nav className="flex flex-col space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 bg-card-bg dark:bg-background-secondary p-6 rounded-2xl border border-subtle dark:border-white/10 shadow-custom">
          {children}
        </div>
      </div>
    </div>
  );
}
