'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ThreadRenameProps = {
  thread: {
    id: string;
    name?: string;
  };
  onRenameComplete: (threadId: string, newName: string) => void;
};

const ThreadRename = ({ thread, onRenameComplete }: ThreadRenameProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(thread.name || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === thread.name) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/thread/${thread.id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      if (response.ok) {
        onRenameComplete(thread.id, newName);
      } else {
        console.error('Failed to rename thread');
      }
    } catch (error) {
      console.error('Error renaming thread:', error);
    }
    
    setIsLoading(false);
    setIsEditing(false);
  };
  
  if (!isEditing) {
    return (
      <div className="thread-item flex items-center">
        <span className="thread-name mr-2">{thread.name || 'Unnamed Thread'}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Rename thread</span>
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleRename} className="thread-rename-form flex items-center space-x-2">
      <Input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        autoFocus
        placeholder="Thread name"
        disabled={isLoading}
        className="h-8"
      />
      <Button type="submit" variant="ghost" size="icon" disabled={isLoading}>
        {isLoading ? <span className="h-4 w-4 animate-spin">...</span> : <Check className="h-4 w-4" />}
      </Button>
      <Button 
        type="button" 
        variant="ghost"
        size="icon"
        onClick={() => { setNewName(thread.name || ''); setIsEditing(false); }}
        disabled={isLoading}
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ThreadRename;
