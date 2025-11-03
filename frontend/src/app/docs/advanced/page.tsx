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
  { title: 'Advanced' }
];

export default function AdvancedPage() {
  return (
    <>
      <DocsHeader
        title="Advanced Strategies"
        subtitle="Scale your automation, optimize costs, and maximize business impact"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Overview</h2>
        <p className="text-lg mb-6">
          Advanced strategies for scaling your automation, managing multiple agents, and maximizing business impact.
        </p>

        <h2 id="subscription-plans">Understanding Subscription Plans</h2>
        <p className="mb-6 text-lg">
          Machine offers flexible plans for every need—from free testing to enterprise-scale automation. Pick monthly or annual billing (save up to 17% with yearly plans).
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-2">💡 How Credits Work:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">Each plan includes monthly credits to power your agents. When you exceed your monthly allocation, you can purchase additional credits as needed. Unused credits roll over to the next month (up to 3 months).</p>
        </div>

        <h3 id="plan-free">💚 Free Tier</h3>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-sm">$0/month</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Perfect for getting started</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">$2.00</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">starting credits</p>
            </div>
          </div>
          <ul className="text-sm space-y-2 ml-4">
            <li>✓ Up to 5 agents maximum</li>
            <li>✓ Basic tools access</li>
            <li>✓ 1,000 runs per month</li>
            <li>✓ Community support</li>
          </ul>
        </div>

        <h3 id="plan-pro">💙 Pro Tier ($99/month)</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-sm">$99/month</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">For scaling teams</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">50 Agents</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">max deployment</p>
            </div>
          </div>
          <ul className="text-sm space-y-2 ml-4">
            <li>✓ Up to 50 agents</li>
            <li>✓ All tools and integrations</li>
            <li>✓ 100,000 runs per month</li>
            <li>✓ Priority support</li>
            <li>✓ Custom integrations</li>
            <li className="font-medium text-blue-600 dark:text-blue-400">🔥 Best for growing teams</li>
          </ul>
        </div>

        <h3 id="plan-enterprise">💜 Enterprise (Custom)</h3>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-sm">Custom Pricing</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">For large-scale deployments</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">Unlimited</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">everything</p>
            </div>
          </div>
          <ul className="text-sm space-y-2 ml-4">
            <li>✓ Unlimited agents</li>
            <li>✓ Custom features & configurations</li>
            <li>✓ Unlimited runs</li>
            <li>✓ 24/7 dedicated support</li>
            <li>✓ SLA guarantees</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs">📞 Contact us for custom pricing and dedicated account management</p>
          </div>
        </div>

        <h2 id="scaling-agents">Scaling Agent Deployment</h2>
        <p className="mb-4">
          As your automation needs grow, here's how to scale effectively:
        </p>

        <h3 id="multi-agent-coordination">Coordinating Multiple Agents</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Workflow Example: Customer Onboarding</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">1</div>
              <div>
                <p className="text-sm font-medium">Welcome Agent</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Sends personalized welcome email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">2</div>
              <div>
                <p className="text-sm font-medium">Setup Agent</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Creates account and sends setup instructions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">3</div>
              <div>
                <p className="text-sm font-medium">Training Agent</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Sends training materials and resources</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">4</div>
              <div>
                <p className="text-sm font-medium">Follow-up Agent</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Checks in after 7 days with support</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Tip: Each agent runs when the previous one completes, creating a seamless customer journey</p>
          </div>
        </div>

        <h2 id="business-workflows">Advanced Business Workflows</h2>

        <h3 id="workflow-conditional">Conditional Processing</h3>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Example: Lead Scoring & Routing</p>
          <p className="text-sm mb-3">Your agent analyzes incoming leads and routes them based on criteria:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>If</strong> budget &gt; $100,000 &gt; Route to Enterprise Team</li>
            <li><strong>If</strong> budget $10K-$100K &gt; Route to Mid-Market Team</li>
            <li><strong>If</strong> budget &lt; $10K &gt; Send automated nurture sequence</li>
            <li><strong>If</strong> urgent issue flagged &gt; Escalate immediately</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">Result: 60% automation of lead routing, faster response times, better lead quality</p>
          </div>
        </div>

        <h3 id="workflow-scheduled">Scheduled Automation Chains</h3>
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Example: End-of-Week Operations</p>
          <p className="text-sm mb-3">Set up agents to run in sequence every Friday at 5 PM:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li>5:00 PM - <strong>Sales Agent:</strong> Generates weekly sales report</li>
            <li>5:15 PM - <strong>HR Agent:</strong> Compiles team activity summary</li>
            <li>5:30 PM - <strong>Analysis Agent:</strong> Combines reports and identifies trends</li>
            <li>5:45 PM - <strong>Distribution Agent:</strong> Sends combined report to executives</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">Result: Automated executive reporting, consistent format, saves 6+ hours of manual work weekly</p>
          </div>
        </div>

        <h2 id="cost-optimization">Optimizing Costs</h2>

        <h3 id="cost-monitoring">Monitor Your Spending</h3>
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Key Metrics to Track:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Cost per Agent:</strong> Which agents are most expensive?</li>
            <li><strong>Cost per Run:</strong> Is your agent becoming cheaper as it improves?</li>
            <li><strong>Value Generated:</strong> How much time/money does each agent save?</li>
            <li><strong>ROI Calculation:</strong> (Time Saved × Hourly Rate) - (Agent Cost)</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
            <p className="text-xs"><strong>Example Calculation:</strong></p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Weekly Report Agent saves 5 hours = $125 (@ $25/hr) for only $2.50 in credits = 50x ROI!</p>
          </div>
        </div>

        <h3 id="cost-reduction">Reducing Costs</h3>
        <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Strategies:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li>✅ <strong>Batch Processing:</strong> Run agents on 50 items at once instead of individually</li>
            <li>✅ <strong>Smarter Instructions:</strong> Clear, focused instructions = faster execution</li>
            <li>✅ <strong>Reduce Tool Usage:</strong> Only enable tools your agent actually needs</li>
            <li>✅ <strong>Cache Results:</strong> Reuse results from similar queries</li>
            <li>✅ <strong>Off-peak Scheduling:</strong> Run heavy workloads during off-peak hours</li>
          </ul>
        </div>

        <h2 id="team-collaboration">Team Collaboration</h2>

        <h3 id="team-sharing">Sharing Agents Across Teams</h3>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Best Practices:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Name Clearly:</strong> Use descriptive names like "Q4-SalesReport-v2" (shows purpose and version)</li>
            <li><strong>Document:</strong> Write clear descriptions of what each agent does</li>
            <li><strong>Version Control:</strong> Keep previous versions for rollback if needed</li>
            <li><strong>Test Before Sharing:</strong> Ensure agents work reliably before team uses it</li>
            <li><strong>Share Instructions:</strong> Provide context on how to use the agent</li>
          </ul>
        </div>

        <h3 id="team-governance">Agent Governance</h3>
        <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Managing Multiple Users:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>Access Control:</strong> Who can view/edit which agents</li>
            <li><strong>Approval Process:</strong> New agents require review before production</li>
            <li><strong>Documentation:</strong> Maintain library of agents and their purposes</li>
            <li><strong>Regular Reviews:</strong> Audit agents quarterly to remove unused ones</li>
            <li><strong>Change Log:</strong> Track modifications to production agents</li>
          </ul>
        </div>

        <h2 id="integration-patterns">Integration Patterns</h2>

        <h3 id="pattern-slack">Slack-Driven Workflows</h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Your Team's Workflow:</p>
          <ol className="text-sm space-y-2 ml-4 list-decimal">
            <li>Team member types <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">/analyze sales</code> in Slack</li>
            <li>Machine agent triggers automatically</li>
            <li>Agent analyzes sales data</li>
            <li>Results posted back in Slack thread</li>
            <li>Team discusses findings in same channel</li>
          </ol>

          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">💡 Benefit: Automation happens in your existing communication tool</p>
          </div>
        </div>

        <h3 id="pattern-scheduled">Email-Triggered Events</h3>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <p className="font-medium mb-3">Automation Trigger Examples:</p>
          <ul className="text-sm space-y-2 ml-4">
            <li><strong>When email arrives with:</strong> Invoice attached → Parse and file in accounting system</li>
            <li><strong>When email contains:</strong> Urgent keywords → Alert manager immediately</li>
            <li><strong>When email is from:</strong> Customer support alias → Route to support queue</li>
            <li><strong>When email arrives daily at:</strong> 9 AM → Generate daily briefing</li>
          </ul>
        </div>

        <h2 id="success-metrics">Measuring Success</h2>

        <h3 id="metrics-business">Business Metrics</h3>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">⏱️ Time Saved</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Hours freed up per week/month</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">💰 Cost Savings</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Hours × hourly rate</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">✅ Accuracy</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Error reduction vs manual process</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">🚀 Speed</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">How much faster now vs before</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">📈 Volume</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Items processed per day/month</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">😊 Satisfaction</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Team/customer satisfaction scores</p>
            </div>
          </div>
        </div>

        <h2 id="avoiding-common-mistakes">Common Mistakes to Avoid</h2>
        <div className="space-y-3 mb-6">
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm font-medium mb-1">❌ Vague Instructions</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Agent doesn't know what to do → produces poor results</p>
          </div>
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm font-medium mb-1">❌ Enabling Unused Tools</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Makes agent slower and more expensive</p>
          </div>
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm font-medium mb-1">❌ No Error Handling</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Agent fails silently instead of retrying or alerting</p>
          </div>
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm font-medium mb-1">❌ Not Testing Edge Cases</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Works fine on normal data but breaks on unusual inputs</p>
          </div>
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm font-medium mb-1">❌ Ignoring Costs</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Agent is expensive and ROI becomes negative</p>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <Link href="/docs/features">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">← Back to Features & Tools</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Explore all available agent tools</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
