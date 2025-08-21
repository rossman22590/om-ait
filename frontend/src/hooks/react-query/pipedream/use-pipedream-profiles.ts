import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pipedreamApi } from './utils';
import { pipedreamKeys } from './keys';
import type {
  PipedreamProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
} from '@/components/agents/pipedream/pipedream-types';
import { toast } from 'sonner';

export const usePipedreamProfiles = (params?: { app_slug?: string; is_active?: boolean }) => {
  return useQuery({
    queryKey: pipedreamKeys.profiles.list(params),
    queryFn: () => pipedreamApi.getProfiles(params),
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get a single profile
export const usePipedreamProfile = (profileId: string, enabled = true) => {
  return useQuery({
    queryKey: pipedreamKeys.profiles.detail(profileId),
    queryFn: () => pipedreamApi.getProfile(profileId),
    enabled: enabled && !!profileId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to get profile connections
export const usePipedreamProfileConnections = (profileId: string, enabled = true) => {
  return useQuery({
    queryKey: pipedreamKeys.profiles.connections(profileId),
    queryFn: () => pipedreamApi.getProfileConnections(profileId),
    enabled: enabled && !!profileId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to create a profile
export const useCreatePipedreamProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateProfileRequest) => pipedreamApi.createProfile(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.all() });
      toast.success(`Profile "${data.profile_name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create profile');
    },
  });
};

// Hook to update a profile
export const useUpdatePipedreamProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, request }: { profileId: string; request: UpdateProfileRequest }) =>
      pipedreamApi.updateProfile(profileId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.all() });
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.detail(data.profile_id) });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

export const useDeletePipedreamProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => pipedreamApi.deleteProfile(profileId),
    onSuccess: (_, profileId) => {
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.all() });
      queryClient.removeQueries({ queryKey: pipedreamKeys.profiles.detail(profileId) });
      toast.success('Profile deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete profile');
    },
  });
};


export const useConnectPipedreamProfile = () => {
  const queryClient = useQueryClient();

  type Vars = { profileId: string; app?: string; profileName?: string; openInPopup?: boolean };
  type Ctx = { popup?: Window | null };

  return useMutation<
    Awaited<ReturnType<typeof pipedreamApi.connectProfile>>,
    Error,
    Vars,
    Ctx
  >({
    mutationFn: ({ profileId, app }: Vars) => pipedreamApi.connectProfile(profileId, app),
    onMutate: (variables) => {
      let popup: Window | null = null;
      // Pre-open a window during the user gesture to avoid popup blockers
      if (variables.openInPopup !== false) {
        try {
          popup = window.open('', '_blank', 'width=600,height=700');
          if (popup) {
            // Immediately navigate to a same-origin holding page
            try {
              const origin = window.location.origin;
              popup.location.href = `${origin}/pipedream/connecting`;
            } catch {}
          }
        } catch {}
      }
      return { popup };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.all() });
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.detail(data.profile_id) });
      queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.connections(data.profile_id) });
      if (data.link) {
        const connectWindow = context?.popup ?? window.open(data.link, '_blank', 'width=600,height=700');
        if (connectWindow) {
          // If we pre-opened our holding page, try to hand off the link via postMessage after a short delay
          if (context?.popup && context.popup !== null) {
            setTimeout(() => {
              try {
                context.popup?.postMessage({ link: data.link }, '*');
              } catch {}
            }, 300);
            // After a slightly longer delay, if we're still on our holding page, force navigate
            setTimeout(() => {
              try {
                const href = context.popup?.location?.href || '';
                if (href.includes('/pipedream/connecting')) {
                  try { context.popup!.location.href = data.link; } catch {}
                }
              } catch {}
            }, 800);
          }
          const checkClosed = setInterval(() => {
            if (connectWindow.closed) {
              clearInterval(checkClosed);
              (async () => {
                try {
                  // Revalidate caches
                  queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.all() });
                  queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.detail(data.profile_id) });
                  queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.connections(data.profile_id) });

                  // Verify connection status for this profile
                  const connections = await pipedreamApi.getProfileConnections(data.profile_id);
                  const targetApp = variables.app;
                  const isConnected = Array.isArray(connections?.connections)
                    ? connections.connections.some((c: any) =>
                        (targetApp ? (c.app === targetApp || c.name_slug === targetApp) : true) && c.status === 'connected'
                      )
                    : false;

                  if (isConnected) {
                    const profileName = variables.profileName || 'Profile';
                    toast.success(`${profileName} successfully connected!`, {
                      icon: '✅',
                      duration: 4000,
                    });
                    window.dispatchEvent(new CustomEvent('pipedream-connection-success', {
                      detail: { profileId: data.profile_id, profileName }
                    }));
                  } else {
                    const name = variables.profileName || 'Profile';
                    toast.error(`${name} authorization not completed. Please try again.`);
                  }
                } catch (e) {
                  const name = variables.profileName || 'Profile';
                  console.error('Failed to verify Pipedream connection', e);
                  toast.error(`Failed to verify ${name} connection. Please refresh and try again.`);
                }
              })();
            }
          }, 1000);
          setTimeout(() => {
            clearInterval(checkClosed);
          }, 5 * 60 * 1000);
        } else {
          toast.error('Failed to open connection window. Please check your popup blocker.');
        }
      }
    },
    onError: (error: Error, _variables, context) => {
      try { context?.popup?.close(); } catch {}
      toast.error(error.message || 'Failed to connect profile');
    },
  });
};