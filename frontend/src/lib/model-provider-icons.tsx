import React from 'react';
import Image from 'next/image';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'moonshotai'
  | 'zhipu'
  | 'meta'
  | 'minimax'
  | 'bedrock'
  | 'openrouter';

/**
 * Get the provider from a model ID
 */
export function getModelProvider(modelId: string): ModelProvider {
  const lower = modelId.toLowerCase();

  if (lower.includes('anthropic') || lower.includes('claude')) {
    return 'anthropic';
  }
  if (lower.includes('openai') || lower.includes('gpt')) {
    return 'openai';
  }
  if (lower.includes('google') || lower.includes('gemini')) {
    return 'google';
  }
  if (lower.includes('xai') || lower.includes('grok')) {
    return 'xai';
  }
  if (lower.includes('moonshotai') || lower.includes('kimi')) {
    return 'moonshotai';
  }
  if (lower.includes('z-ai') || lower.includes('glm')) {
    return 'zhipu';
  }
  if (lower.includes('meta-llama') || lower.includes('llama')) {
    return 'meta';
  }
  if (lower.includes('minimax')) {
    return 'minimax';
  }
  if (lower.includes('bedrock')) {
    return 'bedrock';
  }
  if (lower.includes('openrouter')) {
    return 'openrouter';
  }

  // Default fallback - try to extract provider from model ID format "provider/model"
  const parts = modelId.split('/');
  if (parts.length > 1) {
    const provider = parts[0].toLowerCase();
    if (['openai', 'anthropic', 'google', 'xai', 'moonshotai'].includes(provider)) {
      return provider as ModelProvider;
    }
  }

  return 'openai'; // Default fallback
}

/**
 * Component to render the model provider icon
 */
interface ModelProviderIconProps {
  modelId: string;
  size?: number;
  className?: string;
  variant?: 'default' | 'compact';
}

export function ModelProviderIcon({
  modelId,
  size = 24,
  className = '',
  variant = 'default'
}: ModelProviderIconProps) {
  const provider = getModelProvider(modelId);

  const iconMap: Record<ModelProvider, string> = {
    anthropic: '/images/models/Anthropic.svg',
    openai: '/images/models/OAI.svg',
    google: '/images/models/Gemini.svg',
    xai: '/images/models/Grok.svg',
    moonshotai: '/images/models/Moonshot.svg',
    zhipu: '/images/models/OAI.svg', // Use default for now
    meta: '/images/models/OAI.svg', // Use default for now
    minimax: '/images/models/OAI.svg', // Use default for now
    bedrock: '/images/models/Anthropic.svg',
    openrouter: '/images/models/OAI.svg',
  };

  const iconSrc = iconMap[provider];

  // Calculate responsive border radius
  const borderRadiusStyle = {
    borderRadius: `${Math.min(size * 0.25, 16)}px`
  };

  if (!iconSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-card border flex-shrink-0",
          className
        )}
        style={{ width: size, height: size, ...borderRadiusStyle }}
      >
        <Cpu size={size * 0.6} className="text-muted-foreground dark:text-zinc-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-card border flex-shrink-0",
        className
      )}
      style={{ width: size, height: size, ...borderRadiusStyle }}
    >
      <Image
        src={iconSrc}
        alt={`${provider} icon`}
        width={size * 0.6}
        height={size * 0.6}
        className="object-contain dark:brightness-0 dark:invert"
        style={{ width: size * 0.6, height: size * 0.6 }}
      />
    </div>
  );
}

/**
 * Get the provider display name
 */
export function getModelProviderName(modelId: string): string {
  const provider = getModelProvider(modelId);

  const nameMap: Record<ModelProvider, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    xai: 'xAI',
    moonshotai: 'Moonshot AI',
    zhipu: 'Zhipu AI',
    meta: 'Meta',
    minimax: 'Minimax',
    bedrock: 'AWS Bedrock',
    openrouter: 'OpenRouter',
  };

  return nameMap[provider] || 'Unknown';
}
