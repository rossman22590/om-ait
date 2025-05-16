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
                    
                    # Generate filename based on timestamp
                    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"image_{timestamp}.png"
                    
                    # Create images directory if it doesn't exist
                    await self._ensure_sandbox()
                    images_dir = f"{self.workspace_path}/images"
                    self.sandbox.fs.create_folder(images_dir, "755")
                    
                    # Save the image to the sandbox
                    image_path = f"{images_dir}/{filename}"
                    self.sandbox.fs.upload_file(image_path, image_bytes)
                    
                    # Simple logging of the save path
                    logging.info(f"Image saved to: {image_path}")
                    
                    # Format like the example in the screenshot
                    # The proper markdown format for this system is just a simple relative path
                    image_rel_path = f"/workspace/images/{filename}"
                    
                    # Include usage information if available (matching the example format)
                    usage_info = ""
                    if "usage" in data:
                        usage = data["usage"]
                        total = usage.get('total_tokens', 'N/A')
                        input_tokens = usage.get('input_tokens', 'N/A')
                        output_tokens = usage.get('output_tokens', 'N/A')
                        usage_info = f"\n\nUsage Information:\n- Total tokens: {total}\n- Input tokens: {input_tokens}\n- Output tokens: {output_tokens}"
                    
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
                    
                    # Upload the image to the external API to get a public URL
                    try:
                        # Convert image bytes to base64 for API upload
                        base64_image = base64.b64encode(image_bytes).decode('utf-8')
                        base64_with_prefix = f"data:image/png;base64,{base64_image}"
                        
                        # Prepare the upload payload
                        upload_payload = {
                            "base64": base64_with_prefix,
                            "fileName": filename,
                            "fileType": "image/png"
                        }
                        
                        # Make the API request to upload the image
                        upload_url = "https://uplaodpixio-production.up.railway.app/api/upload"
                        headers = {"Content-Type": "application/json"}
                        
                        async with httpx.AsyncClient() as client:
                            upload_response = await client.post(upload_url, json=upload_payload, headers=headers)
                            upload_response.raise_for_status()
                            upload_data = upload_response.json()
                            
                            # Get the public URL from the response
                            public_url = upload_data.get("publicURL")
                            logging.info(f"Image uploaded successfully to: {public_url}")
                            
                            # Return the image URL and path in a structured format
                            # This allows the agent to display it as a card in their message
                            return ToolResult(
                                success=True,
                                output=f"Image successfully generated and saved to workspace at: {cleaned_path}\n\nImage URL: {public_url}"
                            )
                    except Exception as e:
                        logging.error(f"Error uploading image to external API: {str(e)}")
                        # Fall back to just returning the path if upload fails
                        return ToolResult(
                            success=True,
                            output=f"Image successfully generated and saved to: {cleaned_path}"
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