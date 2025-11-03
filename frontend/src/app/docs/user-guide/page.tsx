'use client';

import * as React from 'react';
import { DocsHeader, DocsBody } from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'User Guide' }
];

export default function UserGuidePage() {
  return (
    <>
      <DocsHeader
        title="Complete User Guide"
        subtitle="Master Machine: In-depth guide to every feature and capability"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="welcome">Welcome to Machine</h2>
        <p className="text-lg mb-6">
          Machine is your AI-powered workforce platform. This guide will walk you through every aspect of using Machine, from basic setup to advanced automations.
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>🎯 Quick Navigation:</strong> Jump to any section using the sidebar to the left
          </p>
        </div>

        <h2 id="section-1">Section 1: Getting Started with Your Account</h2>

        <h3 id="account-creation">Creating Your Account</h3>
        <p className="mb-4">
          Getting started with Machine is simple:
        </p>
        <ol className="list-decimal pl-6 mb-6 space-y-3">
          <li>
            <strong>Visit Machine.com</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Head to our website and click "Sign Up"</p>
          </li>
          <li>
            <strong>Choose Your Sign-Up Method</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sign up with Google, GitHub, or email</p>
          </li>
          <li>
            <strong>Verify Your Email</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Check your inbox for a verification link</p>
          </li>
          <li>
            <strong>Complete Your Profile</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add your name, company, and use case</p>
          </li>
          <li>
            <strong>Welcome to Machine!</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">You're now ready to create your first agent</p>
          </li>
        </ol>

        <h3 id="account-settings">Account Settings & Profile</h3>
        <p className="mb-4">
          Manage your Machine account from the settings panel:
        </p>
        <div className="space-y-3 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">👤 Profile Information</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Update your name, email, avatar, and bio. Your profile helps organize your workspace.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🔐 Security & Password</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Change your password, enable two-factor authentication, and manage sessions.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🔑 API Keys</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generate and manage API keys for programmatic access to Machine.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📧 Notifications</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Control email alerts for agent runs, errors, and important updates.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💳 Billing & Subscription</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">View your plan, usage, invoices, and payment methods.</p>
          </div>
        </div>

        <h3 id="subscription-plans">Understanding Subscription Plans</h3>
        <p className="mb-4">
          Machine offers flexible plans for every need:
        </p>
        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💚 Free Tier - $0/month</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Up to 5 agents maximum</li>
              <li>• Basic tools access</li>
              <li>• 1,000 runs per month</li>
              <li>• Community support</li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-medium mb-2">💙 Pro Tier - $99/month</p>
            <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <li>• Up to 50 agents</li>
              <li>• All tools and integrations</li>
              <li>• 100,000 runs per month</li>
              <li>• Priority support</li>
              <li>• Custom integrations</li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="font-medium mb-2">💜 Enterprise - Custom Pricing</p>
            <ul className="text-sm text-purple-900 dark:text-purple-100 space-y-1">
              <li>• Unlimited agents</li>
              <li>• Custom features & configurations</li>
              <li>• Unlimited runs</li>
              <li>• 24/7 dedicated support</li>
              <li>• SLA guarantees</li>
            </ul>
          </div>
        </div>

        <h2 id="section-2">Section 2: Your Dashboard Overview</h2>

        <h3 id="dashboard-layout">Dashboard Layout & Navigation</h3>
        <p className="mb-4">
          The Machine dashboard is your command center:
        </p>
        <div className="space-y-3 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📊 Main Dashboard</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">See your agents, recent activity, usage metrics, and quick stats</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🤖 Agents Section</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Create, edit, and manage all your agents in one place</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📈 Analytics</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track agent performance, usage trends, and costs</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">⚙️ Settings</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure your account, integrations, and preferences</p>
          </div>
        </div>

        <h3 id="dashboard-widgets">Dashboard Widgets & Metrics</h3>
        <p className="mb-4">
          Monitor key metrics at a glance:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Active Agents</strong> - Number of deployed agents</li>
          <li><strong>This Month's Runs</strong> - Total agent executions</li>
          <li><strong>Credit Balance</strong> - Available credits for agent runs</li>
          <li><strong>Success Rate</strong> - Percentage of successful runs</li>
          <li><strong>Avg Response Time</strong> - Average agent execution duration</li>
          <li><strong>Usage Breakdown</strong> - Breakdown by tool and agent</li>
        </ul>

        <h2 id="section-3">Section 3: Working with Agents</h2>

        <h3 id="agent-lifecycle">Agent Lifecycle: From Creation to Deployment</h3>
        <p className="mb-4">
          Every agent goes through several stages:
        </p>
        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">1</div>
            <div>
              <p className="font-medium">Create</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name your agent and describe its purpose</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">2</div>
            <div>
              <p className="font-medium">Configure</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select tools and write instructions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">3</div>
            <div>
              <p className="font-medium">Test</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Try with sample inputs to verify behavior</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">4</div>
            <div>
              <p className="font-medium">Deploy</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Make your agent live and ready for use</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">5</div>
            <div>
              <p className="font-medium">Monitor</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track performance and refine as needed</p>
            </div>
          </div>
        </div>

        <h3 id="agent-instructions">Writing Effective Agent Instructions</h3>
        <p className="mb-4">
          Clear instructions are the foundation of agent success. Here's how to write them:
        </p>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="text-sm font-medium mb-3">✅ Detailed Instructions Template</p>
          <div className="text-sm text-green-900 dark:text-green-100 space-y-2 font-mono">
            <p>"You are a [specific role]. Your job is to:</p>
            <p className="ml-4">1. [First task/responsibility]</p>
            <p className="ml-4">2. [Second task/responsibility]</p>
            <p className="ml-4">3. [Third task/responsibility]</p>
            <p></p>
            <p>IMPORTANT RULES:</p>
            <p className="ml-4">• Always [key behavior]</p>
            <p className="ml-4">• Never [prohibited behavior]</p>
            <p className="ml-4">• When [scenario], [action]</p>
            <p></p>
            <p>Format your response as: [specific format]"</p>
          </div>
        </div>

        <h3 id="agent-monitoring">Monitoring Agent Performance</h3>
        <p className="mb-4">
          After deployment, monitor your agents closely:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Execution Logs</strong> - See what your agent did step-by-step</li>
          <li><strong>Success/Failure Rates</strong> - Track reliability</li>
          <li><strong>Error Messages</strong> - Debug issues quickly</li>
          <li><strong>Performance Metrics</strong> - Monitor speed and resource usage</li>
          <li><strong>Cost Tracking</strong> - See exactly what each run costs</li>
        </ul>

        <h2 id="section-4">Section 4: Advanced User Features</h2>

        <h3 id="agent-scheduling">Scheduling Agents to Run Automatically</h3>
        <p className="mb-4">
          Set your agents to run on a schedule:
        </p>
        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">⏰ Cron Expressions</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Use standard cron syntax for precise scheduling</p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 font-mono text-xs">
              <p className="text-gray-800 dark:text-gray-200">0 9 * * MON (Every Monday at 9 AM)</p>
              <p className="text-gray-800 dark:text-gray-200">0 */4 * * * (Every 4 hours)</p>
              <p className="text-gray-800 dark:text-gray-200">0 0 1 * * (First day of month)</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📅 Preset Schedules</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Or choose common schedules like daily, weekly, monthly</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">⏸️ Pause & Resume</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Temporarily disable scheduled runs without deleting the schedule</p>
          </div>
        </div>

        <h3 id="webhooks-events">Using Webhooks for Real-Time Events</h3>
        <p className="mb-4">
          Send agent results to external systems in real-time:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Agent Completed</strong> - Trigger when agent finishes successfully</li>
          <li><strong>Agent Failed</strong> - Send alert if agent encounters an error</li>
          <li><strong>Agent Timeout</strong> - Notify if agent takes too long</li>
          <li><strong>Custom Webhooks</strong> - Post to your own API endpoint</li>
        </ul>

        <h3 id="integrations">Popular Integrations</h3>
        <p className="mb-4">
          Connect Machine to your favorite tools:
        </p>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 p-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm"><strong>Slack</strong> - Send agent results to Slack channels</span>
          </div>
          <div className="flex items-center gap-2 p-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm"><strong>Discord</strong> - Post updates to Discord servers</span>
          </div>
          <div className="flex items-center gap-2 p-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm"><strong>Google Sheets</strong> - Automatically update spreadsheets</span>
          </div>
          <div className="flex items-center gap-2 p-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm"><strong>Email</strong> - Send results via email</span>
          </div>
          <div className="flex items-center gap-2 p-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm"><strong>Zapier</strong> - Integrate with 1000+ apps</span>
          </div>
        </div>

        <h3 id="team-collaboration">Team Collaboration Features</h3>
        <p className="mb-4">
          Work together with your team:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Invite Team Members</strong> - Add teammates to your workspace</li>
          <li><strong>Role-Based Access</strong> - Set permissions: Admin, Editor, Viewer</li>
          <li><strong>Agent Sharing</strong> - Share specific agents with team members</li>
          <li><strong>Activity Logs</strong> - See who made changes and when</li>
          <li><strong>Comments & Notes</strong> - Annotate agents for team documentation</li>
        </ul>

        <h2 id="section-5">Section 5: Troubleshooting & Support</h2>

        <h3 id="common-issues">Common Issues & Solutions</h3>
        <div className="space-y-3 mb-6">
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">❌ Agent Returns Empty Results</p>
            <p className="text-sm text-orange-800 dark:text-orange-200"><strong>Solution:</strong> Check your instructions are specific. Review execution logs to see what the agent is doing. Try with simpler test inputs first.</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">❌ Agent Times Out</p>
            <p className="text-sm text-orange-800 dark:text-orange-200"><strong>Solution:</strong> Break the task into smaller steps. Reduce data size. Enable timeout increase for Pro/Enterprise plans.</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">❌ High Cost Per Run</p>
            <p className="text-sm text-orange-800 dark:text-orange-200"><strong>Solution:</strong> Optimize instructions to be more efficient. Use caching where possible. Batch similar tasks together.</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">❌ Tool Not Working</p>
            <p className="text-sm text-orange-800 dark:text-orange-200"><strong>Solution:</strong> Ensure the tool is enabled in agent settings. Check API keys/permissions. Test the tool independently first.</p>
          </div>
        </div>

        <h3 id="getting-help">Getting Help & Support</h3>
        <p className="mb-6">
          We're here to help! Reach out through any of these channels:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Documentation</strong> - Browse our comprehensive docs</li>
          <li><strong>Community Forum</strong> - Ask questions and share solutions</li>
          <li><strong>Email Support</strong> - support@machine.ai</li>
          <li><strong>Live Chat</strong> - Available for Pro/Enterprise users</li>
          <li><strong>Status Page</strong> - Check system status at status.machine.ai</li>
        </ul>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <Link href="/docs/agent-management">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">Agent Management →</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deep dive into agent creation and management</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
