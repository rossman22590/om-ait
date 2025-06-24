from agentpress.tool import Tool, ToolResult, openapi_schema, xml_schema
from sandbox.tool_base import SandboxToolsBase
from agentpress.thread_manager import ThreadManager
import httpx
import json
import base64
import os
import logging
from dotenv import load_dotenv
from utils.config import config
import re
import datetime

class SandboxImageGenTool(SandboxToolsBase):
    """Tool for generating images from text descriptions using OpenAI's image generation API."""

    def __init__(self, project_id: str, thread_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        # Store thread ID for potential use
        self.thread_id = thread_id
        # Make thread_manager accessible within the tool instance
        self.thread_manager = thread_manager
        
        # Load environment variables
        load_dotenv()
        
        # Use dedicated IMAGE_1_API_KEY from config
        self.openai_api_key = config.IMAGE_1_API_KEY if hasattr(config, 'IMAGE_1_API_KEY') else config.OPENAI_API_KEY
        
        if not self.openai_api_key:
            error_msg = "IMAGE_1_API_KEY or OPENAI_API_KEY not found in configuration"
            logging.error(f"⚠️ {error_msg}")
            raise ValueError(error_msg)
            
        self.api_url = "https://api.openai.com/v1/images/generations"
        
    @xml_schema(
        tag_name="generate-image",
        mappings=[
            # Content is just a single mapping with node_type="content"
            {"param_name": "prompt", "node_type": "content", "path": ".", "required": False},
            # Attributes use node_type="attribute"
            {"param_name": "prompt", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "model", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "size", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "quality", "node_type": "attribute", "path": ".", "required": False}
        ],
        example='''
    <!-- Generate an image using OpenAI's gpt-image-1 model -->
    <generate-image prompt="A cute baby sea otter floating on its back"></generate-image>
    
    <!-- Or with the prompt as content -->
    <generate-image>
    A photorealistic portrait of a majestic cat with soft fur, striking eyes, and whiskers.
    </generate-image>
    '''
    )
    async def generate_image(self, prompt=None, model="gpt-image-1", size="1024x1024", quality="high", _xml_chunk=None) -> ToolResult:
        logging.info(f"SandboxImageGenTool.generate_image called")
        logging.info(f"Raw parameters: prompt={prompt}, model={model}, size={size}, quality={quality}")
        logging.info(f"XML chunk: {_xml_chunk}")
        
        # Always try extraction even if prompt is provided (for debugging)
        if _xml_chunk is not None:
            try:
                # First check for attribute
                attr_match = re.search(r'prompt=["\']([^"\']*)["\']', _xml_chunk)
                if attr_match:
                    extracted_attr = attr_match.group(1).strip()
                    logging.info(f"Found prompt in attribute: {extracted_attr[:50]}...")
                    # Use attribute value if we don't have a prompt yet
                    if prompt is None:
                        prompt = extracted_attr
                
                # Then check for content between tags
                content_match = re.search(r'<generate-image[^>]*>(.*?)</generate-image>', _xml_chunk, re.DOTALL)
                if content_match and content_match.group(1).strip():
                    extracted_content = content_match.group(1).strip()
                    logging.info(f"Found prompt in content: {extracted_content[:50]}...")
                    # Use content if we don't have a prompt yet
                    if prompt is None:
                        prompt = extracted_content
                    # If we found both attribute and content, attribute takes priority
                    elif attr_match:
                        logging.info("Using attribute prompt instead of content prompt")
            except Exception as e:
                logging.error(f"Error extracting prompt from XML: {str(e)}")
                
        logging.info(f"Final prompt after extraction: {prompt[:50]}..." if prompt else "No prompt found!")
        
        # Validate prompt
        if not prompt:
            return ToolResult(success=False, output="Error: No prompt provided for image generation")
            
        try:
            # Always force model to gpt-image-1
            model = "gpt-image-1"
            
            # Build request payload exactly matching the example
            payload = {
                "model": model,
                "prompt": prompt,
                "n": 1,
                "size": size,
                "quality": "high"  # Always use high quality
            }
            
            logging.info(f"Generating image with prompt: {prompt[:100]}...")
            
            # Make the API request
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                }
                
                try:
                    # Make API call with 2-minute timeout
                    response = await client.post(
                        self.api_url,
                        json=payload,
                        headers=headers,
                        timeout=120
                    )
                    
                    # Check for HTTP errors
                    if response.status_code >= 400:
                        response.raise_for_status()
                    
                    # Parse response
                    data = response.json()
                    
                    # Validate response format
                    if "data" not in data or len(data["data"]) == 0:
                        return ToolResult(
                            success=False,
                            output=f"Error: Invalid response from OpenAI API. The image generation may have failed."
                        )
                    
                    # Get image URL from response
                    image_bytes = None
                    if "url" in data["data"][0]:
                        # URL-based response
                        image_url = data["data"][0]["url"]
                        logging.info(f"Image URL received: {image_url}")
                        
                        # Download the image
                        logging.info(f"Downloading image from URL")
                        async with httpx.AsyncClient() as img_client:
                            img_response = await img_client.get(image_url, timeout=60)
                            img_response.raise_for_status()
                            image_bytes = img_response.content
                    elif "b64_json" in data["data"][0]:
                        # Base64 response (fallback)
                        logging.info(f"Base64 image data received")
                        image_b64 = data["data"][0]["b64_json"]
                        image_bytes = base64.b64decode(image_b64)
                    else:
                        return ToolResult(
                            success=False,
                            output=f"Error: No image URL or base64 data found in the API response."
                        )
                    
                    # Validate image_bytes
                    if not image_bytes or not isinstance(image_bytes, bytes):
                        return ToolResult(
                            success=False,
                            output="Error: Failed to download or decode image data"
                        )
                    
                    # Generate filename based on thread ID and timestamp with microseconds for uniqueness
                    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    filename = f"image_{self.thread_id}_{timestamp}.png"
                    
                    # Create images directory if it doesn't exist
                    await self._ensure_sandbox()
                    images_dir = f"{self.workspace_path}/images"
                    self.sandbox.fs.create_folder(images_dir, "755")
                    
                    # Save the image to the sandbox - CRITICAL FIX: content first, path second
                    image_path = f"{images_dir}/{filename}"
                    try:
                        self.sandbox.fs.upload_file(image_bytes, image_path)
                        logging.info(f"Image saved to: {image_path}")
                    except Exception as e:
                        logging.error(f"Error saving image to sandbox: {str(e)}")
                        return ToolResult(
                            success=False,
                            output=f"Error saving image to workspace: {str(e)}"
                        )
                    
                    # Format the path for direct markdown display
                    cleaned_path = f"images/{filename}"
                    
                    # Log the path for debugging
                    logging.info(f"Image saved to path: {cleaned_path}")
                    
                    # Double check that the image is saved to workspace
                    try:
                        file_info = self.sandbox.fs.get_file_info(image_path)
                        logging.info(f"Confirmed image saved to workspace: {image_path}, size: {file_info.size} bytes")
                    except Exception as e:
                        logging.error(f"Error verifying image in workspace: {str(e)}")
                    
                    # Upload the image to Pixio media using multipart/form-data
                    try:
                        # Ensure we have bytes data for file upload
                        if not isinstance(image_bytes, bytes):
                            logging.error(f"Image bytes is not bytes type: {type(image_bytes)}")
                            raise ValueError("Image data is not in bytes format")
                        
                        # Make the API request to upload the image using multipart/form-data
                        upload_url = "https://uplaodpixio-production.up.railway.app/api/upload"
                        
                        # Prepare the file for multipart upload
                        files = {
                            'file': (filename, image_bytes, 'image/png')
                        }
                        
                        # Set headers for multipart upload (let httpx handle Content-Type)
                        upload_headers = {
                            'accept': 'application/json'
                        }
                        
                        logging.info(f"Uploading image to Pixio media using multipart/form-data")
                        logging.info(f"File size: {len(image_bytes)} bytes, filename: {filename}")
                        
                        async with httpx.AsyncClient(timeout=60.0) as upload_client:
                            upload_response = await upload_client.post(
                                upload_url, 
                                files=files, 
                                headers=upload_headers
                            )
                            upload_response.raise_for_status()
                            upload_data = upload_response.json()
                            
                            logging.info(f"Upload response status: {upload_response.status_code}")
                            logging.info(f"Upload response: {upload_data}")
                            
                            # Get the public URL from the response
                            public_url = upload_data.get("publicURL")
                            if not public_url:
                                logging.warning(f"No publicURL in response: {upload_data}")
                                raise ValueError("No public URL returned from upload service")
                                
                            logging.info(f"Image uploaded successfully to Pixio media: {public_url}")
                            
                            # Return the image URL and path in a structured format
                            return ToolResult(
                                success=True,
                                output=f"Image successfully generated and saved to workspace at: {cleaned_path}\n\nImage URL: {public_url}?t={timestamp}"
                            )
                    except Exception as e:
                        logging.error(f"Error uploading image to Pixio media: {str(e)}")
                        # Fall back to just returning the path if upload fails
                        return ToolResult(
                            success=True,
                            output=f"Image successfully generated and saved to workspace at: {cleaned_path}?t={timestamp}\n\nNote: External upload failed, but image is available in workspace."
                        )
                    
                except httpx.HTTPStatusError as e:
                    error_msg = f"HTTP error {e.response.status_code}"
                    try:
                        error_data = e.response.json()
                        if "error" in error_data and "message" in error_data["error"]:
                            error_msg = f"OpenAI API error: {error_data['error']['message']}"
                    except:
                        pass
                    return ToolResult(success=False, output=f"Failed to generate image: {error_msg}")
                    
                except Exception as e:
                    logging.error(f"Error during API call: {str(e)}")
                    return ToolResult(success=False, output=f"Error generating image: {str(e)}")
                    
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return ToolResult(success=False, output=f"Unexpected error: {str(e)}")
            
    def get_xml_schemas(self):
        """Return the XML schemas for this tool."""
        return [
            {
                "tag_name": "generate-image",
                "mappings": [
                    # Content is just a single mapping with node_type="content"
                    {"param_name": "prompt", "node_type": "content", "path": ".", "required": False},
                    # Attributes use node_type="attribute"
                    {"param_name": "prompt", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "model", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "size", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "quality", "node_type": "attribute", "path": ".", "required": False}
                ],
                "method_name": "generate_image"
            }
        ]