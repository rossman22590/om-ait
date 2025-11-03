'use client';

import * as React from 'react';
import { DocsHeader, DocsBody } from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Agent Management' }
];

export default function AgentManagementPage() {
  return (
    <>
      <DocsHeader
        title="Agent Management Guide"
        subtitle="Create, configure, deploy, and manage your AI agents"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="creating-agents">Creating Your First Agent</h2>
        
        <h3 id="step-by-step">Step-by-Step Agent Creation</h3>
        <p className="mb-4">Follow this detailed process to create a new agent:</p>

        <div className="space-y-4 mb-6">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 1: Click "Create Agent"</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">From the dashboard, click the blue "Create Agent" button in the top right</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 2: Name Your Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose a clear, descriptive name (e.g., "Customer Support Bot", "Data Analyzer")</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 3: Write the Description</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Briefly describe what this agent does and its main purpose</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 4: Select Required Tools</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Check the tools your agent needs to function</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 5: Write Detailed Instructions</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">This is crucial - write clear, specific instructions for the agent</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 6: Test Your Agent</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Use the test panel to verify the agent works as expected</p>
          </div>

          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium mb-1">Step 7: Deploy</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Click "Deploy" to make your agent live</p>
          </div>
        </div>

        <h2 id="agent-configuration">Detailed Agent Configuration</h2>

        <h3 id="naming-conventions">Agent Naming Best Practices</h3>
        <p className="mb-4">Use clear, descriptive names that indicate the agent's purpose:</p>
        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium">✅ "Weekly Report Generator"</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Clear what it does and when</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium">✅ "Customer Email Responder"</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Specific use case</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium">❌ "Agent1" or "Test"</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Too vague</p>
            </div>
          </div>
        </div>

        <h3 id="tool-selection-guide">Tool Selection Guide</h3>
        <p className="mb-4">Choose tools based on what your agent needs to accomplish:</p>

        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🌐 Web Search</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Access real-time internet information</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: Research, news, market data, finding information</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📁 File Handler</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Read and write files (CSV, JSON, TXT, PDF, etc.)</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: Processing documents, data, reports, file management</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🌍 Browser Automation</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Control browser, fill forms, navigate websites</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: Web scraping, automation, form filling, clicking elements</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📊 Data Analysis</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Perform calculations, statistics, data transformation</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: Analytics, charts, calculations, data processing</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">✉️ Email</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Send and receive emails, manage mailboxes</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: Sending alerts, processing incoming mail, notifications</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">👁️ Vision/Image Processing</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Analyze images, extract text, OCR</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: Image analysis, OCR, screenshot processing</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">📚 Knowledge Base</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reference custom training data and documents</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: FAQs, policies, company info, documentation</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">🔌 API Integration</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Call external APIs and webhooks</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Use when: CRM, databases, third-party services, custom tools</p>
          </div>
        </div>

        <h3 id="instruction-templates">Instruction Templates for Common Scenarios</h3>
        
        <h4 id="template-support">Support Agent Template</h4>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6 font-mono text-xs overflow-x-auto">
          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
{`You are a customer support agent. Your job is to:
1. Read incoming support tickets
2. Understand the customer's issue
3. Categorize by severity (urgent, high, medium, low)
4. Respond to common questions immediately
5. Escalate complex issues to the support team

RULES:
• Always be polite and professional
• If unsure, ask clarifying questions
• Never promise things you can't guarantee
• Include a ticket ID in your response
• For urgent issues, mark for immediate review

Response format:
- Greeting
- Problem summary
- Solution (if applicable) or escalation note
- Next steps`}
          </div>
        </div>

        <h4 id="template-research">Research Agent Template</h4>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6 font-mono text-xs overflow-x-auto">
          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
{`You are a research analyst. Your job is to:
1. Search for information on the given topic
2. Gather data from multiple sources
3. Verify information accuracy
4. Synthesize findings into a report

SEARCH STRATEGY:
• Look for recent, authoritative sources
• Check multiple perspectives
• Note conflicting information
• Cite all sources

OUTPUT FORMAT:
## [Topic] Research Report

### Executive Summary
[2-3 sentence overview]

### Key Findings
- Finding 1 (source)
- Finding 2 (source)
- Finding 3 (source)

### Conclusion
[Summary and recommendations]

### Sources
[List all sources]`}
          </div>
        </div>

        <h2 id="testing-agents">Testing Your Agents</h2>

        <h3 id="test-best-practices">Testing Best Practices</h3>
        <p className="mb-4">Before deploying, thoroughly test your agent:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Normal Inputs</strong> - Test with typical use cases</li>
          <li><strong>Edge Cases</strong> - Try boundary conditions</li>
          <li><strong>Error Scenarios</strong> - Test with invalid/empty inputs</li>
          <li><strong>Large Data</strong> - Test with maximum file sizes</li>
          <li><strong>Different Formats</strong> - Try various data types</li>
          <li><strong>Timeout Scenarios</strong> - See how agent handles delays</li>
        </ul>

        <h3 id="reading-logs">Understanding Execution Logs</h3>
        <p className="mb-4">Logs show exactly what your agent did:</p>
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 space-y-1">
            <div>[14:32:15] Agent started</div>
            <div>[14:32:16] Reading input: "search for AI trends"</div>
            <div>[14:32:17] Calling web_search tool...</div>
            <div>[14:32:22] Got 5 results, processing...</div>
            <div>[14:32:25] Analyzing data...</div>
            <div>[14:32:28] Generating report...</div>
            <div>[14:32:30] Agent completed successfully</div>
          </p>
        </div>

        <h2 id="agent-optimization">Optimizing Agent Performance</h2>

        <h3 id="cost-optimization">Reducing Agent Costs</h3>
        <p className="mb-4">Save money on agent runs with these strategies:</p>
        <div className="space-y-3 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💰 Write Clear Instructions</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vague instructions cause the AI to think longer, increasing costs</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💰 Use Caching</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Reuse recent results instead of recalculating</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💰 Batch Operations</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Process multiple items in one run instead of many small runs</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-medium mb-2">💰 Limit Web Searches</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Use knowledge base first before searching the web</p>
          </div>
        </div>

        <h3 id="speed-optimization">Improving Agent Speed</h3>
        <p className="mb-4">Make your agents faster with these techniques:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Parallelize Tasks</strong> - Let agents do multiple things at once</li>
          <li><strong>Break Into Steps</strong> - Complex tasks run faster if divided</li>
          <li><strong>Use Relevant Tools Only</strong> - Don't load unnecessary tools</li>
          <li><strong>Cache Results</strong> - Avoid recalculating same data</li>
          <li><strong>Set Realistic Timeouts</strong> - Don't make timeouts too short</li>
        </ul>

        <h2 id="agent-versions">Version Control & Updates</h2>

        <h3 id="creating-versions">Creating Agent Versions</h3>
        <p className="mb-4">Keep track of changes to your agents:</p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Save a Version</strong> - Before major changes, save current version</li>
          <li><strong>Version Notes</strong> - Document what changed in each version</li>
          <li><strong>Rollback</strong> - Revert to previous version if needed</li>
          <li><strong>A/B Testing</strong> - Compare different agent versions</li>
        </ul>

        <h2 id="monitoring-production">Monitoring Agents in Production</h2>

        <h3 id="alerts-notifications">Setting Up Alerts</h3>
        <p className="mb-4">Get notified when something goes wrong:</p>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Alert on high error rate (&gt;10% failures)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Alert on slow runs (&gt;60 seconds)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Alert on high costs (&gt;$X per run)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Alert on quota exceeded</span>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />
      
      <Link href="/docs/use-cases">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">Real-World Use Cases →</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">See how other users are leveraging Machine</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
