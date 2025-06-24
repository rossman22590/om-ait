import React, { useState, useEffect } from 'react';
import { ToolViewProps } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Play, Clock, CheckCircle, XCircle } from 'lucide-react';

// Interface for image aspect ratio tracking
interface ImageDimensions {
  id: string;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape' | 'square';
}

// --- Interfaces for API and Parsed Content ---
interface ArgilAvatar {
  avatar_id: string; // API 'id'
  name: string;
  thumbnailUrl: string; // API 'thumbnailUrl'
}

interface Voice {
  id: string;
  name: string;
  sampleUrl?: string; // API 'sampleUrl'
  status?: string; // API 'status'
}

interface VideoGenerationInputArgs {
  avatar_id: string;
  voice_id: string;
  script: string;
  title?: string;
}

interface VideoGenerationPollingResponse {
  video_id: string;
  status?: string; // Can be IDLE, GENERATING_AUDIO, GENERATING_VIDEO, DONE, or FAILED
  video_name?: string;
  created_at?: string;
  updated_at?: string;
  video_url?: string; // URL of the generated video when status is DONE
  video_url_subtitled?: string; // URL of the video with subtitles when available
  pixio_video_url?: string; // URL of the Pixiomedia video when available
  workspace_path?: string; // Path to the video in the workspace
  message?: string; // Status message from backend
  note?: string; // Additional information, like estimated time
  error?: string; // Error details when something fails
  upload_error?: string; // Details about any upload failure
  debug_info?: { [key: string]: any }; // Debug information for troubleshooting
}

// Combined type for what might be rendered for video generation
type VideoGenerationResult = VideoGenerationInputArgs | VideoGenerationPollingResponse;

// The parsed content from any of these tool calls will conform to one of these types.
type ParsedToolContent = ArgilAvatar[] | Voice[] | VideoGenerationResult;

const AvatarToolView: React.FC<ToolViewProps> = ({ name, toolContent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [imageDimensions, setImageDimensions] = useState<Record<string, ImageDimensions>>({});

  let dataToRender: ParsedToolContent | undefined;
  let parseError: Error | null = null;

  try {
    let currentContent: any = toolContent;

    // 1. Handle { role: '...', content: 'JSON_STRING' } wrapper
    if (currentContent && typeof currentContent === 'object' && 'content' in currentContent && typeof currentContent.content === 'string') {
      try {
        currentContent = JSON.parse(currentContent.content);
      } catch (e) {
        // If parsing the inner 'content' string fails, transform currentContent
        // to look like a failed tool execution result. This allows the existing
        // error handling for failed tool executions to take over.
        const originalContentStr = String(currentContent.content);
        currentContent = {
          tool_execution: {
            result: {
              success: false,
              output: `Invalid JSON in tool content string: ${originalContentStr.substring(0, 100)}${originalContentStr.length > 100 ? '...' : ''}`
            }
          }
        };
      }
    }
    // 2. Handle if currentContent is still a string (direct JSON string)
    else if (typeof currentContent === 'string') {
      try {
        currentContent = JSON.parse(currentContent);
      } catch (e) {
        // If parsing the direct string fails, transform similarly.
        const originalContentStr = String(currentContent);
        currentContent = {
          tool_execution: {
            result: {
              success: false,
              output: `Invalid JSON in direct tool content string: ${originalContentStr.substring(0, 100)}${originalContentStr.length > 100 ? '...' : ''}`
            }
          }
        };
      }
    }

    // 3. Handle the { tool_execution: { result: { output: ... } } } wrapper
    if (currentContent && typeof currentContent === 'object' && currentContent.tool_execution) {
      const toolExecution = currentContent.tool_execution;
      if (toolExecution.result) {
        if (toolExecution.result.success) {
          // If success is true, output is the actual data
          // The backend sb_avatar_tool.py returns stringified JSON in 'output'
          const output = toolExecution.result.output;
          
          // Parse the JSON string for any of the Argil tools
          if (typeof output === 'string' && ['list-argil-avatars', 'list-argil-voices', 'generate-argil-video', 'check-argil-video-status'].includes(name || '')) {
            try {
              // Special handling for check-argil-video-status which might already be a stringified JSON
              if (name === 'check-argil-video-status') {
                try {
                  // First, try to parse it as JSON
                  dataToRender = JSON.parse(output);
                } catch (parseErr) {
                  // If parsing fails, try to force it into our expected format
                  console.log('Failed to parse output, attempting to create valid structure:', output);
                  // Create a minimal VideoGenerationPollingResponse object with the values we have
                  dataToRender = {
                    video_id: 'unknown',
                    status: 'DONE',
                    video_url: output // Use the raw output as the video URL
                  } as VideoGenerationPollingResponse;
                }
              } else {
                dataToRender = JSON.parse(output);
                
                // Additional validation for specific tools
                if (name === 'list-argil-avatars' && !Array.isArray(dataToRender)) {
                  throw new Error('Avatar data is not an array');
                } else if (name === 'list-argil-voices' && !Array.isArray(dataToRender)) {
                  throw new Error('Voice data is not an array');
                }
              }
            } catch (e) {
              throw new Error(`Failed to parse ${name} result: ${e.message}. Raw output: ${output.substring(0, 100)}${output.length > 100 ? '...' : ''}`);
            }
          } else {
            // For other tools or if output is already an object
            dataToRender = output as ParsedToolContent;
          }
        } else {
          // If success is false, output contains the error message
          const errorOutput = toolExecution.result.output;
          let finalErrorMessage: string;
          if (typeof errorOutput === 'string') {
            try {
              const parsedJson = JSON.parse(errorOutput);
              if (parsedJson && typeof parsedJson === 'object' && parsedJson.hasOwnProperty('error') && typeof parsedJson.error === 'string') {
                finalErrorMessage = parsedJson.error; // Successfully extracted error message
              } else {
                // Parsed, but not the expected {error: "..."} structure, or errorOutput was not a string to begin with.
                finalErrorMessage = errorOutput; 
              }
            } catch (e) {
              // Not a valid JSON string, use the original string as the error message
              finalErrorMessage = errorOutput;
            }
          } else if (errorOutput && typeof errorOutput === 'object' && (errorOutput as object).hasOwnProperty('error') && typeof (errorOutput as { error: string }).error === 'string') {
            // errorOutput is already an object like {error: "message"}
            finalErrorMessage = (errorOutput as { error: string }).error;
          } else {
            // Fallback for other types or structures (e.g., null, undefined, or other objects)
            finalErrorMessage = JSON.stringify(errorOutput);
          }
          throw new Error(finalErrorMessage);
        }
      } else {
        // Should not happen if backend conforms to ToolResult structure
        throw new Error('Tool execution result is missing.');
      }
    } else {
      // If not the tool_execution wrapper, assume currentContent is the direct data
      // This handles cases where the backend might return data directly or already parsed by a previous step
      dataToRender = currentContent as ParsedToolContent;
    }

    // Final type check for list-argil-avatars and list-argil-voices
    if (name === 'list-argil-avatars') {
        // First ensure dataToRender exists
        if (dataToRender === undefined || dataToRender === null) {
            throw new Error('Avatar data is missing or undefined.');
        }

        // Attempt to re-parse if it's a string that looks like an array
        if (typeof dataToRender === 'string') {
            try {
                const reparsed = JSON.parse(dataToRender);
                if (Array.isArray(reparsed)) dataToRender = reparsed as ArgilAvatar[];
            } catch (e) { /* ignore reparse error, will fall through to throw */ }
        }
        
        // Now check if it's an array after all parsing attempts
        if (!Array.isArray(dataToRender)) {
            throw new Error('Avatar data is not an array.');
        }
    }
    
    if (name === 'list-argil-voices') {
        // First ensure dataToRender exists
        if (dataToRender === undefined || dataToRender === null) {
            throw new Error('Voice data is missing or undefined.');
        }

        if (typeof dataToRender === 'string') {
            try {
                const reparsed = JSON.parse(dataToRender);
                if (Array.isArray(reparsed)) dataToRender = reparsed as Voice[];
            } catch (e) { /* ignore reparse error, will fall through to throw */ }
        }
        
        // Now check if it's an array after all parsing attempts
        if (!Array.isArray(dataToRender)) {
            throw new Error('Voice data is not an array.');
        }
    }

  } catch (error) {
    console.error(`Error parsing toolContent for ${name}:`, error, "Raw toolContent:", toolContent);
    parseError = error instanceof Error ? error : new Error(String(error));
  }

  if (parseError) {
    return (
      <Alert className="my-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error displaying {name}: {parseError.message}
        </AlertDescription>
        <AlertDescription className="mt-2 text-xs break-all">
          Raw: {typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent)}
        </AlertDescription>
      </Alert>
    );
  }

  if (!dataToRender) {
    return (
      <Alert className="my-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unrecognized or empty content for {name}
        </AlertDescription>
        <AlertDescription className="mt-2 text-xs break-all">
          Raw: {typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent)}
        </AlertDescription>
      </Alert>
    );
  }

  // --- Render based on the tool name and parsed data ---
  switch (name) {
    case 'list-argil-avatars':
      const avatars = dataToRender as ArgilAvatar[];
      if (!Array.isArray(avatars)) {
        return (
          <Alert className="my-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Avatar data is not an array.</AlertDescription>
          </Alert>
        );
      }

      const filteredAvatars = avatars.filter(avatar =>
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return (
        <Card className="my-2">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Available Avatars</h2>
            <Input
              type="text"
              placeholder="Search Avatars"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {filteredAvatars.length === 0 ? (
              <p className="text-sm text-muted-foreground">{searchTerm ? 'No avatars match your search.' : 'No avatars found.'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAvatars.map((avatar, index) => {
                  const avatarId = avatar.avatar_id && avatar.avatar_id.trim() !== '' ? avatar.avatar_id : `${avatar.name}-${index}`;
                  const avatarDimensions = imageDimensions[avatarId];
                  
                  return (
                    <Card key={avatarId} className="hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative aspect-square">
                        <img
                          src={avatar.thumbnailUrl}
                          alt={avatar.name}
                          className="w-full h-full object-cover rounded-t-lg"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            const aspectRatio = img.naturalWidth / img.naturalHeight;
                            let orientation: 'portrait' | 'landscape' | 'square' = 'square';
                            
                            if (aspectRatio > 1.1) orientation = 'landscape';
                            else if (aspectRatio < 0.9) orientation = 'portrait';
                            
                            setImageDimensions(prev => ({
                              ...prev,
                              [avatarId]: { id: avatarId, aspectRatio, orientation }
                            }));
                          }}
                        />
                        {avatarDimensions && (
                          <Badge
                            className="absolute bottom-2 left-2 text-xs"
                            variant={avatarDimensions.orientation === 'portrait' ? "default" : 
                                  avatarDimensions.orientation === 'landscape' ? "secondary" : "outline"}
                          >
                            {`${avatarDimensions.orientation} (${avatarDimensions.aspectRatio.toFixed(1)})`}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm truncate">{avatar.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {avatar.avatar_id}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'list-argil-voices':
      const voices = dataToRender as Voice[];
      if (!Array.isArray(voices)) {
        return (
          <Alert className="my-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Voice data is not an array.</AlertDescription>
          </Alert>
        );
      }
      
      return (
        <Card className="my-2">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Available Voices</h2>
            {voices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No voices found.</p>
            ) : (
              <div className="space-y-3">
                {voices.map((voice) => (
                  <div key={voice.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {voice.id}</p>
                      {voice.status && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {voice.status}
                        </Badge>
                      )}
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
      const statusData = dataToRender as VideoGenerationPollingResponse;
      return (
        <Card className="my-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Video Status</h2>
              {statusData.status === 'DONE' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {statusData.status === 'FAILED' && <XCircle className="h-5 w-5 text-red-500" />}
              {statusData.status && !['DONE', 'FAILED'].includes(statusData.status) && <Clock className="h-5 w-5 text-blue-500" />}
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm"><span className="font-medium">Video ID:</span> {statusData.video_id}</p>
              <p className="text-sm"><span className="font-medium">Status:</span> 
                <Badge className="ml-2" variant={statusData.status === 'DONE' ? 'default' : statusData.status === 'FAILED' ? 'destructive' : 'secondary'}>
                  {statusData.status || 'Processing'}
                </Badge>
              </p>
              {statusData.video_name && <p className="text-sm"><span className="font-medium">Name:</span> {statusData.video_name}</p>}
            </div>

            {statusData.status === 'DONE' && (
              <div className="mt-4">
                <h3 className="text-base font-semibold mb-3">Video Ready:</h3>
                
                {/* Pixiomedia player (preferred) */}
                {statusData.pixio_video_url && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-blue-600 mb-1">Recommended Player (Pixiomedia):</p>
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
                
                {/* Fallback to workspace video if Pixiomedia failed */}
                {!statusData.pixio_video_url && statusData.workspace_path && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-green-600 mb-1">Workspace Video Player:</p>
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
            
            {/* Show error if available */}
            {statusData.status === 'FAILED' && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Video generation failed: {statusData.error || 'Unknown error'}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Show message or note if available */}
            {statusData.message && <p className="text-sm text-muted-foreground mt-3">{statusData.message}</p>}
            {statusData.note && <p className="text-xs text-muted-foreground italic mt-2">{statusData.note}</p>}
          </CardContent>
        </Card>
      );

    case 'generate-argil-video':
      const videoResult = dataToRender as VideoGenerationResult;
      if ('script' in videoResult && 'avatar_id' in videoResult) {
        // Input display (initial call)
        const inputArgs = videoResult as VideoGenerationInputArgs;
        return (
          <Card className="my-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Video Generation Initiated</h2>
              </div>
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
        // Polling response or final result
        const pollData = videoResult as VideoGenerationPollingResponse;
        return (
          <Card className="my-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                {pollData.status === 'DONE' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {pollData.status === 'FAILED' && <XCircle className="h-5 w-5 text-red-500" />}
                {pollData.status && !['DONE', 'FAILED'].includes(pollData.status) && <Clock className="h-5 w-5 text-blue-500" />}
                <h2 className="text-lg font-semibold">Video Generation Status</h2>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm"><span className="font-medium">Video ID:</span> {pollData.video_id}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> 
                  <Badge className="ml-2" variant={pollData.status === 'DONE' ? 'default' : pollData.status === 'FAILED' ? 'destructive' : 'secondary'}>
                    {pollData.status || 'Processing'}
                  </Badge>
                </p>
                {pollData.video_name && <p className="text-sm"><span className="font-medium">Name:</span> {pollData.video_name}</p>}
                {pollData.created_at && <p className="text-sm"><span className="font-medium">Created:</span> {new Date(pollData.created_at).toLocaleString()}</p>}
                {pollData.updated_at && <p className="text-sm"><span className="font-medium">Updated:</span> {new Date(pollData.updated_at).toLocaleString()}</p>}
              </div>
              
              {/* Show progress indicator for all in-progress states */}
              {pollData.status && !['DONE', 'FAILED'].includes(pollData.status) && (
                <div className="flex items-center mt-4 mb-4">
                  <div className="w-full mr-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-blue-500 rounded-full animate-pulse w-full"></div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground min-w-[120px]">
                    {pollData.status === 'GENERATING_AUDIO' ? 'Generating audio...' : 
                     pollData.status === 'GENERATING_VIDEO' ? 'Generating video...' : 
                     'Processing...'}
                  </p>
                </div>
              )}
              
              {/* Show workspace path if available */}
              {pollData.workspace_path && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Saved to workspace:</p>
                  <p className="text-xs text-muted-foreground font-mono">{pollData.workspace_path}</p>
                </div>
              )}
              
              {/* Show video if available */}
              {pollData.status === 'DONE' && (pollData.video_url || pollData.pixio_video_url || pollData.workspace_path) && (
                <div className="mt-4">
                  <h3 className="text-base font-semibold mb-3">Video Ready:</h3>
                  
                  {/* Pixiomedia player (preferred) */}
                  {pollData.pixio_video_url && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-600 mb-1">Recommended Player (Pixiomedia):</p>
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
                  
                  {/* Fallback to workspace video if Pixiomedia failed */}
                  {!pollData.pixio_video_url && pollData.workspace_path && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-green-600 mb-1">Workspace Video Player:</p>
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
                        <p className="text-xs text-red-500 mt-2">
                          Note: Pixiomedia upload failed - using local video. Error: {pollData.upload_error}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Original Argil source */}
                  {pollData.video_url && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">{(pollData.pixio_video_url || pollData.workspace_path) ? 'Alternative Source (Argil):' : 'Argil Source:'}</p>
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
                      <p className="text-sm font-medium text-gray-600 mb-1">Video with subtitles:</p>
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
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Video generation failed: {pollData.error || 'Unknown error'}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Show message or note if available */}
              {pollData.message && <p className="text-sm text-muted-foreground mt-3">{pollData.message}</p>}
              {pollData.note && <p className="text-xs text-muted-foreground italic mt-2">{pollData.note}</p>}
            </CardContent>
          </Card>
        );
      }
      // Fallback for unexpected videoResult structure
      return (
        <Alert className="my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Unexpected video generation data structure.</AlertDescription>
        </Alert>
      );

    default:
      return (
        <Alert className="my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Display for '{name}': {JSON.stringify(dataToRender, null, 2)}
          </AlertDescription>
        </Alert>
      );
  }
}

export default AvatarToolView;
