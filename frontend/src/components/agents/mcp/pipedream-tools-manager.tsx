import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Info,
  RefreshCw,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdatePipedreamToolsForAgent } from '@/hooks/agents/use-pipedream-tools';
import { pipedreamApi } from '@/hooks/react-query/pipedream/utils';
import { usePipedreamProfiles } from '@/hooks/react-query/pipedream/use-pipedream-profiles';
import { usePipedreamAppIcon } from '@/hooks/react-query/pipedream/use-pipedream';
import type { MCPConfiguration } from './types';

interface PipedreamToolsManagerProps {
  agentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpConfig: MCPConfiguration;
  onToolsUpdate?: (enabledTools: string[]) => void;
  versionData?: {
    configured_mcps?: any[];
    custom_mcps?: any[];
    system_prompt?: string;
    agentpress_tools?: any;
  };
  saveMode?: 'direct' | 'callback';
  versionId?: string;
  initialEnabledTools?: string[];
}

export const PipedreamToolsManager: React.FC<PipedreamToolsManagerProps> = ({
  agentId,
  open,
  onOpenChange,
  mcpConfig,
  onToolsUpdate,
  versionData,
  saveMode = 'callback',
  versionId,
  initialEnabledTools = []
}) => {
  const [tools, setTools] = useState<Array<{ name: string; description?: string }>>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [localTools, setLocalTools] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const updatePipedreamTools = useUpdatePipedreamToolsForAgent();
  const { data: profiles } = usePipedreamProfiles();
  const { data: iconData } = usePipedreamAppIcon(mcpConfig.config?.app_slug || '', {
    enabled: !!mcpConfig.config?.app_slug
  });

  // Get the profile to extract external_user_id
  const profile = useMemo(() => {
    if (!mcpConfig.config?.profile_id || !profiles) return null;
    return profiles.find(p => p.profile_id === mcpConfig.config.profile_id);
  }, [mcpConfig.config?.profile_id, profiles]);

  // Load tools from Pipedream API
  useEffect(() => {
    if (open && mcpConfig.config?.profile_id && mcpConfig.config?.app_slug && profile?.external_user_id) {
      loadTools();
    }
  }, [open, mcpConfig.config?.profile_id, mcpConfig.config?.app_slug, profile?.external_user_id]);

  // Initialize local tools state
  useEffect(() => {
    if (initialEnabledTools.length > 0) {
      const toolsMap: Record<string, boolean> = {};
      tools.forEach(tool => {
        toolsMap[tool.name] = initialEnabledTools.includes(tool.name);
      });
      setLocalTools(toolsMap);
      setHasChanges(false);
    }
  }, [tools, initialEnabledTools]);

  const loadTools = async () => {
    if (!mcpConfig.config?.profile_id || !profile?.external_user_id || !mcpConfig.config?.app_slug) {
      setError('Missing required configuration for Pipedream MCP');
      return;
    }

    setIsLoadingTools(true);
    setError(null);

    try {
      const servers = await pipedreamApi.discoverMCPServers(
        profile.external_user_id, 
        mcpConfig.config.app_slug
      );
      
      const server = servers.find(s => s.app_slug === mcpConfig.config.app_slug);
      
      if (server?.available_tools) {
        setTools(server.available_tools);
        
        // Initialize local tools state
        const toolsMap: Record<string, boolean> = {};
        server.available_tools.forEach(tool => {
          toolsMap[tool.name] = initialEnabledTools.includes(tool.name);
        });
        setLocalTools(toolsMap);
        setHasChanges(false);
      } else {
        setError('No tools available for this Pipedream integration');
      }
    } catch (error) {
      console.error('Error loading Pipedream tools:', error);
      setError('Failed to load tools from Pipedream');
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleToolToggle = (toolName: string) => {
    setLocalTools(prev => {
      const newValue = !prev[toolName];
      const updated = { ...prev, [toolName]: newValue };
      
      // Check if there are changes compared to initial state
      const hasChanges = Object.keys(updated).some(key => 
        updated[key] !== initialEnabledTools.includes(key)
      );
      
      setHasChanges(hasChanges);
      return updated;
    });
  };

  const handleSelectAll = () => {
    const allEnabled = tools.every(tool => !!localTools[tool.name]);
    const newState: Record<string, boolean> = {};
    tools.forEach(tool => {
      newState[tool.name] = !allEnabled;
    });
    setLocalTools(newState);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!agentId || !mcpConfig.config?.profile_id) {
      toast.error('Missing agent ID or profile ID');
      return;
    }

    const enabledTools = Object.entries(localTools)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);

    if (saveMode === 'callback') {
      console.log('[PipedreamToolsManager] Callback mode - calling onToolsUpdate with:', enabledTools);
      if (onToolsUpdate) {
        onToolsUpdate(enabledTools);
      } else {
        console.warn('[PipedreamToolsManager] No onToolsUpdate callback provided');
      }
      setHasChanges(false);
      onOpenChange(false);
    } else {
      try {
        await updatePipedreamTools.mutateAsync({
          agentId,
          profileId: mcpConfig.config.profile_id,
          enabledTools
        });
        
        setHasChanges(false);
        if (onToolsUpdate) {
          onToolsUpdate(enabledTools);
        }
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['agents'] });
        queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
        queryClient.invalidateQueries({ queryKey: ['pipedream', 'profiles'] });
        
        toast.success(`Updated ${enabledTools.length} Pipedream tools`);
      } catch (error) {
        console.error('Failed to save Pipedream tools:', error);
        toast.error('Failed to save tools');
      }
    }
  };

  const handleCancel = () => {
    const resetState: Record<string, boolean> = {};
    tools.forEach(tool => {
      resetState[tool.name] = initialEnabledTools.includes(tool.name);
    });
    setLocalTools(resetState);
    setHasChanges(false);
  };

  const enabledCount = Object.values(localTools).filter(Boolean).length;
  const totalCount = tools.length;

  // Show loading state while profiles are being fetched
  if (!profiles) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Pipedream Profile
            </DialogTitle>
            <DialogDescription>
              Loading profile information...
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Error Loading Tools
            </DialogTitle>
            <DialogDescription>
              Failed to load Pipedream tools
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={loadTools}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-muted p-2">
              {iconData?.icon_url ? (
                <img
                  src={iconData.icon_url}
                  alt={mcpConfig.name}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <Zap className="h-5 w-5 text-primary" />
              )}
            </div>
            Configure {mcpConfig.name} Tools
          </DialogTitle>
          <DialogDescription>
            {versionData ? (
              <span className="flex items-center gap-2 text-amber-600">
                Changes will make a new version of the agent.
              </span>
            ) : saveMode === 'callback' ? (
              <span>Choose which Pipedream tools are available to your agent. Changes will be saved when you save the agent configuration.</span>
            ) : (
              <span>Choose which Pipedream tools are available to your agent. Changes will be saved immediately.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoadingTools ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading Pipedream tools...
                </p>
              </div>
            </div>
          ) : !tools.length ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tools available for this Pipedream integration
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {enabledCount} of {totalCount} tools enabled
                      </span>
                      {hasChanges && (
                        <Badge className="text-xs bg-primary/10 text-primary">
                          Unsaved changes
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pipedream: {mcpConfig.name}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={updatePipedreamTools.isPending}
                >
                  {tools.every(tool => localTools[tool.name]) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {tools.map((tool) => (
                  <Card 
                    key={tool.name}
                    className={cn(
                      "transition-colors cursor-pointer",
                      localTools[tool.name] ? "bg-muted/50" : "hover:bg-muted/20"
                    )}
                    onClick={() => handleToolToggle(tool.name)}
                  >
                    <CardContent>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{tool.name}</h4>
                            {localTools[tool.name] && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          {tool.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {tool.description}
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={localTools[tool.name] || false}
                          onCheckedChange={() => handleToolToggle(tool.name)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={updatePipedreamTools.isPending}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {saveMode === 'direct' && (
                <Alert className="p-2">
                  <Info className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    This will update the Pipedream tools configuration for your agent
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={hasChanges ? handleCancel : () => onOpenChange(false)}
                disabled={updatePipedreamTools.isPending}
              >
                {hasChanges ? 'Cancel' : 'Close'}
              </Button>
              
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={updatePipedreamTools.isPending}
                >
                  {updatePipedreamTools.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saveMode === 'callback' ? (
                    <>
                      <Save className="h-4 w-4" />
                      Apply Changes
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
