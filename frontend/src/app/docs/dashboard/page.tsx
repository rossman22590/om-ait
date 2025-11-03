'use client';

import * as React from 'react';
import { DocsHeader, DocsBody } from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Dashboard' }
];

export default function DashboardPage() {
  return (
    <>
      <DocsHeader
        title="Dashboard Guide"
        subtitle="Understand and master every feature in your Machine dashboard"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Dashboard Overview</h2>
        <p className="text-lg mb-6">
          The Machine dashboard is your command center. This guide walks you through every section and shows you how to get the most from each feature.
        </p>

        <h2 id="main-navigation">Main Navigation</h2>
        <p className="mb-4">
          The left sidebar contains all main navigation sections. Here's what each does:
        </p>

        <h3 id="nav-dashboard">Dashboard</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What it is:</p>
          <p className="text-sm mb-4">The home page showing your account overview and quick stats.</p>
          
          <p className="font-medium mb-3">Key cards you'll see:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Credit Balance:</strong> Your remaining credits. Shows in dollars (e.g., $3.11)</li>
            <li><strong>Active Agents:</strong> Number of agents currently deployed</li>
            <li><strong>Recent Runs:</strong> Quick access to your last executed agents</li>
            <li><strong>Usage This Month:</strong> Total credits consumed so far</li>
            <li><strong>Quick Start Actions:</strong> Buttons to create new agent or browse templates</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Check your dashboard first thing in the morning to see overnight agent runs</p>
          </div>
        </div>

        <h3 id="nav-agents">Agents</h3>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What it is:</p>
          <p className="text-sm mb-4">Complete list of all your agents. This is where you create, edit, test, and manage agents.</p>
          
          <p className="font-medium mb-3">What you can do:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Create New:</strong> Click "New Agent" to start building</li>
            <li><strong>Search/Filter:</strong> Find agents by name or status</li>
            <li><strong>View Status:</strong> See if each agent is active/inactive</li>
            <li><strong>Recent Activity:</strong> See last run time and result</li>
            <li><strong>Edit:</strong> Click any agent to open editor</li>
            <li><strong>Delete:</strong> Remove agents you no longer need</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Sort by "Last Run" to focus on your most active agents</p>
          </div>
        </div>

        <h3 id="nav-threads">Threads</h3>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What it is:</p>
          <p className="text-sm mb-4">Conversation history with your agents. Each thread is a separate conversation session.</p>
          
          <p className="font-medium mb-3">What you can do:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>View Results:</strong> See agent responses and outputs</li>
            <li><strong>Check Cost:</strong> See how many credits each run used</li>
            <li><strong>View Details:</strong> Inspect agent reasoning and steps taken</li>
            <li><strong>Continue Conversation:</strong> Ask follow-up questions</li>
            <li><strong>Export Results:</strong> Download agent output as file</li>
            <li><strong>Delete Thread:</strong> Remove old conversations</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Each thread shows the cost in the header - good for understanding agent expenses</p>
          </div>
        </div>

        <h3 id="nav-integrations">Integrations</h3>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What it is:</p>
          <p className="text-sm mb-4">Connect external services like Slack, Discord, webhooks, and APIs.</p>
          
          <p className="font-medium mb-3">What you can do:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Connect Slack:</strong> Trigger agents from Slack commands</li>
            <li><strong>Connect Discord:</strong> Get agent results in Discord</li>
            <li><strong>Setup Webhooks:</strong> Integrate with your own tools</li>
            <li><strong>API Keys:</strong> Generate keys for external access</li>
            <li><strong>Test Connection:</strong> Verify integrations are working</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: You can trigger the same agent from multiple channels (web, Slack, API, etc.)</p>
          </div>
        </div>

        <h3 id="nav-billing">Billing & Credits</h3>
        <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What it is:</p>
          <p className="text-sm mb-4">Manage your subscription, view usage, and purchase credits.</p>
          
          <p className="font-medium mb-3">What you can do:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>View Plan:</strong> See your current subscription level</li>
            <li><strong>Buy Credits:</strong> Purchase additional credits if needed</li>
            <li><strong>View Usage:</strong> Detailed breakdown of credit usage</li>
            <li><strong>Invoices:</strong> Download past invoices</li>
            <li><strong>Upgrade:</strong> Change to a higher plan</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-pink-200 dark:border-pink-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Credits are shown in cents internally but displayed as dollars in the UI (e.g., 311 cents = $3.11)</p>
          </div>
        </div>

        <h3 id="nav-settings">Settings</h3>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What it is:</p>
          <p className="text-sm mb-4">Account preferences and configuration options.</p>
          
          <p className="font-medium mb-3">What you can do:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Profile:</strong> Update name, email, profile picture</li>
            <li><strong>Preferences:</strong> Theme (light/dark), notifications</li>
            <li><strong>API Keys:</strong> Manage authentication tokens</li>
            <li><strong>Security:</strong> Password, two-factor authentication</li>
            <li><strong>Team:</strong> Invite users and manage permissions</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Keep your API keys secret and rotate them regularly</p>
          </div>
        </div>

        <h2 id="agent-editor">Agent Editor Walkthrough</h2>
        <p className="mb-4">
          When you create or edit an agent, you'll see the main editor interface. Here's what each section does:
        </p>

        <h3 id="editor-basics">Basic Information</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Fields you'll fill:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Agent Name:</strong> Something descriptive like "Weekly Report Generator" or "Support Ticket Classifier"</li>
            <li><strong>Description:</strong> What this agent does in 1-2 sentences</li>
            <li><strong>Icon/Avatar:</strong> Visual identifier (helps you recognize it in lists)</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Good naming example: "Email→Slack Notifier" (shows input → output)</p>
          </div>
        </div>

        <h3 id="editor-instructions">Instructions (Most Important!)</h3>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What goes here:</p>
          <p className="text-sm mb-4">Tell the agent exactly what to do. This is the "brain" of your agent.</p>
          
          <p className="font-medium mb-3">Good instructions include:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li>✓ The overall goal</li>
            <li>✓ Step-by-step process</li>
            <li>✓ How to handle different scenarios</li>
            <li>✓ Any constraints or rules</li>
            <li>✓ Output format you want</li>
          </ul>

          <p className="font-medium mt-4 mb-3">Example:</p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs font-mono space-y-1">
            <p>You are a support ticket classifier.</p>
            <p>When given a ticket, you must:</p>
            <p>1. Identify the category (Bug, Feature Request, Billing, etc)</p>
            <p>2. Rate urgency (Low, Medium, High, Critical)</p>
            <p>3. Suggest a response template</p>
            <p>4. Return as JSON with keys: category, urgency, template</p>
          </div>

          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Be specific! "Classify tickets" is vague. Show examples and expected output.</p>
          </div>
        </div>

        <h3 id="editor-tools">Tools Selection</h3>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">What this section is:</p>
          <p className="text-sm mb-4">Choose which tools your agent can use. Your agent will intelligently use these as needed.</p>
          
          <p className="font-medium mb-3">Available tools include:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>🔍 <strong>Web Search:</strong> Search the internet for information</li>
            <li>📁 <strong>File Handler:</strong> Read/write/analyze files</li>
            <li>🌐 <strong>Browser:</strong> Visit websites and extract data</li>
            <li>📊 <strong>Data Analysis:</strong> Process and analyze data</li>
            <li>📧 <strong>Email:</strong> Send emails</li>
            <li>⏰ <strong>Scheduling:</strong> Schedule tasks for future</li>
            <li>👁️ <strong>Vision:</strong> Analyze images</li>
            <li>💾 <strong>Knowledge Base:</strong> Search your documents</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Only enable tools you actually need - it speeds up agent execution</p>
          </div>
        </div>

        <h3 id="editor-config">Configuration Options</h3>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Settings to fine-tune:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Model:</strong> Choice of AI models (faster vs more powerful)</li>
            <li><strong>Temperature:</strong> Creativity level (0=consistent, 1=creative)</li>
            <li><strong>Max Tokens:</strong> Length of response</li>
            <li><strong>Timeout:</strong> How long to wait before giving up</li>
            <li><strong>Retry Logic:</strong> How many times to retry if it fails</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: For consistent outputs, use low temperature (0.2-0.4). For creative outputs, use high (0.7-1.0)</p>
          </div>
        </div>

        <h2 id="running-agents">Running and Testing Agents</h2>

        <h3 id="run-test">Test Run (In Editor)</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">How to use it:</p>
          <ol className="text-sm space-y-2 ml-4 list-decimal">
            <li>Click the "Test" button in the agent editor</li>
            <li>Enter your test input/prompt</li>
            <li>Click "Run"</li>
            <li>Watch the agent work (you'll see step-by-step reasoning)</li>
            <li>See the final result and cost</li>
          </ol>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Always test with realistic inputs before deploying. Test edge cases too!</p>
          </div>
        </div>

        <h3 id="run-production">Run Agent (From Dashboard)</h3>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">How to use it:</p>
          <ol className="text-sm space-y-2 ml-4 list-decimal">
            <li>Go to Agents list</li>
            <li>Find your agent and click it</li>
            <li>Click "Run" button</li>
            <li>Provide your input</li>
            <li>Agent executes and creates a thread</li>
            <li>View results in the thread</li>
          </ol>

          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Production runs are charged. Test mode is free (up to your trial limit)</p>
          </div>
        </div>

        <h3 id="run-schedule">Scheduled Runs</h3>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">How to schedule agents:</p>
          <ol className="text-sm space-y-2 ml-4 list-decimal">
            <li>In agent settings, find "Schedule" section</li>
            <li>Select frequency (daily, weekly, monthly)</li>
            <li>Pick time and timezone</li>
            <li>Provide input (or let it use static input)</li>
            <li>Click "Enable Schedule"</li>
            <li>Agent will run automatically at set time</li>
          </ol>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Scheduled runs happen at the exact time you set. Check your threads to see results.</p>
          </div>
        </div>

        <h2 id="monitoring">Monitoring & Analytics</h2>

        <h3 id="monitor-usage">Usage Statistics</h3>
        <p className="mb-4">
          In your dashboard, you can see:
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Total Runs:</strong> How many times each agent has been executed</li>
            <li><strong>Total Cost:</strong> How many credits each agent has consumed</li>
            <li><strong>Success Rate:</strong> Percentage of successful runs</li>
            <li><strong>Avg Duration:</strong> How long each run takes on average</li>
            <li><strong>Last Run:</strong> When the agent was last used</li>
          </ul>
        </div>

        <h3 id="monitor-logs">Viewing Logs</h3>
        <p className="mb-4">
          Click on any agent run to see:
        </p>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Agent Reasoning:</strong> How it decided what to do</li>
            <li><strong>Tool Calls:</strong> Which tools it used and when</li>
            <li><strong>Results:</strong> Output from each tool</li>
            <li><strong>Final Output:</strong> Agent's conclusion</li>
            <li><strong>Errors:</strong> Any problems encountered</li>
            <li><strong>Tokens Used:</strong> Technical detail about processing</li>
          </ul>
        </div>

        <h2 id="troubleshooting-dashboard">Common Dashboard Issues</h2>

        <h3 id="trouble-slow">Dashboard is Slow</h3>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-2">Problem:</p>
          <p className="text-sm mb-3">The dashboard feels sluggish or takes time to load</p>
          
          <p className="font-medium mb-2">Solutions:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Refresh the page (Ctrl+R)</li>
            <li>• Clear browser cache</li>
            <li>• Close unused tabs</li>
            <li>• Check your internet connection</li>
            <li>• Try a different browser</li>
          </ul>
        </div>

        <h3 id="trouble-balance">Balance Not Updating</h3>
        <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-2">Problem:</p>
          <p className="text-sm mb-3">Your credit balance isn't showing recent purchases or usage</p>
          
          <p className="font-medium mb-2">Solutions:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Wait 30 seconds and refresh page</li>
            <li>• Check Billing page for transaction history</li>
            <li>• Sign out and sign back in</li>
            <li>• Contact support if issue persists</li>
          </ul>
        </div>

        <h3 id="trouble-agents">Agents Not Appearing</h3>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-2">Problem:</p>
          <p className="text-sm mb-3">Recently created agents aren't showing in the list</p>
          
          <p className="font-medium mb-2">Solutions:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Refresh the Agents page</li>
            <li>• Clear the search filter if one is active</li>
            <li>• Check if the agent is in archived agents</li>
            <li>• Reload the entire dashboard</li>
          </ul>
        </div>

        <h2 id="keyboard-shortcuts">Keyboard Shortcuts</h2>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Navigation</p>
              <ul className="space-y-1">
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">Ctrl+/</code> - Show all shortcuts</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">G</code> then <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">A</code> - Go to Agents</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">G</code> then <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">D</code> - Go to Dashboard</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Actions</p>
              <ul className="space-y-1">
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">Ctrl+K</code> - Quick search</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">N</code> - New Agent</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">Enter</code> - Run selected agent</li>
              </ul>
            </div>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <Link href="/docs/agent-management">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">← Back to Agent Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to build and manage your agents</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
