'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Getting Started' }
];

export default function GettingStartedPage() {
  return (
    <>
      <DocsHeader
        title="Getting Started with Machine"
        subtitle="Start building your first AI agent in minutes"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Overview</h2>
        <p className="text-lg mb-6">
          This guide will walk you through setting up Machine and creating your first agent. Whether you're building a simple automation or a complex multi-step workflow, Machine makes it easy to get started.
        </p>

        <h3 id="requirements">What You'll Need</h3>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>A Machine account (sign up for free)</li>
          <li>Basic understanding of what you want your agent to do</li>
          <li>An API key for any external services (optional)</li>
        </ul>

        <h3 id="step-1">Step 1: Create Your Account</h3>
        <p className="mb-4">
          Head over to Machine and sign up for a free account. You'll get immediate access to the dashboard where you can start building.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Free tier includes:</strong> 5 agents, basic automation tools, web search, file handling, and email support.
          </p>
        </div>

        <h3 id="step-2">Step 2: Navigate to the Dashboard</h3>
        <p className="mb-4">
          Once logged in, you'll see your dashboard. Click the "Create Agent" button to get started.
        </p>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6 font-mono text-sm">
          <div className="text-gray-600 dark:text-gray-400">Dashboard → Create Agent → Configure</div>
        </div>

        <h3 id="step-3">Step 3: Configure Your Agent</h3>
        <p className="mb-4">
          Give your agent a name and description. This helps Machine understand its purpose.
        </p>
        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Example: Support Ticket Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              "This agent monitors our support inbox, categorizes tickets, and responds to common questions."
            </p>
          </div>
        </div>

        <h3 id="step-4">Step 4: Select Tools</h3>
        <p className="mb-4">
          Choose which tools your agent needs. Common tools include:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Web Search</strong> - Research information online</li>
          <li><strong>File Handler</strong> - Read and manage files</li>
          <li><strong>Browser Automation</strong> - Automate web tasks</li>
          <li><strong>Email</strong> - Send and receive emails</li>
          <li><strong>Data Analysis</strong> - Process spreadsheets and data</li>
        </ul>

        <h3 id="step-5">Step 5: Write Instructions</h3>
        <p className="mb-4">
          Give your agent clear instructions about what to do. The more specific you are, the better your agent will perform.
        </p>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6">
          <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
            "You are a customer support agent. Your job is to read support tickets, categorize them by urgency (high, medium, low), and respond to simple questions immediately. For complex issues, escalate to our support team."
          </p>
        </div>

        <h3 id="step-6">Step 6: Test Your Agent</h3>
        <p className="mb-4">
          Use the test panel to try out your agent with sample inputs. This helps you refine the instructions before going live.
        </p>

        <h3 id="step-7">Step 7: Deploy</h3>
        <p className="mb-6">
          Once you're happy with your agent, click "Deploy" to make it live. Your agent is now ready to handle real tasks!
        </p>

        <h3 id="common-patterns">Common Agent Patterns</h3>
        <div className="space-y-3 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📋 Data Processing</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Read files, extract information, and generate reports</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🔍 Research & Analysis</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Search the web, gather information, and summarize findings</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">⚙️ Automation</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automate repetitive tasks like scheduling, notifications, and updates</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💬 Customer Service</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Handle inquiries, route tickets, and provide instant support</p>
          </div>
        </div>

        <h3 id="next-steps">Next Steps</h3>
        <p className="mb-6">
          Now that you've created your first agent, explore these topics to build more powerful automations:
        </p>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link href="/docs/building-agents" className="flex-1">
          <Card className="p-4 group rounded-xl hover:shadow-md transition-all h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Building Agents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Learn advanced agent configuration</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Card>
        </Link>
        <Link href="/docs/features" className="flex-1">
          <Card className="p-4 group rounded-xl hover:shadow-md transition-all h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Features & Tools</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Explore available tools and capabilities</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Card>
        </Link>
      </div>
    </>
  );
}
