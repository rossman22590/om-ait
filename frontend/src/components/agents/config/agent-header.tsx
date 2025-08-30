'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { ProfilePictureDialog } from './profile-picture-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentIconAvatar } from './agent-icon-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AgentVersionSwitcher } from '../agent-version-switcher';
import { UpcomingRunsDropdown } from '../upcoming-runs-dropdown';
import { useSubscriptionData } from '@/contexts/SubscriptionContext';

interface AgentHeaderProps {
  agentId: string;
  displayData: {
    name: string;
    description?: string;
    profile_image_url?: string;
    icon_name?: string | null;
    icon_color?: string | null;
    icon_background?: string | null;
  };
  isViewingOldVersion: boolean;
  onFieldChange: (field: string, value: any) => void;
  onExport?: () => void;
  isExporting?: boolean;
  agentMetadata?: {
    is_suna_default?: boolean;
    centrally_managed?: boolean;
    restrictions?: {
      name_editable?: boolean;
    };
  };
  currentVersionId?: string;
  currentFormData?: {
    system_prompt: string;
    configured_mcps: any[];
    custom_mcps: any[];
    agentpress_tools: any;
  };
  hasUnsavedChanges?: boolean;
  onVersionCreated?: () => void;
  onNameSave?: (name: string) => Promise<void>;
  onProfileImageSave?: (profileImageUrl: string | null) => Promise<void>;
  onIconSave?: (iconName: string | null, iconColor: string, iconBackground: string) => Promise<void>;
}

export function AgentHeader({
  agentId,
  displayData,
  isViewingOldVersion,
  onFieldChange,
  onExport,
  isExporting = false,
  agentMetadata,
  currentVersionId,
  currentFormData,
  hasUnsavedChanges,
  onVersionCreated,
  onNameSave,
  onProfileImageSave,
  onIconSave,
}: AgentHeaderProps) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(displayData.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: subscriptionData } = useSubscriptionData();
  
  // All agents are now fully editable - no restrictions
  const isSunaAgent = false; // Disabled Suna restrictions
  const restrictions = {}; // No restrictions
  const isNameEditable = !isViewingOldVersion; // Always editable if not viewing old version
  
  const startEditing = () => {
    setEditName(displayData.name);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(displayData.name);
  };

  const saveNewName = async () => {
    if (editName.trim() === '') {
      setEditName(displayData.name);
      setIsEditing(false);
      return;
    }

    if (editName !== displayData.name) {
      if (!isNameEditable && isSunaAgent) {
        toast.error("Name cannot be edited", {
          description: "Machine's name is managed centrally and cannot be changed.",
        });
        setEditName(displayData.name);
        setIsEditing(false);
        return;
      }
      
      if (onNameSave) {
        await onNameSave(editName);
      } else {
        onFieldChange('name', editName);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveNewName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleImageUpdate = (url: string | null) => {
    if (onProfileImageSave) {
      onProfileImageSave(url);
    } else {
      onFieldChange('profile_image_url', url);
    }
  };
  
  const handleIconUpdate = async (iconName: string | null, iconColor: string, backgroundColor: string) => {
    if (onIconSave) {
      await onIconSave(iconName, iconColor, backgroundColor);
    } else {
      onFieldChange('icon_name', iconName);
      onFieldChange('icon_color', iconColor);
      onFieldChange('icon_background', backgroundColor);
    }
    
    if (iconName && displayData.profile_image_url) {
      handleImageUpdate(null);
    }
  };

  return (
    <>
    <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-3 z-20 w-full px-8 mb-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          {isSunaAgent ? (
            <div className="h-9 w-9 rounded-lg bg-muted border flex items-center justify-center">
              <KortixLogo size={16} />
            </div>
          ) : (
            <button 
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => setIsProfileDialogOpen(true)}
              type="button"
            >
              <AgentIconAvatar
                profileImageUrl={displayData.profile_image_url}
                iconName={displayData.icon_name}
                iconColor={displayData.icon_color}
                backgroundColor={displayData.icon_background}
                agentName={displayData.name}
                size={36}
                className="ring-1 ring-black/5 hover:ring-black/10 transition-all"
              />
            </button>
          )}
        </div>
        <div className="min-w-0">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveNewName}
              className="h-8 w-auto min-w-[180px] text-base font-medium"
              maxLength={50}
            />
          ) : !displayData.name || displayData.name === 'Agent' ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
              onClick={startEditing}
            >
              <span className="text-base font-medium text-foreground truncate">
                {displayData.name}
              </span>
              {!isViewingOldVersion && (
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to edit
                </span>
              )}
            </div>
          )}
          
          {/* Current Plan Display */}
          {subscriptionData?.subscription && (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Current Plan:
                </span>
                <span className="text-xs font-medium text-foreground">
                  {subscriptionData.subscription.cancel_at_period_end || subscriptionData.subscription.cancel_at 
                    ? 'Ending Soon'
                    : subscriptionData.subscription.status === 'trialing' 
                      ? 'Trial'
                      : subscriptionData.subscription.status === 'active'
                        ? 'Active'
                        : subscriptionData.subscription.status || 'Unknown'
                  }
                </span>
                {subscriptionData.subscription.cancel_at_period_end && (
                  <span className="text-xs text-muted-foreground">
                    • Ends {new Date(subscriptionData.subscription.current_period_end * 1000).toLocaleDateString()}
                  </span>
                )}
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => window.location.href = '/settings/billing'}
                >
                  Manage
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center gap-2">
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {!isSunaAgent && currentFormData && (
            <AgentVersionSwitcher
              agentId={agentId}
              currentVersionId={currentVersionId}
              currentFormData={currentFormData}
            />
          )}
          <UpcomingRunsDropdown agentId={agentId} />
          {onExport && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={onExport}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExporting ? 'Exporting...' : 'Export Agent'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </header>
    <ProfilePictureDialog
      isOpen={isProfileDialogOpen}
      onClose={() => setIsProfileDialogOpen(false)}
      currentImageUrl={displayData.profile_image_url}
      currentIconName={displayData.icon_name}
      currentIconColor={displayData.icon_color}
      currentBackgroundColor={displayData.icon_background}
      agentName={displayData.name}
      onImageUpdate={handleImageUpdate}
      onIconUpdate={handleIconUpdate}
    />
    </>
  );
} 