import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Archive, X } from 'lucide-react';

interface FileToolbarProps {
  onDelete: () => void;
  onDownload: () => void;
  onDeselectAll: () => void;
  selectedCount: number;
  disabled?: boolean;
}

export function FileToolbar({
  onDelete,
  onDownload,
  onDeselectAll,
  selectedCount,
  disabled = false,
}: FileToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-muted/20 border-b border-border px-4 py-2 sticky top-0 z-20">
      <span className="font-medium text-sm">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onDelete} 
        disabled={disabled}
        className="h-7"
      >
        <Trash2 className="h-4 w-4 mr-1" /> Delete
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onDownload} 
        disabled={disabled}
        className="h-7"
      >
        <Archive className="h-4 w-4 mr-1" /> Download ZIP
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onDeselectAll}
        className="h-7"
      >
        <X className="h-4 w-4 mr-1" /> Deselect All
      </Button>
    </div>
  );
}
