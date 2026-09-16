'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  getProjectDetail, getSessionProviderSecretPool, listAccountSecretResources,
  setSessionProviderSecretPool,
} from '@kortix/sdk';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorToast, successToast } from '@/components/ui/toast';

export function ProviderSecretPoolEditor({ projectId, sessionId }: { projectId: string; sessionId: string }) {
  const queryClient = useQueryClient();
  const project = useQuery({ queryKey: ['provider-pool-project', projectId], queryFn: () => getProjectDetail(projectId) });
  const accountId = project.data?.project?.account_id;
  const resources = useQuery({
    queryKey: ['account-secret-resources', accountId],
    queryFn: () => listAccountSecretResources(accountId!),
    enabled: Boolean(accountId),
  });
  const providers = useMemo(() => [...new Set((resources.data?.secrets ?? [])
    .filter((secret) => secret.consumer === 'llm_gateway' && secret.provider_id && secret.can_use)
    .map((secret) => secret.provider_id!))].sort(), [resources.data]);
  const [providerId, setProviderId] = useState('');
  const activeProvider = providers.includes(providerId) ? providerId : (providers[0] ?? '');
  const poolKey = ['session-provider-secret-pool', projectId, sessionId, activeProvider] as const;
  const pool = useQuery({
    queryKey: poolKey,
    queryFn: () => getSessionProviderSecretPool(projectId, sessionId, activeProvider),
    enabled: Boolean(activeProvider),
  });
  const [draft, setDraft] = useState<{ providerId: string; ids: string[] } | null>(null);
  const keys = (resources.data?.secrets ?? []).filter((secret) => secret.provider_id === activeProvider && secret.can_use);
  const save = useMutation({
    mutationFn: (ids: string[] | null) => setSessionProviderSecretPool(projectId, sessionId, activeProvider, ids),
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: poolKey });
      successToast('Provider keys updated');
    },
    onError: (error) => errorToast(error instanceof Error ? error.message : 'Provider keys could not be updated'),
  });

  if (project.isLoading || resources.isLoading) return <p className="text-muted-foreground text-xs">Loading keys…</p>;
  if (project.isError || resources.isError) return <p className="text-muted-foreground text-xs">Keys could not be loaded.</p>;
  if (!providers.length) return <p className="text-muted-foreground text-xs">Add a shared provider key in Secrets to build a pool.</p>;
  const selected = draft?.providerId === activeProvider ? draft.ids : (pool.data?.secret_ids ?? []);
  return <div className="space-y-3">
    <div>
      <label className="text-foreground text-xs font-medium" htmlFor="session-provider-pool-provider">Provider</label>
      <Select value={activeProvider} onValueChange={(id) => { setProviderId(id); setDraft(null); }}>
        <SelectTrigger id="session-provider-pool-provider"><SelectValue /></SelectTrigger>
        <SelectContent>{providers.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    <p className="text-muted-foreground text-xs">{pool.data?.configured ? `${selected.length} keys selected for this session` : 'Using the project default'}</p>
    <div className="max-h-44 space-y-1 overflow-y-auto">
      {keys.map((secret) => <label key={secret.secret_id} className="hover:bg-hover flex items-center gap-2 rounded-md px-2 py-2 text-sm">
        <Checkbox checked={selected.includes(secret.secret_id)} disabled={save.isPending}
          onCheckedChange={(checked) => setDraft((current) => {
            const ids = current?.providerId === activeProvider ? current.ids : (pool.data?.secret_ids ?? []);
            return { providerId: activeProvider, ids: checked === true ? [...ids, secret.secret_id] : ids.filter((id) => id !== secret.secret_id) };
          })} />
        <span className="text-foreground truncate">{secret.label}</span>
      </label>)}
    </div>
    <div className="flex gap-2">
      <Button size="sm" disabled={save.isPending || !activeProvider || (pool.data?.configured && JSON.stringify(selected) === JSON.stringify(pool.data.secret_ids))}
        onClick={() => save.mutate(selected)}>Save key selection</Button>
      <Button size="sm" variant="secondary" disabled={save.isPending || !pool.data?.configured}
        onClick={() => save.mutate(null)}>Reset to project default</Button>
    </div>
  </div>;
}

export function NewProviderSecretPoolEditor({ projectId, selection, onChange }: {
  projectId: string;
  selection: Record<string, string[]>;
  onChange: (selection: Record<string, string[]>) => void;
}) {
  const project = useQuery({ queryKey: ['provider-pool-project', projectId], queryFn: () => getProjectDetail(projectId) });
  const accountId = project.data?.project?.account_id;
  const resources = useQuery({
    queryKey: ['account-secret-resources', accountId],
    queryFn: () => listAccountSecretResources(accountId!),
    enabled: Boolean(accountId),
  });
  const providers = useMemo(() => [...new Set((resources.data?.secrets ?? [])
    .filter((secret) => secret.consumer === 'llm_gateway' && secret.provider_id && secret.can_use)
    .map((secret) => secret.provider_id!))].sort(), [resources.data]);
  const [providerId, setProviderId] = useState('');
  const activeProvider = providers.includes(providerId) ? providerId : (providers[0] ?? '');
  const keys = (resources.data?.secrets ?? []).filter((secret) => secret.provider_id === activeProvider && secret.can_use);
  const selected = selection[activeProvider] ?? [];
  if (project.isLoading || resources.isLoading) return <p className="text-muted-foreground text-xs">Loading keys…</p>;
  if (project.isError || resources.isError) return <p className="text-muted-foreground text-xs">Keys could not be loaded.</p>;
  if (!providers.length) return <p className="text-muted-foreground text-xs">Add a shared provider key in Secrets to build a pool.</p>;
  return <div className="space-y-3">
    <label className="text-foreground block text-xs font-medium" htmlFor="new-provider-pool-provider">Provider</label>
    <Select value={activeProvider} onValueChange={setProviderId}>
      <SelectTrigger id="new-provider-pool-provider"><SelectValue /></SelectTrigger>
      <SelectContent>{providers.map((id) => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
    </Select>
    <p className="text-muted-foreground text-xs">{activeProvider in selection ? `${selected.length} keys selected` : 'Using the project default'}</p>
    <div className="max-h-44 space-y-1 overflow-y-auto">
      {keys.map((secret) => <label key={secret.secret_id} className="hover:bg-hover flex items-center gap-2 rounded-md px-2 py-2 text-sm">
        <Checkbox checked={selected.includes(secret.secret_id)} onCheckedChange={(checked) => {
          const next = checked === true ? [...selected, secret.secret_id] : selected.filter((id) => id !== secret.secret_id);
          onChange({ ...selection, [activeProvider]: next });
        }} />
        <span className="text-foreground truncate">{secret.label}</span>
      </label>)}
    </div>
    {activeProvider in selection && <Button size="sm" variant="secondary" onClick={() => {
      const next = { ...selection };
      delete next[activeProvider];
      onChange(next);
    }}>Reset to project default</Button>}
  </div>;
}
