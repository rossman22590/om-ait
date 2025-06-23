import React, { useMemo } from 'react';
import { ToolViewProps } from '../types';
import { GenericToolView } from '../GenericToolView';
import { BrowserToolView } from '../BrowserToolView';
import { CommandToolView } from '../command-tool/CommandToolView';
import { ExposePortToolView } from '../expose-port-tool/ExposePortToolView';
import { FileOperationToolView } from '../file-operation/FileOperationToolView';
import { StrReplaceToolView } from '../str-replace/StrReplaceToolView';
import { WebCrawlToolView } from '../WebCrawlToolView';
import { WebScrapeToolView } from '../web-scrape-tool/WebScrapeToolView';
import { WebSearchToolView } from '../web-search-tool/WebSearchToolView';
import { SeeImageToolView } from '../see-image-tool/SeeImageToolView';
import { TerminateCommandToolView } from '../command-tool/TerminateCommandToolView';
import { AskToolView } from '../ask-tool/AskToolView';
import { CompleteToolView } from '../CompleteToolView';
import { ExecuteDataProviderCallToolView } from '../data-provider-tool/ExecuteDataProviderCallToolView';
import { DataProviderEndpointsToolView } from '../data-provider-tool/DataProviderEndpointsToolView';
import { ImageGenToolView } from '../ImageGenToolView';
import { DeployToolView } from '../DeployToolView';
import AvatarToolView from '../AvatarToolView';

// These are provided by the existing imports

// All custom tool views are now properly imported

export type ToolViewComponent = React.ComponentType<ToolViewProps>;

type ToolViewRegistryType = Record<string, ToolViewComponent>;

const defaultRegistry: ToolViewRegistryType = {
  'browser-navigate-to': BrowserToolView,
  'browser-go-back': BrowserToolView,
  'browser-wait': BrowserToolView,
  'browser-click-element': BrowserToolView,
  'browser-input-text': BrowserToolView,
  'browser-send-keys': BrowserToolView,
  'browser-switch-tab': BrowserToolView,
  'browser-close-tab': BrowserToolView,
  'browser-scroll-down': BrowserToolView,
  'browser-scroll-up': BrowserToolView,
  'browser-scroll-to-text': BrowserToolView,
  'browser-get-dropdown-options': BrowserToolView,
  'browser-select-dropdown-option': BrowserToolView,
  'browser-drag-drop': BrowserToolView,
  'browser-click-coordinates': BrowserToolView,

  'execute-command': CommandToolView,
  'check-command-output': GenericToolView,
  'terminate-command': TerminateCommandToolView,
  'list-commands': GenericToolView,

  'create-file': FileOperationToolView,
  'delete-file': FileOperationToolView,
  'full-file-rewrite': FileOperationToolView,
  'read-file': FileOperationToolView,

  'str-replace': StrReplaceToolView,
  'str_replace': StrReplaceToolView,
  'str_replace_tool': StrReplaceToolView,
  'SandboxFilesTool.str_replace': StrReplaceToolView,

  'web-search': WebSearchToolView,
  'crawl-webpage': WebCrawlToolView,
  'scrape-webpage': WebScrapeToolView,

  'execute-data-provider-call': ExecuteDataProviderCallToolView,
  'get-data-provider-endpoints': DataProviderEndpointsToolView,

  'expose-port': ExposePortToolView,

  'see-image': SeeImageToolView,

  'call-mcp-tool': GenericToolView,

  'ask': AskToolView,
  'complete': CompleteToolView,

  // Add custom tool views with proper components
  'generate-image': ImageGenToolView,
  'edit-image': ImageGenToolView, // Using the same view as generate-image
  'deploy': DeployToolView,
  'list-argil-avatars': AvatarToolView,
  'list-argil-voices': AvatarToolView,
  'generate-argil-video': AvatarToolView,
  'check-argil-video-status': AvatarToolView,
  


  
  // Map 'unknown' tool type to appropriate handler based on content
  // For image generation, use ImageGenToolView
  // For other cases, fall back to GenericToolView
  'unknown': (props: ToolViewProps) => {
    // Check if content appears to be image generation-related
    const content = typeof props.toolContent === 'string' 
      ? props.toolContent 
      : JSON.stringify(props.toolContent);
    
    if (content.includes('pixiomedia.nyc3.digitaloceanspaces.com') || 
        content.includes('saved to workspace at') ||
        content.includes('success=True') ||
        content.includes('generating image') ||
        (typeof window !== 'undefined' && window.location.href.includes('image'))) {
      console.log('Using ImageGenToolView for unknown tool type (image detected)');
      return <ImageGenToolView {...props} />;
    }
    
    // Fall back to generic view for non-image content
    return <GenericToolView {...props} />;
  },

  'default': GenericToolView,
};

class ToolViewRegistry {
  private registry: ToolViewRegistryType;

  constructor(initialRegistry: Partial<ToolViewRegistryType> = {}) {
    this.registry = { ...defaultRegistry, ...initialRegistry };
  }

  register(toolName: string, component: ToolViewComponent): void {
    this.registry[toolName] = component;
  }

  registerMany(components: Partial<ToolViewRegistryType>): void {
    Object.assign(this.registry, components);
  }

  get(toolName: string): ToolViewComponent {
    return this.registry[toolName] || this.registry['default'];
  }

  has(toolName: string): boolean {
    return toolName in this.registry;
  }

  getToolNames(): string[] {
    return Object.keys(this.registry).filter(key => key !== 'default');
  }

  clear(): void {
    this.registry = { default: this.registry['default'] };
  }
}

export const toolViewRegistry = new ToolViewRegistry();

export function useToolView(toolName: string): ToolViewComponent {
  return useMemo(() => toolViewRegistry.get(toolName), [toolName]);
}

export function ToolView({ name = 'default', ...props }: ToolViewProps) {
  const ToolViewComponent = useToolView(name);
  return <ToolViewComponent name={name} {...props} />;
}
