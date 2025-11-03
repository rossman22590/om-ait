'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Users,
  Lock,
  Settings,
  Zap,
  BarChart3,
  Sliders,
  Key,
  User,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Database,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Workspace' }
];

interface TabItem {
  label: string;
  icon: React.ReactNode;
}

interface GuideSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
}

function GuideSection({ title, description, icon, steps }: GuideSectionProps) {
  return (
    <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 mb-6">
      <div className="flex gap-4 mb-4">
        <div className="flex-shrink-0 text-blue-600">{icon}</div>
        <div className="flex-grow">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <ul className="space-y-2 ml-8">
        {steps.map((step, i) => (
          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
            <span className="text-blue-600 flex-shrink-0">→</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

interface RoleProps {
  role: string;
  description: string;
  permissions: string[];
  color: string;
}

function RoleCard({ role, description, permissions, color }: RoleProps) {
  const colorClasses = {
    admin: 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10',
    member: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10',
    viewer: 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/10',
  };

  return (
    <Card className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h4 className="font-semibold mb-2">{role}</h4>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{description}</p>
      <div>
        <p className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">Permissions:</p>
        <ul className="space-y-1">
          {permissions.map((perm, i) => (
            <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{perm}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default function WorkspacePage() {
  return (
    <>
      <DocsHeader
        title="Workspace & Organization"
        subtitle="Master your workspace settings, team management, and organization structure"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">What is a Workspace?</h2>
        <p className="mb-6">
          A Workspace is your dedicated environment in Machine AI where you manage agents, knowledge bases, team members, integrations, and settings. Each workspace is isolated and secure—only authorized team members can access it. Workspaces allow teams to collaborate efficiently while maintaining control and organization.
        </p>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <p className="font-semibold mb-3">✨ Your Workspace includes:</p>
          <ul className="space-y-2 text-sm">
            <li>🤖 Agent builder and management</li>
            <li>📚 Knowledge base and document storage</li>
            <li>👥 Team collaboration tools</li>
            <li>🔑 API keys and integrations</li>
            <li>📊 Analytics and monitoring</li>
            <li>⚙️ Security and access controls</li>
            <li>💾 Workspace settings and customization</li>
            <li>📱 Mobile-friendly dashboard</li>
          </ul>
        </div>

        <h2 id="workspace-structure">🏗️ Workspace Structure</h2>

        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-4">Standard Workspace Hierarchy</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Workspace (Top Level)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Your isolated environment</p>
              </div>
            </div>
            <div className="ml-8 flex items-start gap-3">
              <Layers className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Projects</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Organize agents by project/use case</p>
              </div>
            </div>
            <div className="ml-16 flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Agents</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Individual AI agents within projects</p>
              </div>
            </div>
            <div className="ml-16 flex items-start gap-3">
              <Database className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Knowledge Bases</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Shared knowledge accessible to multiple agents</p>
              </div>
            </div>
          </div>
        </div>

        <h2 id="accessing-workspace">🚀 Accessing Your Workspace</h2>

        <StepCard
          number={1}
          title="Log In"
          description="Access your Machine AI account"
          details={[
            'Go to Machine AI login page',
            'Enter your email and password',
            'Complete any 2FA if enabled',
            'You\'ll be taken to your workspace dashboard',
          ]}
        />

        <StepCard
          number={2}
          title="Switch Between Workspaces"
          description="If you have multiple workspaces, easily switch between them"
          details={[
            'Click your workspace name in the top-left corner',
            'Select from list of available workspaces',
            'Or create a new workspace from this menu',
            'Your dashboard reloads with the new workspace context',
          ]}
        />

        <StepCard
          number={3}
          title="Explore the Dashboard"
          description="Familiarize yourself with workspace sections"
          details={[
            'Left Sidebar: Navigate between Agents, Knowledge Base, Integrations, Settings',
            'Main Area: View agents, create new ones, see recent activity',
            'Top Bar: Access workspace settings, notifications, profile menu',
            'Cards show quick stats on agents, API usage, team members',
          ]}
        />

        <h2 id="team-management">👥 Team Management</h2>

        <div className="mb-8">
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Collaborate with your team by managing members, assigning roles, and controlling permissions.
          </p>

          <GuideSection
            title="Add Team Members"
            description="Invite people to collaborate on your workspace"
            icon={<Users className="w-6 h-6" />}
            steps={[
              'Go to Settings → Team & Access',
              'Click "Invite Team Member"',
              'Enter their email address',
              'Select their role (Admin, Member, Viewer)',
              'Send invitation',
              'They receive an email and can join the workspace',
              'Once accepted, they appear in your team list',
            ]}
          />

          <GuideSection
            title="Manage Roles"
            description="Control what team members can do"
            icon={<Shield className="w-6 h-6" />}
            steps={[
              'Go to Settings → Team & Access',
              'Find the team member in the list',
              'Click the role dropdown next to their name',
              'Select new role (Admin, Member, Viewer)',
              'Changes take effect immediately',
              'View role descriptions to understand permissions',
              'Only Admins can change member roles',
            ]}
          />

          <GuideSection
            title="Remove Team Members"
            description="Remove access from team members"
            icon={<Lock className="w-6 h-6" />}
            steps={[
              'Go to Settings → Team & Access',
              'Find the member you want to remove',
              'Click the three-dot menu next to their name',
              'Select "Remove from workspace"',
              'Confirm the action',
              'They lose immediate access to all workspace resources',
              'Their API keys are automatically revoked',
            ]}
          />
        </div>

        <h2 id="roles-permissions">🔐 Roles & Permissions</h2>

        <p className="mb-6 text-gray-700 dark:text-gray-300">
          Machine AI offers three built-in roles. Each has different capabilities:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <RoleCard
            role="Admin"
            description="Full control over workspace. Can manage team, settings, and resources."
            permissions={[
              'Create and delete agents',
              'Manage team members',
              'Change workspace settings',
              'Access billing information',
              'Revoke API keys',
              'Delete workspace',
              'View all analytics',
              'Manage integrations',
            ]}
            color="admin"
          />

          <RoleCard
            role="Member"
            description="Can build and manage agents. Limited to their own resources."
            permissions={[
              'Create and edit agents',
              'Access knowledge base',
              'View workspace analytics',
              'Create API keys',
              'Access integrations',
              'Cannot manage team',
              'Cannot change settings',
              'Cannot access billing',
            ]}
            color="member"
          />

          <RoleCard
            role="Viewer"
            description="Read-only access. Can view but not modify agents or settings."
            permissions={[
              'View agents',
              'View analytics',
              'View knowledge base',
              'Cannot create agents',
              'Cannot edit settings',
              'Cannot create API keys',
              'Cannot access billing',
              'Read-only access',
            ]}
            color="viewer"
          />
        </div>

        <h2 id="settings">⚙️ Workspace Settings</h2>

        <GuideSection
          title="Basic Settings"
          description="Configure your workspace name, timezone, and preferences"
          icon={<Settings className="w-6 h-6" />}
          steps={[
            'Go to Settings → Workspace Settings',
            'Update workspace name if desired',
            'Select your timezone for accurate timestamps',
            'Choose default language and locale',
            'Set workspace description for team reference',
            'Enable/disable features as needed',
            'Click "Save" to apply changes',
          ]}
        />

        <GuideSection
          title="Security Settings"
          description="Manage authentication, API access, and security controls"
          icon={<Lock className="w-6 h-6" />}
          steps={[
            'Go to Settings → Security',
            'Enable two-factor authentication (2FA)',
            'Set password requirements',
            'Configure IP whitelisting if needed',
            'Review active sessions and log out unused ones',
            'Set session timeout duration',
            'Enable SSO if on enterprise plan',
            'Review security audit logs',
          ]}
        />

        <GuideSection
          title="API & Integration Settings"
          description="Manage API keys and third-party integrations"
          icon={<Key className="w-6 h-6" />}
          steps={[
            'Go to Settings → API & Keys',
            'Click "Create New Key" for API access',
            'Set appropriate permissions for the key',
            'Copy and securely store your API key',
            'Go to Settings → Integrations to connect services',
            'Select integration type (Slack, Zapier, etc.)',
            'Authenticate with the service',
            'Configure integration settings',
          ]}
        />

        <GuideSection
          title="Billing & Plan"
          description="Manage subscription, billing, and usage"
          icon={<BarChart3 className="w-6 h-6" />}
          steps={[
            'Go to Settings → Billing',
            'View your current plan and features',
            'See monthly usage statistics',
            'Manage payment method',
            'Download invoices',
            'View usage breakdown by service',
            'Upgrade or downgrade your plan',
            'Set billing email and notifications',
          ]}
        />

        <h2 id="api-keys">🔑 API Keys Management</h2>

        <div className="space-y-4 mb-8">
          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Creating API Keys
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>1. Go to API Keys:</strong> Navigate to Settings → API & Keys
              </p>
              <p>
                <strong>2. Create Key:</strong> Click "Create New API Key"
              </p>
              <p>
                <strong>3. Name It:</strong> Give your key a descriptive name (e.g., "Production Agents")
              </p>
              <p>
                <strong>4. Set Permissions:</strong> Choose which APIs the key can access
              </p>
              <p>
                <strong>5. Copy & Store:</strong> Copy the key immediately—you won't see it again
              </p>
              <p>
                <strong>6. Secure Storage:</strong> Store securely (use environment variables, not hardcoded)
              </p>
            </div>
          </Card>

          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-red-50/30 dark:bg-red-950/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              API Key Security Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>🔒 Never share API keys or commit them to version control</li>
              <li>🔄 Rotate keys periodically (every 3-6 months)</li>
              <li>🗑️ Delete unused keys immediately</li>
              <li>🔍 Monitor key usage in your analytics dashboard</li>
              <li>⏰ Set key expiration dates for temporary access</li>
              <li>📋 Use separate keys for different environments (dev, staging, prod)</li>
              <li>🚨 Revoke compromised keys immediately</li>
            </ul>
          </Card>
        </div>

        <h2 id="analytics">📊 Workspace Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Dashboard Overview
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              View high-level metrics about your workspace usage.
            </p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Total agents created</li>
              <li>• Lifetime API calls</li>
              <li>• Tokens used this month</li>
              <li>• Current team members</li>
              <li>• Storage usage</li>
              <li>• Recent activity feed</li>
            </ul>
          </Card>

          <Card className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Detailed Analytics
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Dive deeper into specific metrics and trends.
            </p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Agent performance metrics</li>
              <li>• API response times</li>
              <li>• Token usage breakdown</li>
              <li>• Error rates and logs</li>
              <li>• Team activity history</li>
              <li>• Cost analysis by agent</li>
            </ul>
          </Card>
        </div>

        <h2 id="organization-best-practices">💡 Organization Best Practices</h2>

        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">📁 Organize Projects Logically</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Create projects by department, use case, or client. For example: "HR Automation", "Customer Support", "Internal Tools". Makes it easy to find and manage related agents.
            </p>
          </div>

          <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-green-900 dark:text-green-200">📝 Use Descriptive Names</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Name agents clearly: "Email-Lead-Qualifier" instead of "Agent1". Include context in descriptions so team members understand purpose and usage.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">👥 Assign Right Roles</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Give team members only the permissions they need. Reduce admins to essential personnel. Use Viewer role for stakeholders who only need to monitor.
            </p>
          </div>

          <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-orange-900 dark:text-orange-200">🔑 Manage API Keys Carefully</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Create separate keys for different environments and integrations. Rotate keys regularly. Monitor usage to detect anomalies. Delete unused keys.
            </p>
          </div>

          <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-200">📊 Review Analytics Regularly</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Check your workspace analytics monthly. Monitor token usage to control costs. Review team activity logs for security and audit purposes.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-200">🔐 Enable Security Features</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Turn on 2FA for all team members. Use SSO on enterprise plans. Enable IP whitelisting if available. Regularly review security audit logs.
            </p>
          </div>
        </div>

        <h2 id="troubleshooting">🔧 Workspace Troubleshooting</h2>

        <div className="space-y-4 mb-8">
          <Card className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10">
            <p className="font-semibold text-sm mb-2">❓ I can't access the workspace</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✓ Check if you're logged in to the right account</li>
              <li>✓ Make sure you were added to the workspace</li>
              <li>✓ Check if 2FA is enabled and you have access to your authenticator</li>
              <li>✓ Try clearing browser cache and logging in again</li>
              <li>✓ Contact your workspace admin if you think access was removed</li>
            </ul>
          </Card>

          <Card className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10">
            <p className="font-semibold text-sm mb-2">❓ API key not working</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✓ Verify you copied the entire key without extra spaces</li>
              <li>✓ Check if the key has expired</li>
              <li>✓ Confirm the key has the right permissions</li>
              <li>✓ Make sure you're using the correct environment endpoint</li>
              <li>✓ Check rate limiting if making many requests</li>
            </ul>
          </Card>

          <Card className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10">
            <p className="font-semibold text-sm mb-2">❓ Team member can't see certain agents</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✓ Check their role—might need Member or Admin role</li>
              <li>✓ Verify they're in the right project</li>
              <li>✓ Check if resource-level permissions are restricted</li>
              <li>✓ Ask an Admin to grant explicit access if needed</li>
              <li>✓ Make sure they've refreshed the dashboard</li>
            </ul>
          </Card>

          <Card className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10">
            <p className="font-semibold text-sm mb-2">❓ Analytics showing no data</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✓ Give agents time to run—data updates every 5-10 minutes</li>
              <li>✓ Check date range is correct</li>
              <li>✓ Verify agents have been executed</li>
              <li>✓ Look for errors in the error logs that might prevent tracking</li>
              <li>✓ Contact support if issue persists</li>
            </ul>
          </Card>
        </div>

        <h2 id="advanced-features">🚀 Advanced Features</h2>

        <div className="space-y-4 mb-8">
          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-2">Workspace Export & Backup</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Export your workspace configuration for backup or migration to another workspace or instance.
            </p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Go to Settings → Export & Backup</li>
              <li>• Select what to export (agents, configs, knowledge base)</li>
              <li>• Download as JSON or CSV</li>
              <li>• Keep backups in secure location</li>
            </ul>
          </Card>

          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-2">Workspace Collaboration</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Real-time collaboration features for teams building agents together.
            </p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Shared agent editing with team members</li>
              <li>• Comments and suggestions on agent configurations</li>
              <li>• Activity feed showing who did what and when</li>
              <li>• Version history with rollback capability</li>
            </ul>
          </Card>

          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold mb-2">Custom Webhooks</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Set up webhooks to trigger external systems when events occur in your workspace.
            </p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Agent execution events (start, complete, error)</li>
              <li>• New API key created or revoked</li>
              <li>• Team member added or removed</li>
              <li>• Knowledge base updated</li>
            </ul>
          </Card>
        </div>

        <h2 id="next-steps">🎯 Next Steps</h2>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Ready to master your workspace?</h3>
          <div className="space-y-3">
            <Link href="/docs/knowledge-base" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              <ArrowRight className="w-4 h-4" />
              Learn about Knowledge Base Management
            </Link>
            <Link href="/docs/building-agents" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              <ArrowRight className="w-4 h-4" />
              Start Building Your First Agent
            </Link>
            <Link href="/docs/models" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              <ArrowRight className="w-4 h-4" />
              Explore AI Models
            </Link>
          </div>
        </div>
      </DocsBody>
    </>
  );
}

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  details: string[];
}

function StepCard({ number, title, description, details }: StepCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6 bg-gray-50 dark:bg-gray-900/20">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
            {number}
          </div>
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{description}</p>
          <ul className="space-y-2">
            {details.map((detail, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
