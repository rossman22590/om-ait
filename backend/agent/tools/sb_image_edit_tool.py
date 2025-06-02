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
import io
from PIL import Image
import numpy as np

class SandboxImageEditTool(SandboxToolsBase):
    """Tool for editing images using OpenAI's image editing API."""

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
            
        self.api_url = "https://api.openai.com/v1/images/edits"
        
    @xml_schema(
        tag_name="edit-image",
        mappings=[
            # Content is just a single mapping with node_type="content"
            {"param_name": "prompt", "node_type": "content", "path": ".", "required": False},
            # Attributes use node_type="attribute"
            {"param_name": "prompt", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "model", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "size", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "quality", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "background", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "mask", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "images", "node_type": "attribute", "path": ".", "required": True},
        ],
        example='''
    <!-- Edit images using OpenAI's gpt-image-1 model -->
    <edit-image images="image1.png,image2.png,image3.png" prompt="Combine these product images into a gift basket"></edit-image>
    
    <!-- Or with the prompt as content -->
    <edit-image images="soap.png,bath-bomb.png,incense-kit.png">
    Create a photorealistic gift basket containing all these items with a ribbon labeled "Relax & Unwind"
    </edit-image>
    
    <!-- With additional parameters -->
    <edit-image 
      images="product1.png,product2.png" 
      mask="mask.png"
      quality="high" 
      background="transparent"
      size="1536x1024">
    Create a professional product showcase with detailed lighting
    </edit-image>
    '''
    )
    async def edit_image(self, prompt=None, model="gpt-image-1", size="1024x1024", quality="high", background="auto", mask=None, images=None, _xml_chunk=None) -> ToolResult:
        logging.info(f"SandboxImageEditTool.edit_image called")
        logging.info(f"Raw parameters: prompt={prompt}, model={model}, size={size}, images={images}")
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
                content_match = re.search(r'<edit-image[^>]*>(.*?)</edit-image>', _xml_chunk, re.DOTALL)
                if content_match and content_match.group(1).strip():
                    extracted_content = content_match.group(1).strip()
                    logging.info(f"Found prompt in content: {extracted_content[:50]}...")
                    # Use content if we don't have a prompt yet
                    if prompt is None:
                        prompt = extracted_content
                    # If we found both attribute and content, attribute takes priority
                    elif attr_match:
                        logging.info("Using attribute prompt instead of content prompt")
                        
                # Extract images attribute
                images_match = re.search(r'images=["\']([^"\']*)["\']', _xml_chunk)
                if images_match:
                    extracted_images = images_match.group(1).strip()
                    logging.info(f"Found images in attribute: {extracted_images}")
                    if images is None:
                        images = extracted_images
                        
                # Extract mask attribute if present
                mask_match = re.search(r'mask=["\']([^"\']*)["\']', _xml_chunk)
                if mask_match:
                    extracted_mask = mask_match.group(1).strip()
                    logging.info(f"Found mask in attribute: {extracted_mask}")
                    if mask is None:
                        mask = extracted_mask
                        
                # Extract quality attribute if present
                quality_match = re.search(r'quality=["\']([^"\']*)["\']', _xml_chunk)
                if quality_match:
                    extracted_quality = quality_match.group(1).strip()
                    logging.info(f"Found quality in attribute: {extracted_quality}")
                    quality = extracted_quality
                    
                # Extract background attribute if present
                background_match = re.search(r'background=["\']([^"\']*)["\']', _xml_chunk)
                if background_match:
                    extracted_background = background_match.group(1).strip()
                    logging.info(f"Found background in attribute: {extracted_background}")
                    background = extracted_background
                
            except Exception as e:
                logging.error(f"Error extracting data from XML: {str(e)}")
                
        logging.info(f"Final prompt after extraction: {prompt[:50]}..." if prompt else "No prompt found!")
        logging.info(f"Final images after extraction: {images}" if images else "No images found!")
        
        # Validate prompt and images
        if not prompt:
            return ToolResult(success=False, output="Error: No prompt provided for image editing")
            
        if not images:
            return ToolResult(success=False, output="Error: No images provided for editing")
            
        # Parse the images list
        image_paths = [img.strip() for img in images.split(',')]
        if not image_paths:
            return ToolResult(success=False, output="Error: No valid image paths provided")
            
        try:
            # Always force model to gpt-image-1
            model = "gpt-image-1"
            
            # Ensure workspace is ready
            await self._ensure_sandbox()
            
            # Load each image from the workspace
            image_bytes_list = []
            image_objects = []
            for img_path in image_paths:
                # Check if it's a relative path and prepend workspace path if needed
                if not img_path.startswith('/'):
                    full_path = f"{self.workspace_path}/{img_path}"
                else:
                    # Remove leading slash for sandbox path
                    path_without_slash = img_path[1:] if img_path.startswith('/') else img_path
                    full_path = f"{self.workspace_path}/{path_without_slash}"
                
                logging.info(f"Loading image from: {full_path}")
                try:
                    # Try to get the file from the sandbox
                    file_content = self.sandbox.fs.download_file(full_path)
                    image_bytes_list.append(file_content)
                    
                    # Also open as PIL Image for potential collage creation
                    img = Image.open(io.BytesIO(file_content))
                    image_objects.append(img)
                except Exception as e:
                    logging.error(f"Error loading image {img_path}: {str(e)}")
                    return ToolResult(success=False, output=f"Error loading image {img_path}: {str(e)}")
            
            if not image_bytes_list:
                return ToolResult(success=False, output="Error: Failed to load any valid images")
                
            logging.info(f"Successfully loaded {len(image_bytes_list)} images")
            
            # Log the number of images being processed
            logging.info(f"Processing {len(image_bytes_list)} images for editing")
            
            # Check if mask is specified and load it
            mask_bytes = None
            if mask:
                try:
                    # Check if it's a relative path and prepend workspace path if needed
                    if not mask.startswith('/'):
                        mask_path = f"{self.workspace_path}/{mask}"
                    else:
                        # Remove leading slash for sandbox path
                        path_without_slash = mask[1:] if mask.startswith('/') else mask
                        mask_path = f"{self.workspace_path}/{path_without_slash}"
                    
                    logging.info(f"Loading mask from: {mask_path}")
                    try:
                        # Try to get the file from the sandbox
                        mask_bytes = self.sandbox.fs.download_file(mask_path)
                        logging.info(f"Successfully loaded mask of size {len(mask_bytes)/1024:.1f} KB")
                    except Exception as e:
                        logging.error(f"Error loading mask {mask}: {str(e)}")
                        return ToolResult(success=False, output=f"Error loading mask {mask}: {str(e)}")
                except Exception as e:
                    logging.error(f"Error processing mask: {str(e)}")
                    return ToolResult(success=False, output=f"Error processing mask: {str(e)}")
            
            # Make the API request using the proper format for image edit API
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.openai_api_key}"
                }
                
                # Create form data with the required format for the image edit API
                form_data = {
                    "model": model,
                    "prompt": prompt,
                    "n": 1,
                    "size": size,
                }
                
                # Add optional parameters if they're not set to default values
                if quality != "auto":
                    form_data["quality"] = quality
                
                if background != "auto":
                    form_data["background"] = background
                
                # The OpenAI image edit API for gpt-image-1 model supports multiple images
                # Format the files parameter to include all images
                files = []
                for i, img_bytes in enumerate(image_bytes_list):
                    # Use array notation for multiple images: 'image[]' instead of 'image'
                    files.append(("image[]", (f"image{i}.png", img_bytes, "image/png")))
                
                # Add mask file if provided
                if mask_bytes:
                    files.append(("mask", ("mask.png", mask_bytes, "image/png")))
                
                try:
                    logging.info(f"Making API request to {self.api_url} with prompt: {prompt[:50]}...")
                    logging.info(f"Using {len(image_bytes_list)} images for editing with gpt-image-1 model")
                    
                    # Make API call with 2-minute timeout
                    response = await client.post(
                        self.api_url,
                        data=form_data,
                        files=files,
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
                            output=f"Error: Invalid response from OpenAI API. The image editing may have failed."
                        )
                    
                    # Get image data from response
                    if "url" in data["data"][0]:
                        # URL-based response
                        image_url = data["data"][0]["url"]
                        logging.info(f"Image URL received: {image_url}")
                        
                        # Download the image
                        logging.info(f"Downloading edited image from URL")
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
                    
                    # Generate filename based on thread ID and timestamp with microseconds for uniqueness
                    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    filename = f"edited_image_{self.thread_id}_{timestamp}.png"
                    
                    # Create images directory if it doesn't exist
                    images_dir = f"{self.workspace_path}/images"
                    self.sandbox.fs.create_folder(images_dir, "755")
                    
                    # Save the edited image to the sandbox
                    image_path = f"{images_dir}/{filename}"
                    self.sandbox.fs.upload_file(image_path, image_bytes)
                    
                    # Simple logging of the save path
                    logging.info(f"Edited image saved to: {image_path}")
                    
                    # The proper markdown format for this system is just a simple relative path
                    image_rel_path = f"/workspace/images/{filename}"
                    
                    # Include usage information if available
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
                    logging.info(f"Edited image saved to path: {cleaned_path}")
                    
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
                            logging.info(f"Edited image uploaded successfully to: {public_url}")
                            
                            # Return the image URL and path in a structured format
                            return ToolResult(
                                success=True,
                                output=f"Images successfully edited and saved to workspace at: {cleaned_path}\n\nImage URL: {public_url}?t={timestamp}"
                            )
                    except Exception as e:
                        logging.error(f"Error uploading edited image to external API: {str(e)}")
                        # Fall back to just returning the path if upload fails
                        return ToolResult(
                            success=True,
                            output=f"Images successfully edited and saved to: {cleaned_path}?t={timestamp}"
                        )
                    
                except httpx.HTTPStatusError as e:
                    error_msg = f"HTTP error {e.response.status_code}"
                    try:
                        error_data = e.response.json()
                        if "error" in error_data and "message" in error_data["error"]:
                            error_msg = f"OpenAI API error: {error_data['error']['message']}"
                    except:
                        pass
                    return ToolResult(success=False, output=f"Failed to edit images: {error_msg}")
                    
                except Exception as e:
                    logging.error(f"Error during API call: {str(e)}")
                    return ToolResult(success=False, output=f"Error editing images: {str(e)}")
                    
        except Exception as e:
            logging.error(f"Unexpected error: {str(e)}")
            return ToolResult(success=False, output=f"Unexpected error: {str(e)}")
            

    
    def get_xml_schemas(self):
        """Return the XML schemas for this tool."""
        return [
            {
                "tag_name": "edit-image",
                "mappings": [
                    # Content is just a single mapping with node_type="content"
                    {"param_name": "prompt", "node_type": "content", "path": ".", "required": False},
                    # Attributes use node_type="attribute"
                    {"param_name": "prompt", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "model", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "size", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "quality", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "background", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "mask", "node_type": "attribute", "path": ".", "required": False},
                    {"param_name": "images", "node_type": "attribute", "path": ".", "required": True}
                ],
                "method_name": "edit_image"
            }
        ]
