import { ThemeProvider } from '@/components/home/theme-provider';
import { siteMetadata } from '@/lib/site-metadata';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { PresenceProvider } from '@/providers/presence-provider';
import { ReactQueryProvider } from './react-query-provider';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';
import '@/lib/polyfills';
import { roobert } from './fonts/roobert';
import { roobertMono } from './fonts/roobert-mono';
import { Suspense, lazy } from 'react';
import { I18nProvider } from '@/components/i18n-provider';

// Lazy load non-critical analytics and global components
const Analytics = lazy(() => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })));
const SpeedInsights = lazy(() => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })));
const GoogleAnalytics = lazy(() => import('@next/third-parties/google').then(mod => ({ default: mod.GoogleAnalytics })));
const PostHogIdentify = lazy(() => import('@/components/posthog-identify').then(mod => ({ default: mod.PostHogIdentify })));
const PlanSelectionModal = lazy(() => import('@/components/billing/pricing/plan-selection-modal').then(mod => ({ default: mod.PlanSelectionModal })));


export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.url),
  title: {
    default: 'Machine',
    template: '%s | Machine',
  },
  description: 'Machine is an AI assistant that helps you accomplish real-world tasks with ease. Through natural conversation, Machine becomes your digital companion for research, data analysis, and everyday challenges.',
  keywords: [
    'AI assistant',
    'artificial intelligence',
    'AI worker',
    'browser automation',
    'web scraping',
    'file management',
    'research assistant',
    'data analysis',
    'task automation',
    'Machine',
    'generalist AI',
    'code generation',
    'AI coding assistant',
    'workflow automation',
    'AI productivity',
  ],
  authors: [
    { name: 'Machine Team', url: 'https://machine.myapps.ai' }
  ],
  creator: 'Machine Team',
  publisher: 'Machine Team',
  category: 'Technology',
  applicationName: 'Machine',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    title: 'Machine - Generalist AI Agent',
    description: 'Machine is an AI assistant that helps you accomplish real-world tasks with ease through natural conversation.',
    url: siteMetadata.url,
    siteName: 'Machine',
    locale: 'en_US',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'Machine - Generalist AI Agent',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Machine - Generalist AI Agent',
    description: 'Machine is an AI assistant that helps you accomplish real-world tasks with ease through natural conversation.',
    creator: '@the_machine_ai',
    site: '@the_machine_ai',
    images: ['/banner.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32' },
      { url: '/favicon-light.png', sizes: '32x32', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: '/favicon.png',
    apple: [{ url: '/logo_black.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteMetadata.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${roobert.variable} ${roobertMono.variable}`}>
      <head>
        <meta property="og:title" content="Machine - Generalist AI Agent" />
        <meta property="og:description" content="Machine is an AI assistant that helps you accomplish real-world tasks with ease through natural conversation." />
        <meta property="og:image" content="/banner.png" />
        <meta property="og:url" content={siteMetadata.url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Machine - Generalist AI Agent" />
        <meta name="twitter:description" content="Machine is an AI assistant that helps you accomplish real-world tasks with ease through natural conversation." />
        <meta name="twitter:image" content="/banner.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Machine',
              alternateName: ['Machine', 'Machine AI'],
              url: siteMetadata.url,
              logo: `${siteMetadata.url}/favicon.png`,
              description: metadata.description,
              foundingDate: '2024',
              sameAs: ['https://x.com/the_machine_ai'],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                url: siteMetadata.url,
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Machine',
              alternateName: 'Machine',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, macOS, Windows, Linux',
              description: siteMetadata.description,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1000',
              },
            }),
          }}
        />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-PCHSN4M2');`}
        </Script>
      </head>

      <body className="antialiased font-sans bg-background">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PCHSN4M2"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              <PresenceProvider>
              <ReactQueryProvider>
                {children}
                <Toaster />
                <Suspense fallback={null}>
                  <PlanSelectionModal />
                </Suspense>
              </ReactQueryProvider>
              </PresenceProvider>
            </AuthProvider>
          </I18nProvider>
          {/* Analytics - lazy loaded to not block FCP */}
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
          <Suspense fallback={null}>
            <GoogleAnalytics gaId="G-6ETJFB3PT3" />
          </Suspense>
          <Suspense fallback={null}>
            <SpeedInsights />
          </Suspense>
          <Suspense fallback={null}>
            <PostHogIdentify />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}