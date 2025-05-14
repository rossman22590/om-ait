'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface ThreadRenameProps {
  threadId: string;
  currentName: string;
  onRenameComplete?: (threadId: string, newName: string) => void;
}

export default function ThreadRename({ 
  threadId, 
  currentName, 
  onRenameComplete 
}: ThreadRenameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setEditName(currentName);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(currentName);
  };

  const saveNewName = async () => {
    if (editName.trim() === '') {
      setEditName(currentName);
      setIsEditing(false);
      return;
    }

    if (editName !== currentName) {
      try {
        // Implement actual API call to update thread name here
        // For now, just simulate a successful update
        
        // Notify parent component
        onRenameComplete?.(threadId, editName);
        toast.success('Thread renamed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to rename thread';
        console.error('Failed to rename thread:', errorMessage);
        toast.error(errorMessage);
        setEditName(currentName);
      }
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveNewName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveNewName}
          className="h-8 w-auto min-w-[180px] text-sm"
          maxLength={50}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={saveNewName}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={cancelEditing}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      onClick={startEditing}
      title="Click to rename thread"
    >
      {currentName}
    </div>
  );
}
