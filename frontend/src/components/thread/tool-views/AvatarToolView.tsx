import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Play, Download, Eye } from 'lucide-react';
import { ToolViewProps } from './types';
import { extractToolData, getToolTitle } from './utils';
import { cn } from '@/lib/utils';

// Interfaces for API and Parsed Content
interface ArgilAvatar {
  avatar_id: string;
  name: string;
  thumbnailUrl: string;
}

interface Voice {
  id: string;
  name: string;
  sampleUrl?: string;
  status?: string;
}

interface VideoGenerationInputArgs {
  avatar_id: string;
  voice_id: string;
  script: string;
  title?: string;
}

interface VideoGenerationPollingResponse {
  video_id: string;
  status?: string;
  video_name?: string;
  created_at?: string;
  updated_at?: string;
  video_url?: string;
  video_url_subtitled?: string;
  pixio_video_url?: string;
  workspace_path?: string;
  message?: string;
  note?: string;
  error?: string;
  upload_error?: string;
  debug_info?: { [key: string]: any };
}

type VideoGenerationResult = VideoGenerationInputArgs | VideoGenerationPollingResponse;
type ParsedToolContent = ArgilAvatar[] | Voice[] | VideoGenerationResult;

export function AvatarToolView({
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  name = 'avatar-tool',
  project,
}: ToolViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [imageDimensions, setImageDimensions] = useState<Record<string, { aspectRatio: number; orientation: 'portrait' | 'landscape' | 'square' }>>({});

  const toolTitle = getToolTitle(name);
  const { toolResult } = extractToolData(toolContent);

  // Parse the tool result
  let dataToRender: ParsedToolContent | null = null;
  let error: string | null = null;

  try {
    if (toolResult && toolResult.toolOutput) {
      const output = toolResult.toolOutput;
      if (typeof output === 'string') {
        // Check if output is a streaming status or non-JSON content
        if (output.trim() === 'STREAMING' || output.includes('STREAMING')) {
          // Handle streaming status - don't try to parse as JSON
          dataToRender = null;
          error = null; // This is expected during streaming
        } else {
          try {
            dataToRender = JSON.parse(output);
          } catch (e: any) {
            console.error('Failed to parse tool output:', e);
            console.error('Raw output:', output);
            error = `Failed to parse tool data: ${e?.message || 'Invalid JSON'}`;
          }
        }
      } else {
        dataToRender = output as unknown as ParsedToolContent;
      }
    }
  } catch (e: any) {
    console.error('Error parsing tool data:', e);
    error = e?.message || 'Failed to parse tool data';
  }

  if (isStreaming) {
    return (
      <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
        <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
              <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base font-medium">Creating Avatar Video...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !isSuccess) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <CardTitle className="text-base">Avatar Tool Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'Failed to execute avatar tool'}</p>
        </CardContent>
      </Card>
    );
  }

  if (!dataToRender) {
    return (
      <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
        <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
              <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base font-medium">{toolTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  // Render based on the tool name and parsed data
  switch (name) {
    case 'list-argil-avatars':
    case 'list_argil_avatars':
      // Handle both the new wrapped format and legacy direct array format
      let avatars: ArgilAvatar[] = [];
      console.log('AvatarToolView - Raw dataToRender:', dataToRender);
      
      if (Array.isArray(dataToRender)) {
        avatars = dataToRender as ArgilAvatar[];
        console.log('AvatarToolView - Using direct array format, found', avatars.length, 'avatars');
      } else if (dataToRender && typeof dataToRender === 'object' && 'avatars' in dataToRender) {
        avatars = (dataToRender as any).avatars as ArgilAvatar[];
        console.log('AvatarToolView - Using wrapped format, found', avatars.length, 'avatars');
      } else {
        console.error('AvatarToolView - Unexpected data format:', typeof dataToRender, dataToRender);
      }
      
      if (!Array.isArray(avatars)) {
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Avatar data is not an array. Data structure: {JSON.stringify(dataToRender, null, 2)}</AlertDescription>
          </Alert>
        );
      }

      const filteredAvatars = avatars.filter(avatar =>
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return (
        <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
          <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
            <div className="flex items-center gap-2">
              <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base font-medium">Available Avatars</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <Input
              placeholder="Search avatars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {filteredAvatars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'No avatars match your search.' : 'No avatars found.'}
              </p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAvatars.map((avatar, index) => {
                    const avatarId = avatar.avatar_id && avatar.avatar_id.trim() !== '' ? avatar.avatar_id : `${avatar.name}-${index}`;
                    const avatarDimensions = imageDimensions[avatarId];
                    
                    return (
                      <Card key={avatarId} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-square">
                          <img
                            src={avatar.thumbnailUrl}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              const img = e.target as HTMLImageElement;
                              const aspectRatio = img.naturalWidth / img.naturalHeight;
                              let orientation: 'portrait' | 'landscape' | 'square' = 'square';
                              
                              if (aspectRatio > 1.1) orientation = 'landscape';
                              else if (aspectRatio < 0.9) orientation = 'portrait';
                              
                              setImageDimensions(prev => ({
                                ...prev,
                                [avatarId]: { aspectRatio, orientation }
                              }));
                            }}
                            onError={(e) => {
                              console.error('Failed to load avatar image:', avatar.thumbnailUrl);
                              const img = e.target as HTMLImageElement;
                              img.src = 'data:image/svg+xml;base64,' + btoa(`
                                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="100%" height="100%" fill="#f3f4f6"/>
                                  <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">
                                    ${avatar.name}
                                  </text>
                                </svg>
                              `);
                            }}
                          />
                          {avatarDimensions && (
                            <Badge 
                              variant="secondary"
                              className="absolute bottom-2 left-2 text-xs"
                            >
                              {avatarDimensions.orientation} ({avatarDimensions.aspectRatio.toFixed(1)})
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-medium text-sm truncate">{avatar.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">ID: {avatar.avatar_id}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'list-argil-voices':
    case 'list_argil_voices':
      // Handle both the new wrapped format and legacy direct array format
      let voices: Voice[] = [];
      if (Array.isArray(dataToRender)) {
        voices = dataToRender as Voice[];
      } else if (dataToRender && typeof dataToRender === 'object' && 'voices' in dataToRender) {
        voices = (dataToRender as any).voices as Voice[];
      }
      
      if (!Array.isArray(voices)) {
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Voice data is not an array. Data structure: {JSON.stringify(dataToRender, null, 2)}</AlertDescription>
          </Alert>
        );
      }

      return (
        <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
          <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
            <div className="flex items-center gap-2">
              <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base font-medium">Available Voices</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {voices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No voices found.</p>
            ) : (
              <div className="space-y-3">
                {voices.map((voice) => (
                  <div key={voice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{voice.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {voice.id}{voice.status ? ` - Status: ${voice.status}` : ''}
                      </p>
                    </div>
                    {voice.sampleUrl && (
                      <audio controls src={voice.sampleUrl} className="ml-4">
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'check-argil-video-status':
    case 'check_argil_video_status':
      const statusData = dataToRender as VideoGenerationPollingResponse;
      return (
        <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
          <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
            <div className="flex items-center gap-2">
              <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base font-medium">Video Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Video ID:</span> {statusData.video_id}</p>
              <p className="text-sm"><span className="font-medium">Status:</span> {statusData.status || 'Processing'}</p>
              {statusData.video_name && <p className="text-sm"><span className="font-medium">Name:</span> {statusData.video_name}</p>}
              
              {statusData.status === 'DONE' && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Video Ready:</h4>
                  
                  {/* Pixiomedia player (preferred) */}
                  {statusData.pixio_video_url && (
                    <div className="mb-4">
                      <p className="text-sm text-blue-600 mb-2">Recommended Player (Pixiomedia):</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Source: <a href={statusData.pixio_video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{statusData.pixio_video_url}</a>
                      </p>
                      <video 
                        controls 
                        preload="metadata"
                        playsInline
                        src={statusData.pixio_video_url} 
                        className="w-full max-h-96 rounded-lg"
                      >
                        <source src={statusData.pixio_video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {/* Fallback to workspace video */}
                  {!statusData.pixio_video_url && statusData.workspace_path && (
                    <div className="mb-4">
                      <p className="text-sm text-blue-600 mb-2">Workspace Video Player:</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Source: {`/api/workspace${statusData.workspace_path}`}
                      </p>
                      <video 
                        controls 
                        preload="metadata"
                        playsInline
                        src={`/api/workspace${statusData.workspace_path}`}
                        className="w-full max-h-96 rounded-lg"
                      >
                        <source src={`/api/workspace${statusData.workspace_path}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              )}
              
              {statusData.status === 'FAILED' && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Video generation failed: {statusData.error || 'Unknown error'}
                  </AlertDescription>
                </Alert>
              )}
              
              {statusData.message && <p className="text-sm mt-2">{statusData.message}</p>}
              {statusData.note && <p className="text-xs text-muted-foreground mt-1 italic">{statusData.note}</p>}
            </div>
          </CardContent>
        </Card>
      );

    case 'generate-argil-video':
    case 'generate_argil_video':
      const videoResult = dataToRender as VideoGenerationResult;
      if ('script' in videoResult && 'avatar_id' in videoResult) {
        const inputArgs = videoResult as VideoGenerationInputArgs;
        return (
          <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
            <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
              <div className="flex items-center gap-2">
                <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                  <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-base font-medium">Video Generation Initiated</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Avatar ID:</span> {inputArgs.avatar_id}</p>
                <p className="text-sm"><span className="font-medium">Voice ID:</span> {inputArgs.voice_id}</p>
                <p className="text-sm"><span className="font-medium">Script:</span> "{inputArgs.script}"</p>
                {inputArgs.title && <p className="text-sm"><span className="font-medium">Title:</span> {inputArgs.title}</p>}
              </div>
            </CardContent>
          </Card>
        );
      } else if ('video_id' in videoResult) {
        const pollData = videoResult as VideoGenerationPollingResponse;
        return (
          <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
            <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
              <div className="flex items-center gap-2">
                <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                  <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-base font-medium">Video Generation Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">Video ID:</span> {pollData.video_id}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> {pollData.status || 'Processing'}</p>
                {pollData.video_name && <p className="text-sm"><span className="font-medium">Name:</span> {pollData.video_name}</p>}
                {pollData.created_at && <p className="text-sm"><span className="font-medium">Created:</span> {new Date(pollData.created_at).toLocaleString()}</p>}
                {pollData.updated_at && <p className="text-sm"><span className="font-medium">Updated:</span> {new Date(pollData.updated_at).toLocaleString()}</p>}
                
                {/* Show progress indicator for in-progress states */}
                {pollData.status && !['DONE', 'FAILED'].includes(pollData.status) && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {pollData.status === 'GENERATING_AUDIO' ? 'Generating audio...' : 
                       pollData.status === 'GENERATING_VIDEO' ? 'Generating video...' : 
                       'Processing...'}
                    </p>
                  </div>
                )}
                
                {/* Show workspace path if available */}
                {pollData.workspace_path && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Saved to workspace:</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded mt-1">
                      {pollData.workspace_path}
                    </p>
                  </div>
                )}
                
                {/* Show video if available */}
                {pollData.status === 'DONE' && (pollData.video_url || pollData.pixio_video_url || pollData.workspace_path) && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Video Ready:</h4>
                    
                    {/* Pixiomedia player (preferred) */}
                    {pollData.pixio_video_url && (
                      <div className="mb-4">
                        <p className="text-sm text-blue-600 mb-2">Recommended Player (Pixiomedia):</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Source: {pollData.pixio_video_url}
                        </p>
                        <video 
                          controls 
                          preload="metadata"
                          playsInline
                          src={pollData.pixio_video_url} 
                          className="w-full max-h-96 rounded-lg"
                        >
                          <source src={pollData.pixio_video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    
                    {/* Fallback to workspace video */}
                    {!pollData.pixio_video_url && pollData.workspace_path && (
                      <div className="mb-4">
                        <p className="text-sm text-blue-600 mb-2">Workspace Video Player:</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Source: {`/api/workspace${pollData.workspace_path}`}
                        </p>
                        <video 
                          controls 
                          preload="metadata"
                          playsInline
                          src={`/api/workspace${pollData.workspace_path}`}
                          className="w-full max-h-96 rounded-lg"
                        >
                          <source src={`/api/workspace${pollData.workspace_path}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        {pollData.upload_error && (
                          <p className="text-xs text-red-500 mt-1">
                            Note: Pixiomedia upload failed - using local video. Error: {pollData.upload_error}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Original Argil source */}
                    {pollData.video_url && (
                      <div className={cn("mt-2", (pollData.pixio_video_url || pollData.workspace_path) ? "mt-2" : "mt-4")}>
                        <p className="text-sm font-medium">{(pollData.pixio_video_url || pollData.workspace_path) ? 'Alternative Source (Argil):' : ''}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Source: <a href={pollData.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">{pollData.video_url}</a>
                        </p>
                        <video 
                          controls
                          preload="metadata"
                          playsInline
                          src={pollData.video_url}
                          className="w-full max-h-96 rounded-lg"
                        >
                          <source src={pollData.video_url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    
                    {/* Subtitled video if available */}
                    {pollData.video_url_subtitled && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">Video with subtitles:</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Source: {pollData.video_url_subtitled}
                        </p>
                        <video 
                          controls
                          preload="metadata"
                          playsInline
                          src={pollData.video_url_subtitled}
                          className="w-full max-h-96 rounded-lg"
                        >
                          <source src={pollData.video_url_subtitled} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show error if available */}
                {pollData.status === 'FAILED' && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Video generation failed: {pollData.error || 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Show message or note if available */}
                {pollData.message && <p className="text-sm mt-2">{pollData.message}</p>}
                {pollData.note && <p className="text-xs text-muted-foreground mt-1 italic">{pollData.note}</p>}
              </div>
            </CardContent>
          </Card>
        );
      }
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Unexpected video generation data structure.</AlertDescription>
        </Alert>
      );

    default:
      return (
        <Card className="border border-t border-b-0 border-x-0 p-0 rounded-none">
          <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4">
            <div className="flex items-center gap-2">
              <div className="relative p-2 rounded-lg border bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base font-medium">Display for '{name}'</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(dataToRender, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
  }
}
