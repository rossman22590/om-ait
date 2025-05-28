'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CustomPromptSettingsClient() {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load the custom prompt from localStorage on component mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('user_custom_prompt');
    if (savedPrompt) {
      setCustomPrompt(savedPrompt);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('user_custom_prompt', customPrompt);
      toast.success('Custom prompt saved successfully');
    } catch (error) {
      toast.error('Failed to save custom prompt');
      console.error('Error saving custom prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setCustomPrompt('');
    localStorage.removeItem('user_custom_prompt');
    toast.success('Custom prompt cleared');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Custom Prompt</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add a custom prompt that will be prepended to every system prompt. This allows you to customize the AI's behavior without affecting the core system prompt.
        </p>
        
        <Textarea
          placeholder="Enter your custom prompt here..."
          className="min-h-[200px] font-mono text-sm"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
        
        <div className="mt-2 text-xs text-muted-foreground">
          <p>
            The custom prompt will be injected at the beginning of the system prompt with this format:
          </p>
          <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto">
            {`{your custom prompt}\n\n# SYSTEM PROMPT STARTS HERE\n\n{original system prompt}`}
          </pre>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Custom Prompt'}
        </Button>
      </div>
    </div>
  );
}
