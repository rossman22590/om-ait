'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Navbar } from '@/components/home/sections/navbar';
import { FooterSection } from '@/components/home/sections/footer-section';
import LaserFlow from '@/components/ui/LaserFlow';
import MagicBento from '@/components/ui/MagicBento';
import { 
  Search, 
  Globe, 
  Code, 
  Database, 
  FileText, 
  Cog, 
  Zap, 
  Terminal, 
  Cloud, 
  Lock,
  Rocket,
  Brain,
  MessageSquare,
  Image,
  Calendar,
  Mail,
  Github,
  Clock,
  CheckCircle,
  Sparkles,
  Workflow,
  Box,
  FileCode,
  Bug,
  Settings,
  ExternalLink
} from 'lucide-react';

interface SubTool {
  name: string;
  description: string;
}

interface Tool {
  name: string;
  description: string;
  longDescription: string;
  category: string;
  icon: any;
  features: string[];
  subTools: SubTool[];
  useCases: string[];
  color: string;
}

const tools: Tool[] = [
  {
    name: 'Web Search',
    description: 'Search the internet for information, news, and research',
    longDescription: 'Perform web searches using Tavily API with advanced filtering and content extraction. Access real-time information from across the web.',
    category: 'Research',
    icon: Search,
    features: ['Real-time search', 'Content extraction', 'News filtering', 'Domain filtering'],
    subTools: [
      { name: 'Tavily Search', description: 'AI-powered web search with source citations' },
      { name: 'Web Scraping', description: 'Extract content from any webpage using Firecrawl' },
      { name: 'News Search', description: 'Filter specifically for recent news articles' },
      { name: 'Domain Search', description: 'Search within specific domains' },
    ],
    useCases: ['Research', 'News monitoring', 'Content discovery', 'Fact checking'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Terminal & Commands',
    description: 'Run commands, install packages, and execute scripts in your workspace',
    longDescription: 'Full terminal access with session management, process control, and comprehensive command execution in isolated Daytona sandboxes.',
    category: 'Development',
    icon: Terminal,
    features: ['Command execution', 'Package installation', 'Process management', 'Session persistence'],
    subTools: [
      { name: 'Shell Executor', description: 'Execute bash commands and scripts' },
      { name: 'Package Manager', description: 'Install npm, pip, and other packages' },
      { name: 'Process Control', description: 'Start, stop, and monitor processes' },
      { name: 'Session Manager', description: 'Maintain state between commands' },
    ],
    useCases: ['Development workflows', 'Automation scripts', 'Package installation', 'System administration'],
    color: 'from-gray-700 to-gray-900',
  },
  {
    name: 'Files & Folders',
    description: 'Create, edit, read, and organize files in your workspace',
    longDescription: 'Complete file system operations in Daytona sandboxes. Create, edit, search, and organize files with advanced editing capabilities and version control.',
    category: 'Development',
    icon: FileText,
    features: ['File creation', 'Smart editing', 'Search & replace', 'Directory operations'],
    subTools: [
      { name: 'File Editor', description: 'Create and edit files with context-aware modifications' },
      { name: 'File Reader', description: 'Read file contents with line range support' },
      { name: 'Search Tool', description: 'Search files using grep and ripgrep' },
      { name: 'Directory Manager', description: 'List, create, and organize folders' },
    ],
    useCases: ['Code development', 'File management', 'Content editing', 'Project organization'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Web Browser',
    description: 'Browse websites, click buttons, fill forms, and extract information from web pages',
    longDescription: 'Automated browser interaction using Stagehand API. Navigate, extract content, fill forms, and interact with any website programmatically.',
    category: 'Automation',
    icon: Globe,
    features: ['Page navigation', 'Element interaction', 'Content extraction', 'Form filling'],
    subTools: [
      { name: 'Page Navigator', description: 'Navigate to URLs and manage browser sessions' },
      { name: 'Element Interactor', description: 'Click, type, and interact with page elements' },
      { name: 'Data Extractor', description: 'Extract structured data from web pages' },
      { name: 'Form Filler', description: 'Automatically fill and submit forms' },
    ],
    useCases: ['Web scraping', 'Form automation', 'Data extraction', 'Testing workflows'],
    color: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Image Editor',
    description: 'Generate and edit images with AI assistance',
    longDescription: 'Create and modify images using OpenAI GPT Image generation. Generate new images from descriptions or edit existing ones.',
    category: 'Creative',
    icon: Image,
    features: ['Image generation', 'AI editing', 'Style control', 'High resolution'],
    subTools: [
      { name: 'Image Generator', description: 'Generate images from text descriptions' },
      { name: 'Image Editor', description: 'Edit existing images with AI guidance' },
      { name: 'Style Transfer', description: 'Apply different artistic styles' },
      { name: 'Resolution Control', description: 'Generate images at various sizes' },
    ],
    useCases: ['Content creation', 'Visual design', 'Marketing materials', 'Concept art'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Port Exposure',
    description: 'Share your local development servers with preview URLs',
    longDescription: 'Expose sandbox ports to the internet with public preview URLs. Perfect for sharing development servers, APIs, and web applications.',
    category: 'Development',
    icon: ExternalLink,
    features: ['Port forwarding', 'Public URLs', 'Instant access', 'Secure sharing'],
    subTools: [
      { name: 'Port Exposer', description: 'Expose any port to the internet' },
      { name: 'URL Generator', description: 'Get shareable preview URLs' },
      { name: 'Port Manager', description: 'Manage multiple exposed ports' },
      { name: 'Access Control', description: 'Control who can access your ports' },
    ],
    useCases: ['Development previews', 'API sharing', 'Testing webhooks', 'Demos'],
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Chat & Messages',
    description: 'Talk with users, ask questions, and share updates about your work',
    longDescription: 'Natural conversation interface for agent-user communication. Ask questions, provide updates, and maintain context across conversations.',
    category: 'Communication',
    icon: MessageSquare,
    features: ['Natural chat', 'Question asking', 'Context awareness', 'Rich responses'],
    subTools: [
      { name: 'Ask Question', description: 'Ask users for clarification or input' },
      { name: 'Send Message', description: 'Send updates and information' },
      { name: 'Context Manager', description: 'Maintain conversation context' },
      { name: 'Rich Formatting', description: 'Format messages with markdown' },
    ],
    useCases: ['User interaction', 'Clarification requests', 'Progress updates', 'Collaboration'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Image Search',
    description: 'Find images on the internet for any topic or subject',
    longDescription: 'Search for images using Serper API. Find high-quality images for any topic with advanced filtering and search capabilities.',
    category: 'Research',
    icon: Image,
    features: ['Image search', 'Quality filtering', 'Source diversity', 'Fast results'],
    subTools: [
      { name: 'Serper Search', description: 'Search images using Serper API' },
      { name: 'Quality Filter', description: 'Filter by image quality and size' },
      { name: 'Topic Search', description: 'Find images for specific topics' },
      { name: 'Bulk Search', description: 'Search for multiple images at once' },
    ],
    useCases: ['Content research', 'Visual references', 'Design inspiration', 'Media sourcing'],
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    name: 'People Research',
    description: 'Find and research people with professional background information',
    longDescription: 'Research people using Exa API. Find professional backgrounds, social profiles, and career information.',
    category: 'Research',
    icon: Search,
    features: ['People search', 'Professional profiles', 'Career info', 'Social links'],
    subTools: [
      { name: 'Profile Search', description: 'Find people by name and context' },
      { name: 'Background Research', description: 'Get professional background' },
      { name: 'Social Finder', description: 'Locate social media profiles' },
      { name: 'Career Tracker', description: 'Track career history' },
    ],
    useCases: ['Recruiting', 'Networking', 'Due diligence', 'Research'],
    color: 'from-sky-500 to-blue-500',
  },
  {
    name: 'Company Research',
    description: 'Find and research companies with detailed business information',
    longDescription: 'Research companies using Exa API. Get company information, business details, funding history, and key personnel.',
    category: 'Research',
    icon: Search,
    features: ['Company search', 'Business info', 'Funding data', 'Executive profiles'],
    subTools: [
      { name: 'Company Finder', description: 'Search for companies by name and industry' },
      { name: 'Business Intelligence', description: 'Get detailed business information' },
      { name: 'Funding Tracker', description: 'Track funding rounds and investors' },
      { name: 'Executive Search', description: 'Find key company personnel' },
    ],
    useCases: ['Market research', 'Due diligence', 'Lead generation', 'Competitive analysis'],
    color: 'from-slate-500 to-gray-500',
  },
  {
    name: 'Academic Research',
    description: 'Search and analyze academic papers, authors, and scientific research',
    longDescription: 'Access Semantic Scholar API to search academic papers, analyze research, and track citations. Perfect for literature reviews and research.',
    category: 'Research',
    icon: Search,
    features: ['Paper search', 'Citation tracking', 'Author profiles', 'Research trends'],
    subTools: [
      { name: 'Paper Search', description: 'Search millions of academic papers' },
      { name: 'Citation Analyzer', description: 'Track citations and references' },
      { name: 'Author Finder', description: 'Find researchers and their work' },
      { name: 'Trend Analysis', description: 'Analyze research trends over time' },
    ],
    useCases: ['Literature review', 'Research analysis', 'Citation tracking', 'Academic writing'],
    color: 'from-emerald-500 to-green-500',
  },
  {
    name: 'Knowledge Base',
    description: 'Store and retrieve information from your personal knowledge library',
    longDescription: 'Build and search your personal knowledge base using kb-fusion. Store documents, notes, and information with AI-powered search.',
    category: 'Productivity',
    icon: Brain,
    features: ['Document storage', 'AI search', 'Context retrieval', 'Knowledge management'],
    subTools: [
      { name: 'Document Indexer', description: 'Add documents to your knowledge base' },
      { name: 'Smart Search', description: 'Search with natural language queries' },
      { name: 'Context Retriever', description: 'Get relevant context for your tasks' },
      { name: 'KB Manager', description: 'Manage and organize your knowledge' },
    ],
    useCases: ['Research notes', 'Documentation', 'Personal wiki', 'Context retrieval'],
    color: 'from-yellow-500 to-amber-500',
  },
  {
    name: 'Task Management',
    description: 'Create and track your action plan with organized to-do lists',
    longDescription: 'Organize tasks into sections with status tracking. Create structured action plans and track progress through your projects.',
    category: 'Productivity',
    icon: CheckCircle,
    features: ['Task lists', 'Status tracking', 'Section organization', 'Action planning'],
    subTools: [
      { name: 'Task Creator', description: 'Create tasks with descriptions' },
      { name: 'Status Manager', description: 'Track pending, completed, and cancelled tasks' },
      { name: 'Section Organizer', description: 'Group tasks into logical sections' },
      { name: 'Progress Tracker', description: 'Monitor overall progress' },
    ],
    useCases: ['Project planning', 'Action tracking', 'Workflow organization', 'Goal management'],
    color: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Document Creator',
    description: 'Create and edit professional documents with rich formatting',
    longDescription: 'Create professional documents with rich text formatting, tables, lists, and more. Perfect for reports, proposals, and documentation.',
    category: 'Productivity',
    icon: FileText,
    features: ['Rich formatting', 'Templates', 'Table support', 'Export options'],
    subTools: [
      { name: 'Document Editor', description: 'Create and edit formatted documents' },
      { name: 'Template Library', description: 'Use pre-built document templates' },
      { name: 'Table Builder', description: 'Add tables and structured data' },
      { name: 'Export Manager', description: 'Export to various formats' },
    ],
    useCases: ['Reports', 'Proposals', 'Documentation', 'Letters'],
    color: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Design & Graphics',
    description: 'Generate images and graphics for social media, websites, and more',
    longDescription: 'Create graphics optimized for social media platforms, websites, and marketing. Generate images at perfect sizes for Instagram, Facebook, Twitter, and more.',
    category: 'Creative',
    icon: Image,
    features: ['Social media sizes', 'Custom dimensions', 'AI generation', 'Format optimization'],
    subTools: [
      { name: 'Social Graphics', description: 'Generate images for Instagram, Facebook, Twitter' },
      { name: 'Custom Sizes', description: 'Create graphics at any dimension' },
      { name: 'Template Generator', description: 'Use pre-sized templates' },
      { name: 'Format Optimizer', description: 'Optimize for web and social' },
    ],
    useCases: ['Social media posts', 'Marketing graphics', 'Website images', 'Brand assets'],
    color: 'from-rose-500 to-pink-500',
  },
  {
    name: 'File Upload',
    description: 'Upload files to cloud storage and share them with secure links',
    longDescription: 'Upload files from your sandbox to cloud storage and get shareable URLs. Perfect for sharing outputs, reports, and generated content.',
    category: 'Storage',
    icon: Cloud,
    features: ['Cloud upload', 'Secure links', 'File management', 'Access control'],
    subTools: [
      { name: 'Cloud Uploader', description: 'Upload files to cloud storage' },
      { name: 'Link Generator', description: 'Generate shareable secure URLs' },
      { name: 'File Manager', description: 'Manage uploaded files' },
      { name: 'Access Controller', description: 'Set file permissions' },
    ],
    useCases: ['File sharing', 'Report distribution', 'Asset hosting', 'Backup'],
    color: 'from-teal-500 to-cyan-500',
  },
  {
    name: 'Image Vision',
    description: 'View and analyze images to understand their content',
    longDescription: 'Analyze images with AI vision capabilities. Describe image contents, extract text, identify objects, and understand visual information.',
    category: 'AI',
    icon: Image,
    features: ['Image analysis', 'Object detection', 'Text extraction', 'Content understanding'],
    subTools: [
      { name: 'Image Analyzer', description: 'Get detailed descriptions of images' },
      { name: 'Object Detector', description: 'Identify objects in images' },
      { name: 'OCR Engine', description: 'Extract text from images' },
      { name: 'Visual QA', description: 'Answer questions about images' },
    ],
    useCases: ['Image analysis', 'Content moderation', 'Visual search', 'Accessibility'],
    color: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Presentations',
    description: 'Create and manage stunning presentation slides',
    longDescription: 'Build professional presentations with HTML slides. Create multi-slide decks with custom styling, images, and content.',
    category: 'Productivity',
    icon: FileText,
    features: ['Slide creation', 'Custom styling', 'Rich content', 'Export options'],
    subTools: [
      { name: 'Slide Builder', description: 'Create presentation slides' },
      { name: 'Style Editor', description: 'Customize slide appearance' },
      { name: 'Content Manager', description: 'Add text, images, and media' },
      { name: 'Presentation Exporter', description: 'Export to various formats' },
    ],
    useCases: ['Business presentations', 'Pitch decks', 'Training materials', 'Webinars'],
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Voice Calls',
    description: 'Make and manage voice phone calls with AI agents',
    longDescription: 'Make voice phone calls using Vapi AI. Set up AI phone agents, make outbound calls, and manage voice interactions.',
    category: 'Communication',
    icon: MessageSquare,
    features: ['Voice calls', 'AI agents', 'Call management', 'Conversation tracking'],
    subTools: [
      { name: 'Call Initiator', description: 'Start outbound voice calls' },
      { name: 'Agent Creator', description: 'Set up AI phone agents' },
      { name: 'Call Manager', description: 'Track and manage calls' },
      { name: 'Conversation Logger', description: 'Record call transcripts' },
    ],
    useCases: ['Customer support', 'Outreach', 'Surveys', 'Notifications'],
    color: 'from-indigo-500 to-blue-500',
  },
  {
    name: 'Data Providers',
    description: 'Access data from LinkedIn, Yahoo Finance, Amazon, Zillow, and Twitter',
    longDescription: 'Connect to multiple data providers to fetch information from LinkedIn profiles, stock prices, Amazon products, real estate data, and Twitter/X posts.',
    category: 'Data',
    icon: Database,
    features: ['LinkedIn data', 'Stock prices', 'Product data', 'Real estate', 'Social media'],
    subTools: [
      { name: 'LinkedIn Provider', description: 'Get LinkedIn profile and company data' },
      { name: 'Yahoo Finance', description: 'Fetch stock prices and financial data' },
      { name: 'Amazon Provider', description: 'Get product information and pricing' },
      { name: 'Zillow Provider', description: 'Access real estate listings and data' },
      { name: 'Twitter Provider', description: 'Fetch tweets and social media data' },
    ],
    useCases: ['Market research', 'Lead generation', 'Price monitoring', 'Social listening'],
    color: 'from-lime-500 to-green-500',
  },
  {
    name: 'Agent Builder',
    description: 'Create and configure new AI agents with custom capabilities',
    longDescription: 'Build custom AI agents with specific roles, tools, and capabilities. Create specialized agents for different tasks and workflows.',
    category: 'Automation',
    icon: Settings,
    features: ['Agent creation', 'Tool selection', 'Custom instructions', 'Role configuration'],
    subTools: [
      { name: 'Agent Creator', description: 'Create new AI agents with custom settings' },
      { name: 'Tool Configurator', description: 'Select and configure tools for agents' },
      { name: 'Role Designer', description: 'Define agent roles and behaviors' },
      { name: 'Agent Manager', description: 'Manage and update existing agents' },
    ],
    useCases: ['Workflow automation', 'Specialized assistants', 'Team collaboration', 'Task delegation'],
    color: 'from-purple-500 to-indigo-500',
  },
  {
    name: 'Avatar Videos',
    description: 'Generate AI avatar videos with custom scripts and voiceovers',
    longDescription: 'Create professional AI avatar videos using Argil AI. Generate videos with realistic avatars, custom scripts, and voice synthesis for marketing, training, and content creation.',
    category: 'Creative',
    icon: Image,
    features: ['AI avatars', 'Voice synthesis', 'Script generation', 'Video export'],
    subTools: [
      { name: 'Avatar Library', description: 'Browse and select from available AI avatars' },
      { name: 'Video Generator', description: 'Create videos with custom scripts' },
      { name: 'Voice Synthesizer', description: 'Generate natural-sounding voiceovers' },
      { name: 'Video Exporter', description: 'Export and download generated videos' },
    ],
    useCases: ['Marketing videos', 'Training content', 'Product demos', 'Social media content'],
    color: 'from-pink-500 to-purple-500',
  },
];

interface ExamplePrompt {
  title: string;
  prompt: string;
}

function getExamples(tool: Tool): ExamplePrompt[] {
  switch (tool.name) {
    case 'Web Search':
      return [
        { title: 'News summary', prompt: 'Find the latest news about AI safety this week and summarize 5 key points with links.' },
        { title: 'Page extraction', prompt: 'Scrape https://example.com/pricing and extract the pricing tiers as a table.' },
      ];
    case 'Code Execution':
      return [
        { title: 'Python calc', prompt: 'Write a Python script to parse data.csv and compute average, median, and top 5 rows by score.' },
        { title: 'JS transform', prompt: 'Use Node to read input.json and output a normalized JSON array of users.' },
      ];
    case 'Database Query':
      return [
        { title: 'Top orders', prompt: 'Run SQL to list top 10 orders by revenue in the last 30 days with customer name.' },
        { title: 'Schema check', prompt: 'Inspect the database and report any tables without primary keys.' },
      ];
    case 'Document Analysis':
      return [
        { title: 'PDF tables', prompt: 'Extract all tables from contract.pdf and return CSV for each table.' },
        { title: 'OCR', prompt: 'Perform OCR on receipt.png and return merchant, date, and total as JSON.' },
      ];
    case 'API Integration':
      return [
        { title: 'REST call', prompt: 'Call the Stripe API to list the last 20 charges and format them as a table.' },
        { title: 'GraphQL', prompt: 'Query the GitHub GraphQL API for open PRs in repo owner/repo with author and labels.' },
      ];
    case 'Terminal Access':
      return [
        { title: 'Disk usage', prompt: 'Show the top 10 largest folders under /var/www with human-readable sizes.' },
        { title: 'Process snapshot', prompt: 'List the top CPU and memory processes and suggest candidates to restart.' },
      ];
    case 'Cloud Storage':
      return [
        { title: 'S3 upload', prompt: 'Upload report.pdf to s3://my-bucket/reports/ and return a signed URL valid for 24h.' },
        { title: 'Folder sync', prompt: 'Sync ./dist to the cloud storage folder app-assets/dist keeping timestamps.' },
      ];
    case 'Credential Management':
      return [
        { title: 'Store secret', prompt: 'Save OPENAI_API_KEY securely and make it available only to the admin role.' },
        { title: 'Rotate key', prompt: 'Rotate the Github PAT credential and update dependent workflows.' },
      ];
    case 'AI Models':
      return [
        { title: 'Rewrite', prompt: 'Rewrite this paragraph in a friendly, concise tone and keep under 120 words.' },
        { title: 'Route models', prompt: 'Summarize the attached doc; if >3 pages use a cheaper model, else use the best quality model.' },
      ];
    case 'Image Generation':
      return [
        { title: 'Hero image', prompt: 'Generate a 1600x900 hero image in a modern gradient style for a fintech landing page.' },
        { title: 'Edit/variations', prompt: 'Upscale and slightly sharpen logo.png; produce 3 background variations.' },
      ];
    case 'Scheduling':
      return [
        { title: 'Cron job', prompt: 'Create a cron job to fetch analytics daily at 06:00 UTC and email a summary.' },
        { title: 'Reminder', prompt: 'Schedule a weekly reminder every Monday 9am local time with a checklist.' },
      ];
    case 'Email':
      return [
        { title: 'Send email', prompt: 'Draft and send a follow-up email to sales@company.com about the proposal, CC my team.' },
        { title: 'Parse inbox', prompt: 'Read unread emails from label Invoices and extract vendor, amount, and due date.' },
      ];
    case 'GitHub Integration':
      return [
        { title: 'PR automation', prompt: 'Open a PR from feature/auth to main with title and checklist, then assign reviewers.' },
        { title: 'Triage issues', prompt: 'Label open issues with bug or enhancement and close duplicates.' },
      ];
    case 'Workflow Builder':
      return [
        { title: 'ETL flow', prompt: 'Build a workflow: fetch CSV → transform to JSON → upload to S3 → notify via email.' },
        { title: 'Error handling', prompt: 'Create a multi-step flow with retries and a fallback branch on failures.' },
      ];
    case 'MCP Tools':
      return [
        { title: 'Discover tools', prompt: 'Discover available MCP servers and list tools for pipedream:gmail.' },
        { title: 'Use MCP', prompt: 'Connect to pipedream:gmail and send an email to me with subject and body.' },
      ];
    default:
      return [
        { title: 'Quick start', prompt: `Show three practical examples of how to use the ${tool.name} tool.` },
        { title: 'Best practices', prompt: `List best practices and common pitfalls when using ${tool.name}.` },
      ];
  }
}

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <>
      <Navbar />
      
      <div className="relative">
        {/* LaserFlow Background Layer */}
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '500px',
            zIndex: 1,
            overflow: 'visible',
            backgroundColor: '#060010'
          }}
        >
          <LaserFlow
            horizontalBeamOffset={0.2}
            verticalBeamOffset={-0.50}
            color="#FF79C6"
          />
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          {/* Hero Section */}
          <div style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">{tools.length}+ Powerful Tools</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                <span className="text-white">
                  Machine Tools
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
                Everything your AI agents need to accomplish any task. From web search to code execution, 
                we've got you covered.
              </p>
            </div>
          </div>

          {/* Tools Grid with MagicBento */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 bg-gradient-to-br from-background via-background to-muted/20">
            <MagicBento
              textAutoHide={false}
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              spotlightRadius={300}
              particleCount={12}
              glowColor="255, 121, 198"
              cards={filteredTools.map((tool, index) => {
                const Icon = tool.icon;
                return {
                  title: tool.name,
                  description: tool.description,
                  label: tool.category,
                  icon: (
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} shadow-lg inline-flex`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  ),
                  onClick: () => setSelectedTool(tool)
                };
              })}
            />

            {filteredTools.length === 0 && (
              <div className="text-center py-20">
                <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No tools found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Detail Modal */}
      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTool && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${selectedTool.color} shadow-lg`}>
                    {(() => {
                      const Icon = selectedTool.icon;
                      return <Icon className="h-8 w-8 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-3xl">{selectedTool.name}</DialogTitle>
                    <Badge variant="secondary" className="mt-2">
                      {selectedTool.category}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-lg leading-relaxed">
                  {selectedTool.longDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Features */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTool.features.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant="outline" 
                        className="px-3 py-1"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sub Tools */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Available Sub-Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTool.subTools.map((subTool) => (
                      <div 
                        key={subTool.name}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {subTool.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {subTool.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Common Use Cases</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTool.useCases.map((useCase) => (
                      <div 
                        key={useCase}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                      >
                        <Rocket className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example Prompts */}
                <div>
                  <h3 className="text-xl font-semibold mb-3">Example Prompts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getExamples(selectedTool).map((ex) => (
                      <div key={ex.title} className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          {ex.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{ex.prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4 border-t">
                  <div className="flex gap-3">
                    <Link 
                      href="/auth"
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all text-center"
                    >
                      Start Using {selectedTool.name}
                    </Link>
                    <button 
                      onClick={() => setSelectedTool(null)}
                      className="px-6 py-3 bg-muted rounded-lg font-medium hover:bg-muted/80 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <div className="border-t bg-muted/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to build with Machine?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start creating powerful AI agents that can use any of these tools to accomplish your tasks.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/auth"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl inline-block"
            >
              Get Started Free
            </Link>
            <Link 
              href="https://support.myapps.ai/machine/the-machine"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-background border-2 rounded-lg font-medium hover:bg-muted transition-all hover:scale-105 inline-block"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>

      <FooterSection />
    </>
  );
}
