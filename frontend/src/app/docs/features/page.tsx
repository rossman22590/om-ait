'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Features & Tools' }
];

export default function FeaturesPage() {
  return (
    <>
      <DocsHeader
        title="Features & Tools"
        subtitle="Explore all available capabilities in Machine"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Overview</h2>
        <p className="text-lg mb-6">
          Machine provides a comprehensive toolkit for building AI agents. Each tool can be enabled or disabled based on your agent's needs.
        </p>

        <h2 id="web-search">🌐 Web Search</h2>
        <p className="mb-4">
          Search the internet for real-time information and research across multiple sources.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Research market trends and competitors</li>
            <li>• Find current information and news</li>
            <li>• Gather data for reports and analysis</li>
            <li>• Verify facts and check sources</li>
          </ul>
        </div>

        <h2 id="file-handler">📁 File Handler</h2>
        <p className="mb-4">
          Read, write, and process files in various formats (PDF, CSV, JSON, TXT, etc.)
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Process spreadsheets and CSV files</li>
            <li>• Extract data from PDFs</li>
            <li>• Generate and format reports</li>
            <li>• Parse and transform data</li>
          </ul>
        </div>

        <h2 id="browser-automation">🌍 Browser Automation</h2>
        <p className="mb-4">
          Automate browser interactions, web scraping, and form filling.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Scrape data from websites</li>
            <li>• Fill out forms automatically</li>
            <li>• Monitor website changes</li>
            <li>• Automate login and navigation</li>
          </ul>
        </div>

        <h2 id="data-analysis">📊 Data Analysis</h2>
        <p className="mb-4">
          Perform calculations, statistical analysis, and data transformations.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Analyze trends and patterns</li>
            <li>• Create visualizations and charts</li>
            <li>• Perform statistical calculations</li>
            <li>• Generate insights from data</li>
          </ul>
        </div>

        <h2 id="email">✉️ Email Integration</h2>
        <p className="mb-4">
          Send and receive emails, manage mailing lists, and handle email workflows.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Send automated notifications</li>
            <li>• Process incoming emails</li>
            <li>• Create email campaigns</li>
            <li>• Handle customer inquiries</li>
          </ul>
        </div>

        <h2 id="scheduling">⏰ Scheduling</h2>
        <p className="mb-4">
          Run agents on a schedule or trigger them based on events.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Daily reports and digests</li>
            <li>• Periodic data synchronization</li>
            <li>• Regular maintenance tasks</li>
            <li>• Event-triggered workflows</li>
          </ul>
        </div>

        <h2 id="vision">👁️ Vision & Image Processing</h2>
        <p className="mb-4">
          Analyze images, extract text, and process visual data.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Extract text from images (OCR)</li>
            <li>• Analyze visual content</li>
            <li>• Process documents and screenshots</li>
            <li>• Identify objects and patterns</li>
          </ul>
        </div>

        <h2 id="knowledge-base">📚 Knowledge Base</h2>
        <p className="mb-4">
          Create and manage custom knowledge bases for your agents to reference.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Store company policies and procedures</li>
            <li>• Maintain FAQs and documentation</li>
            <li>• Reference training materials</li>
            <li>• Access historical data and records</li>
          </ul>
        </div>

        <h2 id="api-integration">🔌 API Integration</h2>
        <p className="mb-4">
          Connect to external APIs and services to extend functionality.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Integrate with business tools (Slack, Teams, etc.)</li>
            <li>• Connect to CRM and database systems</li>
            <li>• Call custom webhooks and services</li>
            <li>• Sync data across platforms</li>
          </ul>
        </div>

        <h2 id="monitoring">📊 Monitoring & Logging</h2>
        <p className="mb-4">
          Track agent performance, debug issues, and monitor execution in real-time.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Features:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Real-time execution logs</li>
            <li>• Performance metrics and analytics</li>
            <li>• Error tracking and alerts</li>
            <li>• Usage statistics and reports</li>
          </ul>
        </div>

        <h2 id="choosing-tools">Choosing the Right Tools</h2>
        <p className="mb-4">
          Not every agent needs every tool. Choose based on your agent's purpose:
        </p>
        <div className="space-y-3 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">Research Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Web Search + Data Analysis + File Handler</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">Support Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email + Knowledge Base + API Integration</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">Data Processing Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">File Handler + Data Analysis + Scheduling</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">Automation Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Browser Automation + Scheduling + API Integration</p>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link href="/docs/building-agents" className="flex-1">
          <Card className="p-4 group rounded-xl hover:shadow-md transition-all h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Building Agents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Learn agent configuration</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Card>
        </Link>
        <Link href="/docs/advanced" className="flex-1">
          <Card className="p-4 group rounded-xl hover:shadow-md transition-all h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Advanced</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">API and custom workflows</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Card>
        </Link>
      </div>
    </>
  );
}
