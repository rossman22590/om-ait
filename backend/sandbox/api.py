import os
import urllib.parse
import uuid
from typing import Optional
import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter, Form, Depends, Request
from fastapi.responses import Response
from pydantic import BaseModel

from sandbox.sandbox import get_or_start_sandbox, SessionExecuteRequest
from utils.logger import logger
from utils.auth_utils import get_optional_user_id
from services.supabase import DBConnection

# Initialize shared resources
router = APIRouter(tags=["sandbox"])
db = None

def initialize(_db: DBConnection):
    """Initialize the sandbox API with resources from the main API."""
    global db
    db = _db
    logger.info("Initialized sandbox API with database connection")

class FileInfo(BaseModel):
    """Model for file information"""
    name: str
    path: str
    is_dir: bool
    size: int
    mod_time: str
    permissions: Optional[str] = None
    
    # Add a get method to allow FileInfo to be used like a dictionary
    # This fixes the 'FileInfo' object has no attribute 'get' error
    def get(self, key, default=None):
        """Allow FileInfo to be used like a dictionary, which fixes issues in the Daytona SDK"""
        return getattr(self, key, default)

def normalize_path(path: str) -> str:
    """
    Normalize a path to ensure proper UTF-8 encoding and handling.
    
    Args:
        path: The file path, potentially containing URL-encoded characters
        
    Returns:
        Normalized path with proper UTF-8 encoding
    """
    try:
        # First, ensure the path is properly URL-decoded
        decoded_path = urllib.parse.unquote(path)
        
        # Handle Unicode escape sequences like \u0308
        try:
            # Replace Python-style Unicode escapes (\u0308) with actual characters
            # This handles cases where the Unicode escape sequence is part of the URL
            import re
            unicode_pattern = re.compile(r'\\u([0-9a-fA-F]{4})')
            
            def replace_unicode(match):
                hex_val = match.group(1)
                return chr(int(hex_val, 16))
            
            decoded_path = unicode_pattern.sub(replace_unicode, decoded_path)
        except Exception as unicode_err:
            logger.warning(f"Error processing Unicode escapes in path '{path}': {str(unicode_err)}")
        
        logger.debug(f"Normalized path from '{path}' to '{decoded_path}'")
        return decoded_path
    except Exception as e:
        logger.error(f"Error normalizing path '{path}': {str(e)}")
        return path  # Return original path if decoding fails

async def verify_sandbox_access(client, sandbox_id: str, user_id: Optional[str] = None):
    """
    Verify that a user has access to a specific sandbox based on account membership.
    
    Args:
        client: The Supabase client
        sandbox_id: The sandbox ID to check access for
        user_id: The user ID to check permissions for. Can be None for public resource access.
        
    Returns:
        dict: Project data containing sandbox information
        
    Raises:
        HTTPException: If the user doesn't have access to the sandbox or sandbox doesn't exist
    """
    # Find the project that owns this sandbox
    project_result = await client.table('projects').select('*').filter('sandbox->>id', 'eq', sandbox_id).execute()
    
    if not project_result.data or len(project_result.data) == 0:
        raise HTTPException(status_code=404, detail="Sandbox not found")
    
    project_data = project_result.data[0]

    if project_data.get('is_public'):
        return project_data
    
    # For private projects, we must have a user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required for this resource")
    
    account_id = project_data.get('account_id')
    
    # Verify account membership
    if account_id:
        account_user_result = await client.schema('basejump').from_('account_user').select('account_role').eq('user_id', user_id).eq('account_id', account_id).execute()
        if account_user_result.data and len(account_user_result.data) > 0:
            return project_data
    
    raise HTTPException(status_code=403, detail="Not authorized to access this sandbox")

async def get_sandbox_by_id_safely(client, sandbox_id: str):
    """
    Safely retrieve a sandbox object by its ID, using the project that owns it.
    
    Args:
        client: The Supabase client
        sandbox_id: The sandbox ID to retrieve
    
    Returns:
        Sandbox: The sandbox object
        
    Raises:
        HTTPException: If the sandbox doesn't exist or can't be retrieved
    """
    # Find the project that owns this sandbox
    project_result = await client.table('projects').select('project_id').filter('sandbox->>id', 'eq', sandbox_id).execute()
    
    if not project_result.data or len(project_result.data) == 0:
        logger.error(f"No project found for sandbox ID: {sandbox_id}")
        raise HTTPException(status_code=404, detail="Sandbox not found - no project owns this sandbox ID")
    
    # project_id = project_result.data[0]['project_id']
    # logger.debug(f"Found project {project_id} for sandbox {sandbox_id}")
    
    try:
        # Get the sandbox
        sandbox = await get_or_start_sandbox(sandbox_id)
        # Extract just the sandbox object from the tuple (sandbox, sandbox_id, sandbox_pass)
        # sandbox = sandbox_tuple[0]
            
        return sandbox
    except Exception as e:
        logger.error(f"Error retrieving sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sandbox: {str(e)}")

@router.post("/sandboxes/{sandbox_id}/files")
async def create_file(
    sandbox_id: str, 
    path: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Create a file in the sandbox using direct file upload"""
    # Normalize the path to handle UTF-8 encoding correctly
    path = normalize_path(path)
    
    logger.info(f"Received file upload request for sandbox {sandbox_id}, path: {path}, user_id: {user_id}")
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get sandbox using the safer method
        sandbox = await get_sandbox_by_id_safely(client, sandbox_id)
        
        # Read file content directly from the uploaded file
        content = await file.read()
        
        # Create file using raw binary content
        sandbox.fs.upload_file(path, content)
        logger.info(f"File created at {path} in sandbox {sandbox_id}")
        
        return {"status": "success", "created": True, "path": path}
    except Exception as e:
        logger.error(f"Error creating file in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sandboxes/{sandbox_id}/files")
async def list_files(
    sandbox_id: str, 
    path: str,
    request: Request = None,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """List files and directories at the specified path"""
    # Normalize the path to handle UTF-8 encoding correctly
    path = normalize_path(path)
    
    logger.info(f"Received list files request for sandbox {sandbox_id}, path: {path}, user_id: {user_id}")
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get sandbox using the safer method
        sandbox = await get_sandbox_by_id_safely(client, sandbox_id)
        
        # List files
        files = sandbox.fs.list_files(path)
        result = []
        
        for file in files:
            # Convert file information to our model
            # Ensure forward slashes are used for paths, regardless of OS
            full_path = f"{path.rstrip('/')}/{file.name}" if path != '/' else f"/{file.name}"
            file_info = FileInfo(
                name=file.name,
                path=full_path, # Use the constructed path
                is_dir=file.is_dir,
                size=file.size,
                mod_time=str(file.mod_time),
                permissions=getattr(file, 'permissions', None)
            )
            result.append(file_info)
        
        logger.info(f"Successfully listed {len(result)} files in sandbox {sandbox_id}")
        return {"files": [file.dict() for file in result]}
    except Exception as e:
        logger.error(f"Error listing files in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sandboxes/{sandbox_id}/files/content")
async def read_file(
    sandbox_id: str, 
    path: str,
    request: Request = None,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Read a file from the sandbox"""
    # Normalize the path to handle UTF-8 encoding correctly
    original_path = path
    path = normalize_path(path)
    
    logger.info(f"Received file read request for sandbox {sandbox_id}, path: {path}, user_id: {user_id}")
    if original_path != path:
        logger.info(f"Normalized path from '{original_path}' to '{path}'")
    
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get sandbox using the safer method
        sandbox = await get_sandbox_by_id_safely(client, sandbox_id)
        
        # Verify the file exists first
        try:
            filename = os.path.basename(path)
            parent_dir = os.path.dirname(path)
            
            # List files in the parent directory to check if the file exists
            files_in_dir = sandbox.fs.list_files(parent_dir)
            
            # Look for the target file with exact name match
            file_exists = any(file.name == filename for file in files_in_dir)
            
            if not file_exists:
                logger.warning(f"File not found: {path} in sandbox {sandbox_id}")
                
                # Try to find similar files to help diagnose
                close_matches = [file.name for file in files_in_dir if filename.lower() in file.name.lower()]
                error_detail = f"File '{filename}' not found in directory '{parent_dir}'"
                
                if close_matches:
                    error_detail += f". Similar files in the directory: {', '.join(close_matches)}"
                
                raise HTTPException(status_code=404, detail=error_detail)
        except Exception as list_err:
            # If we can't list files, continue with the download attempt
            logger.warning(f"Error checking if file exists: {str(list_err)}")
        
        # Read file
        try:
            content = sandbox.fs.download_file(path)
        except Exception as download_err:
            logger.error(f"Error downloading file {path} from sandbox {sandbox_id}: {str(download_err)}")
            raise HTTPException(
                status_code=404, 
                detail=f"Failed to download file: {str(download_err)}"
            )
        
        # Return a Response object with the content directly
        filename = os.path.basename(path)
        logger.info(f"Successfully read file {filename} from sandbox {sandbox_id}")
        
        # Ensure proper encoding by explicitly using UTF-8 for the filename in Content-Disposition header
        # This applies RFC 5987 encoding for the filename to support non-ASCII characters
        encoded_filename = filename.encode('utf-8').decode('latin-1')
        content_disposition = f"attachment; filename*=UTF-8''{encoded_filename}"
        
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": content_disposition}
        )
    except HTTPException:
        # Re-raise HTTP exceptions without wrapping
        raise
    except Exception as e:
        logger.error(f"Error reading file in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Should happen on server-side fully
@router.delete("/sandboxes/{sandbox_id}/files")
async def delete_file(
    sandbox_id: str, 
    path: str,
    request: Request = None,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Delete a file or directory from the sandbox"""
    logger.info(f"Received delete file request for sandbox {sandbox_id}, path: {path}, user_id: {user_id}")
    client = await db.client
    
    # Verify access to the sandbox
    project_data = await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get the sandbox object
        sandbox = await get_sandbox_by_id_safely(client, sandbox_id)
        
        # Normalize the path
        path = normalize_path(path)
        logger.info(f"Normalized path for deletion: {path}")
        
        try:
            # Delete the file using the fs module
            sandbox.fs.delete_file(path)
            logger.info(f"Successfully deleted file/folder {path} from sandbox {sandbox_id}")
            
        except AttributeError as attr_error:
            # If we're still getting a FileInfo attribute error, try the fallback approach
            if "'FileInfo' object has no attribute" in str(attr_error):
                logger.warning(f"Falling back to shell command for deletion due to FileInfo error: {attr_error}")
                
                # Use shell commands as a fallback
                from sandbox.sandbox import SessionExecuteRequest
                import uuid
                
                # Create a unique session ID for this delete operation
                session_id = f"del_{uuid.uuid4().hex[:8]}"
                
                try:
                    # Create a shell session
                    sandbox.process.create_session(session_id)
                    
                    # Execute the delete command
                    delete_cmd = f"rm -rf '{path}' 2>/dev/null || true"
                    sandbox.process.execute_session_command(session_id, SessionExecuteRequest(command=delete_cmd))
                    
                    # Close the session
                    sandbox.process.execute_session_command(session_id, SessionExecuteRequest(command="exit"))
                    logger.info(f"Successfully deleted via shell command: {path}")
                except Exception as shell_error:
                    logger.error(f"Shell command fallback failed: {str(shell_error)}")
                    raise HTTPException(status_code=500, detail=f"Shell deletion error: {str(shell_error)}")       
            else:
                # Re-raise if it's not the FileInfo error we're handling
                raise
        
        return {"status": "success", "message": "File deleted successfully"}
        
    except HTTPException as http_error:
        # Re-raise HTTP exceptions
        raise http_error
    except Exception as e:
        logger.error(f"Error deleting file in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_or_create_project_sandbox(client, project_id: str):
    """
    Get or create a sandbox for a project.
    
    Args:
        client: The Supabase client
        project_id: The project ID to get or create a sandbox for
        
    Returns:
        tuple: (sandbox_object, sandbox_id, sandbox_password)
        
    Raises:
        HTTPException: If there's an error creating or retrieving the sandbox
    """
    try:
        # Check if project already has a sandbox
        project_result = await client.table('projects').select('*').eq('project_id', project_id).execute()
        
        if not project_result.data or len(project_result.data) == 0:
            raise HTTPException(status_code=404, detail="Project not found")
            
        project_data = project_result.data[0]
        sandbox_info = project_data.get('sandbox', {})
        
        # If sandbox exists, return it
        if sandbox_info and sandbox_info.get('id'):
            sandbox_id = sandbox_info['id']
            sandbox_pass = sandbox_info.get('pass', '')
            
            # Get the sandbox object
            sandbox = await get_or_start_sandbox(sandbox_id)
            return sandbox, sandbox_id, sandbox_pass
        
        # Create a new sandbox if one doesn't exist
        logger.info(f"Creating new sandbox for project {project_id}")
        
        # Generate a unique ID for the sandbox
        sandbox_id = str(uuid.uuid4())
        sandbox_pass = str(uuid.uuid4())[:8]  # Use first 8 chars of UUID as password
        
        # Create the sandbox
        sandbox = await get_or_start_sandbox(sandbox_id)
        
        # Update the project with the new sandbox information
        now = datetime.datetime.utcnow().isoformat()
        sandbox_data = {
            "id": sandbox_id,
            "pass": sandbox_pass,
            "created_at": now
        }
        
        await client.table('projects').update({"sandbox": sandbox_data, "updated_at": now}).eq('project_id', project_id).execute()
        
        logger.info(f"Created new sandbox {sandbox_id} for project {project_id}")
        return sandbox, sandbox_id, sandbox_pass
        
    except Exception as e:
        logger.error(f"Error in get_or_create_project_sandbox for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating or retrieving sandbox: {str(e)}")

@router.post("/project/{project_id}/sandbox/ensure-active")
async def ensure_project_sandbox_active(
    project_id: str,
    request: Request = None,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Ensure that a project's sandbox is active and running.
    Checks the sandbox status and starts it if it's not running.
    """
    logger.info(f"Received ensure sandbox active request for project {project_id}, user_id: {user_id}")
    client = await db.client
    
    # Find the project and sandbox information
    project_result = await client.table('projects').select('*').eq('project_id', project_id).execute()
    
    if not project_result.data or len(project_result.data) == 0:
        logger.error(f"Project not found: {project_id}")
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = project_result.data[0]
    
    # For public projects, no authentication is needed
    if not project_data.get('is_public'):
        # For private projects, we must have a user_id
        if not user_id:
            logger.error(f"Authentication required for private project {project_id}")
            raise HTTPException(status_code=401, detail="Authentication required for this resource")
            
        account_id = project_data.get('account_id')
        
        # Verify account membership
        if account_id:
            account_user_result = await client.schema('basejump').from_('account_user').select('account_role').eq('user_id', user_id).eq('account_id', account_id).execute()
            if not (account_user_result.data and len(account_user_result.data) > 0):
                logger.error(f"User {user_id} not authorized to access project {project_id}")
                raise HTTPException(status_code=403, detail="Not authorized to access this project")
    
    try:
        # Get or create a sandbox for this project
        sandbox, sandbox_id, sandbox_pass = await get_or_create_project_sandbox(client, project_id)
        
        logger.info(f"Successfully ensured sandbox {sandbox_id} is active for project {project_id}")
        
        return {
            "status": "success", 
            "sandbox_id": sandbox_id,
            "message": "Sandbox is active"
        }
    except Exception as e:
        logger.error(f"Error ensuring sandbox is active for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
