'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DotsThreeIcon } from '@phosphor-icons/react';
import { errorToast, successToast } from '@/components/ui/toast';
import { useAuth } from '@/features/providers/auth-provider';

/** Provider keys live beside the provider they configure. The secret value stays write-only. */
export function AccountSecretResourcesPanel({ accountId, providerId, providerName, envVar, canWrite }: {
  accountId: string;
  providerId: string;
  providerName: string;
  envVar: string;
  canWrite: boolean;
}) {
  const t = useTranslations('pooledSecrets');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['account-secret-resources', accountId] as const;
  const resources = useQuery({ queryKey, queryFn: () => listAccountSecretResources(accountId) });
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [rotating, setRotating] = useState<AccountSecretResource | null>(null);
  const [sharing, setSharing] = useState<AccountSecretResource | null>(null);
  const [deleting, setDeleting] = useState<AccountSecretResource | null>(null);
  const members = useQuery({ queryKey: ['account-members', accountId], queryFn: () => listAccountMembers(accountId) });
  const actorRole = members.data?.find((member) => member.user_id === user?.id)?.account_role;
  const keys = (resources.data?.secrets ?? []).filter((secret) => secret.provider_id === providerId);
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey }); };
  const save = useMutation({
    mutationFn: async () => {
      if (rotating) return rotateAccountSecretResource(accountId, rotating.secret_id, value);
      return createAccountSecretResource(accountId, {
        provider_id: providerId, name: envVar, label: label.trim(),
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
    <section className="min-w-0 space-y-2" aria-label={`${providerName} API keys`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">{keys.length} {keys.length === 1 ? 'key' : 'keys'}</p>
        {canWrite && <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>{t('addKey')}</Button>}
      </div>
      {resources.isLoading ? <Loading /> : resources.isError ? (
        <p className="text-muted-foreground text-xs">{t('loadError')}</p>
      ) : keys.length ? (
        <ul className="space-y-1">{keys.map((secret) => (
            <li key={secret.secret_id} className="border-border flex min-w-0 items-center gap-3 rounded-md border px-3 py-1.5">
              <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                <span>{secret.label}</span>
                {secret.cooldown_until && Date.parse(secret.cooldown_until) > resources.dataUpdatedAt && (
                  <span className="text-muted-foreground block text-xs font-normal">{t('coolingDown')}</span>
                )}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">{secret.granted_user_ids.length} {secret.granted_user_ids.length === 1 ? t('member') : t('members')}</span>
              {canWrite && (secret.created_by === user?.id || actorRole === 'owner' || actorRole === 'admin') && <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={t('actionsFor', { label: secret.label })}><DotsThreeIcon className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setSharing(secret)}>{t('manageAccess')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { setValue(''); setRotating(secret); }}>{t('rotateKey')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDeleting(secret)}>{t('deleteKey')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}
            </li>
          ))}</ul>
      ) : null}

      <Modal open={creating || rotating !== null} onOpenChange={(open) => { if (!open) { setCreating(false); setRotating(null); setValue(''); } }}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader><ModalTitle>{rotating ? t('rotateLabel', { label: rotating.label }) : `${t('addKey')} · ${providerName}`}</ModalTitle>
            <ModalDescription>{t('valueNeverShown')}</ModalDescription></ModalHeader>
          <ModalBody className="space-y-3">
            {!rotating && <>
              <Field><FieldLabel htmlFor={`provider-key-label-${providerId}`}>{t('label')}</FieldLabel><Input id={`provider-key-label-${providerId}`} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('primaryKey')} maxLength={100} /></Field>
            </>}
            <Field><FieldLabel htmlFor={`provider-key-value-${providerId}`}>{t('apiKey')}</FieldLabel><Input id={`provider-key-value-${providerId}`} type="password" value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" /></Field>
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
