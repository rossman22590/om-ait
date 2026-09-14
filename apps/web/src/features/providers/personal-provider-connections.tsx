'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProjectDetail, deleteUserProviderConnection, listProjectPersonalProviders, listUserProviderConnections,
  pollUserProviderOAuth, saveUserProviderApiKey, setProjectPersonalProvider, startUserProviderOAuth } from '@kortix/sdk';
import { qk, refreshProjectProviderState } from '@kortix/sdk/react';
import { isLlmGatewayEnabled } from '@/lib/llm-gateway';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChatGptDeviceChallenge } from '@/components/projects/chatgpt-device-challenge';
import { errorToast, successToast } from '@/components/ui/toast';

const connectionsKey = ['user-provider-connections'];

/** Personal credentials have one management surface, also embedded in project Providers. */
export function PersonalProviderConnections({ projectId }: { projectId?: string }) {
  const queryClient = useQueryClient();
  const project = useQuery({ queryKey: qk.project.detail(projectId ?? ''),
    queryFn: () => getProjectDetail(projectId!), enabled: !!projectId });
  const connections = useQuery({ queryKey: connectionsKey, queryFn: listUserProviderConnections });
  const bindings = useQuery({ queryKey: [...connectionsKey, projectId],
    queryFn: () => listProjectPersonalProviders(projectId!), enabled: !!projectId });
  const [provider, setProvider] = useState('codex');
  const [apiKey, setApiKey] = useState('');
  const [remove, setRemove] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<{ url: string; code: string | null } | null>(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const adapter = connections.data?.providers.find(p => p.provider_id === provider);
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: connectionsKey });
    if (projectId) refreshProjectProviderState(queryClient, projectId);
    else await queryClient.invalidateQueries();
  };
  const connect = useMutation({
    mutationFn: async () => {
      const attempt = ++generation.current;
      if (adapter?.auth_type === 'api_key') {
        await saveUserProviderApiKey(provider, apiKey);
        setApiKey('');
      } else {
        const start = await startUserProviderOAuth(provider);
        if (generation.current !== attempt) return;
        setChallenge({ url: start.verification_url, code: start.user_code });
        let authorized = false;
        while (Date.now() < start.expires_at) {
          await new Promise(resolve => setTimeout(resolve, Math.max(3000, start.interval_ms)));
          if (generation.current !== attempt) return;
          const result = await pollUserProviderOAuth(provider, start.flow_id);
          if (generation.current !== attempt) return;
          if (result.status === 'success') { authorized = true; break; }
          if (result.status === 'failed') throw new Error(result.error);
          if (result.status === 'expired') throw new Error('Authorization expired. Connect again.');
          if (Date.now() >= start.expires_at) throw new Error('Authorization expired. Connect again.');
        }
        if (!authorized) throw new Error('Authorization expired. Connect again.');
      }
      if (generation.current !== attempt) return;
      if (projectId) await setProjectPersonalProvider(projectId, provider, true);
      setChallenge(null);
      await refresh();
      successToast('Personal provider connected');
    },
    onError: (error) => { setChallenge(null); errorToast(error.message); },
  });
  const bind = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
    setProjectPersonalProvider(projectId!, id, enabled), onSuccess: refresh,
    onError: (error) => errorToast(error.message) });
  const disconnect = useMutation({ mutationFn: deleteUserProviderConnection,
    onSuccess: async () => { setRemove(null); await refresh(); }, onError: (error) => errorToast(error.message) });

  if (projectId && project.isPending) return <Loading />;
  if (projectId && !isLlmGatewayEnabled(project.data?.project)) return <InfoBanner>Personal providers require the LLM gateway for this project.</InfoBanner>;
  if (connections.isPending) return <Loading />;
  if (connections.isError) return <InfoBanner tone="destructive">{connections.error.message}</InfoBanner>;
  const providers = connections.data.providers;
  return (
    <section className="space-y-4" aria-label="Personal provider connections">
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium">My providers</h3>
        <p className="text-muted-foreground text-xs">
          Connect once and use your subscription or API key across projects.
          {projectId ? ' Enabling a connection uses it for sessions launched as you in this project.' : ' Choose where to use each connection in project Models → Providers.'}
        </p>
      </div>
      {bindings.isError && <InfoBanner tone="destructive">{bindings.error.message}</InfoBanner>}
      {connections.data.items.length > 0 && (
        <ul className="divide-y rounded-md border bg-popover">
          {connections.data.items.map(connection => {
            const id = connection.provider_id;
            const name = providers.find(p => p.provider_id === id)?.name ?? id;
            return <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-muted-foreground text-xs">Personal · {connection.auth_type === 'api_key' ? 'API key' : 'Subscription'}</p>
              </div>
              {projectId && <Switch aria-label={`Use my ${name} in this project`}
                checked={bindings.data?.items.some(b => b.provider_id === id) ?? false}
                disabled={bindings.isPending || bindings.isError || bind.isPending}
                onCheckedChange={enabled => bind.mutate({ id, enabled })} />}
              <Button variant="ghost" size="sm" onClick={() => setRemove(id)}>Disconnect</Button>
            </li>;
          })}
        </ul>
      )}
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="personal-provider">Provider</FieldLabel>
          <Select value={provider} onValueChange={setProvider} disabled={connect.isPending}>
            <SelectTrigger id="personal-provider"><SelectValue /></SelectTrigger>
            <SelectContent>{providers.map(p => <SelectItem key={p.provider_id} value={p.provider_id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        {adapter?.auth_type === 'api_key' && <Field>
          <FieldLabel htmlFor="personal-provider-key">Your API key</FieldLabel>
          <Input id="personal-provider-key" type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={connect.isPending} />
        </Field>}
        {challenge && <ChatGptDeviceChallenge {...challenge} />}
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={connect.isPending || !adapter || (adapter.auth_type === 'api_key' && !apiKey.trim())} onClick={() => connect.mutate()}>
            {connect.isPending && <Loading className="size-4" />}
            {adapter?.auth_type === 'device_oauth' ? 'Connect ChatGPT' : 'Save personal key'}
          </Button>
          {challenge && <Button size="sm" variant="ghost" onClick={() => { generation.current++; setChallenge(null); }}>Cancel</Button>}
        </div>
        {projectId && <p className="text-muted-foreground text-xs">Connecting here also enables this provider for your sessions in this project.</p>}
      </div>
      <ConfirmDialog open={!!remove} onOpenChange={open => { if (!open) setRemove(null); }}
        title="Disconnect personal provider?" description="This removes your connection from every project. You can connect again later."
        confirmLabel="Disconnect" confirmVariant="destructive" isPending={disconnect.isPending}
        onConfirm={() => { if (remove) disconnect.mutate(remove); }} />
    </section>
  );
}
