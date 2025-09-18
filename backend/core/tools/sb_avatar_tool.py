import httpx
import json
import logging
import asyncio
from typing import Optional, List, Dict, Any
import base64
import re
import datetime

from core.agentpress.tool import ToolResult, openapi_schema, usage_example
from core.sandbox.tool_base import SandboxToolsBase
from core.agentpress.thread_manager import ThreadManager
from core.utils.config import config
from core.utils.logger import logger

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
                
                response.raise_for_status()
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

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_argil_avatars",
            "description": "Lists available avatars from Argil AI, returning a simplified list",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    @usage_example("""
    # List all available Argil AI avatars
    list_argil_avatars()
    """)
    async def list_argil_avatars(self) -> ToolResult:
        """Lists available avatars from Argil AI, returning a simplified list."""
        try:
            logger.info("Listing Argil avatars...")
            api_response = await self._make_argil_request("GET", "/avatars")
            
            if "error" in api_response:
                return self.fail_response(f"Failed to fetch avatars: {api_response}")

            if not isinstance(api_response, list):
                possible_keys = ["avatars", "data", "results", "items"]
                actual_list = None
                if isinstance(api_response, dict):
                    for key in possible_keys:
                        if isinstance(api_response.get(key), list):
                            actual_list = api_response[key]
                            break
                if actual_list is None:
                    logger.error(f"Unexpected Argil avatars API response format: {type(api_response)}")
                    return self.fail_response("Unexpected API response format for avatars")
            else:
                actual_list = api_response

            simplified_avatars = []
            for avatar_data in actual_list:
                if not isinstance(avatar_data, dict):
                    logger.warning(f"Skipping non-dict item in avatar list: {avatar_data}")
                    continue
                simplified_avatars.append({
                    "avatar_id": avatar_data.get("id"),
                    "name": avatar_data.get("name"),
                    "thumbnailUrl": avatar_data.get("thumbnailUrl")
                })
            
            return self.success_response({
                "avatars": simplified_avatars,
                "message": f"Successfully retrieved {len(simplified_avatars)} avatars"
            })
            
        except Exception as e:
            logger.error(f"Failed to list avatars: {e}", exc_info=True)
            return self.fail_response(f"Failed to list avatars: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_argil_voices",
            "description": "Lists available voices from Argil AI, returning a simplified list",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    @usage_example("""
    # List all available Argil AI voices
    list_argil_voices()
    """)
    async def list_argil_voices(self) -> ToolResult:
        """Lists available voices from Argil AI, returning a simplified list."""
        try:
            logger.info("Listing Argil voices...")
            api_response = await self._make_argil_request("GET", "/voices")

            if "error" in api_response:
                return self.fail_response(f"Failed to fetch voices: {api_response}")

            if not isinstance(api_response, list):
                possible_keys = ["voices", "data", "results", "items"]
                actual_list = None
                if isinstance(api_response, dict):
                    for key in possible_keys:
                        if isinstance(api_response.get(key), list):
                            actual_list = api_response[key]
                            break
                if actual_list is None:
                    logger.error(f"Unexpected Argil voices API response format: {type(api_response)}")
                    return self.fail_response("Unexpected API response format for voices")
            else:
                actual_list = api_response
                
            simplified_voices = []
            for voice_data in actual_list:
                if not isinstance(voice_data, dict):
                    logger.warning(f"Skipping non-dict item in voice list: {voice_data}")
                    continue
                simplified_voices.append({
                    "id": voice_data.get("id"),
                    "name": voice_data.get("name"),
                    "sampleUrl": voice_data.get("sampleUrl"),
                    "status": voice_data.get("status")
                })
                
            return self.success_response({
                "voices": simplified_voices,
                "message": f"Successfully retrieved {len(simplified_voices)} voices"
            })
            
        except Exception as e:
            logger.error(f"Failed to list voices: {e}", exc_info=True)
            return self.fail_response(f"Failed to list voices: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "generate_argil_video",
            "description": "Generates a video using Argil AI with the given text, avatar, and voice",
            "parameters": {
                "type": "object",
                "properties": {
                    "avatar_name": {
                        "type": "string",
                        "description": "Name of the avatar to use for video generation"
                    },
                    "text": {
                        "type": "string",
                        "description": "Script content for the video"
                    },
                    "voice_name": {
                        "type": "string",
                        "description": "Name of the voice to use (optional - will auto-match with avatar if not provided)"
                    },
                    "video_name": {
                        "type": "string",
                        "description": "Custom name for the generated video (optional)"
                    }
                },
                "required": ["avatar_name", "text"]
            }
        }
    })
    @usage_example("""
    # Generate a video with specific avatar and voice
    generate_argil_video(
        avatar_name="Pipo",
        text="Hello, this is a test video generated by Argil AI!",
        voice_name="Pipo US Male",
        video_name="My First Video"
    )
    
    # Generate a video with auto-matched voice
    generate_argil_video(
        avatar_name="Sarah",
        text="Welcome to our product demonstration!"
    )
    """)
    async def generate_argil_video(
        self,
        avatar_name: str,
        text: str,
        voice_name: Optional[str] = None,
        video_name: Optional[str] = None
    ) -> ToolResult:
        """Generates a video using Argil AI with the given text, avatar, and voice."""
        try:
            if not text:
                return self.fail_response("Video script content is required")
            
            logger.info(f"Generating Argil video with script: '{text[:50]}...', avatar: {avatar_name}, voice: {voice_name}")
            
            if not self.api_key:
                return self.fail_response("ARGIL_API_KEY not configured")

            # Get Avatars and Voices to find IDs
            avatars_data = await self._make_argil_request("GET", "/avatars")
            if "error" in avatars_data or not isinstance(avatars_data, list):
                return self.fail_response(f"Failed to fetch avatars list: {avatars_data}")
            
            voices_data = await self._make_argil_request("GET", "/voices")
            if "error" in voices_data or not isinstance(voices_data, list):
                return self.fail_response(f"Failed to fetch voices list: {voices_data}")

            # Find avatar ID
            target_avatar_id = None
            for avatar in avatars_data:
                if avatar.get("name") == avatar_name:
                    target_avatar_id = avatar.get("id")
                    break
            if not target_avatar_id:
                return self.fail_response(f"Avatar '{avatar_name}' not found")

            # Find voice ID
            target_voice_id = None
            if voice_name:
                for voice in voices_data:
                    if voice.get("name") == voice_name:
                        target_voice_id = voice.get("id")
                        break
                if not target_voice_id:
                    logger.warning(f"Specified voice '{voice_name}' not found. Attempting to match with avatar name")
            
            if not target_voice_id:
                # Try to match voice name containing avatar name
                for voice in voices_data:
                    if avatar_name.lower() in voice.get("name", "").lower():
                        target_voice_id = voice.get("id")
                        logger.info(f"Found voice '{voice.get('name')}' matching avatar name '{avatar_name}'")
                        break
                if not target_voice_id and voices_data:
                    # Fallback to the first available voice
                    target_voice_id = voices_data[0].get("id")
                    logger.info(f"Using first available voice: {voices_data[0].get('name')}")
            
            if not target_voice_id:
                return self.fail_response(f"Could not find a suitable voice for avatar '{avatar_name}'")

            # Create Video
            video_payload = {
                "name": video_name or f"Video for {avatar_name} - {text[:20]}",
                "moments": [
                    {
                        "transcript": text,
                        "avatarId": target_avatar_id,
                        "voiceId": target_voice_id
                    }
                ]
            }
            
            creation_response = await self._make_argil_request("POST", "/videos", payload=video_payload)
            if "error" in creation_response or not creation_response.get("id"):
                return self.fail_response(f"Failed to create video: {creation_response}")

            video_id = creation_response["id"]
            logger.info(f"Video creation initiated with ID: {video_id}")
            
            # Trigger rendering
            render_response = await self._make_argil_request("POST", f"/videos/{video_id}/render")
            if "error" in render_response:
                return self.fail_response(f"Created video but failed to trigger rendering: {render_response}")
                
            # Get updated status
            status_response = await self._make_argil_request("GET", f"/videos/{video_id}")
            
            return self.success_response({
                "video_id": video_id,
                "video_name": status_response.get("name") or creation_response.get("name"),
                "status": status_response.get("status") or "PROCESSING",
                "created_at": creation_response.get("createdAt"),
                "updated_at": status_response.get("updatedAt"),
                "message": f"Video generation initiated. Video ID: {video_id}. Check status in 3-8 minutes."
            })
            
        except Exception as e:
            logger.error(f"Video generation failed: {e}", exc_info=True)
            return self.fail_response(f"Video generation failed: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "check_argil_video_status",
            "description": "Check the status of a video that is being generated",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "The ID of the video to check status for"
                    }
                },
                "required": ["video_id"]
            }
        }
    })
    @usage_example("""
    # Check status of a video being generated
    check_argil_video_status(video_id="3c90c3cc-0d44-4b50-8888-8dd25736052a")
    """)
    async def check_argil_video_status(self, video_id: str) -> ToolResult:
        """Check the status of a video that is being generated."""
        try:
            if not self.api_key:
                return self.fail_response("ARGIL_API_KEY not configured")
                
            logger.info(f"Checking status for Argil video: {video_id}")
            
            status_response = await self._make_argil_request("GET", f"/videos/{video_id}")
            if "error" in status_response:
                return self.fail_response(f"Failed to retrieve video status: {status_response}")

            status = status_response.get("status", "UNKNOWN")
            result = {
                "video_id": video_id,
                "status": status,
                "name": status_response.get("name"),
                "created_at": status_response.get("createdAt"),
                "updated_at": status_response.get("updatedAt")
            }
            
            if status == "DONE":
                argil_video_url = status_response.get("videoUrl")
                result["video_url"] = argil_video_url
                if status_response.get("videoUrlSubtitled"):
                    result["video_url_subtitled"] = status_response.get("videoUrlSubtitled")
                
                # Download and save to workspace
                try:
                    if argil_video_url:
                        await self._ensure_sandbox()
                        
                        videos_dir = f"{self.workspace_path}/videos"
                        logger.info(f"Creating videos directory: {videos_dir}")
                        await self.sandbox.fs.create_folder(videos_dir, "755")
                    
                        logger.info(f"Downloading video from Argil URL: {argil_video_url}")
                        async with httpx.AsyncClient() as client:
                            video_response = await client.get(argil_video_url, timeout=60)
                            video_response.raise_for_status()
                            video_bytes = video_response.content
                        
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                        video_name = result["name"] or "argil_video"
                        safe_name = re.sub(r'[^\w\s-]', '', video_name).strip().replace(' ', '_')
                        filename = f"{safe_name}_{video_id[:8]}_{timestamp}.mp4"
                        
                        video_path = f"{videos_dir}/{filename}"
                        await self.sandbox.fs.upload_file(video_bytes, video_path)
                        
                        result["workspace_path"] = f"/workspace/videos/{filename}"
                        
                        # Upload to Pixiomedia
                        upload_url = "https://uplaodpixio-production.up.railway.app/api/upload"
                        files = {'file': (filename, video_bytes, 'video/mp4')}
                        
                        try:
                            async with httpx.AsyncClient(timeout=180.0) as upload_client:
                                upload_response = await upload_client.post(upload_url, files=files)
                                upload_response.raise_for_status()
                                upload_data = upload_response.json()
                                
                                pixio_url = upload_data.get("publicURL")
                                if pixio_url:
                                    result["pixio_video_url"] = f"{pixio_url}?t={timestamp}"
                                    logger.info(f"Video successfully uploaded to Pixiomedia: {pixio_url}")
                        except Exception as upload_error:
                            logger.error(f"Failed to upload to Pixiomedia: {upload_error}")
                            result["upload_error"] = f"Could not upload to Pixiomedia: {str(upload_error)}"
                
                except Exception as e:
                    logger.error(f"Error processing video: {e}", exc_info=True)
                    result["processing_error"] = f"Could not process video: {str(e)}"
            
            message = {
                "DONE": "Video generation completed successfully!",
                "FAILED": "Video generation failed.",
                "PROCESSING": f"Video is currently processing. Check again later.",
                "UNKNOWN": f"Video status is unknown: {status}"
            }.get(status, f"Video is in '{status}' status.")
            
            result["message"] = message
            return self.success_response(result)
            
        except Exception as e:
            logger.error(f"Failed to check video status: {e}", exc_info=True)
            return self.fail_response(f"Failed to check video status: {str(e)}")