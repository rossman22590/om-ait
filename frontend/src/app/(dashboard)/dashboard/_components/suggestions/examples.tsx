'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Bot,
  Briefcase,
  Settings,
  Sparkles,
  Image,
  Code,
  Brain,
  LineChart,
  FileText,
  Laptop,
  Globe,
  Database,
  PieChart,
  Activity,
  Lock,
  Zap,
  ArrowRightLeft,
  Music,
  Video,
  MessageSquare,
  CloudCog,
  BookOpen,
  Truck,
  CreditCard,
  QrCode,
  Mail,
  Search,
  Calendar,
  Users,
  ClipboardCheck,
  Smartphone,
  Server,
  Workflow,
  Gauge,
  FileCog,
  CloudLightning,
  ScrollText,
  Puzzle,
  Table,
  FilePieChart,
  PenTool,
  Edit3,
  BarChart,
  Microscope,
  Newspaper,
  ScrollText as Report,
  BookText,
} from 'lucide-react';

type PromptExample = {
  title: string;
  query: string;
  icon: React.ReactNode;
};

const prompts: PromptExample[] = [
  {
    title: 'Market research dashboard',
    query: 'Create a comprehensive market research dashboard analyzing industry trends, customer segments, and competitive landscape. Include data visualization and actionable recommendations.',
    icon: <BarChart3 className="text-green-700 dark:text-green-400" size={16} />,
  },
  {
    title: 'Recommendation engine development',
    query: 'Develop a recommendation engine for personalized product suggestions. Include collaborative filtering, content-based filtering, and hybrid approaches with evaluation metrics.',
    icon: <Bot className="text-blue-700 dark:text-blue-400" size={16} />,
  },
  {
    title: 'Go-to-market strategy',
    query: 'Develop a comprehensive go-to-market strategy for a new product. Include market sizing, customer acquisition channels, pricing strategy, and launch timeline.',
    icon: <Briefcase className="text-rose-700 dark:text-rose-400" size={16} />,
  },
  {
    title: 'Data pipeline automation',
    query: 'Create an automated data pipeline for ETL processes. Include data validation, error handling, monitoring, and scalable architecture design.',
    icon: <Settings className="text-purple-700 dark:text-purple-400" size={16} />,
  },
  {
    title: 'AI image generation',
    query: 'Generate a series of realistic landscape images showing different seasons in a mountain range. Include snowy winter, colorful autumn, lush summer, and blooming spring scenes.',
    icon: <Image className="text-amber-700 dark:text-amber-400" size={16} />,
  },
  {
    title: 'Web app development',
    query: 'Build a React web application for team task management with user authentication, real-time updates, and a clean, responsive interface. Include documentation for deployment.',
    icon: <Code className="text-indigo-700 dark:text-indigo-400" size={16} />,
  },
  {
    title: 'Machine learning model',
    query: 'Create a machine learning model to predict customer churn based on historical data. Include data preprocessing, feature selection, model training, and evaluation metrics.',
    icon: <Brain className="text-teal-700 dark:text-teal-400" size={16} />,
  },
  {
    title: 'Sales forecast analysis',
    query: 'Analyze historical sales data and create a forecast model for the next 12 months. Include seasonal trends, growth factors, and visualization of predictions with confidence intervals.',
    icon: <LineChart className="text-cyan-700 dark:text-cyan-400" size={16} />,
  },
  {
    title: 'Technical documentation',
    query: 'Create comprehensive technical documentation for a REST API including endpoints, authentication methods, request/response formats, and error handling.',
    icon: <FileText className="text-orange-700 dark:text-orange-400" size={16} />,
  },
  {
    title: 'Mobile app prototype',
    query: 'Design a mobile app prototype for a fitness tracking application with workout planning, progress tracking, and social sharing features.',
    icon: <Laptop className="text-emerald-700 dark:text-emerald-400" size={16} />,
  },
  {
    title: 'SEO optimization strategy',
    query: 'Develop an SEO optimization strategy for an e-commerce website to improve organic search rankings, including keyword research, on-page optimization, and content strategy.',
    icon: <Globe className="text-sky-700 dark:text-sky-400" size={16} />,
  },
  {
    title: 'Database schema design',
    query: 'Design a normalized database schema for an inventory management system with products, suppliers, warehouses, and transaction tracking capabilities.',
    icon: <Database className="text-violet-700 dark:text-violet-400" size={16} />,
  },
  {
    title: 'Customer analytics dashboard',
    query: 'Create a customer analytics dashboard with cohort analysis, customer lifetime value, retention metrics, and segmentation capabilities.',
    icon: <PieChart className="text-pink-700 dark:text-pink-400" size={16} />,
  },
  {
    title: 'System performance optimization',
    query: 'Analyze and optimize the performance of a web application, addressing database queries, frontend rendering, caching strategies, and server response times.',
    icon: <Activity className="text-red-700 dark:text-red-400" size={16} />,
  },
  {
    title: 'Security audit checklist',
    query: 'Create a comprehensive security audit checklist for a web application, covering authentication, authorization, data protection, API security, and infrastructure vulnerabilities.',
    icon: <Lock className="text-gray-700 dark:text-gray-400" size={16} />,
  },
  {
    title: 'Serverless architecture',
    query: 'Design a serverless architecture for a high-traffic e-commerce application using AWS Lambda, API Gateway, DynamoDB, and other cloud services.',
    icon: <Zap className="text-yellow-700 dark:text-yellow-400" size={16} />,
  },
  {
    title: 'API integration plan',
    query: 'Create an API integration plan for connecting a CRM system with marketing automation tools, payment processors, and analytics platforms.',
    icon: <ArrowRightLeft className="text-fuchsia-700 dark:text-fuchsia-400" size={16} />,
  },
  {
    title: 'Music recommendation algorithm',
    query: 'Design a music recommendation algorithm that incorporates user listening history, song features, genre preferences, and trending patterns.',
    icon: <Music className="text-lime-700 dark:text-lime-400" size={16} />,
  },
  {
    title: 'Video streaming architecture',
    query: 'Develop an architecture for a scalable video streaming platform with content delivery, adaptive bitrate streaming, and user engagement analytics.',
    icon: <Video className="text-blue-800 dark:text-blue-300" size={16} />,
  },
  {
    title: 'Chatbot development',
    query: 'Create a customer service chatbot with natural language understanding, intent recognition, contextual responses, and human handoff capabilities.',
    icon: <MessageSquare className="text-green-800 dark:text-green-300" size={16} />,
  },
  {
    title: 'Cloud migration strategy',
    query: 'Develop a step-by-step cloud migration strategy for moving a legacy on-premises application to a cloud environment with minimal downtime.',
    icon: <CloudCog className="text-purple-800 dark:text-purple-300" size={16} />,
  },
  {
    title: 'Learning management system',
    query: 'Design a learning management system with course creation, student progress tracking, assessment tools, and interactive content delivery.',
    icon: <BookOpen className="text-amber-800 dark:text-amber-300" size={16} />,
  },
  {
    title: 'Supply chain optimization',
    query: 'Analyze and optimize a manufacturing supply chain to reduce costs, improve delivery times, and enhance inventory management using data analytics.',
    icon: <Truck className="text-indigo-800 dark:text-indigo-300" size={16} />,
  },
  {
    title: 'Payment gateway integration',
    query: 'Implement a secure payment gateway integration for an e-commerce website, supporting multiple payment methods, transaction logging, and fraud detection.',
    icon: <CreditCard className="text-emerald-600 dark:text-emerald-400" size={16} />,
  },
  {
    title: 'QR code inventory system',
    query: 'Design an inventory management system using QR codes for tracking products throughout the supply chain with mobile scanning capabilities.',
    icon: <QrCode className="text-blue-600 dark:text-blue-400" size={16} />,
  },
  {
    title: 'Email marketing automation',
    query: 'Create an email marketing automation workflow with segmentation, A/B testing, personalized content, and performance analytics.',
    icon: <Mail className="text-amber-600 dark:text-amber-400" size={16} />,
  },
  {
    title: 'Semantic search implementation',
    query: 'Implement a semantic search feature for a content-rich website using vector embeddings, relevance scoring, and query understanding.',
    icon: <Search className="text-purple-600 dark:text-purple-400" size={16} />,
  },
  {
    title: 'Event scheduling platform',
    query: 'Design an event scheduling platform with calendar integration, automated reminders, resource allocation, and attendee management.',
    icon: <Calendar className="text-red-600 dark:text-red-400" size={16} />,
  },
  {
    title: 'Team collaboration tool',
    query: 'Build a team collaboration tool with real-time document editing, task assignment, progress tracking, and integrated communication channels.',
    icon: <Users className="text-cyan-600 dark:text-cyan-400" size={16} />,
  },
  {
    title: 'Quality assurance workflow',
    query: 'Develop a quality assurance workflow for software testing, including test case management, automated testing, defect tracking, and reporting.',
    icon: <ClipboardCheck className="text-green-600 dark:text-green-400" size={16} />,
  },
  {
    title: 'Progressive web app conversion',
    query: 'Convert an existing website into a progressive web app with offline capabilities, push notifications, home screen installation, and improved performance.',
    icon: <Smartphone className="text-violet-600 dark:text-violet-400" size={16} />,
  },
  {
    title: 'Python REST API with FastAPI',
    query: 'Create a RESTful API using Python FastAPI with authentication, rate limiting, Swagger documentation, and database integration using SQLAlchemy.',
    icon: <Server className="text-green-500 dark:text-green-300" size={16} />,
  },
  {
    title: 'Python data processing pipeline',
    query: 'Build a data processing pipeline in Python using Pandas and NumPy to clean, transform, and analyze large datasets with visualization using Matplotlib.',
    icon: <Workflow className="text-blue-500 dark:text-blue-300" size={16} />,
  },
  {
    title: 'Flask web application',
    query: 'Develop a Flask web application with user authentication, database integration, form validation, and responsive templates using Jinja2 and Bootstrap.',
    icon: <Globe className="text-indigo-500 dark:text-indigo-300" size={16} />,
  },
  {
    title: 'Python performance optimization',
    query: 'Optimize the performance of a Python application by identifying bottlenecks, implementing caching, parallel processing, and memory management techniques.',
    icon: <Gauge className="text-red-500 dark:text-red-300" size={16} />,
  },
  {
    title: 'Python API client library',
    query: 'Create a Python client library for a REST API with request handling, response parsing, error handling, rate limiting, and comprehensive documentation.',
    icon: <FileCog className="text-amber-500 dark:text-amber-300" size={16} />,
  },
  {
    title: 'Serverless Python functions',
    query: 'Develop serverless Python functions for AWS Lambda to process events, integrate with other AWS services, and handle API Gateway requests efficiently.',
    icon: <CloudLightning className="text-purple-500 dark:text-purple-300" size={16} />,
  },
  {
    title: 'GraphQL API with Python',
    query: 'Implement a GraphQL API using Python with Graphene, including schema definition, resolvers, authentication, and integration with a database.',
    icon: <ScrollText className="text-teal-500 dark:text-teal-300" size={16} />,
  },
  {
    title: 'Python microservices architecture',
    query: 'Design a microservices architecture using Python with service discovery, API gateways, message queues, and containerization using Docker and Kubernetes.',
    icon: <Puzzle className="text-cyan-500 dark:text-cyan-300" size={16} />,
  },
  {
    title: 'Content marketing strategy',
    query: 'Develop a comprehensive content marketing strategy with audience analysis, content calendar, distribution channels, and performance metrics for a B2B SaaS company.',
    icon: <PenTool className="text-pink-500 dark:text-pink-300" size={16} />,
  },
  {
    title: 'Research literature review',
    query: 'Conduct a comprehensive literature review on machine learning applications in healthcare, summarizing key findings, methodologies, and identifying research gaps.',
    icon: <Microscope className="text-indigo-500 dark:text-indigo-300" size={16} />,
  },
  {
    title: 'Exploratory data analysis',
    query: 'Perform exploratory data analysis on a customer purchase dataset to identify patterns, outliers, and correlations. Include visualizations and insights for business decision-making.',
    icon: <FilePieChart className="text-yellow-500 dark:text-yellow-300" size={16} />,
  },
  {
    title: 'Content generation for blog',
    query: 'Generate a series of engaging blog articles on artificial intelligence for a technical audience. Include practical examples, code snippets, and visuals where relevant.',
    icon: <Edit3 className="text-blue-500 dark:text-blue-300" size={16} />,
  },
  {
    title: 'Market trend analysis',
    query: 'Analyze current market trends in renewable energy sector, focusing on technological innovations, investment patterns, and regulatory changes across major global markets.',
    icon: <BarChart className="text-green-500 dark:text-green-300" size={16} />,
  },
  {
    title: 'Competitive analysis report',
    query: 'Create a detailed competitive analysis report for a fintech startup, comparing features, pricing, market positioning, and strengths/weaknesses of top 5 competitors.',
    icon: <Report className="text-red-500 dark:text-red-300" size={16} />,
  },
  {
    title: 'Educational course outline',
    query: 'Design a comprehensive 12-week course outline for teaching data science to beginners, including learning objectives, weekly topics, assignments, and projects.',
    icon: <BookText className="text-teal-500 dark:text-teal-300" size={16} />,
  },
];

export const Examples = ({
  onSelectPrompt,
}: {
  onSelectPrompt?: (query: string) => void;
}) => {
  // Select 4 random examples from the prompts array
  const [randomPrompts, setRandomPrompts] = React.useState<PromptExample[]>([]);
  
  React.useEffect(() => {
    // Function to get 4 random examples
    const getRandomPrompts = () => {
      const shuffled = [...prompts].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
    };
    
    setRandomPrompts(getRandomPrompts());
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {randomPrompts.map((prompt, index) => (
          <Card
            key={index}
            className="group cursor-pointer h-full shadow-none transition-all bg-sidebar hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
            onClick={() => onSelectPrompt && onSelectPrompt(prompt.query)}
          >
            <CardHeader className="px-4">
                <div className="flex items-center gap-2">
                    {prompt.icon}
                </div>
                <CardTitle className="font-normal group-hover:text-foreground transition-all text-muted-foreground text-sm line-clamp-3">
                    {prompt.title}
                </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};