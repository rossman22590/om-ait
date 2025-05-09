'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renameThread } from '@/lib/api';
import { toast } from 'sonner';

interface RenameThreadDialogProps {
  threadId: string;
  currentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newName: string) => void;
}

export function RenameThreadDialog({
  threadId,
  currentName = '',
  isOpen,
  onClose,
  onSuccess,
}: RenameThreadDialogProps) {
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await renameThread(threadId, name.trim());
      toast.success('Thread renamed successfully');
      onSuccess(name.trim());
      onClose();
    } catch (error) {
      console.error('Error renaming thread:', error);
      toast.error('Failed to rename thread');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Thread</DialogTitle>
          <DialogDescription>
            Give your thread a new name that makes it easier to identify.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Enter thread name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
