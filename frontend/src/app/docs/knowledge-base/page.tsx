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
  BookOpen,
  Upload,
  Search,
  Brain,
  Shield,
  Zap,
  FileText,
  Link as LinkIcon,
  Database,
  Settings,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'Knowledge Base' }
];

interface StepProps {
  number: number;
  title: string;
  description: string;
  details: string[];
}

function StepCard({ number, title, description, details }: StepProps) {
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

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureProps) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-blue-600 mt-1">{icon}</div>
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <>
      <DocsHeader
        title="Knowledge Base"
        subtitle="Store, organize, and leverage your data with AI agents"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">What is a Knowledge Base?</h2>
        <p className="mb-6">
          A Knowledge Base is a centralized repository where you store documents, data, and information that your AI agents can access and use when processing tasks. Instead of training custom models or hardcoding information, agents can reference your knowledge base to provide accurate, contextual responses.
        </p>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <p className="font-semibold mb-3">🎯 Knowledge Base enables:</p>
          <ul className="space-y-2 text-sm">
            <li>✨ Agents that answer questions about your data</li>
            <li>✨ Document-based customer support automation</li>
            <li>✨ Context-aware decision making in workflows</li>
            <li>✨ Faster agent responses with pre-indexed information</li>
            <li>✨ Compliance-ready document management</li>
            <li>✨ Multi-document semantic search</li>
          </ul>
        </div>

        <h2 id="use-cases">📚 Common Use Cases</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">Customer Support Automation</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Store FAQs, product documentation, and troubleshooting guides. Your agent automatically answers customer questions by searching the knowledge base.
            </p>
          </Card>

          <Card className="p-4 rounded-lg border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
            <h3 className="font-semibold mb-2 text-green-900 dark:text-green-200">Internal Knowledge Management</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Organize company policies, procedures, training materials. Agents help employees find information quickly and consistently.
            </p>
          </Card>

          <Card className="p-4 rounded-lg border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10">
            <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">Legal & Compliance</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Store contracts, compliance documents, and legal frameworks. Agents help review documents and ensure consistency with your policies.
            </p>
          </Card>

          <Card className="p-4 rounded-lg border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10">
            <h3 className="font-semibold mb-2 text-orange-900 dark:text-orange-200">Product Information Database</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Catalog product specs, pricing, features. Agents provide accurate product information to sales teams and customers.
            </p>
          </Card>

          <Card className="p-4 rounded-lg border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-200">Medical & Research</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Index medical records, research papers, case studies. Agents assist in research, diagnosis support, and literature reviews.
            </p>
          </Card>

          <Card className="p-4 rounded-lg border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10">
            <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-200">Code & Technical Docs</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Store API documentation, code examples, architecture diagrams. Agents help developers find solutions quickly.
            </p>
          </Card>
        </div>

        <h2 id="getting-started">🚀 Getting Started with Knowledge Base</h2>

        <StepCard
          number={1}
          title="Access Your Knowledge Base"
          description="Navigate to the Knowledge Base section in your Machine workspace dashboard."
          details={[
            'Open your workspace dashboard',
            'Look for "Knowledge Base" in the left sidebar under your workspace',
            'Click to view your knowledge base',
            'You\'ll see options to upload files, manage documents, and search',
          ]}
        />

        <StepCard
          number={2}
          title="Upload Documents"
          description="Add documents to your knowledge base by uploading files or importing from URLs."
          details={[
            'Click "Add Documents" or "Upload" button',
            'Choose file types: PDF, TXT, DOCX, PPTX, CSV, JSON',
            'Or paste URLs to web pages you want to index',
            'Or paste text content directly',
            'Wait for processing and indexing to complete',
          ]}
        />

        <StepCard
          number={3}
          title="Organize with Collections"
          description="Group related documents into collections for better management and faster search."
          details={[
            'Create new collections (e.g., "Customer Support", "Policies", "Product Docs")',
            'Move documents into relevant collections',
            'Tag documents with keywords for easier discovery',
            'Set access permissions per collection if needed',
          ]}
        />

        <StepCard
          number={4}
          title="Configure Your Agent"
          description="Tell your agent which knowledge base to reference when processing tasks."
          details={[
            'Go to your agent configuration',
            'In "Tools" or "Knowledge" section, enable Knowledge Base',
            'Select which collections the agent should access',
            'Configure search depth and result limits',
            'Test the agent with sample questions',
          ]}
        />

        <StepCard
          number={5}
          title="Test and Monitor"
          description="Verify that your agent is correctly using the knowledge base and refine as needed."
          details={[
            'Test with various questions related to your documents',
            'Review agent responses for accuracy and relevance',
            'Check the "Sources" section to see which documents were referenced',
            'Monitor performance metrics in the analytics dashboard',
            'Update documents regularly to keep information current',
          ]}
        />

        <h2 id="features">⚡ Key Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <FeatureCard
            icon={<Upload className="w-5 h-5" />}
            title="Multiple Upload Methods"
            description="Upload files directly, import from URLs, paste text, or connect to cloud storage."
          />

          <FeatureCard
            icon={<Search className="w-5 h-5" />}
            title="Semantic Search"
            description="Find relevant documents using natural language queries, not just keyword matching."
          />

          <FeatureCard
            icon={<Brain className="w-5 h-5" />}
            title="AI-Powered Indexing"
            description="Documents are automatically indexed and optimized for AI agent comprehension."
          />

          <FeatureCard
            icon={<Database className="w-5 h-5" />}
            title="Unlimited Storage"
            description="Store as much content as you need with no size limits per plan."
          />

          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Access Control"
            description="Manage who can view, edit, and delete documents at the collection level."
          />

          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Real-time Updates"
            description="Changes to documents are immediately reflected in agent responses."
          />

          <FeatureCard
            icon={<FileText className="w-5 h-5" />}
            title="Rich Format Support"
            description="Support for PDF, Word, PowerPoint, Excel, JSON, TXT, and many more formats."
          />

          <FeatureCard
            icon={<LinkIcon className="w-5 h-5" />}
            title="URL Indexing"
            description="Automatically fetch and index content from web pages and APIs."
          />
        </div>

        <h2 id="best-practices">💡 Best Practices</h2>

        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-200">📋 Keep Documents Updated</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Regularly review and update documents in your knowledge base. Outdated information can lead to inaccurate agent responses. Schedule quarterly reviews for critical documents.
            </p>
          </div>

          <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-green-900 dark:text-green-200">🏷️ Use Clear Organization</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Create meaningful collections and use consistent naming. This helps both you and your agents navigate the knowledge base efficiently. Use hierarchical structures for complex information.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-200">🎯 Format for AI</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Use clear headings, bullet points, and structured formats. Avoid scanned images—use searchable PDFs or text files. Well-formatted documents produce better agent responses.
            </p>
          </div>

          <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-orange-900 dark:text-orange-200">🔍 Test Regularly</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Periodically test your agent's ability to find and use information from the knowledge base. Update documents if agents struggle to find relevant content.
            </p>
          </div>

          <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-red-900 dark:text-red-200">🔐 Manage Access Carefully</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Be mindful of sensitive information. Use access controls to restrict confidential documents. Some agents may not need access to all knowledge base collections.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded">
            <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-200">📊 Monitor Analytics</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Track which documents are most frequently used by agents. This data helps you understand what information is most valuable and where to focus updates.
            </p>
          </div>
        </div>

        <h2 id="document-management">📁 Document Management</h2>

        <div className="space-y-4 mb-8">
          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex gap-4">
              <Settings className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Editing Documents</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Keep your knowledge base current by editing documents as needed.
                </p>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Click on any document to open the detail view</li>
                  <li>• Edit text content directly in the editor</li>
                  <li>• Update document metadata (title, description, tags)</li>
                  <li>• Changes are automatically indexed for agent use</li>
                  <li>• View document edit history if needed</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex gap-4">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Deleting Documents</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Remove outdated or no longer needed documents.
                </p>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Select the document you want to remove</li>
                  <li>• Click the delete/trash icon</li>
                  <li>• Confirm deletion (can be reversed within 30 days)</li>
                  <li>• Deleted documents won't appear in agent searches</li>
                  <li>• Use "Archive" instead of delete to preserve history</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex gap-4">
              <Database className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Bulk Operations</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Manage multiple documents efficiently.
                </p>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Select multiple documents using checkboxes</li>
                  <li>• Move multiple files to a different collection</li>
                  <li>• Add tags to multiple documents at once</li>
                  <li>• Change access permissions in bulk</li>
                  <li>• Export multiple documents as a package</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <h2 id="agent-integration">🤖 Integrating with Agents</h2>

        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-4">How Agents Use Knowledge Base</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-sm mb-2">1. Query Understanding</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                When an agent receives a user query, it first determines if knowledge base information would be helpful for answering.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-2">2. Semantic Search</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The agent searches your knowledge base for relevant documents using natural language understanding, not just keyword matching.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-2">3. Context Retrieval</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The top relevant sections from matching documents are retrieved and included in the agent's context.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-2">4. Response Generation</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The agent generates a response based on the user query and the retrieved information, citing sources.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-2">5. Source Attribution</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                The agent includes references to the documents it used, providing traceability and verification.
              </p>
            </div>
          </div>
        </div>

        <h2 id="limitations">⚠️ Limitations & Tips</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-200">Image-Heavy Documents</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Scanned PDFs with mostly images won't be indexed well. Convert to searchable PDFs or add text descriptions.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-200">Document Size</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Very large documents (100+ pages) may be chunked. Organize them into smaller, focused documents for better retrieval.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-200">Language Support</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Knowledge base works best with English content. Other languages are supported but may have lower accuracy.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-200">Specialized Content</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Complex technical or domain-specific content may require more detailed agent prompts to ensure accuracy.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-200">Update Frequency</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Documents are indexed when uploaded. Real-time data should be handled through API integrations instead.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-semibold text-sm mb-2 text-yellow-900 dark:text-yellow-200">Proprietary Formats</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Stick to standard formats (PDF, DOCX, TXT) for best results. Proprietary formats may have limited support.
            </p>
          </div>
        </div>

        <h2 id="faq">❓ Frequently Asked Questions</h2>

        <div className="space-y-4 mb-8">
          <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
            <p className="font-semibold text-sm mb-1">Q: How long does it take to index documents?</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Most documents are indexed within seconds to minutes depending on size. Large documents may take longer. You'll get a notification when indexing is complete.
            </p>
          </div>

          <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 rounded">
            <p className="font-semibold text-sm mb-1">Q: Can agents edit knowledge base documents?</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              No, agents can only read from the knowledge base. You maintain full control over edits and deletions through the dashboard.
            </p>
          </div>

          <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 p-4 rounded">
            <p className="font-semibold text-sm mb-1">Q: Is there a limit to how many documents I can store?</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              No limit on document count. Storage capacity depends on your plan. Check your workspace dashboard for current usage.
            </p>
          </div>

          <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4 rounded">
            <p className="font-semibold text-sm mb-1">Q: How accurate is the semantic search?</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Our AI-powered search is highly accurate for well-organized, clearly written documents. Test with your specific content to see results. Well-formatted documents with clear structure perform best.
            </p>
          </div>

          <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded">
            <p className="font-semibold text-sm mb-1">Q: Can I delete documents permanently?</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Deleted documents go to trash for 30 days before permanent removal. You can recover them during this period. After 30 days, deletion is permanent.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded">
            <p className="font-semibold text-sm mb-1">Q: How do I know which documents an agent used?</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Each agent response includes source citations. You can see which documents were referenced in the "Sources" section of the response details.
            </p>
          </div>
        </div>

        <h2 id="next-steps">🎯 Next Steps</h2>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Ready to build with Knowledge Base?</h3>
          <div className="space-y-3">
            <Link href="/docs/workspace" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              <ArrowRight className="w-4 h-4" />
              Learn about Workspace & Organization
            </Link>
            <Link href="/docs/building-agents" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              <ArrowRight className="w-4 h-4" />
              Build your first agent with Knowledge Base
            </Link>
            <Link href="/docs/models" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              <ArrowRight className="w-4 h-4" />
              Choose the right model for your use case
            </Link>
          </div>
        </div>
      </DocsBody>
    </>
  );
}
