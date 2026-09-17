import { useKeyboard } from '@opentui/react';
import { useMemo, useState } from 'react';

import { theme } from '../theme.ts';
import { List, type ListItem } from './list.tsx';
import { Modal } from './modal.tsx';

export interface PickerProps {
  title: string;
  items: ListItem[];
  /** Enter on a row. The picker does not close itself — the caller decides. */
  onPick: (item: ListItem) => void;
  onClose: () => void;
  /** Printed above the list when the filter is empty. */
  placeholder?: string;
  width?: number;
  height?: number;
}

/** Case-insensitive substring match over the label. */
export function filterItems(items: ListItem[], query: string): ListItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => item.label.toLowerCase().includes(needle));
}

/**
 * A filterable list in a modal: the session switcher, the host switcher, the
 * model/agent/command pickers. Typing filters; Backspace deletes; Enter picks.
 */
export function Picker({
  title,
  items,
  onPick,
  onClose,
  placeholder = 'Type to filter',
  width = 60,
  height = 18,
}: PickerProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterItems(items, query), [items, query]);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  useKeyboard((key) => {
    if (key.name === 'backspace') {
      setQuery((value) => value.slice(0, -1));
      return;
    }
    // A printable character with no modifier extends the filter. Navigation
    // keys reach the List below, which ignores anything it does not bind.
    if (!key.ctrl && !key.option && key.sequence && key.sequence.length === 1) {
      const code = key.sequence.charCodeAt(0);
      if (code >= 0x20 && code !== 0x7f) setQuery((value) => value + key.sequence);
    }
  });

  const visibleId = filtered.some((item) => item.id === selectedId)
    ? selectedId
    : (filtered[0]?.id ?? null);

  return (
    <Modal
      title={title}
      hint="Enter pick · Esc close"
      onClose={onClose}
      width={width}
      height={height}
    >
      <text fg={query ? theme.fg : theme.faint}>{query ? `/ ${query}` : placeholder}</text>
      <text fg={theme.border}>{'─'.repeat(Math.max(width - 4, 0))}</text>
      <List
        items={filtered}
        focused
        selectedId={visibleId}
        onSelectedChange={setSelectedId}
        onOpen={onPick}
        maxRows={Math.max(height - 5, 1)}
        width={width - 4}
        emptyText="No match."
      />
    </Modal>
  );
}
