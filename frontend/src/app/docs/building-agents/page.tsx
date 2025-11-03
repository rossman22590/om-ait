'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, Code, Settings, Zap } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Building Agents' }
];

export default function BuildingAgentsPage() {
  return (
    <>
      <DocsHeader
        title="Building Advanced Agents"
        subtitle="Create powerful agents with custom logic and integrations"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Overview</h2>
        <p className="text-lg mb-6">
          Machine agents are powered by AI models and can handle complex, multi-step workflows. This guide covers advanced configuration options, custom logic, and best practices for building production-ready agents.
        </p>

        <h2 id="agent-structure">Agent Structure</h2>
        <p className="mb-4">
          Every Machine agent consists of three key components:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Identity</strong> - Name, description, and purpose</li>
          <li><strong>Instructions</strong> - Detailed behavior guidelines and constraints</li>
          <li><strong>Tools</strong> - Capabilities like web search, file handling, and automation</li>
        </ul>

        <h3 id="writing-instructions">Writing Effective Instructions</h3>
        <p className="mb-4">
          Good instructions are the foundation of a successful agent. Here's how to write them:
        </p>

        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <p className="text-sm font-medium mb-3">✅ Good Instructions</p>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p>"You are a data analyst. Your job is to:</p>
            <p className="ml-4">1. Read CSV files when given a file path</p>
            <p className="ml-4">2. Analyze the data for trends and patterns</p>
            <p className="ml-4">3. Create a clear summary with 3-5 key findings</p>
            <p className="ml-4">4. Always check data quality and flag any issues</p>
            <p>Return findings in a structured format."</p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <p className="text-sm font-medium mb-3">❌ Vague Instructions</p>
          <div className="text-sm text-red-700 dark:text-red-300">
            <p>"Analyze the data and tell me what you find."</p>
          </div>
        </div>

        <h3 id="tool-selection">Selecting and Configuring Tools</h3>
        <p className="mb-4">
          Choose tools based on what your agent needs to accomplish. Each tool has specific capabilities:
        </p>

        <div className="space-y-3 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🌐 Web Search</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Search the internet for information</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Best for: Research, market analysis, finding information</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📁 File Handler</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Read and write files</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Best for: Data processing, document handling, log analysis</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🌍 Browser Automation</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Automate browser interactions</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Best for: Web scraping, form filling, automated workflows</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📊 Data Analysis</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Process and analyze structured data</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Best for: Spreadsheets, databases, analytics</p>
          </div>
        </div>

        <h2 id="agent-behavior">Controlling Agent Behavior</h2>

        <h3 id="constraints">Setting Constraints</h3>
        <p className="mb-4">
          Include explicit constraints to prevent unwanted behavior:
        </p>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm">
          <p className="text-gray-800 dark:text-gray-200">
            "IMPORTANT: Never delete files unless explicitly asked. Always ask for confirmation before making irreversible changes. Do not access files outside the designated folder."
          </p>
        </div>

        <h3 id="decision-making">Decision Making</h3>
        <p className="mb-4">
          Help your agent make better decisions with clear rules:
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <p className="text-sm font-medium mb-3">Example: Support Ticket Routing</p>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p>"If the issue is:</p>
            <p className="ml-4">• Billing-related → Route to finance@company.com</p>
            <p className="ml-4">• Technical bug → Route to engineering@company.com</p>
            <p className="ml-4">• General question → Respond immediately</p>
            <p className="ml-4">• Urgent (mentions down/critical) → Escalate to ops team"</p>
          </div>
        </div>

        <h2 id="workflows">Multi-Step Workflows</h2>
        <p className="mb-4">
          Create complex workflows by instructing your agent to break down tasks:
        </p>
        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">1</div>
            <div><p className="text-sm"><strong>Plan</strong> - Break down the task into steps</p></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">2</div>
            <div><p className="text-sm"><strong>Execute</strong> - Perform each step in sequence</p></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">3</div>
            <div><p className="text-sm"><strong>Validate</strong> - Check results and handle errors</p></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">4</div>
            <div><p className="text-sm"><strong>Report</strong> - Summarize findings and results</p></div>
          </div>
        </div>

        <h2 id="testing">Testing Your Agent</h2>
        <p className="mb-6">
          Before deploying, test your agent thoroughly:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Test with typical inputs and edge cases</li>
          <li>Verify error handling works correctly</li>
          <li>Check that all tools are functioning</li>
          <li>Review the agent's reasoning in the debug logs</li>
          <li>Test with various user scenarios</li>
        </ul>

        <h2 id="optimization">Optimization Tips</h2>
        <div className="space-y-3 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm"><strong>📝 Be Specific</strong> - The more specific your instructions, the better the agent performs</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm"><strong>⚡ Keep it Focused</strong> - Agents work best when they have a clear, single purpose</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm"><strong>🔄 Iterate</strong> - Start simple and gradually add complexity as you test</p>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Link href="/docs/features" className="flex-1">
          <Card className="p-4 group rounded-xl hover:shadow-md transition-all h-full cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Features & Tools</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Deep dive into all available tools</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">API integration and custom workflows</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </Card>
        </Link>
      </div>
    </>
  );
}
