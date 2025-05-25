'use client';

import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { langs } from '@uiw/codemirror-extensions-langs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import { useTheme } from 'next-themes';
import { EditorView } from '@codemirror/view';
import { Button } from '@/components/ui/button';
import { Save, Edit, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CodeRendererProps {
  content: string;
  language?: string;
  className?: string;
  fileName?: string;
  sandboxId?: string;
  onSave?: (newContent: string) => Promise<void>;
}

// Map of language aliases to CodeMirror language support
const languageMap: Record<string, any> = {
  js: langs.javascript,
  jsx: langs.jsx,
  ts: langs.typescript,
  tsx: langs.tsx,
  html: langs.html,
  css: langs.css,
  json: langs.json,
  md: langs.markdown,
  python: langs.python,
  py: langs.python,
  rust: langs.rust,
  go: langs.go,
  java: langs.java,
  c: langs.c,
  cpp: langs.cpp,
  cs: langs.csharp,
  php: langs.php,
  ruby: langs.ruby,
  sh: langs.shell,
  bash: langs.shell,
  sql: langs.sql,
  yaml: langs.yaml,
  yml: langs.yaml,
  // Add more languages as needed
};

export function CodeRenderer({
  content,
  language = '',
  className,
  fileName,
  sandboxId,
  onSave,
}: CodeRendererProps) {
  // Log the props on mount for debugging
  useEffect(() => {
    console.log('CodeRenderer mounted with props:', { 
      fileName, 
      sandboxId, 
      hasContent: !!content,
      language
    });
  }, [fileName, sandboxId, content, language]);
  // Get current theme
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Set mounted state to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update editable content when content prop changes
  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Determine the language extension to use
  const langExtension =
    language && languageMap[language] ? [languageMap[language]()] : [];

  // Add line wrapping extension
  const extensions = [...langExtension, EditorView.lineWrapping];

  // Select the theme based on the current theme
  const theme = mounted && resolvedTheme === 'dark' ? vscodeDark : xcodeLight;

  // Handle content change
  const handleChange = (value: string) => {
    setEditableContent(value);
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      setIsCopied(true);
      toast.success('Code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Handle save
  const handleSave = async () => {
    // Ensure we have the latest props
    console.log('Attempting to save with:', { fileName, sandboxId });
    
    // Extract file path from element if not in props (fallback mechanism)
    const extractedFileName = fileName || document.querySelector('.file-renderer-filename')?.getAttribute('data-path');
    const extractedSandboxId = sandboxId || document.querySelector('.file-renderer-sandbox')?.getAttribute('data-id');
    
    console.log('Using extracted values if needed:', { extractedFileName, extractedSandboxId });
    
    // If we have an onSave prop, use it regardless of other props
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(editableContent);
        toast.success('File saved successfully');
        return;
      } catch (error) {
        console.error('Error using onSave handler:', error);
        toast.error(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsSaving(false);
        return;
      }
    }
    
    // For direct API saving, we need both fileName and sandboxId
    const filePathToUse = extractedFileName || fileName;
    const sandboxIdToUse = extractedSandboxId || sandboxId;
    
    if (!filePathToUse) {
      toast.error('Cannot save: File name is missing');
      console.error('Save failed - missing fileName');
      return;
    }
    
    if (!sandboxIdToUse) {
      toast.error('Cannot save: Sandbox ID is missing. Try refreshing the page.');
      console.error('Save failed - missing sandboxId');
      return;
    }

    try {
      setIsSaving(true);
      
      if (onSave) {
        await onSave(editableContent);
      } else {
        // If no onSave prop is provided, use the existing API function
        console.log('Final save parameters:', { sandboxId: sandboxIdToUse, path: filePathToUse });
        
        // After examining the backend code, we need to use a form-data upload
        try {
          const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
          console.log(`Saving file to ${API_URL}/sandboxes/${sandboxIdToUse}/files with path=${filePathToUse}`);
          
          // Import auth client to get session token
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          // Create authorization header
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
          
          // Create a file object from the content
          const fileName = filePathToUse.split('/').pop() || 'file.txt';
          const fileType = fileName.endsWith('.html') ? 'text/html' : 
                        fileName.endsWith('.css') ? 'text/css' : 
                        fileName.endsWith('.js') ? 'application/javascript' : 
                        'text/plain';
          
          const fileBlob = new Blob([editableContent], { type: fileType });
          const file = new File([fileBlob], fileName, { type: fileType });
          
          // Create FormData (this is what the backend expects)
          // Important: The backend expects the path parameter as a form field and the file as a file upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', filePathToUse);
          
          // Make sure the path doesn't have double slashes and is properly normalized
          // This matches the backend's normalize_path function
          const normalizedPath = filePathToUse
            .replace(/\/\//g, '/')
            .replace(/^\/+/, '/');
          formData.set('path', normalizedPath);
          
          console.log('Uploading file with formData:', { fileName, fileType, path: filePathToUse });
          
          // Make the request using the correct endpoint
          const response = await fetch(
            `${API_URL}/sandboxes/${sandboxIdToUse}/files`,
            {
              method: 'POST',
              headers,
              body: formData
            }
          );
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error details available');
            console.error('File upload failed:', response.status, response.statusText, errorText);
            throw new Error(`Failed to save file: ${response.statusText}`);
          }
          
          console.log('File saved successfully');
        } catch (error) {
          console.error('Error saving file:', error);
          throw error;
        }
      }
      
      toast.success('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex justify-end items-center p-2 gap-2 bg-muted/30">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          className="flex items-center gap-1"
          disabled={isCopied}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleEditMode}
          className="flex items-center gap-1"
        >
          <Edit className="w-4 h-4" />
          {isEditing ? 'View Only' : 'Edit'}
        </Button>
        
        {isEditing && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>

      <ScrollArea className={cn('w-full flex-1', className)}>
        <div className="w-full">
          <CodeMirror
            value={editableContent}
            theme={theme}
            extensions={extensions}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: isEditing,
              highlightActiveLineGutter: isEditing,
              foldGutter: true,
            }}
            editable={isEditing}
            onChange={handleChange}
            className="text-sm w-full min-h-full"
            style={{ maxWidth: '100%' }}
            height="auto"
          />
        </div>
      </ScrollArea>
    </div>
  );
}
