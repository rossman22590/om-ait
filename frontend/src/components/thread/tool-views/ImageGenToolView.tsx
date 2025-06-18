import React, { useEffect, useState } from 'react';
import { ToolViewProps } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Interface for storing image generation results
interface ImageState {
  imageUrl: string;
  localPath: string;
  rawOutput: string;
  isSuccess: boolean;
  timestamp: number; // Add timestamp for expiration
}

export function ImageGenToolView({ toolContent, isSuccess: propIsSuccess, isStreaming }: ToolViewProps) {
  // State for UI display
  const [imageUrl, setImageUrl] = useState<string>('');
  const [localPath, setLocalPath] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(propIsSuccess || false);
  const [rawOutput, setRawOutput] = useState<string>('');
  const [parsed, setParsed] = useState<boolean>(false);

  // Create a purely content-based key that will be consistent across renders
  const getContentHash = (content: any): string => {
    const contentStr = typeof content === 'string' 
      ? content 
      : JSON.stringify(content);
      
    // Simple hash function for deterministic key generation
    let hash = 0;
    for (let i = 0; i < contentStr.length; i++) {
      const char = contentStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `img_gen_${Math.abs(hash).toString(16)}`;
  };
  
  // Get storage key based solely on content
  const storageKey = getContentHash(toolContent);
  
  // Function to load state from storage
  const loadStateFromStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const state = JSON.parse(saved) as ImageState;
          
          // Check if state has expired (1 hour expiration)
          const MAX_AGE_MS = 3600 * 1000;
          if (state.timestamp && Date.now() - state.timestamp > MAX_AGE_MS) {
            console.log(`Expired state for key: ${storageKey}, removing`);
            localStorage.removeItem(storageKey);
            return false;
          }
          
          console.log(`Loaded saved state for key: ${storageKey}`);
          setImageUrl(state.imageUrl);
          setLocalPath(state.localPath);
          
          // Always use the image presence as the primary success indicator
          const hasImage = state.imageUrl && state.imageUrl.length > 0;
          setIsSuccess(hasImage || state.isSuccess);
          
          setRawOutput(state.rawOutput);
          setParsed(true);
          return true;
        }
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    }
    return false;
  };
  
  // Initialize with content and try to load state
  useEffect(() => {
    // Format raw output for display regardless of whether we load saved state
    const formattedOutput = typeof toolContent === 'string' 
      ? toolContent 
      : JSON.stringify(toolContent, null, 2);
    setRawOutput(formattedOutput);
    
    // Try to load saved state, and if none exists, parse the content
    if (!loadStateFromStorage()) {
      parseToolContent(false);
    }
  }, []);
  
  // Function to parse tool content and extract URLs
  const parseToolContent = (force: boolean = false) => {
    // Start with the tool content
    let content = toolContent;
    
    // Handle role/content JSON structure if present
    if (typeof content === 'string') {
      try {
        const jsonObj = JSON.parse(content);
        if (jsonObj && jsonObj.role === 'user' && jsonObj.content) {
          console.log('Extracting from role/content structure');
          content = jsonObj.content;
        }
      } catch (e) {
        // Not JSON or not the expected structure, continue with the original content
      }
    } else if (typeof content === 'object' && content !== null) {
      // If it's already an object with content field
      if ('role' in content && 'content' in content) {
        // Add type assertion to fix TypeScript error
        const typedContent = content as { role: string; content: string };
        content = typedContent.content;
      }
    }
    
    // Convert to string if it's not already
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    // Extract success status - prioritize image URL presence over text markers
    // This ensures that if we have an image, we consider it a success regardless of text
    const hasSuccess = contentStr.includes('success=True');
    setIsSuccess(hasSuccess);
    
    // Extract the image URL using regex
    if (typeof contentStr === 'string') {
      // 1. Try to extract Digital Ocean URL
      const doSpacesRegex = /(https?:\/\/pixiomedia\.nyc3\.digitaloceanspaces\.com\/[^\s'"\n\)]+)/i;
      const doSpacesMatch = contentStr.match(doSpacesRegex);
      
      let extractedUrl = '';
      if (doSpacesMatch && doSpacesMatch[1]) {
        extractedUrl = doSpacesMatch[1];
        // Clean up URL if needed
        if (extractedUrl.endsWith("'") || extractedUrl.endsWith('"') || extractedUrl.endsWith(')')) {
          extractedUrl = extractedUrl.slice(0, -1);
        }
        console.log('Extracted Digital Ocean URL:', extractedUrl);
        setImageUrl(extractedUrl);
      }
      
      // 2. Try to extract local path
      const pathRegex = /saved to workspace at:? ([^\n]+)/i;
      const pathMatch = contentStr.match(pathRegex);
      let extractedPath = '';
      if (pathMatch && pathMatch[1]) {
        extractedPath = pathMatch[1].trim();
        console.log('Extracted local path:', extractedPath);
        setLocalPath(extractedPath);
      }
      
      // 3. If image URL is found, save state to localStorage with content hash
      if (extractedUrl) {
        try {
          const state: ImageState = {
            imageUrl: extractedUrl,
            localPath: extractedPath,
            rawOutput: contentStr,
            isSuccess: hasSuccess,
            timestamp: Date.now() // Add timestamp for expiration
          };
          localStorage.setItem(storageKey, JSON.stringify(state));
          console.log(`Saved image state to localStorage with key: ${storageKey}`);
          setParsed(true);
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
    }
  };
  
  // Handle click to re-parse the content on demand
  const handleReparseClick = () => {
    console.log('Manually re-parsing tool content...');
    // Don't clear cached results or reset success state
    // Just do nothing - no need to reparse on click
    // This prevents the success badge from changing when clicked
    return;
  };

  return (
    <Card 
      className="w-full overflow-hidden" 
    >
      <CardContent className="p-4">
        {/* Status Badge */}
        <div className="flex items-center space-x-2 mb-3">
          {isStreaming ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ImageIcon className="w-3 h-3 mr-1" /> Generating Image...
            </Badge>
          ) : isSuccess ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <ImageIcon className="w-3 h-3 mr-1" /> Image Generated
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertTriangle className="w-3 h-3 mr-1" /> Generation Failed
            </Badge>
          )}
        </div>
        
        {/* Display the image if URL is available */}
        {imageUrl && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Generated Image</h3>
              {imageUrl && (
                <Link href={imageUrl} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center">
                  Open Full Size <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
            <div className="p-2 flex justify-center">
              <div className="relative w-full max-w-lg aspect-square">
                <Image 
                  src={imageUrl} 
                  alt="Generated image" 
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Image URL */}
        {imageUrl && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-sm text-blue-700 mb-1">Image URL:</h3>
            <div className="flex items-center gap-2">
              <code className="bg-white p-1 border border-blue-100 rounded text-sm text-blue-800 flex-1 break-all">{imageUrl}</code>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card's click handler
                  navigator.clipboard.writeText(imageUrl);
                }}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded transition-colors"
                title="Copy URL to clipboard"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        
        {/* Local Path */}
        {isSuccess && localPath && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Local path: </span>
            <code className="bg-gray-100 p-1 rounded text-sm">{localPath}</code>
          </div>
        )}
        
        {/* Raw Response for Debugging */}
        <div className="mt-2">
          <details className="text-xs" open>
            <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-700">Show Raw Output</summary>
            <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-60 text-gray-700">
              {rawOutput}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}