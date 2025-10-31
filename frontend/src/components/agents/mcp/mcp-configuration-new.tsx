import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Server, Store, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MCPConfigurationProps, MCPConfiguration as MCPConfigurationType } from './types';
import { ConfiguredMcpList } from './configured-mcp-list';
import { CustomMCPDialog } from './custom-mcp-dialog';
import { ComposioRegistry } from '../composio/composio-registry';
import { ComposioToolsManager } from '../composio/composio-tools-manager';
import { PipedreamConnector } from '../pipedream/pipedream-connector';
import { PipedreamRegistry } from '../pipedream/pipedream-registry';
import { ToolsManager } from './tools-manager';
import { PipedreamToolsManager } from './pipedream-tools-manager';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PipedreamApp } from '@/hooks/react-query/pipedream/utils';

export const MCPConfigurationNew: React.FC<MCPConfigurationProps> = ({
  configuredMCPs,
  onConfigurationChange,
  agentId,
  versionData,
  saveMode = 'direct',
  versionId,
  isLoading = false
}) => {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showRegistryDialog, setShowRegistryDialog] = useState(false);
  const [showPipedreamRegistry, setShowPipedreamRegistry] = useState(false);
  const [showPipedreamConnector, setShowPipedreamConnector] = useState(false);
  const [selectedPipedreamApp, setSelectedPipedreamApp] = useState<PipedreamApp | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showComposioToolsManager, setShowComposioToolsManager] = useState(false);
  const [showCustomToolsManager, setShowCustomToolsManager] = useState(false);
  const [selectedMCPForTools, setSelectedMCPForTools] = useState<MCPConfigurationType | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(agentId);
  const queryClient = useQueryClient();

  const handleAgentChange = (newAgentId: string | undefined) => {
    setSelectedAgentId(newAgentId);
  };

  const handleEditMCP = (index: number) => {
    const mcp = configuredMCPs[index];
    
    // If this is an available Pipedream integration, open the registry to connect
    if (mcp.isAvailable && mcp.customType === 'pipedream') {
      setShowPipedreamRegistry(true);
      return;
    }
    
    // If this is an available Composio integration, convert it to configured
    if (mcp.isAvailable && mcp.customType === 'composio') {
      const configuredMcp = { ...mcp, isAvailable: false };
      const newMCPs = [...configuredMCPs];
      newMCPs[index] = configuredMcp;
      onConfigurationChange(newMCPs);
      return;
    }
    
    // For configured MCPs, open the tools manager instead of the custom dialog
    // This allows users to configure which tools are enabled
    if (mcp.customType === 'composio' || mcp.customType === 'pipedream') {
      handleConfigureTools(index);
      return;
    }
    
    // For other custom MCPs, edit as normal
    setEditingIndex(index);
    setShowCustomDialog(true);
  };

  const handleConfigureTools = (index: number) => {
    const mcp = configuredMCPs[index];
    setSelectedMCPForTools(mcp);
    if (mcp.customType === 'composio') {
      const profileId = mcp.selectedProfileId || mcp.config?.profile_id;
      if (profileId) {
        setShowComposioToolsManager(true);
      } else {
        console.warn('Composio MCP has no profile_id:', mcp);
      }
    } else if (mcp.customType === 'pipedream') {
      // For Pipedream, use the Pipedream-specific tools manager
      setShowCustomToolsManager(true);
    } else {
      setShowCustomToolsManager(true);
    }
  };

  const handleRemoveMCP = (index: number) => {
    const newMCPs = configuredMCPs.filter((_, i) => i !== index);
    onConfigurationChange(newMCPs);
  };

  const handleSaveCustomMCP = async (customConfig: any) => {
    const mcpConfig: MCPConfigurationType = {
      name: customConfig.name,
      qualifiedName: `custom_${customConfig.type}_${Date.now()}`,
      config: customConfig.config,
      enabledTools: customConfig.enabledTools,
      selectedProfileId: customConfig.selectedProfileId,
      isCustom: true,
      customType: customConfig.type as 'http' | 'sse'
    };
    onConfigurationChange([...configuredMCPs, mcpConfig]);
  };

  const handleToolsSelected = (profileId: string, selectedTools: string[], appName: string, appSlug: string) => {
    setShowRegistryDialog(false);
    if (selectedAgentId) {
      queryClient.invalidateQueries({ queryKey: ['agents', 'detail', selectedAgentId] });
    }
    queryClient.invalidateQueries({ queryKey: ['composio', 'profiles'] });
    toast.success(`Connected ${appName} integration!`);
  };

  const handlePipedreamConnectionComplete = (profileId: string, selectedTools: string[], appName: string, appSlug: string) => {
    console.log('Pipedream connection complete:', { profileId, selectedTools, appName, appSlug });
    
    // Create a proper Pipedream MCP configuration
    const pipedreamMcp: MCPConfigurationType = {
      name: `${appName} (Pipedream)`,
      qualifiedName: `pipedream_${appSlug}_${profileId}`,
      config: {
        profile_id: profileId,
        app_slug: appSlug,
        app_name: appName,
      },
      enabledTools: selectedTools,
      isCustom: true,
      customType: 'pipedream',
      app_slug: appSlug, // Add app_slug as direct property for icon loading
      isPipedream: true, // Add isPipedream flag for type checking
    };
    
    // Add to configured MCPs
    const newMCPs = [...configuredMCPs.filter(mcp => !mcp.isAvailable || mcp.customType !== 'pipedream' || mcp.config?.profile_id !== profileId), pipedreamMcp];
    onConfigurationChange(newMCPs);
    
    // Clean up state
    setShowPipedreamConnector(false);
    setSelectedPipedreamApp(null);
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: ['agent', selectedAgentId] });
    queryClient.invalidateQueries({ queryKey: ['pipedream', 'profiles'] });
    toast.success(`Connected ${appName} via Pipedream!`);
  };

  const handleCustomToolsUpdate = (enabledTools: string[]) => {
    console.log('[MCPConfiguration] handleCustomToolsUpdate called with:', {
      enabledTools,
      selectedMCPForTools: selectedMCPForTools?.name,
      configuredMCPsCount: configuredMCPs.length
    });
    
    if (!selectedMCPForTools) {
      console.warn('[MCPConfiguration] No selectedMCPForTools');
      return;
    }
    
    // Find the MCP by qualified name to ensure reliable matching
    const updatedMCPs = configuredMCPs.map(mcp => {
      if (mcp.qualifiedName === selectedMCPForTools.qualifiedName) {
        console.log('[MCPConfiguration] Updating MCP tools:', {
          mcpName: mcp.name,
          qualifiedName: mcp.qualifiedName,
          oldTools: mcp.enabledTools,
          newTools: enabledTools
        });
        return { ...mcp, enabledTools };
      }
      return mcp;
    });
    
    console.log('[MCPConfiguration] Calling onConfigurationChange with updated MCPs');
    onConfigurationChange(updatedMCPs);
    setShowCustomToolsManager(false);
    setSelectedMCPForTools(null);
    
    // Show success message
    toast.success(`Updated ${enabledTools.length} tools for ${selectedMCPForTools.name}`);
  };

  // Categorize MCPs by type
  const composioMCPs = configuredMCPs.filter(mcp => mcp.customType === 'composio');
  const pipedreamMCPs = configuredMCPs.filter(mcp => mcp.customType === 'pipedream');
  const otherMCPs = configuredMCPs.filter(mcp =>
    mcp.customType !== 'composio' && mcp.customType !== 'pipedream'
  );

  const [activeTab, setActiveTab] = useState('all');
  const showPipedreamUI = process.env.NEXT_PUBLIC_ENABLE_PIPEDREAM_UI !== 'false';

  const renderTabActions = (tab: string) => {
    switch (tab) {
      case 'composio':
        return (
          <Button
            onClick={() => setShowRegistryDialog(true)}
            variant="outline"
            size="sm"
            className="gap-1 h-9 px-3 text-xs sm:text-sm sm:gap-2 sm:px-4 flex-shrink-0"
          >
            <Store className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Browse Composio</span>
            <span className="sm:hidden">Add App</span>
          </Button>
        );
      case 'pipedream':
        return showPipedreamUI ? (
          <Button
            onClick={() => setShowPipedreamRegistry(true)}
            variant="outline"
            size="sm"
            className="gap-1 h-9 px-3 text-xs sm:text-sm sm:gap-2 sm:px-4 flex-shrink-0"
          >
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Browse Pipedream</span>
            <span className="sm:hidden">Add App</span>
          </Button>
        ) : null;
      case 'other':
        return (
          <Button
            onClick={() => setShowCustomDialog(true)}
            variant="outline"
            size="sm"
            className="gap-1 h-9 px-3 text-xs sm:text-sm sm:gap-2 sm:px-4 flex-shrink-0"
          >
            <Server className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Add Custom MCP</span>
            <span className="sm:hidden">Add MCP</span>
          </Button>
        );
      default: // 'all' tab
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowRegistryDialog(true)}
              size="sm"
              variant="default"
              className="gap-2" type="button"
            >
              <Store className="h-4 w-4" />
              Browse Apps
            </Button>
            <Button
              onClick={() => setShowCustomDialog(true)}
              size="sm"
              variant="outline"
              className="gap-2" type="button"
            >
              <Server className="h-4 w-4" />
              Custom MCP
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="space-y-4 mb-6">
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <TabsList className="h-10 p-1 bg-muted/50 flex-shrink-0 overflow-x-auto">
                  <TabsTrigger value="all" className="px-2 py-2 text-xs sm:text-sm sm:px-3 whitespace-nowrap">All</TabsTrigger>
                  <TabsTrigger value="composio" className="px-2 py-2 text-xs sm:text-sm sm:px-3 whitespace-nowrap">Composio</TabsTrigger>
                  {showPipedreamUI && (
                    <TabsTrigger value="pipedream" className="px-2 py-2 text-xs sm:text-sm sm:px-3 whitespace-nowrap">Pipedream</TabsTrigger>
                  )}
                  {otherMCPs.length > 0 && (
                    <TabsTrigger value="other" className="px-2 py-2 text-xs sm:text-sm sm:px-3 whitespace-nowrap">Other</TabsTrigger>
                  )}
                </TabsList>
                <div className="flex-shrink-0 min-w-0">
                  {renderTabActions(activeTab)}
                </div>
              </div>
            </div>
          </div>

          {configuredMCPs.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No integrations configured
              </h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                Connect your favorite apps and services to enhance your agent's capabilities
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={() => setShowRegistryDialog(true)}
                  className="gap-2 h-10 px-6"
                >
                  <Store className="h-4 w-4" />
                  Browse Composio Apps
                </Button>
                {showPipedreamUI && (
                  <Button
                    onClick={() => setShowPipedreamRegistry(true)}
                    className="gap-2 h-10 px-6"
                  >
                    <Zap className="h-4 w-4" />
                    Browse Pipedream Apps
                  </Button>
                )}
                <Button
                  onClick={() => setShowCustomDialog(true)}
                  variant="outline"
                  className="gap-2 h-10 px-6"
                >
                  <Server className="h-4 w-4" />
                  Add Custom Server
                </Button>
              </div>
            </div>
          ) : (
      <>
              <TabsContent value="all" className="space-y-6">
                <ConfiguredMcpList
                  configuredMCPs={configuredMCPs}
                  onEdit={handleEditMCP}
                  onRemove={handleRemoveMCP}
                  onConfigureTools={handleConfigureTools}
                />
              </TabsContent>
              
              <TabsContent value="composio" className="space-y-6">
                {composioMCPs.length > 0 ? (
                  <ConfiguredMcpList
                    configuredMCPs={composioMCPs}
                    onEdit={handleEditMCP}
                    onRemove={handleRemoveMCP}
                    onConfigureTools={handleConfigureTools}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mb-4">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      No Composio integrations configured
                    </p>
                    <Button
                      onClick={() => setShowRegistryDialog(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Store className="h-4 w-4" />
                      Browse Composio Apps
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {showPipedreamUI && (
                <TabsContent value="pipedream" className="space-y-6">
                  {pipedreamMCPs.length > 0 ? (
                    <ConfiguredMcpList
                      configuredMCPs={pipedreamMCPs}
                      onEdit={handleEditMCP}
                      onRemove={handleRemoveMCP}
                      onConfigureTools={handleConfigureTools}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mb-4">
                        <Zap className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        No Pipedream integrations configured
                      </p>
                      <Button
                        onClick={() => setShowPipedreamRegistry(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Browse Pipedream Apps
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )}
              
              {otherMCPs.length > 0 && (
                <TabsContent value="other" className="space-y-6">
                  <ConfiguredMcpList
                    configuredMCPs={otherMCPs}
                    onEdit={handleEditMCP}
                    onRemove={handleRemoveMCP}
                    onConfigureTools={handleConfigureTools}
                  />
                </TabsContent>
              )}
            </>
          )}
        </Tabs>
      </div>

      <Dialog open={showRegistryDialog} onOpenChange={setShowRegistryDialog}>
        <DialogContent className="p-0 max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Select Integration</DialogTitle>
          </DialogHeader>
          <ComposioRegistry
            showAgentSelector={false}
            selectedAgentId={selectedAgentId}
            onAgentChange={handleAgentChange}
            onToolsSelected={handleToolsSelected}
            onClose={() => {
              setShowRegistryDialog(false);
              if (selectedAgentId) {
                queryClient.invalidateQueries({ queryKey: ['agents', 'detail', selectedAgentId] });
              }
            }}
          />
        </DialogContent>
      </Dialog>
      
      <CustomMCPDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onSave={handleSaveCustomMCP}
      />
      
      {selectedMCPForTools && selectedMCPForTools.customType === 'composio' && (selectedMCPForTools.selectedProfileId || selectedMCPForTools.config?.profile_id) && (
        <ComposioToolsManager
          agentId={selectedAgentId || ''}
          open={showComposioToolsManager}
          onOpenChange={setShowComposioToolsManager}
          profileId={selectedMCPForTools.selectedProfileId || selectedMCPForTools.config?.profile_id}
          onToolsUpdate={() => {
            setShowComposioToolsManager(false);
            setSelectedMCPForTools(null);
          }}
        />
      )}
      
      {selectedMCPForTools && selectedMCPForTools.customType === 'pipedream' && (
        <PipedreamToolsManager
          agentId={selectedAgentId}
          mcpConfig={selectedMCPForTools}
          open={showCustomToolsManager}
          onOpenChange={setShowCustomToolsManager}
          onToolsUpdate={handleCustomToolsUpdate}
          versionData={versionData}
          saveMode={saveMode}
          versionId={versionId}
          initialEnabledTools={selectedMCPForTools.enabledTools}
        />
      )}
      
      {selectedMCPForTools && selectedMCPForTools.customType !== 'composio' && selectedMCPForTools.customType !== 'pipedream' && (
        <ToolsManager
          mode="custom"
          agentId={selectedAgentId}
          mcpConfig={{
            ...selectedMCPForTools.config,
            type: selectedMCPForTools.customType
          }}
          mcpName={selectedMCPForTools.name}
          open={showCustomToolsManager}
          onOpenChange={setShowCustomToolsManager}
          onToolsUpdate={handleCustomToolsUpdate}
          versionData={versionData}
          saveMode={saveMode}
          versionId={versionId}
          initialEnabledTools={(() => {
            console.log('[MCPConfiguration] Rendering Custom ToolsManager with:', {
              selectedMCPForTools,
              enabledTools: selectedMCPForTools.enabledTools,
              customType: selectedMCPForTools.customType
            });
            return selectedMCPForTools.enabledTools;
          })()}
        />
      )}

      {selectedPipedreamApp && (
        <PipedreamConnector
          app={selectedPipedreamApp}
          open={showPipedreamConnector}
          onOpenChange={setShowPipedreamConnector}
          onComplete={handlePipedreamConnectionComplete}
          mode="full"
          saveMode="callback"
          agentId={selectedAgentId}
        />
      )}

      {showPipedreamUI && showPipedreamRegistry && (
        <Dialog open={showPipedreamRegistry} onOpenChange={setShowPipedreamRegistry}>
          <DialogContent className="p-0 max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>Browse Pipedream Apps</DialogTitle>
            </DialogHeader>
            <PipedreamRegistry
              mode="simple"
              showAgentSelector={false}
              onAppSelected={(app) => {
                // Create PipedreamApp object and show our own connector
                const pipedreamApp: PipedreamApp = {
                  id: app.app_slug,
                  name: app.app_name,
                  name_slug: app.app_slug,
                  auth_type: 'oauth',
                  description: `Connect to ${app.app_name}`,
                  img_src: '',
                  custom_fields_json: '[]',
                  categories: [],
                  featured_weight: 0,
                  connect: {
                    allowed_domains: null,
                    base_proxy_target_url: '',
                    proxy_enabled: false,
                  },
                };
                setSelectedPipedreamApp(pipedreamApp);
                setShowPipedreamRegistry(false);
                setShowPipedreamConnector(true);
              }}
              onClose={() => setShowPipedreamRegistry(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};