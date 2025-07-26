import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function FileRenameModal({
  open,
  initialName,
  onSave,
  onCancel,
}: {
  open: boolean;
  initialName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, open]);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Rename File/Folder</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSave(name);
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(name)} disabled={!name.trim()}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
