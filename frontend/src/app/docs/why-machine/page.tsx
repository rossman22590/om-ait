'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, XCircle, Zap, TrendingUp, Cpu, Layers } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Why Machine?' }
];

function ComparisonRow({
  feature,
  machine,
  manus,
  genspark,
}: {
  feature: string;
  machine: string | boolean;
  manus: string | boolean;
  genspark: string | boolean;
}) {
  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
      <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">
        {feature}
      </td>
      <td className="border border-gray-300 dark:border-gray-700 p-4 bg-blue-50/30 dark:bg-blue-950/10 font-semibold">
        {renderCell(machine)}
      </td>
      <td className="border border-gray-300 dark:border-gray-700 p-4">
        {renderCell(manus)}
      </td>
      <td className="border border-gray-300 dark:border-gray-700 p-4">
        {renderCell(genspark)}
      </td>
    </tr>
  );
}

export default function WhyMachinePage() {
  return (
    <>
      <DocsHeader
        title="Why Machine?"
        subtitle="Compare Machine AI to leading alternatives"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">The Machine Advantage</h2>
        <p className="mb-6">
          Machine AI is purpose-built for teams and enterprises who need to build, deploy, and scale AI agents quickly. 
          Here's how we compare to other leading AI platforms.
        </p>

        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
          <p className="font-semibold mb-3">✨ Machine is best for:</p>
          <ul className="space-y-2 text-sm">
            <li>🏢 Teams building production AI agents</li>
            <li>⚡ High-volume automation at scale</li>
            <li>💰 Cost-conscious enterprises - starts at $19.99/mo</li>
            <li>🔧 Custom workflows and unlimited integrations</li>
            <li>📊 Agents that need monitoring and control</li>
            <li>🎯 Granular tool-level customization</li>
            <li>🚀 Rapid prototyping and deployment</li>
          </ul>
        </div>

        <h2 id="manus-comparison">🔷 Machine vs Manus</h2>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Manus is a general-purpose AI reasoning platform focused on research and intelligence. Here's how it compares to Machine for enterprise AI automation:
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">Feature</th>
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Machine
                  </div>
                </th>
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">Manus</th>
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">Genspark</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                feature="Multi-Model Support"
                machine="12+ models (OpenAI, Anthropic, Google, xAI, etc.)"
                manus="Limited to specific models"
                genspark="Single model focus"
              />
              <ComparisonRow
                feature="Agent Building"
                machine={true}
                manus="Research-focused, not automation"
                genspark="Limited automation capabilities"
              />
              <ComparisonRow
                feature="Workflow Automation"
                machine={true}
                manus={false}
                genspark={false}
              />
              <ComparisonRow
                feature="Production Ready"
                machine={true}
                manus="Research tool"
                genspark="Consumer-focused"
              />
              <ComparisonRow
                feature="Cost Control"
                machine="Starts at $19.99 for Full Access!"
                manus="Credit-based: Free plan + $19-$199/mo tiers"
                genspark="Free but limited"
              />
              <ComparisonRow
                feature="API Access"
                machine={true}
                manus="Limited API"
                genspark="Very limited"
              />
              <ComparisonRow
                feature="Custom Integrations"
                machine="Unlimited connections & custom integrations"
                manus={false}
                genspark={false}
              />
              <ComparisonRow
                feature="Granular Tool Customization"
                machine="Full control down to tool level"
                manus={false}
                genspark={false}
              />
              <ComparisonRow
                feature="Enterprise Features"
                machine="SSO, audit logs, team management"
                manus={false}
                genspark={false}
              />
              <ComparisonRow
                feature="Monitoring & Analytics"
                machine="Full dashboard and analytics"
                manus="Basic usage tracking"
                genspark="None"
              />
              <ComparisonRow
                feature="Reasoning Capabilities"
                machine="Advanced via multiple models"
                manus="Deep reasoning focus"
                genspark="Basic reasoning"
              />
              <ComparisonRow
                feature="Pricing Transparency"
                machine="Clear per-token pricing"
                manus="Opaque subscription tiers"
                genspark="Free"
              />
              <ComparisonRow
                feature="Best Use Case"
                machine="Production automation at scale"
                manus="Research and reasoning"
                genspark="Consumer research tool"
              />
            </tbody>
          </table>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
            <p className="font-semibold text-pink-900 dark:text-pink-200 mb-2">✅ Choose Machine if:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• You need to automate business processes</li>
              <li>• You want to build custom AI agents</li>
              <li>• You need support for multiple AI models</li>
              <li>• Cost efficiency is important</li>
              <li>• You require production-grade infrastructure</li>
              <li>• Your team needs analytics and monitoring</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="font-semibold text-purple-900 dark:text-purple-200 mb-2">🔍 Choose Manus if:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• You primarily need deep research and reasoning</li>
              <li>• You want a general AI chat interface</li>
              <li>• You prefer a credit-based system with task limits</li>
              <li>• Your focus is on analysis, not automation</li>
              <li>• You're comfortable with $19-$199/mo subscription tiers</li>
            </ul>
          </div>
        </div>

        <h2 id="genspark-comparison">🟣 Machine vs Genspark</h2>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Genspark is a tiered AI research tool with free and paid plans. Here's how it compares to Machine for enterprise automation:
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">Feature</th>
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Machine
                  </div>
                </th>
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">Genspark</th>
                <th className="border border-gray-300 dark:border-gray-700 p-4 text-left font-semibold">Manus</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                feature="Pricing"
                machine="Pay-as-you-go, very affordable"
                genspark="Free ($0/mo) | Plus ($24.99/mo) | Pro ($249.99/mo)"
                manus="Free + 4 tiers: Free (1K+300/day) | Basic ($19/mo) | Plus ($39/mo) | Pro ($199/mo)"
              />
              <ComparisonRow
                feature="Model Flexibility"
                machine="Choose from 12+ models"
                genspark="Single model only"
                manus="2-3 model options"
              />
              <ComparisonRow
                feature="Automation Capability"
                machine={true}
                genspark={false}
                manus={false}
              />
              <ComparisonRow
                feature="API & Integrations"
                machine={true}
                genspark={false}
                manus="Limited"
              />
              <ComparisonRow
                feature="Enterprise Security"
                machine={true}
                genspark={false}
                manus={false}
              />
              <ComparisonRow
                feature="Team Collaboration"
                machine={true}
                genspark={false}
                manus={false}
              />
              <ComparisonRow
                feature="Deployment Options"
                machine="Cloud, on-premise ready"
                genspark="On-device only"
                manus="Cloud only"
              />
              <ComparisonRow
                feature="Scalability"
                machine="Millions of tasks/day"
                genspark="Single user"
                manus="Moderate scale"
              />
              <ComparisonRow
                feature="Cost at Scale"
                machine="Excellent (per-token)"
                genspark="Stays free"
                manus="Becomes expensive"
              />
              <ComparisonRow
                feature="Use Case"
                machine="Business automation"
                genspark="Personal research"
                manus="Research & reasoning"
              />
            </tbody>
          </table>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
            <p className="font-semibold text-pink-900 dark:text-pink-200 mb-2">✅ Choose Machine if:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• You're building business automation</li>
              <li>• You need to scale beyond single user</li>
              <li>• You want multiple AI model options</li>
              <li>• You need API integrations</li>
              <li>• Enterprise security is required</li>
              <li>• You want cost-effective scaling</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="font-semibold text-purple-900 dark:text-purple-200 mb-2">🎨 Choose Genspark if:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• You're an individual doing personal research</li>
              <li>• You want the free tier ($0/mo, 100 credits/month)</li>
              <li>• You prefer on-device processing for privacy</li>
              <li>• You don't need integrations or APIs</li>
              <li>• Casual use or small-scale research is your primary need</li>
              <li>• You're willing to pay $24.99/mo or $249.99/mo for more credits</li>
            </ul>
          </div>
        </div>

        <h2 id="detailed-comparison">📊 Detailed Feature Comparison</h2>

        <div className="space-y-6">
          <Card className="p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <Cpu className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">AI Model Selection</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Machine:</strong> 12+ models including GPT-5, Claude Sonnet, Gemini, Llama, Grok, and more. Choose the best model for each task.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Manus:</strong> Limited to Manus's preferred models. Less flexibility in model selection.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Genspark:</strong> Single model, no choice available.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <Layers className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Automation & Workflows</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Machine:</strong> Full workflow automation with triggers, actions, and complex logic. Build multi-step agents.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Manus:</strong> Chat-based interaction, not designed for automation.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Genspark:</strong> Limited to conversational AI, no workflow support.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Scale & Performance</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Machine:</strong> Designed for enterprise scale. Handle millions of tasks per day with automatic optimization.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Manus:</strong> Moderate scaling, better for focused teams rather than enterprise deployment.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Genspark:</strong> Single-user tool, minimal scaling capabilities.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Cost Efficiency</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Machine:</strong> Per-token pricing with no subscription lock-in. More you use, lower your per-unit cost.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Manus:</strong> Credit-based system. Free (1K+300/day), Basic ($19/mo, 1.9K credits), Plus ($39/mo, 3.9K), Pro ($199/mo, 19.9K). Concurrency: 2-5 tasks depending on tier.</p>
                  <p className="text-gray-600 dark:text-gray-400"><strong>Genspark:</strong> Free tier (100 credits/mo), Plus ($24.99/mo, 10K credits), Pro ($249.99/mo, 125K credits). Credit system limits usage.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <h2 id="pricing-comparison">💰 Pricing Breakdown</h2>

        <div className="space-y-4 mb-6">
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="font-semibold mb-2 text-purple-900 dark:text-purple-200">Machine AI</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✅ Plans start at $19.99/month</li>
              <li>✅ Unlimited connections and custom integrations</li>
              <li>✅ Granular tool-level agent customization</li>
              <li>✅ Full workflow automation and monitoring</li>
              <li>✅ Enterprise-grade features and analytics</li>
              <li>✅ No credit limits - unlimited usage</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-semibold mb-2">Manus</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✅ Free plan: 1,000 starter credits + 300 daily credits</li>
              <li>✅ Basic: $19/mo (1,900 monthly credits, 2 concurrent tasks)</li>
              <li>✅ Plus: $39/mo (3,900 monthly credits)</li>
              <li>✅ Pro: $199/mo (19,900 credits, 5 concurrent tasks, dedicated resources)</li>
              <li>⚠️ Credit-based system limits usage</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="font-semibold mb-2">Genspark</p>
            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <li>✅ Free plan available ($0/mo)</li>
              <li>✅ Plus tier ($24.99/mo)</li>
              <li>✅ Pro tier ($249.99/mo)</li>
              <li>❌ Single model only</li>
              <li>❌ Personal research focus, not enterprise automation</li>
            </ul>
          </div>
        </div>

        <h2 id="use-cases">🎯 When to Use Each Platform</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 rounded-xl border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/10">
            <h3 className="font-semibold mb-3 text-pink-900 dark:text-pink-200">Machine AI</h3>
            <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
              <li>Email automation</li>
              <li>Lead qualification</li>
              <li>Document processing</li>
              <li>Customer support</li>
              <li>Invoice processing</li>
              <li>Data extraction</li>
              <li>Report generation</li>
              <li>Multi-step workflows</li>
            </ul>
          </Card>

          <Card className="p-4 rounded-xl border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10">
            <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-200">Manus</h3>
            <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
              <li>Deep research</li>
              <li>Reasoning tasks</li>
              <li>Intelligence gathering</li>
              <li>Analysis work</li>
              <li>Strategic thinking</li>
              <li>Problem solving</li>
              <li>Content analysis</li>
            </ul>
          </Card>

          <Card className="p-4 rounded-xl border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10">
            <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-200">Genspark</h3>
            <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300 list-none">
              <li>Quick research</li>
              <li>Casual queries</li>
              <li>Personal use</li>
              <li>Educational purposes</li>
              <li>Hobby projects</li>
              <li>Lightweight tasks</li>
              <li>Private on-device processing</li>
            </ul>
          </Card>
        </div>

        <h2 id="verdict">🏆 The Verdict</h2>

        <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-lg mb-2">Machine AI wins for:</p>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>🔧 <strong>Flexibility:</strong> Choose from 12+ cutting-edge AI models</li>
                <li>⚙️ <strong>Automation:</strong> Built specifically for workflow automation</li>
                <li>📈 <strong>Scale:</strong> Handle millions of tasks daily</li>
                <li>💰 <strong>Cost:</strong> Most affordable at enterprise scale</li>
                <li>📊 <strong>Control:</strong> Full monitoring, analytics, and management</li>
                <li>🏢 <strong>Enterprise:</strong> SSO, audit logs, team management</li>
              </ul>
            </div>

            <Separator className="my-4" />

            <div>
              <p className="font-semibold text-lg mb-2">Machine AI is the clear choice if you need:</p>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>🎯 Production-grade AI automation</li>
                <li>🎯 Enterprise-scale deployment</li>
                <li>🎯 Cost-effective AI infrastructure</li>
                <li>🎯 Multiple AI model support</li>
                <li>🎯 Full workflow automation capabilities</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 id="get-started">🚀 Get Started with Machine</h2>

        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <p className="mb-4">Ready to experience the power of Machine AI?</p>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>1. Start free:</strong> No credit card required for the free tier
            </p>
            <p className="text-sm">
              <strong>2. Build an agent:</strong> Follow our <Link href="/docs/building-agents" className="text-blue-600 hover:underline">building agents guide</Link>
            </p>
            <p className="text-sm">
              <strong>3. Choose your models:</strong> Pick from <Link href="/docs/models" className="text-blue-600 hover:underline">12+ AI models</Link>
            </p>
            <p className="text-sm">
              <strong>4. Scale:</strong> Deploy to production with enterprise features
            </p>
          </div>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />

      <Link href="/docs/models">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">Explore All Supported Models →</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">See the 12+ AI models available on Machine</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
