'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, Code2, Zap, Shield, Network, Settings, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Integrations & MCPs' }
];

export default function IntegrationsPage() {
  return (
    <>
      <DocsHeader
        title="Integrations & Model Context Protocol (MCP)"
        subtitle="Connect Machine with external tools, APIs, and MCPs like Composio for seamless workflow automation"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">

        <h2 id="what-is-mcp">What is Model Context Protocol (MCP)?</h2>
        <p className="mb-4">
          Model Context Protocol (MCP) is an open standard that allows AI models to access external tools, APIs, and services in a standardized way. Instead of building custom integrations for each tool, MCP provides a unified interface for connecting to thousands of applications and services.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-200">Key Benefits of MCP:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>✅ <strong>Standardized Interface:</strong> One protocol for all integrations</li>
            <li>✅ <strong>Wider Compatibility:</strong> Works across multiple AI platforms</li>
            <li>✅ <strong>Simplified Development:</strong> No need to build custom connectors</li>
            <li>✅ <strong>Better Security:</strong> Centralized permission management</li>
            <li>✅ <strong>Continuous Updates:</strong> Integrations stay current automatically</li>
            <li>✅ <strong>Ecosystem Growth:</strong> Access to 500+ pre-built integrations</li>
          </ul>
        </div>

        <h2 id="integration-types">Integration Types in Machine</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 rounded-xl border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex items-start gap-3">
              <Code2 className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-orange-900 dark:text-orange-200">API Integrations</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Direct REST/GraphQL API connections to external services without MCP wrapper</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10">
            <div className="flex items-start gap-3">
              <Network className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">MCP Servers</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Model Context Protocol compliant servers that provide structured tool access</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-green-900 dark:text-green-200">Composio Integration</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Connect via Composio for 500+ pre-built app integrations with simplified authentication</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-200">Webhook Connections</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Real-time event-driven integrations using webhooks for instant automation triggers</p>
              </div>
            </div>
          </Card>
        </div>

        <h2 id="composio-guide">📦 Connecting via Composio</h2>
        <p className="mb-4">
          Composio is the easiest way to integrate 500+ applications into Machine. It handles authentication, API management, and provides a unified interface for all your integrations.
        </p>

        <h3 id="composio-overview">What is Composio?</h3>
        <p className="mb-4">
          Composio is an integration platform that connects AI agents with real-world applications. It provides pre-built, tested integrations with popular tools like Slack, Gmail, GitHub, HubSpot, Notion, and more—eliminating the need to build custom API connectors.
        </p>

        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-3 text-indigo-900 dark:text-indigo-200">💡 Why Choose Composio?</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>🎯 <strong>500+ Pre-built Integrations:</strong> Gmail, Slack, GitHub, Salesforce, HubSpot, Notion, Jira, and more</li>
            <li>🔐 <strong>Secure OAuth:</strong> Enterprise-grade authentication handling</li>
            <li>⚡ <strong>Ready-to-Use Actions:</strong> Send emails, create tickets, post messages, etc.</li>
            <li>📊 <strong>Monitoring & Logs:</strong> Track all integration activities and troubleshoot issues</li>
            <li>🚀 <strong>Rate Limiting & Retry Logic:</strong> Built-in reliability and performance optimization</li>
            <li>💰 <strong>Cost Effective:</strong> Pay only for what you use with flexible pricing</li>
          </ul>
        </div>

        <h3 id="composio-setup">Step-by-Step: Setting Up Composio Integration</h3>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">1</div>
              <div className="flex-grow">
                <h4 className="font-semibold mb-2">Create a Composio Account</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Visit <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">composio.dev</code> and sign up for a free account. You'll get immediate access to all 500+ integrations.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs font-mono text-gray-700 dark:text-gray-300">
                  URL: https://app.composio.dev/sign-up
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">2</div>
              <div className="flex-grow">
                <h4 className="font-semibold mb-2">Get Your API Key</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  In your Composio dashboard, go to Settings → API Keys and create a new API key. Copy this key to use in Machine.
                </p>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs">
                  <p className="text-blue-900 dark:text-blue-200"><strong>Navigation:</strong> Dashboard → Settings → API Keys → Create New Key</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">3</div>
              <div className="flex-grow">
                <h4 className="font-semibold mb-2">Add Composio to Your Agent in Machine</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  In Machine, open your agent settings and navigate to Integrations. Click "Add Integration" and select "Composio".
                </p>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-decimal">
                  <li>Go to Agent Settings → Integrations</li>
                  <li>Click "Add Integration"</li>
                  <li>Select "Composio" from the list</li>
                  <li>Paste your Composio API key</li>
                  <li>Click "Connect"</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">4</div>
              <div className="flex-grow">
                <h4 className="font-semibold mb-2">Select Apps to Connect</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Once connected, you'll see a list of 500+ available apps. Click on the apps you want to use (Gmail, Slack, GitHub, etc.) and authorize them.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3">
                  <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Popular Apps:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Gmail', 'Slack', 'GitHub', 'Salesforce', 'HubSpot', 'Notion', 'Jira', 'Asana', 'Trello'].map((app) => (
                      <span key={app} className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs px-2 py-1 rounded">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">5</div>
              <div className="flex-grow">
                <h4 className="font-semibold mb-2">Use Actions in Your Agent</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Now your agent can use any action from the connected apps. For example, send an email through Gmail, post a message in Slack, or create a GitHub issue.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs font-mono">
                  <p className="text-gray-700 dark:text-gray-300">Example: "Send an email to john@company.com with the report"</p>
                  <p className="text-gray-700 dark:text-gray-300">→ Agent uses Gmail integration via Composio</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 id="composio-actions">Popular Composio Actions by App</h2>
        <p className="mb-4">
          Here are some of the most commonly used actions available through Composio integrations:
        </p>

        <div className="space-y-4 mb-8">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-semibold border-b border-gray-200 dark:border-gray-800">
              📧 Email (Gmail, Outlook, etc.)
            </div>
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• Send email with attachments</p>
              <p>• Create draft emails</p>
              <p>• Forward emails</p>
              <p>• Add labels/tags to emails</p>
              <p>• Search and retrieve emails</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-semibold border-b border-gray-200 dark:border-gray-800">
              💬 Communication (Slack, Teams, Discord, etc.)
            </div>
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• Post messages to channels</p>
              <p>• Send direct messages</p>
              <p>• Create threads and replies</p>
              <p>• Upload files and media</p>
              <p>• Add reactions to messages</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-semibold border-b border-gray-200 dark:border-gray-800">
              🔧 Project Management (Jira, Asana, Trello, Linear, etc.)
            </div>
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• Create issues and tasks</p>
              <p>• Update status and assignments</p>
              <p>• Add comments and attachments</p>
              <p>• List and search tasks</p>
              <p>• Add due dates and priorities</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-semibold border-b border-gray-200 dark:border-gray-800">
              💼 CRM (Salesforce, HubSpot, Pipedrive, etc.)
            </div>
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• Create and update contacts</p>
              <p>• Manage deals and opportunities</p>
              <p>• Add activities and notes</p>
              <p>• Create tasks and reminders</p>
              <p>• Generate reports</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-semibold border-b border-gray-200 dark:border-gray-800">
              📝 Documents (Notion, Google Docs, Confluence, etc.)
            </div>
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• Create pages and documents</p>
              <p>• Add and update content</p>
              <p>• Manage databases and tables</p>
              <p>• Create templates</p>
              <p>• Share and manage permissions</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 font-semibold border-b border-gray-200 dark:border-gray-800">
              🔐 Development (GitHub, GitLab, Bitbucket, etc.)
            </div>
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• Create issues and pull requests</p>
              <p>• Push commits and merge code</p>
              <p>• Manage repositories</p>
              <p>• Add comments and reviews</p>
              <p>• Manage branches and tags</p>
            </div>
          </div>
        </div>

        <h2 id="authentication">🔐 Authentication & Security</h2>
        <p className="mb-4">
          Composio handles authentication securely through OAuth 2.0, so you never need to store API keys or passwords directly in Machine.
        </p>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-3 text-green-900 dark:text-green-200">Security Best Practices:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>✅ Use OAuth whenever available (no passwords shared)</li>
            <li>✅ Rotate API keys regularly in Composio dashboard</li>
            <li>✅ Use workspace-level permissions to control who can use integrations</li>
            <li>✅ Monitor integration activity in Machine's audit logs</li>
            <li>✅ Disable unused integrations to reduce exposure</li>
            <li>✅ Enable two-factor authentication in Composio account</li>
          </ul>
        </div>

        <h2 id="advanced-features">⚙️ Advanced Composio Features</h2>

        <h3 id="connection-sharing">Connection Sharing</h3>
        <p className="mb-4">
          Share authenticated connections across multiple agents in your workspace. This eliminates the need to re-authenticate for each agent.
        </p>

        <h3 id="webhook-triggers">Webhook Triggers</h3>
        <p className="mb-4">
          Use Composio webhooks to trigger agents when events occur in connected apps. For example, automatically process emails when they arrive, or create tasks when Slack messages are posted.
        </p>

        <h3 id="batch-operations">Batch Operations</h3>
        <p className="mb-4">
          Execute multiple actions across different apps in a single agent workflow. Process data from one app and automatically sync to another.
        </p>

        <h3 id="custom-actions">Custom Actions</h3>
        <p className="mb-4">
          For apps not yet available in Composio, you can create custom actions using REST API endpoints or GraphQL queries.
        </p>

        <h2 id="direct-api">Direct API Integrations</h2>
        <p className="mb-4">
          For advanced use cases or apps not available in Composio, Machine supports direct API integrations. You can make HTTP requests to any API endpoint and process the responses.
        </p>

        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-2">Direct API Integration Steps:</p>
          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-decimal">
            <li>Create an API tool in your agent</li>
            <li>Specify the endpoint URL (REST or GraphQL)</li>
            <li>Configure authentication (API key, OAuth, Bearer token)</li>
            <li>Define request headers and body parameters</li>
            <li>Test the connection</li>
            <li>Use the tool in your agent workflows</li>
          </ol>
        </div>

        <h2 id="webhooks">Webhook Connections</h2>
        <p className="mb-4">
          Webhooks enable real-time, event-driven automation. When something happens in an external app, it can automatically trigger your Machine agents.
        </p>

        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-3 text-purple-900 dark:text-purple-200">Webhook Use Cases:</p>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>📨 Trigger agent when email arrives</li>
            <li>📝 Auto-process form submissions</li>
            <li>💬 Respond to Slack messages instantly</li>
            <li>📊 Sync data from spreadsheets in real-time</li>
            <li>🔔 Create tickets when alerts fire</li>
            <li>🚀 Deploy agents on new repository commits</li>
          </ul>
        </div>

        <h2 id="troubleshooting">🔧 Troubleshooting Integrations</h2>

        <div className="space-y-4 mb-8">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">❌ Connection Failed</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Solution:</strong> Verify your API key is valid in the Composio dashboard. Check if the key has expired or been revoked. Generate a new key if necessary.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">❌ Authentication Error with App</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Solution:</strong> Re-authorize the app in Composio dashboard. Some apps require periodic re-authentication. Go to Settings → Connected Apps and click "Reconnect".
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">❌ Action Not Working</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Solution:</strong> Check that your app account has proper permissions for the action. For example, if sending emails fails, ensure the Gmail account has email sending enabled. Review Composio logs for detailed error messages.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">❌ Rate Limiting</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Solution:</strong> Some apps have rate limits. Machine and Composio handle retries automatically, but you may see delays. Upgrade your Composio plan for higher limits or stagger requests.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">❌ Webhook Not Triggering</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Solution:</strong> Verify the webhook URL is correct and publicly accessible. Test the webhook manually in Composio dashboard. Check firewall/security settings that may be blocking incoming webhooks.
            </p>
          </div>
        </div>

        <h2 id="best-practices">✨ Integration Best Practices</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 rounded-xl border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">Minimize Permissions</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Request only the permissions your agent actually needs. Scope credentials appropriately to reduce security risks.
            </p>
          </Card>

          <Card className="p-4 rounded-xl border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
            <h4 className="font-semibold mb-2 text-green-900 dark:text-green-200">Monitor Activity</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Regularly review integration logs and audit trails to detect unusual activity or failures.
            </p>
          </Card>

          <Card className="p-4 rounded-xl border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10">
            <h4 className="font-semibold mb-2 text-orange-900 dark:text-orange-200">Handle Errors Gracefully</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Design agents to handle API errors, rate limits, and timeouts. Add retry logic and fallback actions.
            </p>
          </Card>

          <Card className="p-4 rounded-xl border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10">
            <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">Test Thoroughly</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Test integrations in development before deploying to production. Verify all expected actions work correctly.
            </p>
          </Card>

          <Card className="p-4 rounded-xl border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10">
            <h4 className="font-semibold mb-2 text-red-900 dark:text-red-200">Rotate Credentials</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Periodically rotate API keys and re-authenticate connections to maintain security.
            </p>
          </Card>

          <Card className="p-4 rounded-xl border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10">
            <h4 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-200">Document Workflows</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Keep detailed documentation of your integration workflows for team reference and troubleshooting.
            </p>
          </Card>
        </div>

        <h2 id="faq">❓ Frequently Asked Questions</h2>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Can I use multiple integrations in one agent?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Yes! You can connect unlimited integrations (Composio, API, webhooks) to a single agent. Your agent can orchestrate actions across multiple apps.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">What if an app I need isn't on Composio?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You can still integrate it via direct API integration. If the app has a REST or GraphQL API, you can connect it to Machine. Composio is also constantly adding new integrations—request it on their roadmap.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">How secure are Composio integrations?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Very secure. Composio uses OAuth 2.0 for authentication, never stores passwords, and encrypts all API keys. They also comply with SOC 2 and GDPR standards.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Can I share integrations with team members?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Yes. Once you create an integration in your Machine workspace, all team members with appropriate permissions can use it. You can control access at the workspace level.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Is there a cost for using Composio?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Composio offers a free tier with basic limits, and paid plans starting at $50/month for professional use. Most integrations are included with any Composio plan.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Can I test integrations before deploying?</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Absolutely. Machine includes integration testing tools. You can test API calls, verify authentication, and run test workflows before deploying to production.
            </p>
          </div>
        </div>

        <h2 id="next-steps">🚀 Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/docs/building-agents" className="group">
            <Card className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors bg-blue-50/50 dark:bg-blue-950/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900 dark:text-blue-200">Build AI Agents</span>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Learn how to create powerful AI agents with integrated tools</p>
            </Card>
          </Link>

          <Link href="/docs/features" className="group">
            <Card className="p-4 rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-colors bg-green-50/50 dark:bg-green-950/10">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-900 dark:text-green-200">Explore Features</span>
                <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Discover all tools and capabilities available in Machine</p>
            </Card>
          </Link>
        </div>

      </DocsBody>
    </>
  );
}
