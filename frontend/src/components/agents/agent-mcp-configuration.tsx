import React, { useMemo } from 'react';
import { MCPConfigurationNew } from './mcp/mcp-configuration-new';
import { usePipedreamProfiles } from '@/hooks/react-query/pipedream/use-pipedream-profiles';
import { useComposioCredentialsProfiles } from '@/hooks/composio/use-composio-profiles';

interface AgentMCPConfigurationProps {
  configuredMCPs: any[];
  customMCPs: any[];
  onMCPChange: (updates: { configured_mcps: any[]; custom_mcps: any[] }) => void;
  agentId?: string;
  versionData?: {
    configured_mcps?: any[];
    custom_mcps?: any[];
    system_prompt?: string;
    agentpress_tools?: any;
  };
  saveMode?: 'direct' | 'callback';
  versionId?: string;
  isLoading?: boolean;
}

export const AgentMCPConfiguration: React.FC<AgentMCPConfigurationProps> = ({
  configuredMCPs,
  customMCPs,
  onMCPChange,
  agentId,
  versionData,
  saveMode = 'direct',
  versionId,
  isLoading = false
}) => {
  // Load available credential profiles
  const { data: pipedreamProfiles } = usePipedreamProfiles();
  const { data: composioToolkits } = useComposioCredentialsProfiles();

  // Convert credential profiles to MCP configurations that aren't already configured
  const availableIntegrations = useMemo(() => {
    const integrations: any[] = [];
    
    // Get existing profile IDs to avoid duplicates
    const existingProfileIds = new Set(
      customMCPs
        .filter(mcp => mcp.config?.profile_id)
        .map(mcp => mcp.config.profile_id)
    );

    // Add Pipedream profiles as available integrations
    if (pipedreamProfiles) {
      pipedreamProfiles
        .filter(profile => profile.is_connected && !existingProfileIds.has(profile.profile_id))
        .forEach(profile => {
          integrations.push({
            name: `${profile.app_name} (${profile.profile_name})`,
            qualifiedName: `pipedream_${profile.app_slug}_${profile.profile_id}`,
            config: {
              profile_id: profile.profile_id,
              app_slug: profile.app_slug,
              app_name: profile.app_name,
              profile_name: profile.profile_name,
              external_user_id: profile.external_user_id
            },
            enabledTools: (profile as any).enabledTools ?? (profile as any).enabled_tools ?? [],
            isCustom: true,
            customType: 'pipedream',
            isPipedream: true,
            app_slug: profile.app_slug, // Add app_slug as direct property for icon loading
            isAvailable: true, // Mark as available for connection
            profileData: profile
          });
        });
    }

    // Add Composio profiles as available integrations
    if (composioToolkits) {
      composioToolkits.forEach(toolkit => {
        toolkit.profiles
          .filter(profile => profile.has_mcp_url && !existingProfileIds.has(profile.profile_id))
          .forEach(profile => {
            integrations.push({
              name: `${toolkit.toolkit_name} (${profile.profile_name})`,
              qualifiedName: `composio.${toolkit.toolkit_slug}`,
              mcp_qualified_name: `composio.${toolkit.toolkit_slug}`,
              config: {
                profile_id: profile.profile_id,
                toolkit_slug: toolkit.toolkit_slug,
                toolkit_name: toolkit.toolkit_name,
                profile_name: profile.profile_name
              },
              enabledTools: [],
              isCustom: true,
              customType: 'composio',
              isComposio: true,
              isAvailable: true, // Mark as available for connection
              toolkitSlug: toolkit.toolkit_slug,
              toolkit_slug: toolkit.toolkit_slug,
              profileData: profile
            });
          });
      });
    }

    return integrations;
  }, [pipedreamProfiles, composioToolkits, customMCPs]);

  const allMCPs = [
    ...(configuredMCPs || []),
    ...(customMCPs || []).map(customMcp => {
      if (customMcp.type === 'composio' || customMcp.customType === 'composio') {
        return {
          name: customMcp.name,
          qualifiedName: customMcp.mcp_qualified_name || customMcp.config?.mcp_qualified_name || customMcp.qualifiedName || `composio.${customMcp.toolkit_slug || customMcp.config?.toolkit_slug || customMcp.name.toLowerCase()}`,
          mcp_qualified_name: customMcp.mcp_qualified_name || customMcp.config?.mcp_qualified_name,
          config: customMcp.config,
          enabledTools: customMcp.enabledTools,
          isCustom: true,
          customType: 'composio',
          isComposio: true,
          toolkitSlug: customMcp.toolkit_slug || customMcp.config?.toolkit_slug,
          toolkit_slug: customMcp.toolkit_slug || customMcp.config?.toolkit_slug  // Add for logo system
        };
      }
      
      // Map 'sse' backend type to 'http' for frontend display
      const displayType = customMcp.type === 'sse' ? 'http' : (customMcp.type || customMcp.customType);

      if (customMcp.type === 'pipedream' || customMcp.customType === 'pipedream') {
        return {
          name: customMcp.name,
          qualifiedName: customMcp.qualifiedName || `pipedream_${customMcp.config?.app_slug || 'unknown'}_${customMcp.config?.profile_id || Date.now()}`,
          config: customMcp.config,
          enabledTools: customMcp.enabledTools,
          isCustom: true,
          customType: 'pipedream',
          isPipedream: true,
          app_slug: customMcp.config?.app_slug || customMcp.app_slug // Add app_slug as direct property for icon loading
        };
      }
      
      return {
        name: customMcp.name,
        qualifiedName: customMcp.qualifiedName || `custom_${displayType}_${customMcp.name.replace(' ', '_').toLowerCase()}`,
        config: customMcp.config,
        enabledTools: customMcp.enabledTools,
        isCustom: true,
        customType: displayType
      };
    }),
    // Add available integrations that aren't configured yet
    ...availableIntegrations
  ];

  const handleConfigurationChange = (mcps: any[]) => {
    console.log('[AgentMCPConfiguration] handleConfigurationChange called with:', {
      mcpsCount: mcps.length,
      mcps: mcps.map(mcp => ({
        name: mcp.name,
        customType: mcp.customType,
        isCustom: mcp.isCustom,
        isAvailable: mcp.isAvailable,
        enabledTools: mcp.enabledTools
      }))
    });
    
    console.log('[AgentMCPConfiguration] Configuration changed:', mcps);
    
    const configured = mcps.filter(mcp => !mcp.isCustom);
    const custom = mcps
      .filter(mcp => mcp.isCustom && !mcp.isAvailable) // Only include actually configured MCPs, not just available ones
      .map(mcp => {
        console.log('[AgentMCPConfiguration] Processing MCP:', {
          name: mcp.name,
          customType: mcp.customType,
          enabledTools: mcp.enabledTools
        });
        
        if (mcp.customType === 'composio' || mcp.isComposio) {
          return {
            name: mcp.name,
            type: 'composio',
            customType: 'composio',
            config: mcp.config,
            enabledTools: mcp.enabledTools
          };
        }
        
        // Map 'http' to 'sse' for backend compatibility
        const backendType = mcp.customType === 'http' ? 'sse' : mcp.customType;

        if (mcp.customType === 'pipedream' || mcp.isPipedream) {
          return {
            name: mcp.name,
            type: 'pipedream',
            customType: 'pipedream',
            config: mcp.config,
            enabledTools: mcp.enabledTools
          };
        }
        
        return {
          name: mcp.name,
          type: backendType,
          customType: mcp.customType,
          config: mcp.config,
          enabledTools: mcp.enabledTools
        };
      });

    console.log('[AgentMCPConfiguration] Final result:', {
      configured: configured.length,
      custom: custom.length,
      customMcps: custom.map(mcp => ({
        name: mcp.name,
        type: mcp.type,
        enabledTools: mcp.enabledTools
      }))
    });

    console.log('[AgentMCPConfiguration] Sending to parent - configured:', configured, 'custom:', custom);
    
    onMCPChange({
      configured_mcps: configured,
      custom_mcps: custom
    });
  };

  return (
    <MCPConfigurationNew
      configuredMCPs={allMCPs}
      onConfigurationChange={handleConfigurationChange}
      agentId={agentId}
      versionData={versionData}
      saveMode={saveMode}
      versionId={versionId}
      isLoading={isLoading}
    />
  );
};