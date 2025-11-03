'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, TrendingUp, BarChart3, PieChart, ArrowRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Compare' }
];

const comparisonScenarios = [
  {
    title: "I need to automate emails",
    machine: "Perfect! ✓ Full workflow automation, multiple models, monitoring",
    manus: "Not ideal - No automation features",
    genspark: "Not suitable - No automation"
  },
  {
    title: "I need deep reasoning & analysis",
    machine: "Great! Advanced reasoning via 12+ models",
    manus: "Perfect! Specialized for reasoning",
    genspark: "Basic - Single model only"
  },
  {
    title: "I'm on a tight budget",
    machine: "Excellent! Pay-as-you-go, no lock-in, start free",
    manus: "Expensive - Free plan has 1K starter credits + 300/day, then paid tiers start at $19/mo",
    genspark: "Free option available - 100 credits/month free tier"
  },
  {
    title: "I need to scale to enterprise",
    machine: "Built for it! Millions/day, full enterprise features",
    manus: "Moderate scaling only",
    genspark: "Not scalable - Single user only"
  },
  {
    title: "I want multiple AI model choices",
    machine: "Yes! 12+ models to choose from",
    manus: "Limited - 2-3 models",
    genspark: "No - 1 model only"
  }
];

export default function ComparisonChartPage() {
  const [selectedScenario, setSelectedScenario] = React.useState(0);
  const scenario = comparisonScenarios[selectedScenario];

  return (
    <>
      <DocsHeader
        title="Comparison Charts"
        subtitle="Visual comparison of Machine AI vs competitors"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="quick-comparison">💬 Quick Comparison</h2>

        <div className="mb-8">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select a scenario:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {comparisonScenarios.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedScenario(idx)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    selectedScenario === idx
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-300 dark:border-gray-700 hover:border-blue-300 bg-gray-50 dark:bg-gray-900/20'
                  }`}
                >
                  <p className="text-sm font-medium">{s.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-600 rounded-lg p-4">
              <p className="flex items-start gap-2">
                <span className="font-bold text-blue-600 flex-shrink-0">Machine:</span>
                <span className="text-gray-700 dark:text-gray-300">{scenario.machine}</span>
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-600 rounded-lg p-4">
              <p className="flex items-start gap-2">
                <span className="font-bold text-orange-600 flex-shrink-0">Manus:</span>
                <span className="text-gray-700 dark:text-gray-300">{scenario.manus}</span>
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-600 rounded-lg p-4">
              <p className="flex items-start gap-2">
                <span className="font-bold text-purple-600 flex-shrink-0">Genspark:</span>
                <span className="text-gray-700 dark:text-gray-300">{scenario.genspark}</span>
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <h2 id="feature-comparison">📊 Feature Comparison Matrix</h2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <th className="border border-gray-300 p-4 text-left font-semibold">Feature</th>
                <th className="border border-gray-300 p-4 text-center font-semibold">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">⚡</span>
                    <span>Machine</span>
                  </div>
                </th>
                <th className="border border-gray-300 p-4 text-center font-semibold">Manus</th>
                <th className="border border-gray-300 p-4 text-center font-semibold">Genspark</th>
              </tr>
            </thead>
            <tbody>
              {/* Automation */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Workflow Automation</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
              </tr>

              {/* Model Selection */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Multiple AI Models</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm font-semibold text-green-600">12+</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm text-gray-600">2-3</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm text-red-600">1</span></td>
              </tr>

              {/* API Access */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">API & Integrations</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm text-gray-600">Limited</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
              </tr>

              {/* Enterprise Ready */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Enterprise Ready</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
              </tr>

              {/* Monitoring */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Analytics & Monitoring</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm text-gray-600">Basic</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
              </tr>

              {/* Team Management */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Team Collaboration</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
              </tr>

              {/* Scalability */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Enterprise Scale</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm font-semibold text-green-600">Millions/day</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm text-gray-600">Moderate</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-sm text-red-600">Single user</span></td>
              </tr>

              {/* Pricing Model */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Pricing Model</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-xs font-semibold text-green-600">Pay-as-you-go</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-xs text-gray-600">Subscription</span></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><span className="text-xs text-blue-600">Free</span></td>
              </tr>

              {/* Vision Capabilities */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-4 font-semibold bg-gray-50 dark:bg-gray-900/20">Vision Support</td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
                <td className="border border-gray-300 dark:border-gray-700 p-4 text-center"><XCircle className="w-6 h-6 text-red-600 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="pricing-chart">💰 Pricing Comparison Chart</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 rounded-xl border-2 border-blue-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1 text-blue-600">Machine AI</h3>
              <p className="text-3xl font-bold mb-2">From $19.99/mo</p>
              <div className="space-y-2 text-sm mb-4">
                <p>• Unlimited connections</p>
                <p>• Custom integrations</p>
                <p>• Granular tool control</p>
                <p className="font-semibold text-green-600">Full agent customization</p>
              </div>
              <div className="h-32 bg-gradient-to-t from-blue-200/50 to-transparent rounded-lg flex items-end justify-around p-2">
                <div className="w-2 h-4 bg-blue-600 rounded"></div>
                <div className="w-2 h-8 bg-blue-600 rounded"></div>
                <div className="w-2 h-12 bg-blue-600 rounded"></div>
                <div className="w-2 h-16 bg-blue-600 rounded"></div>
                <div className="w-2 h-20 bg-blue-600 rounded"></div>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl border-2 border-orange-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1 text-orange-600">Manus</h3>
              <p className="text-3xl font-bold mb-2">Credit-Based</p>
              <div className="space-y-2 text-sm mb-4">
                <p>• Free: 1K + 300/day</p>
                <p>• Basic: $19/mo (1.9K)</p>
                <p>• Plus: $39/mo (3.9K)</p>
                <p>• Pro: $199/mo (19.9K)</p>
                <p className="font-semibold text-orange-600">Concurrency: 2-5 tasks</p>
              </div>
              <div className="h-32 bg-gradient-to-t from-orange-200/50 to-transparent rounded-lg flex items-end justify-around p-2">
                <div className="w-2 h-6 bg-orange-600 rounded"></div>
                <div className="w-2 h-10 bg-orange-600 rounded"></div>
                <div className="w-2 h-14 bg-orange-600 rounded"></div>
                <div className="w-2 h-18 bg-orange-600 rounded"></div>
                <div className="w-2 h-20 bg-orange-600 rounded"></div>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-xl border-2 border-purple-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1 text-purple-600">Genspark</h3>
              <p className="text-3xl font-bold mb-2">Tiered Plans</p>
              <div className="space-y-2 text-sm mb-4">
                <p>• Free: $0/mo (100 credits)</p>
                <p>• Plus: $24.99/mo (10K credits)</p>
                <p>• Pro: $249.99/mo (125K credits)</p>
                <p className="font-semibold text-purple-600">Credit-based system</p>
              </div>
              <div className="h-32 bg-gradient-to-t from-purple-200/50 to-transparent rounded-lg flex items-end justify-around p-2">
                <div className="w-2 h-4 bg-purple-600 rounded"></div>
                <div className="w-2 h-8 bg-purple-600 rounded"></div>
                <div className="w-2 h-12 bg-purple-600 rounded"></div>
                <div className="w-2 h-16 bg-purple-600 rounded"></div>
                <div className="w-2 h-20 bg-purple-600 rounded"></div>
              </div>
            </div>
          </Card>
        </div>

        <h2 id="capabilities-radar">🎯 Key Capabilities</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Machine AI</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">12+</div>
                  <span className="text-sm">AI Models</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">✓</div>
                  <span className="text-sm">Automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">✓</div>
                  <span className="text-sm">Enterprise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">✓</div>
                  <span className="text-sm">Analytics</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="font-semibold text-orange-900 dark:text-orange-200 mb-3">Manus</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">2-3</div>
                  <span className="text-sm">AI Models</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">✗</div>
                  <span className="text-sm">Automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">✗</div>
                  <span className="text-sm">Enterprise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white">~</div>
                  <span className="text-sm">Basic Analytics</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="font-semibold text-purple-900 dark:text-purple-200 mb-3">Genspark</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">1</div>
                  <span className="text-sm">AI Model</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">✗</div>
                  <span className="text-sm">Automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">✗</div>
                  <span className="text-sm">Enterprise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">✗</div>
                  <span className="text-sm">Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 id="use-case-comparison">🎯 Use Cases at a Glance</h2>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-blue-900 dark:text-blue-200">Machine AI Best For</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Email automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Lead qualification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Document processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Enterprise automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Multi-step workflows</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-orange-900 dark:text-orange-200">Manus Best For</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Deep research</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Reasoning tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Intelligence gathering</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Analysis work</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Problem solving</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-purple-900 dark:text-purple-200">Genspark Best For</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Quick research</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Personal use</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Educational purposes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Hobby projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Private processing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 id="scale-comparison">📈 Scale & Performance</h2>

        <div className="space-y-6 mb-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Machine AI - Handles millions/day</span>
              <span className="text-sm text-green-600 font-bold">100%</span>
            </div>
            <div className="h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg"></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Manus - Moderate scale</span>
              <span className="text-sm text-orange-600 font-bold">40%</span>
            </div>
            <div className="h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg" style={{ width: '40%' }}></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Genspark - Single user</span>
              <span className="text-sm text-purple-600 font-bold">15%</span>
            </div>
            <div className="h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg" style={{ width: '15%' }}></div>
          </div>
        </div>

        <h2 id="bottom-line">🏆 The Bottom Line</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
            <h3 className="font-bold text-lg text-green-900 dark:text-green-200 mb-4">Choose Machine If You Need:</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>✅ Business process automation</li>
              <li>✅ Multiple AI model options</li>
              <li>✅ Enterprise-grade features</li>
              <li>✅ Cost-effective scaling</li>
              <li>✅ Full monitoring & analytics</li>
              <li>✅ Team collaboration tools</li>
            </ul>
          </Card>

          <Card className="p-6 rounded-xl border-2 border-gray-400">
            <h3 className="font-bold text-lg mb-4">Other Platforms Are Better If You Need:</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-orange-600 mb-1">Manus:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Deep research, reasoning, analysis</p>
              </div>
              <div>
                <p className="font-semibold text-purple-600 mb-1">Genspark:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Personal, free, lightweight research</p>
              </div>
            </div>
          </Card>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />

      <Link href="/docs/why-machine">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">Read Full Comparison →</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed feature-by-feature breakdown</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
