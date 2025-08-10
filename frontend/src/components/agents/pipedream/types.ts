import type { PipedreamProfile } from './pipedream-types';
import type { PipedreamApp } from '@/hooks/react-query/pipedream/utils';

export interface AppCardProps {
  app: PipedreamApp;
  compact?: boolean;
  mode?: 'full' | 'simple' | 'profile-only';
  currentAgentId?: string;
  agentName?: string;
  agentPipedreamProfiles?: Array<
    Pick<PipedreamProfile, 'profile_id' | 'profile_name'> & {
      enabledTools?: string[];
      toolsCount?: number;
      app_slug?: string;
    }
  >;
  onAppSelected?: (app: { app_slug: string; app_name: string }) => void;
  onConnectApp?: (app: PipedreamApp) => void;
  onConfigureTools?: (profile: any) => void;
  handleCategorySelect?: (category: string) => void;
}

export interface PipedreamRegistryProps {
  onToolsSelected?: (
    profileId: string,
    selectedTools: string[],
    appName: string,
    appSlug: string
  ) => void;
  onAppSelected?: (app: { app_slug: string; app_name: string }) => void;
  mode?: 'full' | 'simple' | 'profile-only';
  onClose?: () => void;
  showAgentSelector?: boolean;
  selectedAgentId?: string;
  onAgentChange?: (agentId?: string) => void;
  versionData?: any;
  versionId?: string;
  // When true, the connector should always persist tools directly via API (no callback-only flow)
  forceDirectSave?: boolean;
}
