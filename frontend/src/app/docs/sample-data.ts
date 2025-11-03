import { 
  BookOpen, 
  Rocket, 
  Settings, 
  Code, 
  Zap, 
  FileText,
  Users,
  Shield,
  Database,
  Layers,
  Palette,
  MessageSquare,
  Image,
  Table,
  Map
} from 'lucide-react';

import type { DocsNavigationSection } from '@/components/ui/docs-sidebar';
import type { DocsTableColumn } from '@/components/ui/docs-index';

export const sampleNavigation: DocsNavigationSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        id: 'introduction',
        title: 'What is Machine?',
        href: '/docs/introduction',
        icon: BookOpen,
        isActive: true
      },
      {
        id: 'quick-start',
        title: 'Getting Started',
        href: '/docs/getting-started',
        icon: Rocket,
        badge: 'Recommended'
      }
    ]
  },
  {
    id: 'building',
    title: 'Building Agents',
    items: [
      {
        id: 'building-agents',
        title: 'Building Agents',
        href: '/docs/building-agents',
        icon: Code
      },
      {
        id: 'features',
        title: 'Features & Tools',
        href: '/docs/features',
        icon: Zap
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced',
    items: [
      {
        id: 'advanced',
        title: 'Advanced Topics',
        href: '/docs/advanced',
        icon: Settings
      }
    ]
  },
  {
    id: 'self-hosting',
    title: 'Self-Hosting Guide',
    items: [
      {
        id: 'overview',
        title: 'Overview',
        href: '/docs/self-hosting',
        icon: Layers
      },
      {
        id: 'contributing',
        title: 'Contributing',
        href: '/docs/contributing',
        icon: MessageSquare
      },
      {
        id: 'architecture',
        title: 'Architecture',
        href: '/docs/architecture',
        icon: Database
      }
    ]
  }
];

export const sampleBreadcrumbs = [
  { title: 'Documentation', onClick: () => console.log('Navigate to docs') },
  { title: 'Kortix Platform Guide' }
];

export const kortixFeatures = [
  {
    title: 'Browser Automation',
    description: 'Navigate websites, extract data, fill forms, automate web workflows',
    icon: Code
  },
  {
    title: 'File Management',
    description: 'Create, edit, and organize documents, spreadsheets, presentations, code',
    icon: FileText
  },
  {
    title: 'Web Intelligence',
    description: 'Crawling, search capabilities, data extraction and synthesis',
    icon: Zap
  },
  {
    title: 'System Operations',
    description: 'Command-line execution, system administration, DevOps tasks',
    icon: Settings
  },
  {
    title: 'API Integrations',
    description: 'Connect with external services and automate cross-platform workflows',
    icon: Database
  },
  {
    title: 'Agent Builder',
    description: 'Visual tools to configure, customize, and deploy agents',
    icon: Palette
  }
];

export const sampleTableData = [
  {
    component: 'Button',
    status: 'Stable',
    version: '1.0.0',
    description: 'Interactive button component with variants'
  },
  {
    component: 'Card',
    status: 'Stable',
    version: '1.2.0',
    description: 'Container component for grouping content'
  },
  {
    component: 'Modal',
    status: 'Beta',
    version: '0.9.0',
    description: 'Overlay component for focused interactions'
  },
  {
    component: 'Table',
    status: 'Stable',
    version: '1.1.0',
    description: 'Data display component with sorting'
  }
];

export const sampleTableColumns: DocsTableColumn[] = [
  {
    key: 'component',
    title: 'Component',
    width: '200px'
  },
  {
    key: 'status',
    title: 'Status',
    width: '120px'
  },
  {
    key: 'version',
    title: 'Version',
    width: '100px',
    align: 'center'
  },
  {
    key: 'description',
    title: 'Description'
  }
]; 