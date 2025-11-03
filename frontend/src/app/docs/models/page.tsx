'use client';

import * as React from 'react';
import {
  DocsHeader,
  DocsBody,
} from '@/components/ui/docs-index';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowRight, Zap, DollarSign, Brain, Zap as Lightning } from 'lucide-react';
import Link from 'next/link';

const breadcrumbs = [
  { title: 'Documentation', onClick: () => window.location.href = '/docs' },
  { title: 'AI Models' }
];

function ModelCard({
  name,
  company,
  description,
  strengths,
  weaknesses,
  costTier,
  speed,
  reasoning,
  useCases,
  tags,
}: {
  name: string;
  company: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  costTier: 'Budget' | 'Standard' | 'Premium';
  speed: 'Fast' | 'Medium' | 'Slow';
  reasoning: string;
  useCases: string[];
  tags: string[];
}) {
  const costColors = {
    Budget: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    Standard: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    Premium: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  const speedIcons = {
    Fast: '⚡ Fast',
    Medium: '🔋 Medium',
    Slow: '🐢 Slow',
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6 bg-gray-50 dark:bg-gray-900/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold mb-1">{name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">by {company}</p>
        </div>
        <div className="text-right">
          <div className={`inline-block px-3 py-1 rounded text-xs font-medium mb-2 ${costColors[costTier]}`}>
            {costTier}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{speedIcons[speed]}</div>
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4">{description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">✅ Strengths:</p>
          <ul className="text-sm space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">⚠️ Weaknesses:</p>
          <ul className="text-sm space-y-1">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
        <p className="text-sm font-medium mb-1 text-blue-900 dark:text-blue-200">🧠 Reasoning Ability:</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{reasoning}</p>
      </div>

      <div className="mb-4">
        <p className="font-semibold text-sm mb-2">🎯 Best For:</p>
        <div className="flex flex-wrap gap-2">
          {useCases.map((useCase, i) => (
            <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {useCase}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span key={i} className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ModelsPage() {
  return (
    <>
      <DocsHeader
        title="AI Models Guide"
        subtitle="Understand each model and choose the right one for your agent"
        breadcrumbs={breadcrumbs}
        lastUpdated="November 2025"
        showSeparator
        size="lg"
        className="mb-8 sm:mb-12"
      />

      <DocsBody className="mb-8">
        <h2 id="overview">Choosing the Right Model</h2>
        <p className="mb-4">
          Different models have different strengths. This guide explains what each model is good for, how much it costs, and when to use it.
        </p>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <p className="font-semibold mb-2">💡 Quick Decision Guide:</p>
          <ul className="space-y-2 text-sm">
            <li><strong>Need the best reasoning?</strong> → Claude Sonnet 4.5 ($3/$15 per M tokens - best for complex tasks)</li>
            <li><strong>Best value & speed?</strong> → GPT-5 Mini ($0.25/$2 per M tokens - recommended for most use cases)</li>
            <li><strong>Ultra budget-conscious?</strong> → GPT-5 Nano ($0.05/$0.40 per M tokens - cheapest option)</li>
            <li><strong>Long document analysis?</strong> → Gemini 2.5 Pro (2M context window, $1.25/$10 per M tokens)</li>
            <li><strong>Speed critical & low cost?</strong> → Grok 4 Fast ($0.20/$0.50 per M tokens - excellent balance)</li>
            <li><strong>Production automation at scale?</strong> → Gemini 2.5 Flash ($0.30/$2.50 per M tokens - fastest & efficient)</li>
          </ul>
        </div>

        <h2 id="gpt-5">🔵 GPT-5 (Premium Choice)</h2>
        
        <ModelCard
          name="GPT-5"
          company="OpenAI"
          description="The most capable model from OpenAI. Excellent at complex reasoning, detailed analysis, and nuanced understanding. Best choice when you want superior output quality."
          strengths={[
            'Best reasoning and problem-solving',
            'Understands complex instructions',
            'Excellent at creative tasks',
            'Handles nuance and context well',
            'Good with code and technical writing',
            'Better at following detailed workflows',
            '400K token context window',
          ]}
          weaknesses={[
            'Most expensive option ($1.25/$10 per M tokens)',
            'Slower than lightweight models',
            'Overkill for simple tasks (wastes money)',
          ]}
          costTier="Premium"
          speed="Medium"
          reasoning="Excellent - Can reason through complex multi-step problems. Handles edge cases and exceptions well."
          useCases={[
            'Complex data analysis',
            'Strategic planning',
            'Creative content',
            'Code generation',
            'Document summarization',
            'Business decision making',
          ]}
          tags={[
            'best-quality',
            'complex-reasoning',
            'analysis',
            'premium',
            'recommended',
            'for-complex-agents',
          ]}
        />

        <h2 id="gpt-5-mini">🟢 GPT-5 Mini (Recommended for Most)</h2>

        <ModelCard
          name="GPT-5 Mini"
          company="OpenAI"
          description="Smaller, faster, cheaper version of GPT-5. Excellent for most tasks. Great for production at scale. The sweet spot for cost vs quality ($0.25/$2 per M tokens)."
          strengths={[
            'Fast performance',
            'Most cost-effective ($0.25 input, $2 output per M)',
            'Still very capable for most tasks',
            'Great for production workloads',
            'Excellent for high-volume automation',
            'Perfect for learning and testing',
            '400K token context window',
          ]}
          weaknesses={[
            'Slightly less nuanced than GPT-5',
            'May struggle with very complex reasoning',
            'Not as good at creative writing',
            'Can miss subtle context sometimes',
          ]}
          costTier="Standard"
          speed="Fast"
          reasoning="Good - Can handle most reasoning tasks. Best for structured, step-by-step workflows. May need more explicit instructions than GPT-5."
          useCases={[
            'Email responses',
            'Data extraction',
            'Simple classifications',
            'Lead qualification',
            'Customer support',
            'Invoice processing',
            'Report generation',
            'High-volume automation',
          ]}
          tags={[
            'cost-effective',
            'fast',
            'production-ready',
            'recommended-for-most',
            'high-volume',
            'best-value',
          ]}
        />

        <h2 id="all-models">📚 Complete Model Reference</h2>

        <p className="mb-6 text-gray-700 dark:text-gray-300">
          We support a wide range of AI models from multiple providers. Here's the complete list with pricing and capabilities:
        </p>

        <ModelCard
          name="Claude Sonnet 4.5"
          company="Anthropic (via OpenRouter)"
          description="Premium flagship model with exceptional reasoning, vision, and thinking capabilities. Best-in-class for complex analysis."
          strengths={[
            'Best reasoning and problem-solving',
            'Excellent with complex analysis',
            'Strong vision capabilities',
            'Advanced thinking mode',
            '1M token context window',
          ]}
          weaknesses={[
            'Most expensive option',
            'Slower than lighter models',
            'Overkill for simple tasks',
          ]}
          costTier="Premium"
          speed="Slow"
          reasoning="Excellent - Advanced reasoning with thinking mode, handles complex multi-step problems exceptionally well."
          useCases={[
            'Complex analysis',
            'Strategic planning',
            'Advanced reasoning',
            'Research synthesis',
          ]}
          tags={[
            'premium',
            'best-reasoning',
            'vision',
            'thinking-mode',
            'openrouter',
          ]}
        />

        <ModelCard
          name="Claude Haiku 4.5"
          company="Anthropic (via OpenRouter)"
          description="Fast and efficient. Great balance of speed and quality. Perfect for production systems with cost sensitivity."
          strengths={[
            'Excellent speed',
            'Very affordable',
            'Good quality for the price',
            'Vision capabilities',
            '200K token context',
          ]}
          weaknesses={[
            'Less capable than Sonnet',
            'Limited to function calling and basic vision',
          ]}
          costTier="Budget"
          speed="Fast"
          reasoning="Good - Solid reasoning for most use cases, well-optimized for production."
          useCases={[
            'Production systems',
            'Customer support',
            'Content moderation',
            'Data classification',
          ]}
          tags={[
            'fast',
            'affordable',
            'production-ready',
            'vision',
            'recommended',
            'free-tier',
          ]}
        />

        <ModelCard
          name="GPT-5"
          company="OpenAI"
          description="OpenAI's most powerful flagship model. Cutting-edge capabilities including vision and structured output."
          strengths={[
            'Most advanced reasoning',
            'Excellent vision capabilities',
            'Structured output support',
            '400K token context',
            'Best-in-class performance',
          ]}
          weaknesses={[
            'Most expensive',
            'Not available on free tier',
          ]}
          costTier="Premium"
          speed="Medium"
          reasoning="Excellent - Top-tier reasoning across all domains, handles edge cases beautifully."
          useCases={[
            'Complex analysis',
            'Vision-based tasks',
            'Structured data generation',
            'Research',
          ]}
          tags={[
            'premium',
            'latest-openai',
            'vision',
            'structured-output',
            'highest-performance',
          ]}
        />

        <ModelCard
          name="GPT-5 Mini"
          company="OpenAI"
          description="Lighter version of GPT-5 with solid performance and faster speeds. Great balance for most tasks."
          strengths={[
            'Significantly cheaper than GPT-5',
            'Faster inference',
            'Structured output support',
            '400K token context',
            'Still very capable',
          ]}
          weaknesses={[
            'Less advanced than GPT-5',
            'Not as good with complex vision tasks',
          ]}
          costTier="Standard"
          speed="Fast"
          reasoning="Good - Strong reasoning capabilities, best for structured workflows."
          useCases={[
            'General tasks',
            'Data extraction',
            'Structured output',
            'Standard automation',
          ]}
          tags={[
            'balanced',
            'fast',
            'openai',
            'free-tier',
            'structured-output',
          ]}
        />

        <ModelCard
          name="GPT-5 Nano"
          company="OpenAI"
          description="The lightest and fastest option in the GPT-5 family. Perfect for high-volume, latency-critical applications."
          strengths={[
            'Cheapest available model',
            'Fastest inference time',
            'Still capable for basic tasks',
            'Structured output support',
            '400K token context',
          ]}
          weaknesses={[
            'Limited reasoning',
            'Basic tasks only',
            'No vision capabilities',
          ]}
          costTier="Budget"
          speed="Fast"
          reasoning="Basic - Good for simple, straightforward tasks. Not for complex reasoning."
          useCases={[
            'High-volume automation',
            'Real-time applications',
            'Cost-sensitive projects',
            'Simple classifications',
          ]}
          tags={[
            'cheapest',
            'fastest',
            'free-tier',
            'high-volume',
            'minimal-reasoning',
          ]}
        />

        <ModelCard
          name="GPT-5 Codex"
          company="OpenAI (via OpenRouter)"
          description="Specialized for code generation and technical tasks. Excellent understanding of programming across many languages."
          strengths={[
            'Exceptional code generation',
            'Understands complex codebases',
            'Structured output support',
            '400K token context',
            'Technical expertise',
          ]}
          weaknesses={[
            'Optimized for code, not general tasks',
            'More expensive',
          ]}
          costTier="Premium"
          speed="Medium"
          reasoning="Excellent - Top-tier reasoning specifically for technical problems."
          useCases={[
            'Code generation',
            'Bug fixing',
            'Code review',
            'Technical documentation',
            'Architecture design',
          ]}
          tags={[
            'code-specialized',
            'technical',
            'premium',
            'developers',
            'structured-output',
          ]}
        />

        <ModelCard
          name="Gemini 2.5 Pro"
          company="Google (via OpenRouter)"
          description="Google's premium model with advanced reasoning and multimodal capabilities. 2M token context window."
          strengths={[
            'Massive 2M token context',
            'Excellent multimodal (vision, audio)',
            'Structured output support',
            'Strong reasoning',
            'Advanced capabilities',
          ]}
          weaknesses={[
            'Relatively expensive',
            'Sometimes verbose outputs',
          ]}
          costTier="Premium"
          speed="Medium"
          reasoning="Excellent - Strong reasoning with advanced understanding of context."
          useCases={[
            'Long document analysis',
            'Multimodal tasks',
            'Video analysis',
            'Complex reasoning',
            'Advanced research',
          ]}
          tags={[
            'premium',
            'multimodal',
            'huge-context',
            'structured-output',
            'vision',
          ]}
        />

        <ModelCard
          name="Gemini 2.5 Flash"
          company="Google (via OpenRouter)"
          description="Fast alternative to Pro with strong capabilities. Great for latency-sensitive applications."
          strengths={[
            'Very fast inference',
            'Multimodal capabilities',
            'Large context (1M tokens)',
            'Structured output support',
            'Great value',
          ]}
          weaknesses={[
            'Less advanced than Pro',
            'Not ideal for ultra-complex reasoning',
          ]}
          costTier="Standard"
          speed="Fast"
          reasoning="Good - Solid reasoning, especially good for multimodal tasks."
          useCases={[
            'Real-time applications',
            'Multimodal analysis',
            'Video understanding',
            'Fast processing needs',
          ]}
          tags={[
            'fast',
            'multimodal',
            'large-context',
            'recommended',
            'free-tier',
            'value',
          ]}
        />

        <ModelCard
          name="Grok 4 Fast"
          company="xAI"
          description="Very fast model with strong capabilities. Huge 2M token context window. Great for high-volume tasks."
          strengths={[
            'Exceptional speed',
            'Massive 2M token context',
            'Very affordable',
            'Good reasoning for speed class',
            'Real-time capable',
          ]}
          weaknesses={[
            'No vision capabilities',
            'Less nuanced than Sonnet/GPT-5',
            'Function calling only',
          ]}
          costTier="Standard"
          speed="Fast"
          reasoning="Good - Solid reasoning optimized for speed."
          useCases={[
            'Real-time applications',
            'High-volume processing',
            'Time-sensitive tasks',
            'Large document processing',
          ]}
          tags={[
            'fast',
            'huge-context',
            'xai',
            'real-time',
            'affordable',
          ]}
        />

        <ModelCard
          name="Llama 4 Scout (Auto)"
          company="Meta (via OpenRouter)"
          description="Auto-routing model that intelligently selects the best compute for each task. Great for cost optimization."
          strengths={[
            'Automatic optimization',
            'Very affordable',
            'Smart task routing',
            'Good performance-to-cost ratio',
            '128K context',
          ]}
          weaknesses={[
            'Less predictable performance',
            'Limited vision/advanced features',
            'Performance varies',
          ]}
          costTier="Budget"
          speed="Fast"
          reasoning="Good - Varies based on auto-routing, generally solid."
          useCases={[
            'Cost-optimized tasks',
            'General automation',
            'Variable workloads',
            'Development/testing',
          ]}
          tags={[
            'auto-routing',
            'cost-optimized',
            'free-tier',
            'meta',
            'smart-routing',
          ]}
        />

        <ModelCard
          name="Kimi K2"
          company="Moonshot AI (via OpenRouter)"
          description="Advanced Chinese-optimized model with excellent reasoning. Strong for multilingual tasks."
          strengths={[
            'Excellent Chinese language',
            'Strong reasoning',
            'Function calling',
            '200K context',
            'Good value',
          ]}
          weaknesses={[
            'Optimized for Chinese',
            'Less widely tested for English',
          ]}
          costTier="Standard"
          speed="Medium"
          reasoning="Good - Solid reasoning, especially for multilingual content."
          useCases={[
            'Chinese language tasks',
            'Multilingual applications',
            'International projects',
            'East Asian market applications',
          ]}
          tags={[
            'multilingual',
            'chinese-optimized',
            'reasoning',
            'free-tier',
            'moonshot',
          ]}
        />

        <ModelCard
          name="GLM 4.6"
          company="Zhipu AI (via OpenRouter)"
          description="Efficient model with good reasoning and broad capability support. Popular in Chinese tech ecosystem."
          strengths={[
            'Very affordable',
            'Good reasoning',
            'Function calling',
            '200K+ context',
            'Efficient',
          ]}
          weaknesses={[
            'Less well-known outside Asia',
            'Fewer use case examples',
          ]}
          costTier="Budget"
          speed="Fast"
          reasoning="Good - Solid reasoning for the price point."
          useCases={[
            'Cost-sensitive applications',
            'Asian market applications',
            'General tasks',
            'Multilingual content',
          ]}
          tags={[
            'affordable',
            'efficient',
            'zhipu-ai',
            'free-tier',
            'reasoning',
          ]}
        />

        <h2 id="comparison">📊 Model Comparison</h2>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-700 p-3 text-left font-semibold">Model</th>
                <th className="border border-gray-300 dark:border-gray-700 p-3 text-left font-semibold">Provider</th>
                <th className="border border-gray-300 dark:border-gray-700 p-3 text-left font-semibold">Input Cost</th>
                <th className="border border-gray-300 dark:border-gray-700 p-3 text-left font-semibold">Output Cost</th>
                <th className="border border-gray-300 dark:border-gray-700 p-3 text-left font-semibold">Context</th>
                <th className="border border-gray-300 dark:border-gray-700 p-3 text-left font-semibold">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Claude Sonnet 4.5</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Anthropic</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">$3.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-orange-600 dark:text-orange-400">$15.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">1M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Vision, Thinking</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Claude Haiku 4.5</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Anthropic</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$1.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$5.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">200K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Vision</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">GPT-5</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">OpenAI</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">$1.25/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-orange-600 dark:text-orange-400">$10.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">400K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Vision, Structured</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">GPT-5 Mini</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">OpenAI</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.25/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$2.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">400K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Structured</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">GPT-5 Nano</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">OpenAI</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.10/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.80/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">400K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Structured</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">GPT-5 Codex</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">OpenAI</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">$1.25/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-orange-600 dark:text-orange-400">$10.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">400K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Structured</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Gemini 2.5 Pro</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Google</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">$1.25/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-orange-600 dark:text-orange-400">$10.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">2M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Vision, Structured</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Gemini 2.5 Flash</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Google</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.30/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$2.50/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">1M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling, Vision, Structured</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Grok 4 Fast</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">xAI</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.20/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.50/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">2M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Llama 4 Scout</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Meta</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.50/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$1.50/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">128K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">Kimi K2</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Moonshot</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$1.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$3.00/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">200K</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="border border-gray-300 dark:border-gray-700 p-3 font-semibold">GLM 4.6</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">Zhipu AI</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$0.50/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-green-600 dark:text-green-400">$1.75/M</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3">200K+</td>
                <td className="border border-gray-300 dark:border-gray-700 p-3 text-xs">Chat, Function Calling</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="cost-examples">💰 Cost Examples</h2>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold mb-2">Example 1: Email Response Agent</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Typical: 200 input tokens + 150 output tokens per email</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">GPT-4o</p>
                <p className="text-gray-600 dark:text-gray-400">~$0.005 per email</p>
                <p className="text-gray-600 dark:text-gray-400">= $0.50 per 100 emails</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">GPT-4o Mini</p>
                <p className="text-green-600 dark:text-green-400">~$0.00015 per email</p>
                <p className="text-green-600 dark:text-green-400">= $0.015 per 100 emails</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold mb-2">Example 2: Document Analysis (5-page document)</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Typical: 3000 input tokens + 500 output tokens</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">GPT-4o</p>
                <p className="text-gray-600 dark:text-gray-400">~$0.030 per document</p>
                <p className="text-gray-600 dark:text-gray-400">= $3.00 per 100 documents</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">GPT-4o Mini</p>
                <p className="text-green-600 dark:text-green-400">~$0.0005 per document</p>
                <p className="text-green-600 dark:text-green-400">= $0.05 per 100 documents</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold mb-2">Example 3: Complex Report Generation</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Typical: 5000 input tokens + 2000 output tokens</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">GPT-4o</p>
                <p className="text-gray-600 dark:text-gray-400">~$0.055 per report</p>
                <p className="text-gray-600 dark:text-gray-400">= $5.50 per 100 reports</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">GPT-4o Mini</p>
                <p className="text-green-600 dark:text-green-400">~$0.0011 per report</p>
                <p className="text-green-600 dark:text-green-400">= $0.11 per 100 reports</p>
              </div>
            </div>
          </div>
        </div>

        <h2 id="choosing-guide">🎯 How to Choose Your Model</h2>

        <div className="space-y-4 mb-6">
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
            <p className="font-semibold text-green-900 dark:text-green-200 mb-2">Use GPT-4o Mini if:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✅ You're just starting out</li>
              <li>✅ Running high-volume operations (100+ tasks/day)</li>
              <li>✅ Task is straightforward (classification, extraction, templated responses)</li>
              <li>✅ Speed is important</li>
              <li>✅ You want to save money</li>
              <li>✅ Using simple, well-structured prompts</li>
            </ul>
          </div>

          <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
            <p className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Use GPT-4o if:</p>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>✅ Task requires complex reasoning or analysis</li>
              <li>✅ You need highest quality output</li>
              <li>✅ Handling creative tasks (writing, brainstorming)</li>
              <li>✅ Complex multi-step workflows</li>
              <li>✅ Need to handle edge cases and exceptions well</li>
              <li>✅ Quality is more important than cost</li>
              <li>✅ Output will be reviewed by humans before using</li>
            </ul>
          </div>
        </div>

        <h2 id="tips">💡 Tips & Best Practices</h2>

        <div className="space-y-3 mb-6">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Start with Mini, upgrade if needed</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build your agent with GPT-4o Mini first. If quality isn't good enough, switch to GPT-4o.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Monitor your spending</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check Dashboard → Billing to see cost per agent. If costs surprise you, switch to Mini or optimize prompts.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Better prompts = good results even with Mini</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">A well-written prompt in Mini often beats a vague prompt in GPT-4o. Invest time in prompt quality.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Mini is 2-3x faster than GPT-4o</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">If speed matters (real-time responses, webhooks), Mini might be better choice.</p>
            </div>
          </div>
        </div>

        <h2 id="token-counting">📝 Understanding Token Usage</h2>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <p className="font-medium mb-2">Rough token estimates:</p>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300 ml-4">
            <li>• ~4 characters = 1 token (rough estimate)</li>
            <li>• Short email = 200-400 tokens</li>
            <li>• One page of text = 300-500 tokens</li>
            <li>• Full document (5-10 pages) = 2000-5000 tokens</li>
            <li>• Simple response = 100-300 tokens</li>
            <li>• Long analysis = 1000+ tokens</li>
          </ul>
        </div>
      </DocsBody>

      <Separator className="my-6 w-full" />

      <Link href="/docs/building-agents">
        <Card className="p-4 group rounded-xl hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold mb-1">← Back to Building Agents</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create and deploy your first agent</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </>
  );
}
