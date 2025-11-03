'use client';

import * as React from 'react';
import { DocsHeader, DocsBody } from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Use Cases' }
];

export default function UseCasesPage() {
  return (
    <>
      <DocsHeader
        title="Real-World Use Cases"
        subtitle="See how Machine is being used to automate workflows and save time"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Real-World Machine Applications</h2>
        <p className="text-lg mb-6">
          Discover how teams across industries are using Machine to automate workflows, reduce costs, and improve efficiency.
        </p>

        <h2 id="business-operations">Business Operations & Administration</h2>

        <h3 id="use-case-reporting">Automated Weekly Report Generation</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">📊 The Scenario</p>
          <p className="text-sm mb-4">Your team manually creates weekly reports from various data sources every Friday morning, taking 2-3 hours.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Deploy an agent that:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Runs every Friday at 6 AM automatically</li>
            <li>• Collects data from Google Sheets, sales system, and analytics</li>
            <li>• Analyzes metrics and identifies trends</li>
            <li>• Generates a formatted report</li>
            <li>• Sends it via email to stakeholders</li>
            <li>• Saves a copy to Google Drive</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm"><strong>Result:</strong> 10 hours saved per week, consistent formatting, zero manual work</p>
          </div>
        </div>

        <h3 id="use-case-expense">Expense Report Processing</h3>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">💰 The Scenario</p>
          <p className="text-sm mb-4">Expense reports arrive in various formats and need categorization, verification, and approval routing.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Create an agent that:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Receives expense report emails/PDFs</li>
            <li>• Extracts line items and amounts using vision tool</li>
            <li>• Categorizes expenses (travel, meals, supplies, etc.)</li>
            <li>• Flags expenses exceeding policy limits</li>
            <li>• Routes to appropriate manager for approval</li>
            <li>• Sends confirmation emails to employees</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-sm"><strong>Result:</strong> 80% faster processing, reduced errors, consistent policy application</p>
          </div>
        </div>

        <h2 id="customer-support">Customer Support & Service</h2>

        <h3 id="use-case-support-triage">Smart Support Ticket Triage</h3>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">🎫 The Scenario</p>
          <p className="text-sm mb-4">Support tickets arrive in a flood, and routing them to the right team takes time. Many simple questions are answered slowly.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Deploy an agent that:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Reads incoming support tickets</li>
            <li>• Analyzes the problem and categorizes (billing, technical, feature request, etc.)</li>
            <li>• Rates urgency (critical, high, medium, low)</li>
            <li>• Checks knowledge base for common solutions</li>
            <li>• Responds to simple questions immediately</li>
            <li>• Routes complex issues to appropriate specialist</li>
            <li>• Creates tags and assigns priority</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-sm"><strong>Result:</strong> 50% reduction in average response time, 70% of issues resolved automatically</p>
          </div>
        </div>

        <h3 id="use-case-feedback">Customer Feedback Analysis</h3>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">💬 The Scenario</p>
          <p className="text-sm mb-4">Analyzing hundreds of customer reviews, surveys, and feedback manually is tedious and error-prone.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Use Machine to:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Collect feedback from all channels (surveys, reviews, emails)</li>
            <li>• Extract sentiment (positive, neutral, negative)</li>
            <li>• Identify common themes and pain points</li>
            <li>• Suggest product improvements</li>
            <li>• Generate weekly summary reports</li>
            <li>• Alert on critical feedback immediately</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
            <p className="text-sm"><strong>Result:</strong> Actionable insights in minutes, identify issues before they become widespread</p>
          </div>
        </div>

        <h2 id="sales-marketing">Sales & Marketing Automation</h2>

        <h3 id="use-case-lead-qualification">Lead Qualification & Routing</h3>
        <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">🎯 The Scenario</p>
          <p className="text-sm mb-4">Leads come in through various channels but qualifying and routing them is manual and slow.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Automate with an agent that:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Receives lead information (form, email, LinkedIn message)</li>
            <li>• Qualifies based on company size, budget, use case</li>
            <li>• Researches company background</li>
            <li>• Checks deal stage and potential value</li>
            <li>• Routes to appropriate sales rep</li>
            <li>• Updates CRM automatically</li>
            <li>• Sends personalized follow-up email</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-pink-200 dark:border-pink-800">
            <p className="text-sm"><strong>Result:</strong> Sales reps focus on qualified leads, 90% of routing is automated</p>
          </div>
        </div>

        <h3 id="use-case-content">Automated Content Distribution</h3>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">📝 The Scenario</p>
          <p className="text-sm mb-4">New content needs to be formatted and posted to multiple social media platforms and email lists.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Deploy an agent for:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Receiving blog posts or content</li>
            <li>• Creating platform-specific versions (Twitter, LinkedIn, Email)</li>
            <li>• Optimizing for each platform</li>
            <li>• Scheduling posts at optimal times</li>
            <li>• Monitoring engagement and responses</li>
              <li>• Generating weekly performance report</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
            <p className="text-sm"><strong>Result:</strong> Content reaches all channels instantly, no manual formatting</p>
          </div>
        </div>

        <h2 id="hr-recruiting">HR & Recruiting</h2>

        <h3 id="use-case-recruiting">Resume Screening & Interview Scheduling</h3>
        <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">👥 The Scenario</p>
          <p className="text-sm mb-4">Your recruiting team receives 100+ resumes weekly and manually filters and schedules interviews.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Use Machine to:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Extract information from resumes (skills, experience, education)</li>
            <li>• Score candidates against job requirements</li>
            <li>• Check for red flags or concerns</li>
            <li>• Send personalized rejection emails</li>
            <li>• Automatically schedule interviews for qualified candidates</li>
            <li>• Send interview prep materials</li>
            <li>• Create summary for hiring manager</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-cyan-200 dark:border-cyan-800">
            <p className="text-sm"><strong>Result:</strong> 95% of screening automated, team focuses only on top candidates</p>
          </div>
        </div>

        <h2 id="data-analytics">Data & Analytics</h2>

        <h3 id="use-case-competitor">Competitor Intelligence</h3>
        <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">🔍 The Scenario</p>
          <p className="text-sm mb-4">Staying on top of competitor changes and market trends requires constant manual research.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Deploy an agent that:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Monitors competitor websites and news daily</li>
            <li>• Extracts pricing, features, and announcements</li>
            <li>• Compares with your product</li>
            <li>• Identifies threats and opportunities</li>
            <li>• Generates weekly competitive analysis</li>
            <li>• Alerts on major changes</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-teal-200 dark:border-teal-800">
            <p className="text-sm"><strong>Result:</strong> Always know what competitors are doing, faster market response</p>
          </div>
        </div>

        <h2 id="operations">Operations & Maintenance</h2>

        <h3 id="use-case-monitoring">Website Monitoring & Alerts</h3>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">🌐 The Scenario</p>
          <p className="text-sm mb-4">Need to monitor website uptime, check for broken links, and verify key functionality.</p>
          
          <p className="font-medium mb-3">🤖 The Machine Solution</p>
          <p className="text-sm mb-4">Use an agent to:</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Check website status every 5 minutes</li>
            <li>• Test critical user flows</li>
            <li>• Verify API endpoints</li>
            <li>• Check for security issues</li>
            <li>• Send alerts to ops team on failures</li>
            <li>• Create incident reports</li>
            <li>• Generate uptime reports</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-800">
            <p className="text-sm"><strong>Result:</strong> Catch issues before users do, 99.9% uptime monitoring</p>
          </div>
        </div>

        <h2 id="getting-started-use-cases">Getting Started with Your Use Case</h2>
        <p className="mb-4">
          See a use case that matches your needs? Here's how to get started:
        </p>
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</div>
            <div>
              <p className="font-medium text-sm">Define Your Process</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Write down the exact steps your agent needs to take</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</div>
            <div>
              <p className="font-medium text-sm">Choose Your Tools</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Select which tools your agent needs</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</div>
            <div>
              <p className="font-medium text-sm">Create & Test</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Build your agent and test with real data</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">4</div>
            <div>
              <p className="font-medium text-sm">Deploy & Monitor</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Go live and watch it save you time</p>
            </div>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <Link href="/docs/user-guide">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">← Back to User Guide</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn all user features in detail</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
