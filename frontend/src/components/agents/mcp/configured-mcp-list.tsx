import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Settings, X, Sparkles, Key, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { 
  MCPConfiguration, 
  isComposioMCP, 
  isPipedreamMCP, 
  ComposioMCPConfiguration, 
  PipedreamMCPConfiguration 
} from './types';
import { usePipedreamAppIcon } from '@/hooks/react-query/pipedream/use-pipedream';
import { useComposioToolkitIcon } from '@/hooks/react-query/composio/use-composio';
import { useCredentialProfilesForMcp } from '@/hooks/react-query/mcp/use-credential-profiles';

// Helper type to handle different response formats
type ToolkitResponse = {
  toolkits?: Array<{ icon_url?: string; logo?: string; name?: string; slug?: string }>;
  [key: string]: any;
} | Array<{ icon_url?: string; logo?: string; name?: string; slug?: string }>;

interface ConfiguredMcpListProps {
  configuredMCPs: MCPConfiguration[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onConfigureTools?: (index: number) => void;
}

const extractAppSlug = (mcp: MCPConfiguration): { type: 'pipedream' | 'composio', slug: string } | null => {
  // Strictly prefer explicit fields; avoid deriving from qualifiedName unless the prefix matches
  if (isPipedreamMCP(mcp)) {
    const pdSlug = (mcp as PipedreamMCPConfiguration).app_slug
      || mcp.config?.app_slug
      || (mcp as any)?.profileData?.app_slug
      || mcp.config?.headers?.['x-pd-app-slug'];
    return pdSlug ? { type: 'pipedream', slug: pdSlug } : null;
  }
  if (isComposioMCP(mcp)) {
    const explicit = (mcp as ComposioMCPConfiguration).toolkitSlug || mcp.config?.toolkit_slug;
    if (explicit) return { type: 'composio', slug: explicit };
    const qn = (mcp as any).mcp_qualified_name || mcp.qualifiedName;
    if (typeof qn === 'string' && qn.startsWith('composio.')) {
      return { type: 'composio', slug: qn.replace('composio.', '') };
    }
    return null;
  }
  return null;
};

const MCPLogo: React.FC<{ mcp: MCPConfiguration }> = ({ mcp }) => {
  const appInfo = extractAppSlug(mcp);
  const isPipedream = appInfo?.type === 'pipedream';
  const isComposio = appInfo?.type === 'composio';

  // For Pipedream, we can fetch the app icon
  const { data: pipedreamIconData } = usePipedreamAppIcon(
    isPipedream && appInfo ? appInfo.slug : '',
    { enabled: !!(isPipedream && appInfo?.slug) }
  ) as { data?: { icon_url: string; app_slug?: string } };

  // For Composio, we can fetch the toolkit icon directly
  const { data: composioIconData } = useComposioToolkitIcon(
    isComposio && appInfo ? appInfo.slug : '',
    { enabled: isComposio && !!appInfo?.slug }
  );

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
    const iconUrl = (pipedreamIconData as any)?.icon_url;
    
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
  if (isComposio && composioIconData?.success && composioIconData?.icon_url) {
    return (
      <>
        <img
          src={composioIconData.icon_url}
          alt={mcp.name}
          className="h-8 w-8 rounded-md object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden h-8 w-8 rounded-full bg-muted items-center justify-center">
          <span className="text-xs font-medium">
            {mcp.name?.charAt(0).toUpperCase() || 'C'}
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

  const { data: credentialProfiles = [] } = useCredentialProfilesForMcp(qualifiedNameForLookup);
  const profileId = mcp.selectedProfileId || mcp.config?.profile_id;
  const selectedProfile = credentialProfiles.find(p => p.profile_id === profileId);

  const hasCredentialProfile = !!profileId && !!selectedProfile;
  const hasCredentialProfiles = credentialProfiles && credentialProfiles.length > 0;
  const isCustom = mcp.customType === 'composio' || mcp.customType === 'pipedream' || mcp.isCustom;
  
  // For Pipedream and Composio integrations, don't show "needs credentials" if they're already configured
  // They have their own profile-based credential system
  const needsCredentials = isCustom && hasCredentialProfiles &&
    mcp.customType !== 'pipedream' && mcp.customType !== 'composio';
  const isAvailable = mcp.isAvailable; // Available but not yet configured

  return (
    <SpotlightCard className="bg-card border border-border">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border/50">
            <MCPLogo mcp={mcp} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-foreground truncate">{mcp.name}</h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{mcp.enabledTools?.length || 0} tools enabled</span>
              {hasCredentialProfile && (
                <div className="flex items-center gap-1">
                  <Key className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium truncate max-w-24">
                    {selectedProfile.profile_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {onConfigureTools && (
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 bg-card border border-border hover:bg-muted"
              onClick={() => onConfigureTools(index)}
              title="Configure tools"
              type="button"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 bg-card border border-border hover:bg-muted text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
            title="Remove integration"
            type="button"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </SpotlightCard>
  );
};

export const ConfiguredMcpList: React.FC<ConfiguredMcpListProps> = ({
  configuredMCPs,
  onEdit,
  onRemove,
  onConfigureTools,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [mcpToDelete, setMcpToDelete] = React.useState<{ mcp: MCPConfiguration; index: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Function to safely get the qualified name for comparison
  const getQualifiedName = (mcp: MCPConfiguration) => {
    return mcp.qualifiedName || (mcp as any).mcp_qualified_name || '';
  };

  const showPipedreamUI = process.env.NEXT_PUBLIC_ENABLE_PIPEDREAM_UI !== 'false';

  const handleDeleteClick = (mcp: MCPConfiguration, index: number) => {
    setMcpToDelete({ mcp, index });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mcpToDelete) {
      onRemove(mcpToDelete.index);
      setMcpToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

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
               key={`${mcp.qualifiedName}-${index}-${mcp.enabledTools?.length || 0}`}
               mcp={mcp}
               index={globalIndex}
               onEdit={onEdit}
               onRemove={(idx) => handleDeleteClick(mcp, idx)}
               onConfigureTools={onConfigureTools}
             />
           );
         })}
      </div>
    );
  };

  return (
    <>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the "{mcpToDelete?.mcp.name}" integration? This will disconnect all associated tools and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Remove Integration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};