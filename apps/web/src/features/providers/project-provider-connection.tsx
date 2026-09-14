'use client';

import { ChatGptDeviceChallenge } from '@/components/projects/chatgpt-device-challenge';
import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import Loading from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isLlmGatewayEnabled } from '@/lib/llm-gateway';
import {
  getProjectDetail,
  listProjectPersonalProviders,
  listUserProviderConnections,
  pollUserProviderOAuth,
  saveUserProviderApiKey,
  setProjectPersonalProvider,
  startUserProviderOAuth,
} from '@kortix/sdk';
import { qk, refreshProjectProviderState } from '@kortix/sdk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ComponentType, type ReactNode, useEffect, useRef, useState } from 'react';
import type { ProviderConnectRow, ProviderKeyFieldsProps } from './provider-connect';

const connectionsKey = ['user-provider-connections'];

/** Keeps credential scope inside the existing provider row on every connect surface. */
export function ProjectProviderConnection({
  projectId,
  row,
  children,
  KeyFields,
}: {
  projectId: string;
  row: ProviderConnectRow;
  children: ReactNode;
  KeyFields: ComponentType<ProviderKeyFieldsProps>;
}) {
  const t = useTranslations('personalProviders');
  const client = useQueryClient();
  const project = useQuery({
    queryKey: qk.project.detail(projectId),
    queryFn: () => getProjectDetail(projectId),
  });
  const personalEnabled = isLlmGatewayEnabled(project.data?.project);
  const connections = useQuery({
    queryKey: connectionsKey,
    queryFn: listUserProviderConnections,
    enabled: personalEnabled,
  });
  const bindings = useQuery({
    queryKey: [...connectionsKey, projectId],
    queryFn: () => listProjectPersonalProviders(projectId),
    enabled: personalEnabled,
  });
  const adapters =
    connections.data?.providers.filter(
      (p) => p.provider_id === row.id || (row.id === 'openai' && p.provider_id === 'codex'),
    ) ?? [];
  const active =
    adapters.find((p) => bindings.data?.items.some((b) => b.provider_id === p.provider_id))
      ?.provider_id ?? 'project';
  // An unsaved choice is a draft. It never changes the running project's credentials.
  const [draft, setDraft] = useState<string | null>(null);
  const selected = draft ?? active;
  const adapter = adapters.find((p) => p.provider_id === selected);
  const connected = connections.data?.items.some((c) => c.provider_id === selected) ?? false;
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [challenge, setChallenge] = useState<{ url: string; code: string | null } | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  async function refresh() {
    await client.invalidateQueries({ queryKey: connectionsKey });
    refreshProjectProviderState(client, projectId);
  }
  async function selectConnection(id: string) {
    // Activate the replacement before removing the previous binding.
    if (id !== 'project') await setProjectPersonalProvider(projectId, id, true);
    for (const other of adapters) {
      if (
        other.provider_id !== id &&
        bindings.data?.items.some((b) => b.provider_id === other.provider_id)
      ) {
        await setProjectPersonalProvider(projectId, other.provider_id, false);
      }
    }
  }
  const change = useMutation({
    mutationFn: async (id: string) => {
      generation.current++;
      setChallenge(null);
      setValue('');
      setRevealed(false);
      connect.reset();
      if (id === 'project' || connections.data?.items.some((c) => c.provider_id === id)) {
        await selectConnection(id);
        await refresh();
        setDraft(null);
      } else setDraft(id);
    },
    onError: async () => {
      setDraft(null);
      await refresh();
    },
  });
  const connect = useMutation({
    mutationFn: async (attempt: number) => {
      const id = selected;
      if (adapter?.auth_type === 'api_key') {
        await saveUserProviderApiKey(id, value.trim());
      } else {
        const start = await startUserProviderOAuth(id);
        if (generation.current !== attempt) return;
        setChallenge({ url: start.verification_url, code: start.user_code });
        let authorized = false;
        // eslint-disable-next-line react-hooks/purity -- This expiry check runs inside the async mutation, not render.
        while (Date.now() < start.expires_at) {
          await new Promise((resolve) => setTimeout(resolve, Math.max(3000, start.interval_ms)));
          if (generation.current !== attempt) return;
          const result = await pollUserProviderOAuth(id, start.flow_id);
          if (generation.current !== attempt) return;
          if (result.status === 'success') {
            authorized = true;
            break;
          }
          if (result.status === 'failed') throw new Error(result.error);
          if (result.status === 'expired') break;
        }
        if (!authorized) throw new Error(t('expired'));
      }
      if (generation.current !== attempt) return;
      await selectConnection(id);
      await refresh();
      setDraft(null);
      setValue('');
      setChallenge(null);
    },
    onError: (_error, attempt) => {
      if (generation.current !== attempt) return;
      setChallenge(null);
      void refresh();
    },
  });

  if (project.isPending) return <Loading />;
  if (!project.isError && !personalEnabled) return children;
  if (personalEnabled && (connections.isPending || bindings.isPending)) return <Loading />;
  if (connections.isError || bindings.isError || project.isError)
    return (
      <div className="space-y-2">
        <InfoBanner tone="destructive">{t('loadFailed')}</InfoBanner>
        {children}
      </div>
    );
  if (!adapters.length) return children;
  const busy = change.isPending || connect.isPending;
  const field = row.envVars[0] ?? 'API_KEY';
  return (
    <div className="min-w-0 space-y-2">
      <Select value={selected} onValueChange={(id) => change.mutate(id)} disabled={busy}>
        <SelectTrigger
          aria-label={t('connectionFor', { provider: row.label })}
          size="sm"
          className="w-fit"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="project">{t('projectConnection')}</SelectItem>
          {adapters.map((p) => (
            <SelectItem key={p.provider_id} value={p.provider_id}>
              {p.auth_type === 'device_oauth'
                ? t('mySubscription')
                : row.id === 'openai'
                  ? t('myApiKey')
                  : t('myConnection')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {change.isError && <InfoBanner tone="destructive">{change.error.message}</InfoBanner>}
      {selected === 'project' ? (
        <fieldset disabled={change.isPending}>{children}</fieldset>
      ) : (
        <>
          {adapter?.auth_type === 'api_key' ? (
            <fieldset disabled={busy}>
              <KeyFields
                row={{ ...row, connected, envVars: [field] }}
                values={{ [`${row.id}:${field}`]: value }}
                onValueChange={(_provider, _env, next) => {
                  setValue(next);
                  connect.reset();
                }}
                onCommit={() => {
                  if (value.trim() && !busy) connect.mutate(++generation.current);
                }}
                status={connect.isPending ? 'saving' : connect.isError ? 'error' : 'idle'}
                errorMessage={connect.error?.message}
                revealedFields={{ [`${row.id}:${field}`]: revealed }}
                onToggleReveal={() => setRevealed((v) => !v)}
              />
            </fieldset>
          ) : (
            <div className="space-y-2">
              {connected && (
                <p role="status" className="text-muted-foreground text-xs">
                  {t('subscriptionConnected')}
                </p>
              )}
              {challenge && <ChatGptDeviceChallenge {...challenge} />}
              {connect.isError && (
                <InfoBanner tone="destructive">{connect.error.message}</InfoBanner>
              )}
              {connect.isPending ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    generation.current++;
                    setChallenge(null);
                    connect.reset();
                  }}
                >
                  {t('cancel')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    if (connected && draft !== null) change.mutate(selected);
                    else connect.mutate(++generation.current);
                  }}
                >
                  {connected
                    ? draft !== null
                      ? t('useConnection')
                      : t('reconnectChatGpt')
                    : t('connectChatGpt')}
                </Button>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            {connected && draft === null ? t('personalActive') : t('personalDraft')}
          </p>
        </>
      )}
    </div>
  );
}
