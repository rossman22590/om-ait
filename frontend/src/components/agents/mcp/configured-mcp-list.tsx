import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, X, Sparkles, Key, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  MCPConfiguration, 
  isComposioMCP, 
  isPipedreamMCP, 
  ComposioMCPConfiguration, 
  PipedreamMCPConfiguration 
} from './types';
import { usePipedreamAppIcon } from '../../../hooks/react-query/pipedream/use-pipedream';
import { useComposioToolkits } from '@/hooks/react-query/composio/use-composio';
import { useCredentialProfilesForMcp } from '@/hooks/react-query/mcp/use-credential-profiles';
import { useMemo } from 'react';

// Helper type to handle different response formats
type ToolkitResponse = {
  toolkits?: Array<{ icon_url?: string; name?: string; slug?: string }>;
  [key: string]: any;
} | Array<{ icon_url?: string; name?: string; slug?: string }>;

interface ConfiguredMcpListProps {
  configuredMCPs: MCPConfiguration[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onConfigureTools?: (index: number) => void;
}

const extractAppSlug = (mcp: MCPConfiguration): { type: 'pipedream' | 'composio', slug: string } | null => {
  if (isPipedreamMCP(mcp)) {
    // Try multiple sources for the app slug
    const slug = (mcp as PipedreamMCPConfiguration).app_slug ||
      mcp.config?.app_slug ||
      mcp.config?.headers?.['x-pd-app-slug'] ||
      mcp.qualifiedName.replace('pipedream_', '').split('_')[0]; // Extract first part before profile ID
    return slug ? { type: 'pipedream', slug } : null;
  }
  if (isComposioMCP(mcp)) {
    const slug = (mcp as ComposioMCPConfiguration).toolkitSlug ||
      mcp.config?.toolkit_slug ||
      mcp.qualifiedName.replace('composio.', '');
    return slug ? { type: 'composio', slug } : null;
  }
  return null;
};

const MCPLogo: React.FC<{ mcp: MCPConfiguration }> = ({ mcp }) => {
  const appInfo = extractAppSlug(mcp);
  const isPipedream = appInfo?.type === 'pipedream';
  const isComposio = appInfo?.type === 'composio';

  // For Pipedream, we can fetch the app icon
  const { data: pipedreamIconData } = usePipedreamAppIcon(
    isPipedream && appInfo ? appInfo.slug : ''
  ) as { data?: { icon_url: string } | string };

  // For Composio, we need to get the toolkit info
  const { data: composioData } = useComposioToolkits(
    isComposio && appInfo ? appInfo.slug : ''
  ) as { 
    data?: { 
      toolkits?: Array<{ icon_url?: string; name?: string }> 
    } | Array<{ icon_url?: string; name?: string }> 
  };

  const toolkit = useMemo(() => {
    if (!isComposio) return null;
    
    // Handle different response formats
    if (Array.isArray(composioData)) {
      return composioData[0] || null;
    } else if (composioData && 'toolkits' in composioData) {
      return Array.isArray(composioData.toolkits) ? composioData.toolkits[0] || null : null;
    }
    
    return null;
  }, [isComposio, composioData]);

  // Fallback for when we don't have app info
  if (!appInfo) {
    const firstLetter = mcp.name?.charAt(0).toUpperCase() || '?';
    return (
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-xs font-medium">{firstLetter}</span>
      </div>
    );
  }

  // Handle Pipedream icon
  if (isPipedream && pipedreamIconData) {
    const iconUrl = typeof pipedreamIconData === 'string' 
      ? pipedreamIconData 
      : pipedreamIconData.icon_url;
    
    if (iconUrl) {
      return (
        <img
          src={iconUrl}
          alt={appInfo?.slug || 'Pipedream App'}
          className="h-8 w-8 rounded-md object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
  }

  // Handle Composio icon
  if (isComposio && toolkit?.icon_url) {
    return (
      <>
        <img
          src={toolkit.icon_url}
          alt={toolkit.name}
          className="h-8 w-8 rounded-md object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden h-8 w-8 rounded-full bg-muted items-center justify-center">
          <span className="text-xs font-medium">
            {toolkit.name?.charAt(0).toUpperCase() || 'C'}
          </span>
        </div>
      </>
    );
  }

  // Fallback for when we don't have an icon
  return (
    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
      <span className="text-xs font-medium">
        {appInfo.slug?.charAt(0).toUpperCase() || '?'}
      </span>
    </div>
  );
};

const MCPConfigurationItem: React.FC<{
  mcp: MCPConfiguration;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onConfigureTools?: (index: number) => void;
}> = ({ mcp, index, onEdit, onRemove, onConfigureTools }) => {
  // Determine the qualified name based on the MCP type
  const qualifiedNameForLookup = isComposioMCP(mcp)
    ? mcp.mcp_qualified_name || mcp.config?.mcp_qualified_name || mcp.qualifiedName
    : mcp.qualifiedName;

  const { data: credentialProfiles } = useCredentialProfilesForMcp(qualifiedNameForLookup);
  const hasCredentialProfiles = credentialProfiles && credentialProfiles.length > 0;
  const isCustom = mcp.customType === 'composio' || mcp.customType === 'pipedream' || mcp.isCustom;
  
  // For Pipedream and Composio integrations, don't show "needs credentials" if they're already configured
  // They have their own profile-based credential system
  const needsCredentials = isCustom && hasCredentialProfiles &&
    mcp.customType !== 'pipedream' && mcp.customType !== 'composio';
  const isAvailable = mcp.isAvailable; // Available but not yet configured

  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <MCPLogo mcp={mcp} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-sm truncate ${isAvailable ? 'text-muted-foreground' : 'text-foreground'}`}>
                {mcp.name}
              </h4>
              {isAvailable && (
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Available
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {isAvailable ? 'Ready to connect to your agent' : mcp.qualifiedName}
            </p>
            {mcp.enabledTools && mcp.enabledTools.length > 0 && !isAvailable && (
              <div className="flex items-center gap-1 mt-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {mcp.enabledTools.length} tool{mcp.enabledTools.length !== 1 ? 's' : ''} enabled
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {isAvailable ? (
            <Button
              size="sm"
              className="h-8 px-4 text-xs gap-2"
              onClick={() => onEdit(index)}
            >
              <Plus className="h-3 w-3" />
              Connect
            </Button>
          ) : (
            <>
              {isCustom && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => onEdit(index)}
                    title="Edit configuration"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {onConfigureTools && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={() => onConfigureTools(index)}
                      title="Configure tools"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(index)}
                    title="Remove integration"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {needsCredentials && (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
                  <Key className="h-3 w-3" />
                  Needs credentials
                </Badge>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const ConfiguredMcpList: React.FC<ConfiguredMcpListProps> = ({
  configuredMCPs,
  onEdit,
  onRemove,
  onConfigureTools,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Function to safely get the qualified name for comparison
  const getQualifiedName = (mcp: MCPConfiguration) => {
    return mcp.qualifiedName || (mcp as any).mcp_qualified_name || '';
  };

  const showPipedreamUI = process.env.NEXT_PUBLIC_ENABLE_PIPEDREAM_UI !== 'false';

  if (configuredMCPs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No MCP servers configured</p>
      </div>
    );
  }

  // Separate configured and available MCPs, then by type
  const configuredMCPs_filtered = configuredMCPs.filter(mcp => !mcp.isAvailable);
  const availableMCPs = configuredMCPs.filter(mcp => mcp.isAvailable);
  
  const composioMCPs = configuredMCPs_filtered.filter(mcp => isComposioMCP(mcp));
  const pipedreamMCPs = configuredMCPs_filtered.filter(mcp => isPipedreamMCP(mcp));
  const otherMCPs = configuredMCPs_filtered.filter(mcp =>
    !isComposioMCP(mcp) && !isPipedreamMCP(mcp)
  );
  
  const availableComposioMCPs = availableMCPs.filter(mcp => isComposioMCP(mcp));
  const availablePipedreamMCPs = availableMCPs.filter(mcp => isPipedreamMCP(mcp));

  const renderMCPs = (mcps: MCPConfiguration[], title?: string) => {
    if (mcps.length === 0) return null;

    return (
      <div className="space-y-3 w-full">
        {title && (
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="h-px bg-border flex-1"></div>
          </div>
        )}
        {mcps.map((mcp, index) => {
          const globalIndex = configuredMCPs.findIndex(m => getQualifiedName(m) === getQualifiedName(mcp));
          return (
            <MCPConfigurationItem
              key={`${mcp.qualifiedName}-${index}`}
              mcp={mcp}
              index={globalIndex}
              onEdit={onEdit}
              onRemove={onRemove}
              onConfigureTools={onConfigureTools}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full overflow-hidden">
      {renderMCPs(composioMCPs, composioMCPs.length > 0 ? 'Composio Integrations' : undefined)}
      {showPipedreamUI && renderMCPs(pipedreamMCPs, pipedreamMCPs.length > 0 ? 'Pipedream Integrations' : undefined)}
      {renderMCPs(otherMCPs, otherMCPs.length > 0 ? 'Other MCP Servers' : undefined)}
      
      {/* Available integrations section */}
      {availableMCPs.length > 0 && (
        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-2 mb-4 bg-grey-50 dark:bg-grey-900/20 p-3 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-pink-500"></div>
            <h3 className="text-sm font-semibold text-foreground">Available Integrations</h3>
            <Badge variant="default" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
              {availableMCPs.length} ready to connect
            </Badge>
          </div>
          {renderMCPs(availableComposioMCPs, availableComposioMCPs.length > 0 ? 'Composio' : undefined)}
          {showPipedreamUI && renderMCPs(availablePipedreamMCPs, availablePipedreamMCPs.length > 0 ? 'Pipedream' : undefined)}
        </div>
      )}
    </div>
  );
};