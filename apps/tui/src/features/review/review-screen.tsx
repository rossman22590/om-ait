/**
 * The Review screen (SPEC §5.6): the project's change requests, and one
 * change request's diff.
 *
 * Data half. Every read is `useChangeRequests(projectId)` from
 * `@kortix/sdk/react` or a method on the one `kortix()` client (SPEC §7); the
 * two writes it offers are that hook's own `merge` and `close` mutations.
 * `ChangeList` and `DiffView` are the pixels and know nothing about the SDK.
 *
 * Actions, and what the SDK actually exposes (verified against
 * `packages/sdk/src/core/rest/projects-client/change-requests.ts`):
 *
 * - `m` merge  → `mergeChangeRequest`   — live.
 * - `x` close  → `closeChangeRequest`   — live.
 * - `a` approve → NOTHING. A Kortix change request has three states
 *   (`open|merged|closed`); there is no approve write and no approved state.
 *   `apps/web` maps its "Ship it" button straight onto merge
 *   (`apps/web/src/features/review-center/review-center-connected.tsx`), so the
 *   key is rendered greyed and says to use `m` instead of silently doing
 *   something else under an approve label.
 */

import { useChangeRequests } from '@kortix/sdk/react';
import { useKeyboard } from '@opentui/react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { kortix } from '../../kortix.ts';
import { theme } from '../../theme.ts';
import { layoutRow } from '../../ui/index.ts';
import { ChangeList, type ChangeRow, toChangeRow } from './change-list.tsx';
import { type DiffState, type DiffViewMode, DiffView, splitUnifiedPatch } from './diff-view.tsx';
import { matchesReviewBinding } from './keys.ts';

/** How often the age column is recomputed. A minute is its smallest unit. */
const CLOCK_TICK_MS = 30_000;

export interface ReviewScreenProps {
  projectId: string;
  focused: boolean;
  width: number;
  height: number;
  onBack(): void;
  /** `o` on a change request that came from a session. */
  onOpenSession?(sessionId: string): void;
  onToast?(message: string, kind?: 'info' | 'error'): void;
}

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Unknown error';
}

/** Open first, then newest first inside each status. */
function compareRows(a: ChangeRow, b: ChangeRow): number {
  const rank = (status: ChangeRow['status']) => (status === 'open' ? 0 : 1);
  const byStatus = rank(a.status) - rank(b.status);
  if (byStatus !== 0) return byStatus;
  return b.createdAtMs - a.createdAtMs;
}

export function ReviewScreen({
  projectId,
  focused,
  width,
  height,
  onBack,
  onOpenSession,
  onToast,
}: ReviewScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCrId, setOpenCrId] = useState<string | null>(null);
  const [mode, setMode] = useState<DiffViewMode>('unified');
  const [fileIndex, setFileIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [confirm, setConfirm] = useState<'merge' | 'close' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // 'all', not the hook's default 'open': the list prints a status column, and
  // a merged change request from an hour ago is exactly what a reviewer looks
  // for after acting on it.
  const query = useChangeRequests(projectId, 'all');

  const rows = useMemo(() => {
    const list = query.data?.change_requests ?? [];
    return list.map(toChangeRow).sort(compareRows);
  }, [query.data]);

  const current = useMemo(
    () => rows.find((row) => row.crId === selectedId) ?? rows[0],
    [rows, selectedId],
  );

  const diffQuery = useQuery({
    queryKey: ['tui', 'change-request-diff', projectId, openCrId],
    queryFn: () => kortix().project(projectId).changeRequests.diff(openCrId as string),
    enabled: Boolean(openCrId),
  });

  const diffState = useMemo<DiffState>(() => {
    if (!openCrId) return { kind: 'idle' };
    if (diffQuery.isError)
      return { kind: 'error', crId: openCrId, message: errorText(diffQuery.error) };
    const data = diffQuery.data;
    if (!data) return { kind: 'loading', crId: openCrId };
    const row = rows.find((entry) => entry.crId === openCrId);
    return {
      kind: 'ready',
      crId: openCrId,
      title: row ? `#${row.number} ${row.title}` : openCrId,
      baseRef: data.base_ref,
      headRef: data.head_ref,
      files: splitUnifiedPatch(data.patch),
      additions: data.additions,
      deletions: data.deletions,
    };
  }, [openCrId, diffQuery.data, diffQuery.isError, diffQuery.error, rows]);

  const fileCount = diffState.kind === 'ready' ? diffState.files.length : 0;

  const moveTo = useCallback(
    (index: number) => {
      if (rows.length === 0) return;
      const clamped = Math.min(Math.max(index, 0), rows.length - 1);
      const row = rows[clamped];
      if (row) setSelectedId(row.crId);
    },
    [rows],
  );

  const cursorIndex = useMemo(
    () =>
      Math.max(
        rows.findIndex((row) => row.crId === current?.crId),
        0,
      ),
    [rows, current],
  );

  const runMerge = useCallback(async () => {
    if (!current) return;
    setBusy(`merging #${current.number}…`);
    try {
      const result = await query.merge.mutateAsync({ crId: current.crId });
      onToast?.(`Merged #${current.number} as ${result.merge.merge_commit_sha.slice(0, 7)}`);
    } catch (error) {
      onToast?.(`Merge failed: ${errorText(error)}`, 'error');
    } finally {
      setBusy(null);
    }
  }, [current, query.merge, onToast]);

  const runClose = useCallback(async () => {
    if (!current) return;
    setBusy(`closing #${current.number}…`);
    try {
      await query.close.mutateAsync(current.crId);
      onToast?.(`Closed #${current.number}`);
    } catch (error) {
      onToast?.(`Close failed: ${errorText(error)}`, 'error');
    } finally {
      setBusy(null);
    }
  }, [current, query.close, onToast]);

  const diffRows = Math.max(height - 4, 1);

  useKeyboard((key) => {
    if (!focused) return;

    if (confirm) {
      if (matchesReviewBinding(key, 'review.back')) return setConfirm(null);
      if (matchesReviewBinding(key, 'review.confirm')) {
        const action = confirm;
        setConfirm(null);
        if (action === 'merge') void runMerge();
        else void runClose();
      }
      return;
    }

    if (openCrId) {
      if (matchesReviewBinding(key, 'review.back')) {
        setOpenCrId(null);
        setOffset(0);
        return;
      }
      if (matchesReviewBinding(key, 'review.toggleView')) {
        setMode((value) => (value === 'unified' ? 'split' : 'unified'));
        return;
      }
      if (matchesReviewBinding(key, 'review.nextFile')) {
        setFileIndex((index) => Math.min(index + 1, Math.max(fileCount - 1, 0)));
        setOffset(0);
        return;
      }
      if (matchesReviewBinding(key, 'review.prevFile')) {
        setFileIndex((index) => Math.max(index - 1, 0));
        setOffset(0);
        return;
      }
      if (matchesReviewBinding(key, 'review.scrollDown'))
        return setOffset((value) => value + diffRows);
      if (matchesReviewBinding(key, 'review.scrollUp'))
        return setOffset((value) => Math.max(value - diffRows, 0));
    }

    if (matchesReviewBinding(key, 'review.down')) return moveTo(cursorIndex + 1);
    if (matchesReviewBinding(key, 'review.up')) return moveTo(cursorIndex - 1);
    if (matchesReviewBinding(key, 'review.first')) return moveTo(0);
    if (matchesReviewBinding(key, 'review.last')) return moveTo(rows.length - 1);
    if (matchesReviewBinding(key, 'review.open')) {
      if (!current) return;
      setOpenCrId(current.crId);
      setFileIndex(0);
      setOffset(0);
      return;
    }
    if (matchesReviewBinding(key, 'review.refresh')) {
      void query.refetch();
      onToast?.('Re-reading change requests…');
      return;
    }
    if (matchesReviewBinding(key, 'review.openSession')) {
      if (!current?.originSessionId) {
        onToast?.('This change request has no origin session.', 'error');
        return;
      }
      if (!onOpenSession) {
        onToast?.('Opening a session is not wired on this screen.', 'error');
        return;
      }
      onOpenSession(current.originSessionId);
      return;
    }
    if (matchesReviewBinding(key, 'review.approve')) {
      onToast?.('Approve is not a Kortix action: merging IS approving. Press m.', 'error');
      return;
    }
    if (matchesReviewBinding(key, 'review.merge')) {
      if (!current) return;
      if (current.status !== 'open') {
        onToast?.(`#${current.number} is ${current.status}; nothing to merge.`, 'error');
        return;
      }
      setConfirm('merge');
      return;
    }
    if (matchesReviewBinding(key, 'review.close')) {
      if (!current) return;
      if (current.status !== 'open') {
        onToast?.(`#${current.number} is already ${current.status}.`, 'error');
        return;
      }
      setConfirm('close');
      return;
    }
    if (matchesReviewBinding(key, 'review.back')) return onBack();
  });

  const bodyWidth = Math.max(width - 1, 0);

  if (confirm && current) {
    return (
      <box flexDirection="column" width={width}>
        <text fg={confirm === 'merge' ? theme.fg : theme.danger}>
          {confirm === 'merge' ? 'Merge change request' : 'Close change request'}
        </text>
        <text fg={theme.fg}>
          {layoutRow(`#${current.number} ${current.title}`, '', bodyWidth)}
        </text>
        <text fg={theme.dim}>
          {layoutRow(
            confirm === 'merge'
              ? `into ${current.baseRef} · this writes to the repository`
              : 'it stays closed until someone reopens it',
            '',
            bodyWidth,
          )}
        </text>
        <text fg={theme.faint}>y confirm · Esc cancel</text>
      </box>
    );
  }

  if (openCrId) {
    return (
      <DiffView
        state={diffState}
        fileIndex={fileIndex}
        mode={mode}
        offset={offset}
        width={width}
        height={height}
      />
    );
  }

  return (
    <box flexDirection="column" width={width} height={height}>
      <ChangeList
        rows={rows}
        selectedId={current?.crId ?? null}
        focused={focused}
        width={width}
        height={Math.max(height - 1, 1)}
        now={now}
        loading={query.isLoading}
        errorMessage={query.isError ? errorText(query.error) : null}
        busyMessage={busy}
      />
      <text fg={theme.faint}>
        {layoutRow('Enter diff · m merge · x close · o session · a approve (use m)', '', bodyWidth)}
      </text>
    </box>
  );
}
