import React, { useState, useEffect, useCallback } from 'react';
import { ToolViewProps } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertTriangle, Image as ImageIcon, Car } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function ImageGenToolView({ toolContent, isSuccess: propIsSuccess }: ToolViewProps) {
  console.log('Raw image generation content:', toolContent); // Log raw content for debugging
  
  // Define interface for our parsed content to ensure type safety
  interface ParsedImageContent {
    success?: boolean;
    message?: string;
    output?: string;
    error?: string;
  }

  // Parse content safely without breaking on any format
  let parsedContent: ParsedImageContent = {};
  
  // First check if we have a string
  if (typeof toolContent === 'string') {
    // Extract success status
    const hasSuccess = toolContent.includes('success=True');
    
    try {
      // Attempt JSON parse as a safe fallback
      const jsonParsed = JSON.parse(toolContent);
      parsedContent = jsonParsed;
      console.log('Successfully parsed JSON content');
    } catch (e) {
      // If JSON parsing fails, create a simple object with the content
      console.log('Using raw content instead of JSON parsing');
      parsedContent = {
        success: hasSuccess, // Extracted from content
        message: 'Image processing complete',
        output: toolContent
      };
    }
  } else if (toolContent && typeof toolContent === 'object') {
    // Already an object, use as is
    parsedContent = toolContent as ParsedImageContent;
    console.log('Tool content is already an object');
  } else {
    // Fallback for anything else
    console.log('Using default object for unexpected content type');
    parsedContent = { 
      message: 'Received non-standard response',
      output: String(toolContent)
    };
  }
  
  console.log('Final processed content:', parsedContent);

  // State to persist the image URL between renders
  const [persistedImageUrl, setPersistedImageUrl] = useState('');

  // Extract a unique ID from the tool content to identify this specific image generation
  const extractToolCallId = useCallback(() => {
    if (typeof toolContent === 'string') {
      // Try to extract a unique identifier from the file name in the output
      const fileNameRegex = /image_([a-f0-9-]+)_\d+/i;
      const fileNameMatch = toolContent.match(fileNameRegex);
      if (fileNameMatch && fileNameMatch[1]) {
        return fileNameMatch[1];
      }
      
      // If no file name, try to extract from URL
      const urlIdRegex = /\/uploads\/\d+-image_([a-f0-9-]+)_\d+/i;
      const urlIdMatch = toolContent.match(urlIdRegex);
      if (urlIdMatch && urlIdMatch[1]) {
        return urlIdMatch[1];
      }
    }
    
    // Fallback to hash of content
    return typeof toolContent === 'string' ? 
      String(toolContent.split('').reduce((a, b) => (a * 21 + b.charCodeAt(0)) % 1000000, 0)) : 
      'default-image';
  }, [toolContent]);
  
  const toolCallId = extractToolCallId();
  
  // Check if image generation was successful
  // Use the prop value if available, otherwise check the parsed content
  const isSuccess = propIsSuccess !== undefined ? propIsSuccess : parsedContent?.success !== false;
  
  // Simple check for car-related content without affecting core functionality
  const isCarImage = typeof toolContent === 'string' && 
    (toolContent.toLowerCase().includes('car') || toolContent.toLowerCase().includes('vehicle'));

  // Get message text
  const messageText = parsedContent?.message || (isSuccess ? 'Image generated successfully' : 'Failed to generate image');
  
  // Extract image URL if available - handle different possible formats
  let imageUrl = '';
  
  // Try to extract URL using regex in case it's embedded in a text message
  if (typeof toolContent === 'string') {
    // First try to match the specific ToolResult format
    const toolResultRegex = /ToolResult\(.*?Image URL: (https?:\/\/[^\s'"]+)/i;
    const toolResultMatch = toolContent.match(toolResultRegex);
    if (toolResultMatch && toolResultMatch[1]) {
      imageUrl = toolResultMatch[1];
      console.log(`Extracted image URL from ToolResult for ID ${toolCallId}:`, imageUrl);
      // Store in persisted state and localStorage with the specific tool call ID
      if (imageUrl && imageUrl !== persistedImageUrl) {
        setPersistedImageUrl(imageUrl);
        try {
          localStorage.setItem(`image-gen-url-${toolCallId}`, imageUrl);
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
    } else {
      // Fall back to the general URL regex
      const urlRegex = /(?:Image URL: )?(https?:\/\/[^\s?"']+(?:\?[^\s"']+)?)/i;
      const urlMatch = toolContent.match(urlRegex);
      if (urlMatch && urlMatch[1]) {
        imageUrl = urlMatch[1];
        console.log(`Extracted image URL from general pattern for ID ${toolCallId}:`, imageUrl);
        // Store in persisted state and localStorage with the specific tool call ID
        if (imageUrl && imageUrl !== persistedImageUrl) {
          setPersistedImageUrl(imageUrl);
          try {
            localStorage.setItem(`image-gen-url-${toolCallId}`, imageUrl);
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }
      }
    }
  }
  
  // If regex didn't find it, check other common patterns
  if (!imageUrl && typeof toolContent === 'string') {
    if (toolContent.includes('http') && (toolContent.includes('.png') || toolContent.includes('.jpg') || toolContent.includes('image'))) {
      const words = toolContent.split(' ');
      for (const word of words) {
        if (word.startsWith('http') && (word.includes('.png') || word.includes('.jpg') || word.includes('.jpeg'))) {
          imageUrl = word;
          break;
        }
      }
    }
  }

  // Get local file path if available
  let localPath = '';
  if (typeof toolContent === 'string') {
    const pathRegex = /saved to:? ([\/\\][^\s]+)/i;
    const pathMatch = toolContent.match(pathRegex);
    if (pathMatch && pathMatch[1]) {
      localPath = pathMatch[1];
    } else {
      // Try another pattern
      const workspacePathRegex = /saved to workspace at:? ([^\n]+)/i;
      const workspaceMatch = toolContent.match(workspacePathRegex);
      if (workspaceMatch && workspaceMatch[1]) {
        localPath = workspaceMatch[1].trim();
      }
    }
  }

  // Extract error details if available
  const errorMessage = parsedContent?.error || '';
  
  // Get raw output for debugging
  const rawOutput = parsedContent?.output || 
    (typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent, null, 2));
    
  // Use persisted image URL if current one is empty
  if (!imageUrl && persistedImageUrl) {
    imageUrl = persistedImageUrl;
    console.log(`Using persisted image URL for ID ${toolCallId}:`, imageUrl);
  }
  
  // Try to restore from localStorage on initial render if we still don't have an image URL
  useEffect(() => {
    if (!imageUrl) {
      try {
        const savedUrl = localStorage.getItem(`image-gen-url-${toolCallId}`);
        if (savedUrl) {
          console.log(`Restored image URL from localStorage for ID ${toolCallId}:`, savedUrl);
          setPersistedImageUrl(savedUrl);
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    }
  }, [toolCallId, imageUrl]);

  // Use useEffect to store imageUrl in localStorage for additional persistence
  useEffect(() => {
    if (imageUrl) {
      try {
        localStorage.setItem(`image-gen-url-${toolCallId}`, imageUrl);
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }
  }, [imageUrl, toolCallId]);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={isSuccess ? "bg-green-500" : "bg-red-500"}>
              {isSuccess ? "Image Generated Successfully" : "Image Generation Failed"}
            </Badge>
          </div>

          {/* Message */}
          <div className="text-sm">
            {messageText}
          </div>

          {/* Image Display */}
          {isSuccess && imageUrl && (
            <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-blue-500" />
                  <span className="text-sm font-medium">Generated Image</span>
                </div>
                {imageUrl && (
                  <Link href={imageUrl} target="_blank" rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                    View Full Size <ExternalLink size={12} />
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

          {/* Local Path */}
          {isSuccess && localPath && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Local path: </span>
              <code className="bg-gray-100 p-1 rounded text-sm">{localPath}</code>
            </div>
          )}

          {/* Error Details */}
          {!isSuccess && errorMessage && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm text-red-700">Error Details:</h3>
                  <p className="text-sm text-red-600 whitespace-pre-wrap">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Raw Response for Debugging */}
          <div className="mt-2">
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-700">Show Raw Output</summary>
              <pre className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md overflow-auto max-h-60 text-gray-700">
                {rawOutput}
              </pre>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
