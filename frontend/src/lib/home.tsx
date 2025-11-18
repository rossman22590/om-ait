import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { config } from '@/lib/config';
import { ArrowRight } from 'lucide-react';

interface UpgradePlan {
  /** @deprecated */
  hours: string;
  price: string;
  tierKey: string;  // Backend tier key
}

export interface PricingTier {
  name: string;
  price: string;
  yearlyPrice?: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  isPopular: boolean;
  /** @deprecated */
  hours: string;
  features: string[];
  tierKey: string;  // Backend tier key (e.g., 'tier_2_20', 'free')
  upgradePlans: UpgradePlan[];
  hidden?: boolean;
  billingPeriod?: 'monthly' | 'yearly';
  originalYearlyPrice?: string;
  discountPercentage?: number;
}

export const siteConfig = {
  name: 'Machine',
  description: 'The Generalist AI Agent that can act on your behalf.',
  cta: 'Start Free',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://machine.myapps.ai',
  keywords: ['AI Agent', 'Generalist AI', 'Autonomous Agent'],
  links: {
    email: 'support@myapps.ai',
    twitter: 'https://x.com/the_machine_ai',
    discord: '#',
    github: '#',
    instagram: '#',
  },
  nav: {
    links: [
      { id: 1, name: 'Home', href: '#hero' },
      { id: 2, name: 'About', href: '/about' },
      { id: 3, name: 'Use Cases', href: '#use-cases' },
      { id: 4, name: 'Pricing', href: '/pricing' },
      { id: 5, name: 'Docs', href: 'https://support.myapps.ai/machine/the-machine' },
      { id: 6, name: 'Status', href: 'https://ai-tutor-x-pixio.instatus.com/' },
    ],
  },
  // Optional list consumed by components like UseCasesSection
  useCases: [
    {
      id: 'uc-1',
      title: 'Automated Market Research',
      description: 'Machine scans global markets and trends for actionable insights.',
      category: 'Research',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
      url: '#',
    },
    {
      id: 'uc-2',
      title: 'Customer Sentiment Analysis',
      description: 'Analyze customer feedback and social media for sentiment trends.',
      category: 'Analytics',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      url: '#',
    },
    {
      id: 'uc-3',
      title: 'Automated Email Response',
      description: 'Respond to customer emails instantly and accurately.',
      category: 'Support',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80',
      url: '#',
    },
    {
      id: 'uc-4',
      title: 'Financial Forecasting',
      description: 'Predict financial outcomes using historical data and AI.',
      category: 'Finance',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
      url: '#',
    },
    {
      id: 'uc-5',
      title: 'Automated Scheduling',
      description: 'Coordinate meetings and events across teams automatically.',
      category: 'Productivity',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      url: '#',
    },
    {
      id: 'uc-6',
      title: 'Document Summarization',
      description: 'Summarize lengthy documents into concise briefs.',
      category: 'Content',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80', // books and documents
      url: '#',
    },
    {
      id: 'uc-7',
      title: 'Social Media Automation',
      description: 'Schedule and post content across platforms automatically.',
      category: 'Marketing',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80', // social media icons on phone
      url: '#',
    },
    {
      id: 'uc-8',
      title: 'AI-Powered Recruiting',
      description: 'Screen resumes and schedule interviews with AI.',
      category: 'HR',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80', // recruiting/interview
      url: '#',
    },
    {
      id: 'uc-9',
      title: 'Inventory Management',
      description: 'Track and optimize inventory levels in real time.',
      category: 'Operations',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://plus.unsplash.com/premium_photo-1681426730828-bfee2d13861d?q=80&w=1332&auto?auto=format&fit=crop&w=800&q=80', // real warehouse, shelves, boxes
      url: '#',
    },
    {
      id: 'uc-10',
      title: 'Automated Code Review',
      description: 'Review code for errors and best practices automatically.',
      category: 'Development',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80', // code
      url: '#',
    },
    {
      id: 'uc-11',
      title: 'AI Chatbots',
      description: 'Deploy chatbots for instant customer support.',
      category: 'Support',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80', // chatbot
      url: '#',
    },
    {
      id: 'uc-12',
      title: 'Automated Testing',
      description: 'Run automated tests for software quality assurance.',
      category: 'QA',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80', // testing
      url: '#',
    },
    {
      id: 'uc-13',
      title: 'Personalized Recommendations',
      description: 'Deliver personalized product or content recommendations.',
      category: 'E-commerce',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&w=800&q=80', // recommendations
      url: '#',
    },
    {
      id: 'uc-14',
      title: 'Fraud Detection',
      description: 'Detect and prevent fraudulent activities using AI.',
      category: 'Security',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80', // security/fraud
      url: '#',
    },
    {
      id: 'uc-15',
      title: 'Voice Transcription',
      description: 'Transcribe audio and video files automatically.',
      category: 'Content',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80', // audio/transcription
      url: '#',
    },
    {
      id: 'uc-16',
      title: 'Smart Home Automation',
      description: 'Control smart home devices and routines with AI.',
      category: 'IoT',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80', // smart home
      url: '#',
    },
    {
      id: 'uc-17',
      title: 'Medical Diagnosis Support',
      description: 'Assist doctors with AI-powered diagnostic tools.',
      category: 'Healthcare',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // medical
      url: '#',
    },
    {
      id: 'uc-18',
      title: 'Energy Usage Optimization',
      description: 'Monitor and optimize energy consumption in buildings.',
      category: 'Sustainability',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80', // energy
      url: '#',
    },
    {
      id: 'uc-19',
      title: 'Translation Services',
      description: 'Translate text and speech between languages automatically.',
      category: 'Language',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80', // translation
      url: '#',
    },
    {
      id: 'uc-20',
      title: 'Remote Device Monitoring',
      description: 'Monitor and manage remote devices and sensors.',
      category: 'IoT',
      featured: true,
      icon: <ArrowRight />,
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80', // sensors/devices
      url: '#',
    },
  ],
  hero: {
    badgeIcon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
      >
        <path
          d="M7.62758 1.09876C7.74088 1.03404 7.8691 1 7.99958 1C8.13006 1 8.25828 1.03404 8.37158 1.09876L13.6216 4.09876C13.7363 4.16438 13.8316 4.25915 13.8979 4.37347C13.9642 4.48779 13.9992 4.6176 13.9992 4.74976C13.9992 4.88191 13.9642 5.01172 13.8979 5.12604C13.8316 5.24036 13.7363 5.33513 13.6216 5.40076L8.37158 8.40076C8.25828 8.46548 8.13006 8.49952 7.99958 8.49952C7.8691 8.49952 7.74088 8.46548 7.62758 8.40076L2.37758 5.40076C2.26287 5.33513 2.16753 5.24036 2.10123 5.12604C2.03492 5.01172 2 4.88191 2 4.74976C2 4.6176 2.03492 4.48779 2.10123 4.37347C2.16753 4.25915 2.26287 4.16438 2.37758 4.09876L7.62758 1.09876Z"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M2.56958 7.23928L2.37758 7.34928C2.26287 7.41491 2.16753 7.50968 2.10123 7.624C2.03492 7.73831 2 7.86813 2 8.00028C2 8.13244 2.03492 8.26225 2.10123 8.37657C2.16753 8.49089 2.26287 8.58566 2.37758 8.65128L7.62758 11.6513C7.74088 11.716 7.8691 11.75 7.99958 11.75C8.13006 11.75 8.25828 11.716 8.37158 11.6513L13.6216 8.65128C13.7365 8.58573 13.8321 8.49093 13.8986 8.3765C13.965 8.26208 14 8.13211 14 7.99978C14 7.86745 13.965 7.73748 13.8986 7.62306C13.8321 7.50864 13.7365 7.41384 13.6216 7.34828L13.4296 7.23828L9.11558 9.70328C8.77568 9.89744 8.39102 9.99956 7.99958 9.99956C7.60814 9.99956 7.22347 9.89744 6.88358 9.70328L2.56958 7.23928Z"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M2.37845 10.5993L2.57045 10.4893L6.88445 12.9533C7.22435 13.1474 7.60901 13.2496 8.00045 13.2496C8.39189 13.2496 8.77656 13.1474 9.11645 12.9533L13.4305 10.4883L13.6225 10.5983C13.7374 10.6638 13.833 10.7586 13.8994 10.8731C13.9659 10.9875 14.0009 11.1175 14.0009 11.2498C14.0009 11.3821 13.9659 11.5121 13.8994 11.6265C13.833 11.7409 13.7374 11.8357 13.6225 11.9013L8.37245 14.9013C8.25915 14.966 8.13093 15 8.00045 15C7.86997 15 7.74175 14.966 7.62845 14.9013L2.37845 11.9013C2.2635 11.8357 2.16795 11.7409 2.10148 11.6265C2.03501 11.5121 2 11.3821 2 11.2498C2 11.1175 2.03501 10.9875 2.10148 10.8731C2.16795 10.7586 2.2635 10.6638 2.37845 10.5983V10.5993Z"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
    ),
    badge: '100% OPEN SOURCE',
    githubUrl: '#',
    title: 'Machine – Build, manage and train your AI Workforce.',
    description:
      'Machine – is a generalist AI Agent that acts on your behalf.',
    inputPlaceholder: 'Ask Machine to...',
  },
  cloudPricingItems: [
    {
      name: 'Basic',
      price: '$0',
      yearlyPrice: '$0',
      originalYearlyPrice: '$0',
      discountPercentage: 0,
      description: 'Perfect for getting started',
      buttonText: 'Select',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '0 hours',
      features: [
        '200 credits/month',
        '1 custom Worker',
        '3 private projects',
        '1 custom trigger',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.FREE_TIER.tierKey,
      upgradePlans: [],
    },
    {
      name: 'Plus',
      price: '$20',
      description: 'Best for individuals and small teams',
      buttonText: 'Get started',
      buttonColor: 'bg-primary text-white dark:text-black',
      isPopular: true,
      hours: '2 hours',
      features: [
        '2,000 credits/m',
        '2,000 credits/m',
        '5 custom agents',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_2_20.tierKey,
      upgradePlans: [],
    },
    {
      name: 'Pro',
      price: '$50',
      description: 'Ideal for growing businesses',
      buttonText: 'Get started',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '6 hours',
      features: [
        '5,000 credits/m',
        '5,000 credits/m',
        '20 custom agents',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_6_50.tierKey,
      upgradePlans: [],
    },
    {
      name: 'Business',
      price: '$100',
      description: 'For established businesses',
      buttonText: 'Get started',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '12 hours',
      features: [
        '10,000 credits/m',
        '10,000 credits/m',
        '20 custom agents',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_12_100.tierKey,
      upgradePlans: [],
      hidden: true,
    },
    {
      name: 'Ultra',
      price: '$200',
      description: 'For power users',
      buttonText: 'Get started',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '25 hours',
      features: [
        '20,000 credits/m',
        '20,000 credits/m',
        '100 custom agents',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
        'Priority Support',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_25_200.tierKey,
      upgradePlans: [],
    },
    {
      name: 'Enterprise',
      price: '$400',
      description: 'For large teams',
      buttonText: 'Get started',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '50 hours',
      features: [
        '40,000 credits/m',
        '40,000 credits/m',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
        'Priority support',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_50_400.tierKey,
      upgradePlans: [],
    },
    {
      name: 'Scale',
      price: '$800',
      description: 'For scaling teams',
      buttonText: 'Get started',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '125 hours',
      features: [
        '80,000 credits/m',
        '80,000 credits/m',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
        'Priority support',
        'Dedicated account manager',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_125_800.tierKey,
      upgradePlans: [],
    },
    {
      name: 'Max',
      price: '$1000',
      description: 'Maximum performance',
      buttonText: 'Get started',
      buttonColor: 'bg-secondary text-white',
      isPopular: false,
      hours: '200 hours',
      features: [
        '100,000 credits/m',
        '100,000 credits/m',
        'Private projects',
        '100+ integrations',
        'Premium AI Models',
        'Priority support',
        'Dedicated account manager',
        'Custom deployment',
      ],
      tierKey: config.SUBSCRIPTION_TIERS.TIER_200_1000.tierKey,
      upgradePlans: [],
    },
  ],
  footerLinks: [
    {
      title: 'Machine',
      links: [
        { id: 1, title: 'About', url: 'https://machine.myapps.ai' },
        { id: 3, title: 'Contact', url: 'mailto:support@mytsi.org' },
        // { id: 4, title: 'Careers', url: 'https://machine.myapps.ai/careers' },
      ],
    },
    // {
    //   title: 'Resources',
    //   links: [
    //     // {
    //     //   id: 5,
    //     //   title: 'Documentation',
    //     //   url: 'https://github.com/Kortix-ai/Suna',
    //     // },
    //     // { id: 7, title: 'Discord', url: 'https://discord.gg/Py6pCBUUPw' },
    //     // { id: 8, title: 'GitHub', url: 'https://github.com/Kortix-ai/Suna' },
    //   ],
    // },
    // {
    //   title: 'Legal',
    //   links: [
    //     // {
    //     //   id: 9,
    //     //   title: 'Privacy Policy',
    //     //   url: 'https://machine.myapps.ai/legal?tab=privacy',
    //     // },
    //     // {
    //     //   id: 10,
    //     //   title: 'Terms of Service',
    //     //   url: 'https://machine.myapps.ai/legal?tab=terms',
    //     // },
    //     // {
    //     //   id: 11,
    //     //   title: 'License Apache 2.0',
    //     //   url: 'https://github.com/Kortix-ai/Suna/blob/main/LICENSE',
    //     // },
    //   ],
    // },
  ],
};

export type SiteConfig = typeof siteConfig;
