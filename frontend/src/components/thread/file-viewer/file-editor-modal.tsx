import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function FileEditorModal({
  open,
  fileName,
  content,
  onSave,
  onCancel,
}: {
  open: boolean;
  fileName: string;
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(content);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit File: {fileName}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          rows={20}
          className="w-full"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(editValue)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
