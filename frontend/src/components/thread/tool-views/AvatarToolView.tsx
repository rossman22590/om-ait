import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  LinearProgress,
  Alert,
  TextField,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ToolViewProps } from './types';

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
  // Add other relevant fields from API if needed, e.g., status
}

interface Voice {
  id: string;
  name: string;
  sampleUrl?: string; // API 'sampleUrl'
  status?: string; // API 'status'
  // Add other relevant fields from API if needed
}

// These type definitions were redundant with the interfaces above, removed to avoid confusion
interface VideoGenerationInputArgs {
  avatar_id: string;
  voice_id: string;
  script: string;
  title?: string;
  // other optional params from your tool schema
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

const AvatarToolView: React.FC<ToolViewProps> = ({ name, toolContent, isCollapsed }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [imageDimensions, setImageDimensions] = useState<Record<string, ImageDimensions>>({});

  if (isCollapsed) {
    return (
      <Paper elevation={1} sx={{ p: 2, my: 1 }}>
        <Typography variant="subtitle1">{name} (collapsed)</Typography>
      </Paper>
    );
  }

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
          if (typeof output === 'string' && ['list-argil-avatars', 'list-argil-voices', 'generate-argil-video', 'check-argil-video-status'].includes(name)) {
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
      <Alert severity="error" sx={{ my: 1 }}>
        <Typography variant="subtitle1">Error displaying {name}</Typography>
        <Typography variant="body2">
          Failed to parse or process tool content. Error: {parseError.message}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
          Raw: {typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent)}
        </Typography>
      </Alert>
    );
  }

  if (!dataToRender) {
    return (
      <Alert severity="warning" sx={{ my: 1 }}>
        <Typography variant="subtitle1">Unrecognized or empty content for {name}</Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            Raw: {typeof toolContent === 'string' ? toolContent : JSON.stringify(toolContent)}
        </Typography>
      </Alert>
    );
  }

  // --- Render based on the tool name and parsed data ---
  switch (name) {
    case 'list-argil-avatars':
      const avatars = dataToRender as ArgilAvatar[];
      if (!Array.isArray(avatars)) return <Alert severity="error">Avatar data is not an array.</Alert>;

      const filteredAvatars = avatars.filter(avatar =>
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Available Avatars</Typography>
          <TextField
            label="Search Avatars"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          {filteredAvatars.length === 0 ? (
            <Typography>{searchTerm ? 'No avatars match your search.' : 'No avatars found.'}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
              {filteredAvatars.map((avatar, index) => {
                const avatarId = avatar.avatar_id && avatar.avatar_id.trim() !== '' ? avatar.avatar_id : `${avatar.name}-${index}`;
                const avatarDimensions = imageDimensions[avatarId];
                
                return (
                <Grid 
                  key={avatarId}
                  sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}
                >
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                      cursor: 'pointer'
                    }
                  }}>
                    <Box sx={{ position: 'relative', paddingTop: '100%' /* 1:1 aspect ratio */ }}>
                      <CardMedia
                        component="img"
                        image={avatar.thumbnailUrl}
                        alt={avatar.name}
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
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
                        <Chip 
                          label={`${avatarDimensions.orientation} (${avatarDimensions.aspectRatio.toFixed(1)})`} 
                          size="small" 
                          color={avatarDimensions.orientation === 'portrait' ? "primary" : 
                                avatarDimensions.orientation === 'landscape' ? "secondary" : "default"}
                          sx={{ 
                            position: 'absolute', 
                            bottom: 8, 
                            left: 8, 
                            opacity: 0.9,
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            backdropFilter: 'blur(2px)',
                            '& .MuiChip-label': {
                              padding: '0 8px'
                            }
                          }}
                        />
                      )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" noWrap>
                        {avatar.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        ID: {avatar.avatar_id}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                );
              })}
            </Box>
          )}
        </Box>
      );

    case 'list-argil-voices':
      const voices = dataToRender as Voice[];
      if (!Array.isArray(voices)) return <Alert severity="error">Voice data is not an array.</Alert>;
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Available Voices</Typography>
          {voices.length === 0 ? (
            <Typography>No voices found.</Typography>
          ) : (
            <List>
              {voices.map((voice) => (
                <ListItem key={voice.id} divider sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ListItemText 
                    primary={voice.name} 
                    secondary={`ID: ${voice.id}${voice.status ? ' - Status: ' + voice.status : ''}`}
                  />
                  {voice.sampleUrl && (
                    <audio controls src={voice.sampleUrl} style={{ marginLeft: '16px' }}>
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      );

    case 'check-argil-video-status':
      // Direct handler for video status check
      const statusData = dataToRender as VideoGenerationPollingResponse;
      return (
        <Paper elevation={1} sx={{ p: 2, my: 1 }}>
          <Typography variant="subtitle1">Video Status</Typography>
          <Typography variant="body2">Video ID: {statusData.video_id}</Typography>
          <Typography variant="body2">Status: {statusData.status || 'Processing'}</Typography>
          {statusData.video_name && <Typography variant="body2">Name: {statusData.video_name}</Typography>}
          
          {/* Debug information - commented out as requested 
          <Box sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '12px', fontFamily: 'monospace', overflow: 'auto' }}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Debug Info:</Typography>
            <pre style={{ margin: 0, maxHeight: '200px', overflow: 'auto' }}>{JSON.stringify(statusData, null, 2)}</pre>
          </Box>
          */}

          {statusData.status === 'DONE' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Video Ready:</Typography>
              
              {/* Pixiomedia player (preferred) */}
              {statusData.pixio_video_url && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="subtitle2" color="primary">Recommended Player (Pixiomedia):</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    Source: <a href={statusData.pixio_video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3', textDecoration: 'underline', fontWeight: 'bold' }}>{statusData.pixio_video_url}</a>
                  </Typography>
                  <video 
                    controls 
                    preload="metadata"
                    playsInline
                    src={statusData.pixio_video_url} 
                    style={{ width: '100%', maxHeight: '400px', marginTop: '8px' }}
                  >
                    <source src={statusData.pixio_video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              )}
              
              {/* Fallback to workspace video if Pixiomedia failed */}
              {!statusData.pixio_video_url && statusData.workspace_path && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="subtitle2" color="primary">Workspace Video Player:</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    Source: {`/api/workspace${statusData.workspace_path}`}
                  </Typography>
                  <video 
                    controls 
                    preload="metadata"
                    playsInline
                    src={`/api/workspace${statusData.workspace_path}`}
                    style={{ width: '100%', maxHeight: '400px', marginTop: '8px' }}
                  >
                    <source src={`/api/workspace${statusData.workspace_path}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              )}
              
              {/* Argil source player has been hidden as requested */}
            </Box>
          )}
          
          {/* Show error if available */}
          {statusData.status === 'FAILED' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Video generation failed: {statusData.error || 'Unknown error'}
            </Alert>
          )}
          
          {/* Show message or note if available */}
          {statusData.message && <Typography variant="body1" sx={{ mt: 1 }}>{statusData.message}</Typography>}
          {statusData.note && <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>{statusData.note}</Typography>}
        </Paper>
      );

    case 'generate-argil-video':
      const videoResult = dataToRender as VideoGenerationResult;
      if ('script' in videoResult && 'avatar_id' in videoResult) { // Input display (initial call)
        const inputArgs = videoResult as VideoGenerationInputArgs;
        return (
          <Paper elevation={1} sx={{ p: 2, my: 1 }}>
            <Typography variant="subtitle1">Video Generation Initiated</Typography>
            <Typography variant="body2">Avatar ID: {inputArgs.avatar_id}</Typography>
            <Typography variant="body2">Voice ID: {inputArgs.voice_id}</Typography>
            <Typography variant="body2">Script: "{inputArgs.script}"</Typography>
            {inputArgs.title && <Typography variant="body2">Title: {inputArgs.title}</Typography>}
          </Paper>
        );
      } else if ('video_id' in videoResult) { // Polling response or final result
        const pollData = videoResult as VideoGenerationPollingResponse;
        return (
          <Paper elevation={1} sx={{ p: 2, my: 1 }}>
            <Typography variant="subtitle1">Video Generation Status</Typography>
            <Typography variant="body2">Video ID: {pollData.video_id}</Typography>
            <Typography variant="body2">Status: {pollData.status || 'Processing'}</Typography>
            {pollData.video_name && <Typography variant="body2">Name: {pollData.video_name}</Typography>}
            {pollData.created_at && <Typography variant="body2">Created: {new Date(pollData.created_at).toLocaleString()}</Typography>}
            {pollData.updated_at && <Typography variant="body2">Updated: {new Date(pollData.updated_at).toLocaleString()}</Typography>}
            
            {/* Show progress indicator for all in-progress states */}
            {pollData.status && !['DONE', 'FAILED'].includes(pollData.status) && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="indeterminate" />
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="body2" color="text.secondary">
                    {pollData.status === 'GENERATING_AUDIO' ? 'Generating audio...' : 
                     pollData.status === 'GENERATING_VIDEO' ? 'Generating video...' : 
                     'Processing...'}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Show workspace path if available */}
            {pollData.workspace_path && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1">Saved to workspace:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.04)', p: 1, borderRadius: 1 }}>
                  {pollData.workspace_path}
                </Typography>
              </Box>
            )}
            
            {/* Show video if available */}
            {pollData.status === 'DONE' && (pollData.video_url || pollData.pixio_video_url || pollData.workspace_path) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Video Ready:</Typography>
                
                {/* Debug information - shows raw data */}
                <Box sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '12px', fontFamily: 'monospace', overflow: 'auto' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Debug Info:</Typography>
                  <pre style={{ margin: 0, maxHeight: '200px', overflow: 'auto' }}>{JSON.stringify(pollData, null, 2)}</pre>
                </Box>

                {/* Pixiomedia player (preferred) */}
                {pollData.pixio_video_url && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="subtitle2" color="primary">Recommended Player (Pixiomedia):</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                      Source: {pollData.pixio_video_url}
                    </Typography>
                    <video 
                      controls 
                      preload="metadata"
                      playsInline
                      src={pollData.pixio_video_url} 
                      style={{ width: '100%', maxHeight: '400px', marginTop: '8px' }}
                    >
                      <source src={pollData.pixio_video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                )}
                
                {/* Fallback to workspace video if Pixiomedia failed */}
                {!pollData.pixio_video_url && pollData.workspace_path && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="subtitle2" color="primary">Workspace Video Player:</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                      Source: {`/api/workspace${pollData.workspace_path}`}
                    </Typography>
                    {/* Convert workspace path to a browser-accessible URL */}
                    <video 
                      controls 
                      preload="metadata"
                      playsInline
                      src={`/api/workspace${pollData.workspace_path}`}
                      style={{ width: '100%', maxHeight: '400px', marginTop: '8px' }}
                    >
                      <source src={`/api/workspace${pollData.workspace_path}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {pollData.upload_error && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                        Note: Pixiomedia upload failed - using local video. Error: {pollData.upload_error}
                      </Typography>
                    )}
                  </Box>
                )}
                
                {/* Original Argil source */}
                {pollData.video_url && (
                  <Box sx={{ mt: pollData.pixio_video_url ? 1 : 2 }}>
                    <Typography variant="subtitle2">{(pollData.pixio_video_url || pollData.workspace_path) ? 'Alternative Source (Argil):' : ''}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                      Source: <a href={pollData.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3', textDecoration: 'underline', fontWeight: 'bold' }}>{pollData.video_url}</a>
                    </Typography>
                    <video 
                      controls
                      preload="metadata"
                      playsInline
                      src={pollData.video_url}
                      style={{ width: '100%', maxHeight: '400px', marginTop: '8px' }}
                    >
                      <source src={pollData.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                )}
                
                {/* Subtitled video if available */}
                {pollData.video_url_subtitled && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Video with subtitles:</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                      Source: {pollData.video_url_subtitled}
                    </Typography>
                    <video 
                      controls
                      preload="metadata"
                      playsInline
                      src={pollData.video_url_subtitled}
                      style={{ width: '100%', maxHeight: '400px', marginTop: '8px' }}
                    >
                      <source src={pollData.video_url_subtitled} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Show error if available */}
            {pollData.status === 'FAILED' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Video generation failed: {pollData.error || 'Unknown error'}
              </Alert>
            )}
            
            {/* Show message or note if available */}
            {pollData.message && <Typography variant="body1" sx={{ mt: 1 }}>{pollData.message}</Typography>}
            {pollData.note && <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>{pollData.note}</Typography>}
          </Paper>
        );
      }
      // Fallback for unexpected videoResult structure
      return <Alert severity="warning">Unexpected video generation data structure.</Alert>;

    default:
      return (
        <Alert severity="info" sx={{ my: 1 }}>
          <Typography variant="subtitle1">Display for '{name}'</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{JSON.stringify(dataToRender, null, 2)}</Typography>
        </Alert>
      );
  }
}

export default AvatarToolView;
