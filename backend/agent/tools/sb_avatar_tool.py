import httpx
import json
import logging
import asyncio
from typing import Optional, List, Dict, Any
import base64
import re
import datetime

from agentpress.tool import ToolResult, xml_schema
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
from utils.config import config

logger = logging.getLogger(__name__)

ARGIL_API_BASE_URL = "https://api.argil.ai/v1"

class SandboxAvatarTool(SandboxToolsBase):
    """Tool for interacting with the Argil AI Avatar API to list avatars, voices, and generate videos."""

    def __init__(self, project_id: str, thread_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.thread_id = thread_id
        self.thread_manager = thread_manager
        self.api_key = getattr(config, 'ARGIL_API_KEY', None)
        if not self.api_key:
            logger.error("⚠️ ARGIL_API_KEY not found in configuration.")
            # Tools should be robust and not raise exceptions in __init__ if a key is missing,
            # but rather fail gracefully when a method requiring the key is called.

    async def _make_argil_request(self, method: str, endpoint: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key:
            return {"error": "ARGIL_API_KEY not configured."}
        
        url = f"{ARGIL_API_BASE_URL}{endpoint}"
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                if method == "GET":
                    response = await client.get(url, headers=headers)
                elif method == "POST":
                    response = await client.post(url, headers=headers, json=payload)
                else:
                    return {"error": f"Unsupported HTTP method: {method}"}
                
                response.raise_for_status() # Raises HTTPStatusError for 4xx/5xx responses
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Argil API HTTP error for {method} {url}: {e.response.status_code} - {e.response.text}")
                return {"error": f"Argil API error: {e.response.status_code}", "details": e.response.text}
            except httpx.RequestError as e:
                logger.error(f"Argil API request error for {method} {url}: {e}")
                return {"error": f"Argil API request error: {str(e)}"}
            except json.JSONDecodeError as e:
                logger.error(f"Argil API JSON decode error for {method} {url}: {e}")
                return {"error": "Failed to decode Argil API response."}

    @xml_schema(
        tag_name="list-argil-avatars",
        example="<list-argil-avatars />"
    )
    async def list_argil_avatars(self, _xml_chunk=None) -> ToolResult:
        """Lists available avatars from Argil AI, returning a simplified list."""
        logger.info("Listing Argil avatars...")
        api_response = await self._make_argil_request("GET", "/avatars")
        
        if "error" in api_response:
            return ToolResult(success=False, output=json.dumps(api_response))

        # Assuming api_response is a list of avatar objects from Argil
        # Or if it's a dict like {"avatars": [...]}, adjust accordingly e.g., api_response.get("avatars", [])
        if not isinstance(api_response, list):
            possible_keys = ["avatars", "data", "results", "items"]
            actual_list = None
            if isinstance(api_response, dict):
                for key in possible_keys:
                    if isinstance(api_response.get(key), list):
                        actual_list = api_response[key]
                        break
            if actual_list is None:
                logger.error(f"Unexpected Argil avatars API response format: {type(api_response)}. Expected a list or a dict with a list.")
                return ToolResult(success=False, output=json.dumps({"error": "Unexpected API response format for avatars."}))
        else:
            actual_list = api_response

        simplified_avatars = []
        for avatar_data in actual_list:
            if not isinstance(avatar_data, dict):
                logger.warning(f"Skipping non-dict item in avatar list: {avatar_data}")
                continue
            simplified_avatars.append({
                "avatar_id": avatar_data.get("id"), # Mapping 'id' from API to 'avatar_id'
                "name": avatar_data.get("name"),
                "thumbnailUrl": avatar_data.get("thumbnailUrl") # Matches frontend
            })
        
        return ToolResult(success=True, output=json.dumps(simplified_avatars, indent=2))

    @xml_schema(
        tag_name="list-argil-voices",
        example="<list-argil-voices />"
    )
    async def list_argil_voices(self, _xml_chunk=None) -> ToolResult:
        """Lists available voices from Argil AI, returning a simplified list."""
        logger.info("Listing Argil voices...")
        api_response = await self._make_argil_request("GET", "/voices")

        if "error" in api_response:
            return ToolResult(success=False, output=json.dumps(api_response))

        # Assuming api_response is a list of voice objects from Argil
        # Or if it's a dict like {"voices": [...]}, adjust accordingly e.g., api_response.get("voices", [])
        if not isinstance(api_response, list):
            possible_keys = ["voices", "data", "results", "items"]
            actual_list = None
            if isinstance(api_response, dict):
                for key in possible_keys:
                    if isinstance(api_response.get(key), list):
                        actual_list = api_response[key]
                        break
            if actual_list is None:
                logger.error(f"Unexpected Argil voices API response format: {type(api_response)}. Expected a list or a dict with a list.")
                return ToolResult(success=False, output=json.dumps({"error": "Unexpected API response format for voices."}))
        else:
            actual_list = api_response
            
        simplified_voices = []
        for voice_data in actual_list:
            if not isinstance(voice_data, dict):
                logger.warning(f"Skipping non-dict item in voice list: {voice_data}")
                continue
            simplified_voices.append({
                "id": voice_data.get("id"), # Matches frontend
                "name": voice_data.get("name"),
                "sampleUrl": voice_data.get("sampleUrl"), # Matches frontend (optional)
                "status": voice_data.get("status") # Matches frontend (optional)
            })
            
        return ToolResult(success=True, output=json.dumps(simplified_voices, indent=2))

    @xml_schema(
        tag_name="generate-argil-video",
        mappings=[
            {"param_name": "avatar_name", "node_type": "attribute", "path": ".", "required": True},
            {"param_name": "text", "node_type": "content", "path": ".", "required": False},
            {"param_name": "voice_name", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "video_name", "node_type": "attribute", "path": ".", "required": False}
        ],
        example='''
<generate-argil-video avatar_name="Pipo" voice_name="Pipo US Male" video_name="My First Video">
Hello, this is a test video generated by Argil AI!
</generate-argil-video>
        '''
    )
    async def generate_argil_video(self, avatar_name: str, *, text: Optional[str] = None, prompt: Optional[str] = None, voice_name: Optional[str] = None, video_name: Optional[str] = None, _xml_chunk=None, **kwargs) -> ToolResult:
        """Generates a video using Argil AI with the given text, avatar, and voice.
        The script content can be provided as either 'text' or 'prompt'."""
        # Use text if provided, otherwise use prompt. If neither, it's None
        script_content = text if text is not None else prompt
        
        if not script_content:
            logger.error("Video generation called without script content ('text' or 'prompt' parameters).")
            return ToolResult(success=False, output=json.dumps({"error": "Video script content is required but was not provided. Use either 'text' or 'prompt' parameter."}))
        
        logger.info(f"Generating Argil video with script: '{script_content[:50]}...', avatar: {avatar_name}, voice: {voice_name}")
        if not self.api_key:
            return ToolResult(success=False, output=json.dumps({"error": "ARGIL_API_KEY not configured."}))

        # 1. Get Avatars and Voices to find IDs
        avatars_data = await self._make_argil_request("GET", "/avatars")
        if "error" in avatars_data or not isinstance(avatars_data, list):
            return ToolResult(success=False, output=json.dumps({"error": "Failed to fetch avatars list.", "details": avatars_data}))
        
        voices_data = await self._make_argil_request("GET", "/voices")
        if "error" in voices_data or not isinstance(voices_data, list):
            return ToolResult(success=False, output=json.dumps({"error": "Failed to fetch voices list.", "details": voices_data}))

        # Find avatar ID
        target_avatar_id = None
        for avatar in avatars_data:
            if avatar.get("name") == avatar_name:
                target_avatar_id = avatar.get("id")
                break
        if not target_avatar_id:
            return ToolResult(success=False, output=json.dumps({"error": f"Avatar '{avatar_name}' not found."}))

        # Find voice ID (intelligently match if voice_name not provided or find specific)
        target_voice_id = None
        if voice_name:
            for voice in voices_data:
                if voice.get("name") == voice_name:
                    target_voice_id = voice.get("id")
                    break
            if not target_voice_id:
                logger.warning(f"Specified voice '{voice_name}' not found. Attempting to match with avatar name or use default.")
        
        if not target_voice_id: # If not found by specific name or if voice_name was None
            # Try to match voice name containing avatar name
            for voice in voices_data:
                if avatar_name.lower() in voice.get("name", "").lower():
                    target_voice_id = voice.get("id")
                    logger.info(f"Found voice '{voice.get('name')}' matching avatar name '{avatar_name}'.")
                    break
            if not target_voice_id and voices_data:
                 # Fallback to the first available voice if no match
                target_voice_id = voices_data[0].get("id")
                logger.info(f"Using first available voice: {voices_data[0].get('name')}")
        
        if not target_voice_id:
            return ToolResult(success=False, output=json.dumps({"error": f"Could not find a suitable voice for avatar '{avatar_name}'."}))

        # 2. Create Video
        video_payload = {
            "name": video_name or f"Video for {avatar_name} - {script_content[:20]}",
            "moments": [
                {
                    "transcript": script_content,
                    "avatarId": target_avatar_id,
                    "voiceId": target_voice_id
                }
            ]
            # Add other parameters like aspectRatio, subtitles if needed later
        }
        
        creation_response = await self._make_argil_request("POST", "/videos", payload=video_payload)
        if "error" in creation_response or not creation_response.get("id"):
            return ToolResult(success=False, output=json.dumps({"error": "Failed to create video.", "details": creation_response}))

        video_id = creation_response["id"]
        logger.info(f"Video creation initiated with ID: {video_id}")
        
        # After creating the video object, we need to trigger the rendering process with a separate API call
        render_response = await self._make_argil_request("POST", f"/videos/{video_id}/render")
        if "error" in render_response:
            return ToolResult(success=False, output=json.dumps({
                "error": "Created video but failed to trigger rendering.",
                "video_id": video_id,
                "details": render_response
            }))
            
        # Get the updated status after rendering is triggered
        status_response = await self._make_argil_request("GET", f"/videos/{video_id}")
        
        # Return with the video ID and status after rendering has started
        return ToolResult(
            success=True, 
            output=json.dumps({
                "video_id": video_id,
                "video_name": status_response.get("name") or creation_response.get("name"),
                "status": status_response.get("status") or "PROCESSING",
                "created_at": creation_response.get("createdAt"),
                "updated_at": status_response.get("updatedAt"),
                "message": "Video generation has been initiated and rendering has started. You can check the status using the video_id.",
                "note": "Video generation typically takes 3-8 minutes to complete."
            })
        )

    @xml_schema(
        tag_name="check-argil-video-status",
        mappings=[
            {"param_name": "video_id", "node_type": "attribute", "path": ".", "required": True}
        ],
        example='&lt;check-argil-video-status video_id="3c90c3cc-0d44-4b50-8888-8dd25736052a"&gt;&lt;/check-argil-video-status&gt;'
    )
    async def check_argil_video_status(self, video_id: str, _xml_chunk=None, **kwargs) -> ToolResult:
        """Check the status of a video that is being generated.
        
        Args:
            video_id: The ID of the video to check status for
            
        Returns:
            ToolResult with the video status information including URL if available
        """
        if not self.api_key:
            return ToolResult(success=False, output=json.dumps({"error": "ARGIL_API_KEY not configured."}))
            
        logger.info(f"Checking status for Argil video: {video_id}")
        
        # Make API call to get video status
        status_response = await self._make_argil_request("GET", f"/videos/{video_id}")
        if "error" in status_response:
            return ToolResult(success=False, output=json.dumps({"error": "Failed to retrieve video status.", "details": status_response}))

        # Prepare response with relevant info
        status = status_response.get("status", "UNKNOWN")
        result = {
            "video_id": video_id,
            "status": status,
            "name": status_response.get("name"),
            "created_at": status_response.get("createdAt"),
            "updated_at": status_response.get("updatedAt")
        }
        
        # Add video URL if available
        if status == "DONE":
            argil_video_url = status_response.get("videoUrl")
            result["video_url"] = argil_video_url
            if status_response.get("videoUrlSubtitled"):
                result["video_url_subtitled"] = status_response.get("videoUrlSubtitled")
            
            # Download, save to workspace, and upload to Pixiomedia for better viewing
            try:
                if argil_video_url:
                    # Ensure sandbox is initialized first - CRITICAL STEP
                    await self._ensure_sandbox()
                    
                    # Create videos directory using proper sandbox method
                    videos_dir = f"{self.workspace_path}/videos"
                    logger.info(f"Creating videos directory: {videos_dir}")
                    self.sandbox.fs.create_folder(videos_dir, "755")
                
                    # Download the video from Argil
                    logger.info(f"Downloading video from Argil URL: {argil_video_url}")
                    async with httpx.AsyncClient() as client:
                        video_response = await client.get(argil_video_url, timeout=60)
                        video_response.raise_for_status()
                        video_bytes = video_response.content
                    
                    # Generate unique filename with timestamp
                    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    video_name = result["name"] or "argil_video"
                    safe_name = re.sub(r'[^\w\s-]', '', video_name).strip().replace(' ', '_')
                    filename = f"{safe_name}_{video_id[:8]}_{timestamp}.mp4"
                    
                    # Save the video to the sandbox
                    video_path = f"{videos_dir}/{filename}"
                    self.sandbox.fs.upload_file(video_bytes, video_path)
                    
                    # Add workspace path to result - format it like the image tool does
                    result["workspace_path"] = f"/workspace/videos/{filename}"
                    
                    # Verify video was saved
                    try:
                        file_info = self.sandbox.fs.get_file_info(video_path)
                        logger.info(f"Confirmed video saved to workspace: {video_path}, size: {file_info.size} bytes")
                    except Exception as e:
                        logger.error(f"Error verifying video in workspace: {str(e)}")
                        # Continue with upload even if verification fails
                    
                    # Use the same filename for both workspace and Pixiomedia upload
                    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    video_name = result["name"] or "argil_video"
                    safe_name = re.sub(r'[^\w\s-]', '', video_name).strip().replace(' ', '_')
                    filename = f"{safe_name}_{video_id[:8]}_{timestamp}.mp4"
                    
                    # Use multipart/form-data for video upload (better for large files)
                    # This is based on the successful curl example from the API docs
                    upload_url = "https://uplaodpixio-production.up.railway.app/api/upload"
                    
                    # Prepare the file as multipart/form-data
                    logger.info(f"Uploading video to Pixiomedia service using multipart/form-data")
                    logger.info(f"File size: {len(video_bytes)} bytes")
                    
                    # Create file object from bytes
                    files = {
                        'file': (filename, video_bytes, 'video/mp4')
                    }
                    
                    # Configure client with longer timeout for large video files
                    # Videos are larger than images, so we need a longer timeout
                    max_retries = 2
                    retry_count = 0
                    last_error = None
                    
                    while retry_count <= max_retries:
                        try:
                            async with httpx.AsyncClient(timeout=180.0) as upload_client:  # 3 minute timeout
                                logger.info(f"Uploading video to Pixiomedia (attempt {retry_count+1}/{max_retries+1})")
                                logger.info(f"Video size: {len(video_bytes)//1024}KB")
                                
                                # Make the request with a timeout using multipart/form-data
                                upload_response = await upload_client.post(
                                    upload_url,
                                    files=files
                                )
                                upload_response.raise_for_status()
                                upload_data = upload_response.json()
                                
                                logger.info(f"Upload response received: {upload_response.status_code}")
                                logger.info(f"Upload response body: {upload_data}")
                                
                                # Add Pixiomedia URL to result
                                pixio_url = upload_data.get("publicURL")
                                if pixio_url:
                                    result["pixio_video_url"] = f"{pixio_url}?t={timestamp}"
                                    logger.info(f"Video successfully uploaded to Pixiomedia: {pixio_url}")
                                    
                                    # Update success message to include both URLs
                                    result["message"] = "Video generation completed successfully! Available from multiple sources."
                                else:
                                    logger.warning("No publicURL found in Pixiomedia response despite 200 OK status")
                                    logger.warning(f"Response data: {upload_data}")
                                    result["message"] = "Video generation completed successfully! Only Argil URL available."
                                
                                # If we get here, the upload was successful
                                break
                                
                        except httpx.TimeoutException as e:
                            retry_count += 1
                            last_error = e
                            logger.warning(f"Timeout during upload (attempt {retry_count}/{max_retries+1}): {str(e)}")
                            if retry_count <= max_retries:
                                logger.info(f"Retrying upload...")
                            else:
                                logger.error(f"Failed to upload after {max_retries+1} attempts due to timeouts.")
                                raise
                        except Exception as e:
                            # For non-timeout errors, don't retry
                            logger.error(f"Non-timeout error during upload: {str(e)}")
                            last_error = e
                            raise
                    
                    # If we exited the loop due to max retries, raise the last error
                    if retry_count > max_retries and last_error:
                        raise last_error
                        
                        # Add Pixiomedia URL to result
                        pixio_url = upload_data.get("publicURL")
                        if pixio_url:
                            result["pixio_video_url"] = f"{pixio_url}?t={timestamp}"
                            logger.info(f"Video successfully uploaded to Pixiomedia: {pixio_url}")
                            
                            # Update success message to include both URLs
                            result["message"] = "Video generation completed successfully! Available from multiple sources."
                        else:
                            logger.warning("No publicURL found in Pixiomedia response despite 200 OK status")
                            logger.warning(f"Response data: {upload_data}")
                            result["message"] = "Video generation completed successfully! Only Argil URL available."
                else:
                    result["message"] = "Video generation completed but no video URL was provided."
                    
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                logger.error(f"Error uploading video to Pixiomedia service: {str(e)}\n{error_trace}")
                result["upload_error"] = f"Could not upload to Pixiomedia: {str(e)}"
                result["message"] = f"Video generation completed successfully, but additional upload failed: {str(e)}"
                # Add debug info to help diagnose the issue
                result["debug_info"] = {
                    "error_type": type(e).__name__,
                    "error_args": str(getattr(e, 'args', ''))
                }
        elif status == "FAILED":
            result["message"] = "Video generation failed."
        else:
            # Still in progress
            result["message"] = f"Video is currently in '{status}' status. Please check again later."
            result["note"] = "Video generation typically takes 3-8 minutes to complete."
            
        return ToolResult(success=True, output=json.dumps(result))

    def get_xml_schemas(self) -> List[Dict[str, Any]]:
        """Return the XML schemas for the Argil Avatar tool."""
        return [
            {
                "tag_name": "list-argil-avatars",
                "method_name": "list_argil_avatars",
                "mappings": [], # No params for list_avatars
                "example": "<list-argil-avatars />"
            },
            {
                "tag_name": "list-argil-voices",
                "method_name": "list_argil_voices",
                "mappings": [], # No params for list_voices
                "example": "<list-argil-voices />"
            },
            {
                "tag_name": "generate-argil-video",
                "method_name": "generate_argil_video",
                "mappings": [
                    {"param_name": "prompt", "node_type": "content", "path": ".", "required": True},
                    {"param_name": "avatar_name", "node_type": "attribute", "path": ".", "required": True},
                    {"param_name": "voice_name", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "video_name", "node_type": "attribute", "path": ".", "required": False}
                ],
                "example": '''
<generate-argil-video avatar_name="Pipo" voice_name="Pipo US Male" video_name="My First Video">
Hello, this is a test video generated by Argil AI!
</generate-argil-video>
                '''
            }
        ]
