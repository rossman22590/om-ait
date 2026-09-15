'use client';

import Hint from '@/components/ui/hint';
import { useTranslations } from '@/i18n/use-translations';
import { useDeploymentCliInstallCommand } from '@/lib/use-deployment-cli-install-command';
import { cn } from '@/lib/utils';
import { CaretDownIcon, CheckIcon, CopyIcon, LaptopIcon } from '@phosphor-icons/react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * A single quiet row at the top of the session Terminal panel. It answers
 * "how do I get a shell into this from my machine?" right where a shell lives.
 *
 * Collapsed, it is a label and nothing else, so no command text competes with
 * the terminal below it. Expanded, it lists the two commands in order:
 * install the CLI once, then connect this session.
 */
export function SessionTerminalConnectBar({ projectSessionId }: { projectSessionId: string }) {
  const tI18nComplete = useTranslations('hardcodedUi.i18nComplete');
  const [expanded, setExpanded] = useState(false);
  const stepsId = useId();

  return (
    <div className="border-terminal-border bg-terminal-surface shrink-0 border-b">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls={stepsId}
        className="text-terminal-muted hover:text-terminal-fg focus-visible:text-terminal-fg focus-visible:ring-ring flex h-9 w-full cursor-pointer items-center gap-2 px-3 text-xs transition-colors duration-(--duration-fast) outline-none focus-visible:ring-1 focus-visible:ring-inset"
      >
        <LaptopIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">
          {tI18nComplete.raw('textb85e0ede430b')}
        </span>
        <CaretDownIcon
          className={cn(
            'size-3 shrink-0 motion-safe:transition-transform motion-safe:duration-(--duration-fast)',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {expanded ? (
        <SessionTerminalConnectSteps id={stepsId} projectSessionId={projectSessionId} />
      ) : null}
    </div>
  );
}

export function SessionTerminalConnectSteps({
  id,
  projectSessionId,
}: {
  id: string;
  projectSessionId: string;
}) {
  const tI18nComplete = useTranslations('hardcodedUi.i18nComplete');
  const installCmd = useDeploymentCliInstallCommand(undefined);
  const connectCmd = `kortix sessions connect ${projectSessionId}`;

  return (
    <ol id={id} className="space-y-3 px-3 pt-0.5 pb-3">
      <CommandStep label={tI18nComplete.raw('textd236e9cd730b')} command={installCmd} />
      <CommandStep label={tI18nComplete.raw('text842bad27af42')} command={connectCmd} />
    </ol>
  );
}

function CommandStep({ label, command }: { label: string; command: string }) {
  return (
    <li className="space-y-1.5">
      <p className="text-terminal-muted text-xs">{label}</p>
      {/* Radius is concentric: the 8px well minus its ~2px inset gives the
          6px (`rounded-sm`) copy button. */}
      <div className="border-terminal-border flex h-8 items-center gap-2 rounded-md border pr-0.5 pl-2.5">
        <code
          title={command}
          className="text-terminal-fg min-w-0 flex-1 truncate font-mono text-xs"
        >
          {command}
        </code>
        <CommandCopyButton command={command} />
      </div>
    </li>
  );
}

function CommandCopyButton({ command }: { command: string }) {
  const tI18nComplete = useTranslations('hardcodedUi.i18nComplete');
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [command]);

  // The house icon-swap morph (see CopyButton). Reduced motion keeps the
  // cross-fade and drops the scale and blur.
  const hiddenIcon = reduceMotion
    ? { opacity: 0 }
    : { scale: 0.25, opacity: 0, filter: 'blur(4px)' };
  const shownIcon = reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, filter: 'blur(0px)' };
  const copyLabel = tI18nComplete.raw('text9a01feecae67');

  return (
    <Hint label={copyLabel} side="top">
      <button
        type="button"
        onClick={copy}
        aria-label={copyLabel}
        className="text-terminal-muted hover:bg-terminal-fg/10 hover:text-terminal-fg focus-visible:ring-ring hit-area-1.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors outline-none focus-visible:ring-1 active:scale-[0.96]"
      >
        <span className="relative inline-flex size-3.5 items-center justify-center">
          <AnimatePresence initial={false} mode="popLayout">
            <m.span
              key={copied ? 'check' : 'copy'}
              initial={hiddenIcon}
              animate={shownIcon}
              exit={hiddenIcon}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              {copied ? (
                <CheckIcon weight="fill" className="text-kortix-green size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </m.span>
          </AnimatePresence>
        </span>
        <span className="sr-only" aria-live="polite">
          {copied ? tI18nComplete.raw('text8d525e5f158b') : ''}
        </span>
      </button>
    </Hint>
  );
}
