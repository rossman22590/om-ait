'use client';

import React from 'react';
import { Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoRendererProps {
  url: string;
  fileName?: string;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export function VideoRenderer({ url, fileName, onDownload, isDownloading }: VideoRendererProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {url ? (
          <video 
            controls 
            preload="metadata"
            playsInline
            className="max-w-full max-h-[calc(100vh-200px)] rounded-md shadow-sm"
          >
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">
            Video could not be loaded
          </div>
        )}
      </div>
      
      {onDownload && (
        <div className="flex justify-center p-4">
          <Button 
            variant="outline" 
            className="flex gap-2 items-center"
            onClick={onDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download{fileName ? ` ${fileName}` : ""}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
