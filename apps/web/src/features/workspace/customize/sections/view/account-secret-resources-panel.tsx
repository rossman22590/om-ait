'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  type AccountSecretResource, createAccountSecretResource, deleteAccountSecretResource,
  grantAccountSecretResource, listAccountMembers, listAccountSecretResources,
  revokeAccountSecretResourceGrant, rotateAccountSecretResource,
} from '@kortix/sdk';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { Modal, ModalBody, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DotsThreeIcon } from '@phosphor-icons/react';
import { errorToast, successToast } from '@/components/ui/toast';
import { LLM_PROVIDERS } from '@/lib/llm-providers';

export function AccountSecretResourcesPanel({ accountId }: { accountId: string }) {
  const t = useTranslations('pooledSecrets');
  const queryClient = useQueryClient();
  const queryKey = ['account-secret-resources', accountId] as const;
  const resources = useQuery({ queryKey, queryFn: () => listAccountSecretResources(accountId) });
  const members = useQuery({ queryKey: ['account-members', accountId], queryFn: () => listAccountMembers(accountId) });
  const [creating, setCreating] = useState(false);
  const [providerId, setProviderId] = useState('anthropic');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [rotating, setRotating] = useState<AccountSecretResource | null>(null);
  const [sharing, setSharing] = useState<AccountSecretResource | null>(null);
  const [deleting, setDeleting] = useState<AccountSecretResource | null>(null);
  const providers = useMemo(() => LLM_PROVIDERS.filter((provider) => !provider.managed && provider.envVars.length === 1), []);
  const selectedProvider = providers.find((provider) => provider.id === providerId);
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey }); };
  const save = useMutation({
    mutationFn: async () => {
      if (rotating) return rotateAccountSecretResource(accountId, rotating.secret_id, value);
      if (!selectedProvider) throw new Error(t('chooseProvider'));
      return createAccountSecretResource(accountId, {
        provider_id: selectedProvider.id, name: selectedProvider.envVars[0]!, label: label.trim(),
        value, consumer: 'llm_gateway', strategy: 'broker',
      });
    },
    onSuccess: async () => {
      await refresh();
      setCreating(false); setRotating(null); setLabel(''); setValue('');
      successToast(t('saved'));
    },
    onError: (error) => errorToast(error instanceof Error ? error.message : t('saveError')),
  });
  const remove = useMutation({
    mutationFn: (secretId: string) => deleteAccountSecretResource(accountId, secretId),
    onSuccess: async () => { await refresh(); setDeleting(null); successToast(t('deleted')); },
    onError: (error) => errorToast(error instanceof Error ? error.message : t('deleteError')),
  });
  const changeGrant = useMutation({
    mutationFn: ({ secretId, userId, grant }: { secretId: string; userId: string; grant: boolean }) =>
      grant ? grantAccountSecretResource(accountId, secretId, userId) : revokeAccountSecretResourceGrant(accountId, secretId, userId),
    onSuccess: async (updated) => { setSharing(updated); await refresh(); },
    onError: (error) => errorToast(error instanceof Error ? error.message : t('accessError')),
  });

  return (
    <section className="border-border space-y-3 border-t pt-4" aria-label={t('sharedTitle')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">{t('sharedTitle')}</h2>
          <p className="text-muted-foreground text-xs">{t('sharedDescription')}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>{t('addKey')}</Button>
      </div>
      {resources.isLoading ? <Loading /> : resources.isError ? (
        <p className="text-muted-foreground text-xs">{t('loadError')}</p>
      ) : resources.data?.secrets.length ? (
        <Table>
          <TableHeader><TableRow><TableHead>{t('key')}</TableHead><TableHead>{t('provider')}</TableHead><TableHead>{t('access')}</TableHead><TableHead className="w-44"><span className="sr-only">{t('actions')}</span></TableHead></TableRow></TableHeader>
          <TableBody>{resources.data.secrets.map((secret) => (
            <TableRow key={secret.secret_id}>
              <TableCell className="text-foreground text-sm font-medium">
                <span>{secret.label}</span>
                {secret.cooldown_until && Date.parse(secret.cooldown_until) > resources.dataUpdatedAt && (
                  <span className="text-muted-foreground block text-xs font-normal">{t('coolingDown')}</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">{providers.find((provider) => provider.id === secret.provider_id)?.label ?? secret.provider_id}</TableCell>
              <TableCell className="text-muted-foreground text-xs">{secret.granted_user_ids.length} {secret.granted_user_ids.length === 1 ? t('member') : t('members')}</TableCell>
              <TableCell className="text-right"><DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={t('actionsFor', { label: secret.label })}><DotsThreeIcon className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setSharing(secret)}>{t('manageAccess')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { setValue(''); setRotating(secret); }}>{t('rotateKey')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDeleting(secret)}>{t('deleteKey')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      ) : <p className="text-muted-foreground text-xs">{t('empty')}</p>}

      <Modal open={creating || rotating !== null} onOpenChange={(open) => { if (!open) { setCreating(false); setRotating(null); setValue(''); } }}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader><ModalTitle>{rotating ? t('rotateLabel', { label: rotating.label }) : t('addProviderKey')}</ModalTitle>
            <ModalDescription>{t('valueNeverShown')}</ModalDescription></ModalHeader>
          <ModalBody className="space-y-3">
            {!rotating && <>
              <Field><FieldLabel>{t('provider')}</FieldLabel><Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{providers.map((provider) => <SelectItem key={provider.id} value={provider.id}>{provider.label}</SelectItem>)}</SelectContent>
              </Select></Field>
              <Field><FieldLabel>{t('label')}</FieldLabel><Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('primaryKey')} maxLength={100} /></Field>
            </>}
            <Field><FieldLabel>{t('apiKey')}</FieldLabel><Input type="password" value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" /></Field>
          </ModalBody>
          <ModalFooter><Button variant="secondary" onClick={() => { setCreating(false); setRotating(null); setValue(''); }}>{t('cancel')}</Button>
            <Button disabled={save.isPending || !value.trim() || (!rotating && !label.trim())} onClick={() => save.mutate()}>{save.isPending ? t('saving') : t('saveKey')}</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={sharing !== null} onOpenChange={(open) => { if (!open) setSharing(null); }}>
        <ModalContent className="sm:max-w-md"><ModalHeader><ModalTitle>{t('accessTo', { label: sharing?.label ?? '' })}</ModalTitle>
          <ModalDescription>{t('grantedMembers')}</ModalDescription></ModalHeader>
          <ModalBody className="max-h-72 space-y-1 overflow-y-auto">{members.data?.map((member) => (
            <label key={member.user_id} className="hover:bg-hover flex items-center gap-2 rounded-md px-2 py-2 text-sm">
              <Checkbox checked={sharing?.granted_user_ids.includes(member.user_id) ?? false}
                disabled={changeGrant.isPending || member.user_id === sharing?.created_by}
                onCheckedChange={(checked) => sharing && changeGrant.mutate({ secretId: sharing.secret_id, userId: member.user_id, grant: checked === true })} />
              <span className="text-foreground truncate">{member.email ?? member.user_id}</span>
            </label>
          ))}</ModalBody>
          <ModalFooter><Button onClick={() => setSharing(null)}>{t('done')}</Button></ModalFooter>
        </ModalContent>
      </Modal>
      <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title={t('deleteConfirmTitle')} description={deleting ? t('deleteConfirmDescription', { label: deleting.label }) : ''}
        confirmLabel={t('deleteKey')} confirmVariant="destructive" isPending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.secret_id); }} />
    </section>
  );
}
