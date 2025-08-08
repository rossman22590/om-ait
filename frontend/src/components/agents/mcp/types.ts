export interface BaseMCPConfiguration {
  name: string;
  qualifiedName: string;
  mcp_qualified_name?: string;
  config: Record<string, any>;
  enabledTools: string[];
  selectedProfileId?: string;
  isCustom?: boolean;
  customType?: 'http' | 'sse' | 'composio' | 'pipedream';
  metadata?: Record<string, any>;
  isAvailable?: boolean; // Available but not yet configured
  profileData?: any; // Original profile data for available integrations
}

export interface ComposioMCPConfiguration extends BaseMCPConfiguration {
  customType: 'composio';
  isComposio: true;
  toolkitSlug?: string;
  toolkit_slug?: string;
  config: {
    toolkit_slug: string;
    profile_id: string;
    [key: string]: any;
  };
}

export interface PipedreamMCPConfiguration extends BaseMCPConfiguration {
  customType: 'pipedream';
  isPipedream?: true;
  isComposio?: false;
  config: {
    headers?: {
      'x-pd-app-slug'?: string;
      [key: string]: any;
    };
    profile_id?: string;
    app_slug?: string;
    app_name?: string;
    profile_name?: string;
    external_user_id?: string;
    [key: string]: any;
  };
  app_slug?: string;
}

export type MCPConfiguration = BaseMCPConfiguration | ComposioMCPConfiguration | PipedreamMCPConfiguration;

export function isComposioMCP(config: MCPConfiguration): config is ComposioMCPConfiguration {
  return (
    config.customType === 'composio' || 
    (config as any).isComposio === true ||
    (config as any).toolkitSlug !== undefined ||
    (config as any).config?.toolkit_slug !== undefined ||
    config.qualifiedName?.startsWith('composio.')
  );
}

export function isPipedreamMCP(config: MCPConfiguration): config is PipedreamMCPConfiguration {
  return (
    config.customType === 'pipedream' || 
    config.qualifiedName?.startsWith('pipedream_') ||
    (config as any).app_slug !== undefined ||
    config.config?.headers?.['x-pd-app-slug'] !== undefined
  );
}
  
export interface MCPConfigurationProps {
  configuredMCPs: MCPConfiguration[];
  onConfigurationChange: (mcps: MCPConfiguration[]) => void;
  agentId?: string;
  versionData?: {
    configured_mcps?: any[];
    custom_mcps?: any[];
    system_prompt?: string;
    agentpress_tools?: any;
  };
  saveMode?: 'direct' | 'callback';
  versionId?: string;
}
