import { ThemeProvider } from '@/components/home/theme-provider';
import { siteConfig } from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ReactQueryProvider } from './react-query-provider';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import { PostHogIdentify } from '@/components/posthog-identify';
import '@/lib/polyfills';
import { roobert } from './fonts/roobert';
import { roobertMono } from './fonts/roobert-mono';
import { PlanSelectionModal } from '@/components/billing/pricing/plan-selection-modal';
import { Suspense } from 'react';
import { I18nProvider } from '@/components/i18n-provider';


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
  metadataBase: new URL(siteConfig.url),
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
    nocache: false,
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
    url: siteConfig.url,
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
      { url: '/favicon.png', sizes: 'any' },
      { url: '/favicon-light.png', sizes: 'any', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteConfig.url,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
        <meta property="og:url" content={siteConfig.url} />
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
              url: siteConfig.url,
              logo: `${siteConfig.url}/favicon.png`,
              description: metadata.description,
              foundingDate: '2024',
              sameAs: ['https://x.com/the_machine_ai'],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                url: siteConfig.url,
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
        <Script async src="https://cdn.tolt.io/tolt.js" data-tolt={process.env.NEXT_PUBLIC_TOLT_REFERRAL_ID}></Script>
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
            <ReactQueryProvider>
              {children}
              <Toaster />
              <Suspense fallback={null}>
                <PlanSelectionModal />
              </Suspense>
            </ReactQueryProvider>
          </AuthProvider>
          </I18nProvider>
          <Analytics />
          <GoogleAnalytics gaId="G-6ETJFB3PT3" />
          <SpeedInsights />
          <PostHogIdentify />
        </ThemeProvider>
      </body>
    </html>
  );
}