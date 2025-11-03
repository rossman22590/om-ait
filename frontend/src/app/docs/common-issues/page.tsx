'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Common Issues' }
];

export default function CommonIssuesPage() {
  return (
    <>
      <DocsHeader
        title="Common Issues & Troubleshooting"
        subtitle="Solutions to the most common problems users encounter"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Getting Help</h2>
        <p className="mb-4">
          Having trouble with your agent or the platform? This page covers the most common issues and how to fix them. If you can't find your answer here, check our <Link href="/docs/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Dashboard Guide</Link> or <Link href="/docs/agent-management" className="text-blue-600 dark:text-blue-400 hover:underline">Agent Management</Link> pages.
        </p>

        <h2 id="agent-creation">Agent Creation & Configuration</h2>

        <div className="space-y-4 mb-6">
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">"Invalid configuration" Error</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              This error appears when a required field is missing or invalid.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Common fixes (try in order):</p>
              <ol className="text-sm space-y-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">
                <li>Make sure Agent Name is at least 3 characters</li>
                <li>Check that you selected at least ONE tool</li>
                <li>Verify Instructions field is NOT empty (paste system prompt)</li>
                <li>Clear browser cache (Ctrl+Shift+Delete) and reload</li>
                <li>Try a different browser temporarily</li>
                <li>If still stuck, contact support with screenshot</li>
              </ol>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 Tip: All three fields (Name, Tools, Instructions) are required before saving.
            </p>
          </div>

          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">Agent not responding after deployment</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your agent deployed but isn't producing output.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Solutions:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li><strong>Check instructions clarity:</strong> Agent instructions might be too vague. Use specific, step-by-step prompts</li>
                <li><strong>Verify tools are enabled:</strong> If using Web Search, make sure it's checked in Tools section</li>
                <li><strong>Test with simpler input:</strong> Try a basic test case to isolate the issue</li>
                <li><strong>Review logs:</strong> Check agent logs for error messages (Dashboard → Agents → Click agent → Logs tab)</li>
                <li><strong>Recreate agent:</strong> If all else fails, create a new agent with simpler instructions first</li>
              </ul>
            </div>
          </div>

          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">Tools not working properly</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              You enabled a tool but it's not functioning as expected.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Troubleshooting by tool:</p>
              <ul className="text-sm space-y-2 ml-4 text-gray-700 dark:text-gray-300">
                <li><strong>Email tool:</strong> Verify email account is properly connected in Settings</li>
                <li><strong>Web Search:</strong> Make sure query is specific enough. Generic searches may return poor results</li>
                <li><strong>File Handler:</strong> Ensure file is in supported format (PDF, CSV, TXT, JSON)</li>
                <li><strong>Calendar:</strong> Check that calendar access is granted in Settings</li>
                <li><strong>Data Analysis:</strong> Verify data structure is valid and not corrupted</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 id="agent-performance">Agent Performance & Costs</h2>

        <div className="space-y-4 mb-6">
          <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-6 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-start gap-3 mb-3">
              <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">Agent is slow or taking too long</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your agent is running but taking longer than expected.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Performance improvements:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li><strong>Disable unused tools:</strong> Each tool adds latency. Only enable what you need</li>
                <li><strong>Simplify instructions:</strong> Shorter, clearer instructions = faster execution</li>
                <li><strong>Use specific prompts:</strong> "Find CEO name" is faster than "Research the company"</li>
                <li><strong>Reduce web searches:</strong> Web Search is slower. Minimize requests if possible</li>
                <li><strong>Break into steps:</strong> Complex tasks: create multiple smaller agents instead of one big one</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 Typical speed: Simple agents 5-10 seconds, Medium 15-30 seconds, Complex 30-60 seconds
            </p>
          </div>

          <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-6 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-start gap-3 mb-3">
              <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">Agent is using too many credits</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your agent works but costs are higher than expected.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Cost optimization:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li><strong>Disable Web Search:</strong> This is the most expensive tool. Only enable if critical</li>
                <li><strong>Cache results:</strong> If running same query repeatedly, save and reuse results</li>
                <li><strong>Smaller models:</strong> Use GPT-4o Mini instead of GPT-4o when appropriate</li>
                <li><strong>Batch processing:</strong> Process 50 items in one run vs 50 individual runs</li>
                <li><strong>Analyze usage:</strong> Dashboard shows cost per agent. Kill expensive agents</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 Expected costs: Simple text task ~$0.01, Web search ~$0.05, File analysis ~$0.02
            </p>
          </div>
        </div>

        <h2 id="account-billing">Account & Billing</h2>

        <div className="space-y-4 mb-6">
          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Out of credits / Can't run agents</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your credits are depleted and agents won't run.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ How to fix:</p>
              <ol className="text-sm space-y-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">
                <li>Go to Dashboard → Settings → Billing</li>
                <li>Click "Add Credits" or "Purchase Credits"</li>
                <li>Select amount ($5, $20, $50, $100)</li>
                <li>Complete payment via Stripe</li>
                <li>Credits appear immediately</li>
              </ol>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 Free tier users get $2 starting credits. Pro subscribers get $100/month included.
            </p>
          </div>

          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Payment declined / Can't purchase credits</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Your payment method isn't working.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Solutions:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li>Verify card has sufficient funds</li>
                <li>Check if card is expired or blocked by bank</li>
                <li>Try a different payment method</li>
                <li>Contact your bank to approve the transaction</li>
                <li>If using international card, check if supported</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 id="integration-issues">Integration & Connection Problems</h2>

        <div className="space-y-4 mb-6">
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">Can't connect email or calendar</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Connection to email or calendar service is failing.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Connection steps:</p>
              <ol className="text-sm space-y-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">
                <li>Go to Settings → Integrations</li>
                <li>Click "Connect" for Email or Calendar</li>
                <li>You'll be redirected to the provider (Gmail, Outlook, etc.)</li>
                <li>Approve access when prompted</li>
                <li>You'll be redirected back to confirm</li>
              </ol>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">🔴 If it still doesn't work:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li>Clear browser cache and try again</li>
                <li>Try a different browser</li>
                <li>For Gmail: You may need to enable "Less secure app access"</li>
                <li>For Outlook: Check if your account has 2FA enabled</li>
                <li>Contact support if still having issues</li>
              </ul>
            </div>
          </div>

          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">Webhook not triggering agent</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              You set up a webhook but the agent isn't running automatically.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Debugging steps:</p>
              <ol className="text-sm space-y-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">
                <li>Copy webhook URL from Dashboard → Agent → Webhooks</li>
                <li>Test webhook manually (use Postman or curl)</li>
                <li>Check agent logs for failed triggers</li>
                <li>Verify webhook payload format matches expected</li>
                <li>Make sure agent isn't in "paused" state</li>
              </ol>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 Webhook should respond within 30 seconds. Longer delays may cause timeout.
            </p>
          </div>
        </div>

        <h2 id="data-issues">Data & File Problems</h2>

        <div className="space-y-4 mb-6">
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">File upload failed or format not supported</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Can't upload a file or agent can't process it.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Supported formats:</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Documents:</strong> PDF, TXT, DOCX, MD
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Data:</strong> CSV, JSON, Excel (XLS, XLSX)
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Images:</strong> PNG, JPG, JPEG, GIF
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Max size:</strong> 25 MB per file
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded p-4">
              <p className="text-sm font-medium mb-2">✅ Common fixes:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li>Verify file format is correct (not .zip or .rar)</li>
                <li>Check file size is under 25 MB</li>
                <li>If CSV/Excel: Make sure data is clean (no special characters)</li>
                <li>PDF: Ensure it's not scanned image (needs OCR)</li>
                <li>Try renaming file without spaces or special chars</li>
              </ul>
            </div>
          </div>

          <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-red-900 dark:text-red-200">Agent producing incorrect or incomplete output</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Agent runs successfully but output is wrong or partial.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded p-4 mb-3">
              <p className="text-sm font-medium mb-2">✅ Improvement strategies:</p>
              <ul className="text-sm space-y-2 ml-4 list-disc text-gray-700 dark:text-gray-300">
                <li><strong>Refine instructions:</strong> Be more specific about format and details needed</li>
                <li><strong>Add examples:</strong> Show agent what good output looks like</li>
                <li><strong>Simplify task:</strong> Break complex requests into multiple agents</li>
                <li><strong>Use better model:</strong> Try GPT-4o instead of GPT-4o Mini</li>
                <li><strong>Adjust temperature:</strong> Lower = more consistent, Higher = more creative</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 id="getting-support">Getting Additional Support</h2>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Before contacting support, try:</h3>
          </div>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Check this troubleshooting page</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Read the relevant guide (Dashboard, Agent Management, etc.)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Clear browser cache and try again</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Check agent logs for error messages</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Try with a fresh/simpler agent to isolate issue</span>
            </li>
          </ul>

          <Separator className="my-4" />

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>When contacting support, include:</strong>
          </p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Your account email</li>
            <li>• Agent name/ID if related to specific agent</li>
            <li>• Screenshot of error or problematic output</li>
            <li>• Steps you've already tried</li>
            <li>• Browser type and version</li>
          </ul>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />

      <Link href="/docs/agent-management">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">← Back to Agent Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to create and manage agents</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
