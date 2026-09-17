import { useKeyboard, useTerminalDimensions } from '@opentui/react';
import type { ReactNode } from 'react';

import { matchesBinding } from '../keymap.ts';
import { theme } from '../theme.ts';

export interface ModalProps {
  title: string;
  /** Printed in the bottom border: the keys this modal answers to. */
  hint?: string;
  /** Esc, and anything else the modal decides to treat as dismiss. */
  onClose?: () => void;
  /** Columns. Clamped to the terminal width minus a 4-column gutter. */
  width?: number;
  /** Rows. Clamped to the terminal height minus a 4-row gutter. */
  height?: number;
  children?: ReactNode;
}

/**
 * A centered overlay. Positioned absolutely at the root so it covers whatever
 * is behind it, with `zIndex` above the layout.
 */
export function Modal({ title, hint, onClose, width, height, children }: ModalProps) {
  const dimensions = useTerminalDimensions();
  const boxWidth = Math.min(width ?? 64, Math.max(dimensions.width - 4, 20));
  const boxHeight = Math.min(height ?? 16, Math.max(dimensions.height - 4, 6));

  useKeyboard((key) => {
    if (matchesBinding(key, 'back')) onClose?.();
  });

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width={dimensions.width}
      height={dimensions.height}
      zIndex={100}
      alignItems="center"
      justifyContent="center"
      backgroundColor={theme.bg}
    >
      <box
        border
        borderStyle="single"
        borderColor={theme.borderFocus}
        title={title}
        titleColor={theme.fg}
        bottomTitle={hint}
        bottomTitleAlignment="right"
        backgroundColor={theme.surface}
        flexDirection="column"
        width={boxWidth}
        height={boxHeight}
        paddingLeft={1}
        paddingRight={1}
        overflow="hidden"
      >
        {children}
      </box>
    </box>
  );
}
