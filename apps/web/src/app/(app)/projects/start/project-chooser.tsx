'use client';

import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { Button } from '@/components/ui/button';
import { EntityAvatar } from '@/components/ui/entity-avatar';
import Loading from '@/components/ui/loading';
import { errorToast } from '@/components/ui/toast';
import { WallpaperBackground } from '@/components/ui/wallpaper-background';
import { useAuth } from '@/features/providers/auth-provider';
import { useMyInvites } from '@/hooks/account/use-my-invites';
import { useTranslations } from '@/i18n/use-translations';
import { cn } from '@/lib/utils';
import { acceptAccountInvite, type MyAccountInvite } from '@kortix/sdk';
import { qk } from '@kortix/sdk/react';
import { PlusIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

/**
 * `/projects/start` with nothing to open: the chooser.
 *
 * Replaces the automatic "My First Project". That auto-create ran before the
 * user could see anything, so an invitee who signed up without the email link
 * landed in a fresh personal project with no sign of the invite. Now the door
 * shows what the user can act on, Slack-style:
 *
 *  - `invites`       — pending invites for the caller's email, each with Join.
 *                      Creating is the secondary path underneath.
 *  - `empty`         — no invites, may create: one create action, and a line
 *                      naming the email that invites reach.
 *  - `no-permission` — no invites, member without PROJECT_CREATE: no create
 *                      control (it would only 403). Flow-08 contract.
 *
 * `/projects` redirects to this route, so nothing here links to it.
 */
export type ChooserMode = 'invites' | 'empty' | 'no-permission';

export function chooserMode(input: { inviteCount: number; canCreate: boolean }): ChooserMode {
  if (input.inviteCount > 0) return 'invites';
  return input.canCreate ? 'empty' : 'no-permission';
}

/**
 * Where Join goes. A project invite opens the first invited project. A plain
 * workspace invite has no project yet, so the caller re-runs the landing
 * resolver against the refreshed account list.
 */
export function joinDestination(invite: MyAccountInvite): string | null {
  const first = invite.projects[0];
  return first ? `/projects/${first.project_id}` : null;
}

export interface ProjectChooserViewProps {
  email: string | null;
  invites: MyAccountInvite[];
  invitesLoading: boolean;
  canCreate: boolean;
  /** The invite whose Join is in flight; every Join is disabled meanwhile. */
  joiningInviteId: string | null;
  onJoin: (invite: MyAccountInvite) => void;
}

/** Props-only half, so every state renders under `renderToStaticMarkup`. */
export function ProjectChooserView({
  email,
  invites,
  invitesLoading,
  canCreate,
  joiningInviteId,
  onJoin,
}: ProjectChooserViewProps) {
  const t = useTranslations('projectChooser');
  const mode = chooserMode({ inviteCount: invites.length, canCreate });
  const recipient = email ?? '';

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <WallpaperBackground wallpaperId="brandmark" />
      <div className="relative z-10 flex min-h-full flex-col items-center justify-center gap-5 px-4 py-10">
        <KortixLogo size={24} />
        {/* Floats over the wallpaper, so it takes an overlay's border + shadow. */}
        <div className="bg-popover w-full max-w-md overflow-hidden rounded-md border shadow-lg">
          {invitesLoading ? (
            <div className="flex items-center justify-center px-4 py-10">
              <Loading className="size-4 shrink-0" />
            </div>
          ) : mode === 'invites' ? (
            <>
              <header className="space-y-1 px-4 pt-5 pb-4">
                <h1 className="text-foreground text-xl font-medium">{t('invitesTitle')}</h1>
                {recipient ? (
                  <p className="text-muted-foreground text-xs">{t('signedInAs', { email: recipient })}</p>
                ) : null}
              </header>
              <p className="text-muted-foreground border-t px-4 pt-3 pb-1 text-xs">
                {t('invitations')} · {invites.length}
              </p>
              <ul>
                {invites.map((invite, i) => (
                  <InviteRow
                    key={invite.invite_id}
                    invite={invite}
                    first={i === 0}
                    joining={joiningInviteId === invite.invite_id}
                    disabled={joiningInviteId !== null}
                    onJoin={onJoin}
                  />
                ))}
              </ul>
              {canCreate ? (
                <div className="border-t px-4 py-3">
                  <Button asChild variant="ghost" size="sm" className="gap-1.5">
                    <Link href="/new">
                      <PlusIcon className="size-3.5 shrink-0" />
                      {t('createProjectInstead')}
                    </Link>
                  </Button>
                </div>
              ) : null}
            </>
          ) : mode === 'empty' ? (
            <div className="space-y-5 px-4 py-5">
              <div className="space-y-1">
                <h1 className="text-foreground text-xl font-medium">{t('emptyTitle')}</h1>
                <p className="text-muted-foreground text-sm">{t('emptyBody')}</p>
              </div>
              <Button asChild className="w-full gap-1.5">
                <Link href="/new">
                  <PlusIcon className="size-4 shrink-0" />
                  {t('createProject')}
                </Link>
              </Button>
              {recipient ? (
                <p className="text-muted-foreground text-xs">
                  {t('waitingForInvite', { email: recipient })}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1 px-4 py-5">
              <h1 className="text-foreground text-xl font-medium">{t('noPermissionTitle')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('noPermissionBody', { email: recipient })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  first,
  joining,
  disabled,
  onJoin,
}: {
  invite: MyAccountInvite;
  first: boolean;
  joining: boolean;
  disabled: boolean;
  onJoin: (invite: MyAccountInvite) => void;
}) {
  const t = useTranslations('projectChooser');
  const workspace = invite.account_name ?? t('unnamedWorkspace');
  // A project invite leads with the project — that is where Join lands. A
  // workspace invite leads with the workspace.
  const title = invite.projects.length > 0 ? invite.projects.map((p) => p.name).join(', ') : workspace;

  return (
    <li className={cn('flex items-center gap-3 px-4 py-2.5', !first && 'border-t')}>
      <EntityAvatar label={title} size="md" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-foreground truncate text-sm font-medium">{title}</p>
        {/* Not `InlineMeta`: it truncates every item alike. The workspace name
            is short and identifies the invite; only the long inviter email
            may truncate. */}
        <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
          {invite.projects.length > 0 ? <span className="shrink-0">{workspace}</span> : null}
          {invite.projects.length > 0 && invite.inviter_email ? (
            <span aria-hidden className="text-muted-foreground/40">
              &bull;
            </span>
          ) : null}
          {invite.inviter_email ? (
            <span className="truncate">{t('invitedBy', { email: invite.inviter_email })}</span>
          ) : null}
        </p>
      </div>
      <Button size="sm" disabled={disabled} onClick={() => onJoin(invite)} className="shrink-0 gap-1.5">
        {joining ? <Loading className="size-3.5 shrink-0" /> : null}
        {t('join')}
      </Button>
    </li>
  );
}

/**
 * The stateful half: reads the invites, runs Join, and hands the destination
 * back to the page. `onJoined(null)` means "no project to open directly" —
 * the page re-runs its resolver against the refreshed account list.
 */
export function ProjectChooser({
  canCreate,
  onJoined,
}: {
  canCreate: boolean;
  onJoined: (result: { accountId: string; destination: string | null }) => void;
}) {
  const t = useTranslations('projectChooser');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const invitesQuery = useMyInvites();

  const join = useMutation({
    mutationFn: (invite: MyAccountInvite) => acceptAccountInvite(invite.invite_id),
    onSuccess: async (_result, invite) => {
      // One prefix reaches the account list AND this invite list
      // (`qk.accounts.myInvites` sits under `scope()`), plus every project list.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.accounts.scope() }),
        queryClient.invalidateQueries({ queryKey: qk.projects.scope() }),
      ]);
      onJoined({ accountId: invite.account_id, destination: joinDestination(invite) });
    },
    onError: (error: unknown) => {
      errorToast(error instanceof Error ? error.message : t('joinError'));
    },
  });

  return (
    <ProjectChooserView
      email={user?.email ?? null}
      invites={invitesQuery.data ?? []}
      // A failed invite read degrades to "no invites" rather than blocking the
      // create path — the switcher shows the same list once it loads.
      invitesLoading={invitesQuery.isLoading}
      canCreate={canCreate}
      joiningInviteId={join.isPending ? (join.variables?.invite_id ?? null) : null}
      onJoin={(invite) => join.mutate(invite)}
    />
  );
}
