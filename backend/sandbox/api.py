import os
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter, Form, Depends, Request
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

from utils.logger import logger
from utils.auth_utils import get_current_user_id, get_user_id_from_stream_auth, get_optional_user_id
from sandbox.sandbox import get_or_start_sandbox
from services.supabase import DBConnection

# TODO: ADD AUTHORIZATION TO ONLY HAVE ACCESS TO SANDBOXES OF PROJECTS U HAVE ACCESS TO

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

async def verify_sandbox_access(client, sandbox_id: str, user_id: str):
    """
    Verify that a user has access to a specific sandbox based on account membership.
    
    Args:
        client: The Supabase client
        sandbox_id: The sandbox ID to check access for
        user_id: The user ID to check permissions for.
        
    Returns:
        dict: Project data containing sandbox information
        
    Raises:
        HTTPException: If the user doesn't have access to the sandbox or sandbox doesn't exist
    """
    # Find the project that owns this sandbox
    project_result = await client.table('projects').select('*').filter('sandbox->>id', 'eq', sandbox_id).execute()
    
    if not project_result.data or len(project_result.data) == 0:
        logger.error(f"Sandbox not found: {sandbox_id}")
        raise HTTPException(status_code=404, detail="Sandbox not found")
    
    project_data = project_result.data[0]
    account_id = project_data.get('account_id')

    # STRICT SECURITY: Direct account ownership check first (most secure)
    if account_id == user_id:
        logger.info(f"User {user_id} has direct ownership access to project account {account_id}")
        return project_data
    
    # If not direct ownership, check membership in basejump schema ONLY
    try:
        # Skip public schema check entirely and go straight to basejump
        account_user_result = await client.schema('basejump').from_('account_user').select('account_role').eq('user_id', user_id).eq('account_id', account_id).execute()
        
        if account_user_result.data and len(account_user_result.data) > 0:
            logger.info(f"User {user_id} has membership access to sandbox {sandbox_id} (basejump schema)")
            return project_data
    except Exception as e:
        # Log the error but DO NOT bypass security
        logger.error(f"Error checking sandbox account membership: {str(e)}")
        # Always fail closed for security - no development mode bypass
        raise HTTPException(status_code=500, detail="Error verifying sandbox access permissions")
    
    # If we reach here, the user doesn't have access
    logger.warning(f"Security: Denied access for user {user_id} to sandbox {sandbox_id} (account: {account_id})")
    raise HTTPException(status_code=403, detail="Not authorized to access this sandbox")

@router.post("/sandboxes/{sandbox_id}/files")
async def create_file(
    sandbox_id: str, 
    path: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,
    user_id: str = Depends(get_current_user_id)
):
    """Create a file in the sandbox using direct file upload"""
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get or start sandbox instance
        sandbox = await get_or_start_sandbox(sandbox_id)
        
        # Read file content directly from the uploaded file
        content = await file.read()
        
        # Create file using raw binary content
        sandbox.fs.upload_file(path, content)
        logger.info(f"File created at {path} in sandbox {sandbox_id}")
        
        return {"status": "success", "created": True, "path": path}
    except Exception as e:
        logger.error(f"Error creating file in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# For backward compatibility, keep the JSON version too
@router.post("/sandboxes/{sandbox_id}/files/json")
async def create_file_json(
    sandbox_id: str, 
    file_request: dict,
    request: Request = None,
    user_id: str = Depends(get_current_user_id)
):
    """Create a file in the sandbox using JSON (legacy support)"""
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get or start sandbox instance
        sandbox = await get_or_start_sandbox(sandbox_id)
        
        # Get file path and content
        path = file_request.get("path")
        content = file_request.get("content", "")
        
        if not path:
            raise HTTPException(status_code=400, detail="File path is required")
        
        # Convert string content to bytes
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        # Create file
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
    user_id: str = Depends(get_current_user_id)
):
    """List files and directories at the specified path"""
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get or start sandbox instance using the async function
        sandbox = await get_or_start_sandbox(sandbox_id)
        
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
        
        return {"files": [file.dict() for file in result]}
    except Exception as e:
        logger.error(f"Error listing files in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sandboxes/{sandbox_id}/files/content")
async def read_file(
    sandbox_id: str, 
    path: str,
    request: Request = None,
    user_id: str = Depends(get_current_user_id)
):
    """Read a file from the sandbox"""
    client = await db.client
    
    # Verify the user has access to this sandbox
    await verify_sandbox_access(client, sandbox_id, user_id)
    
    try:
        # Get or start sandbox instance using the async function
        sandbox = await get_or_start_sandbox(sandbox_id)
        
        # Read file
        content = sandbox.fs.download_file(path)
        
        # Return a Response object with the content directly
        filename = os.path.basename(path)
        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Error reading file in sandbox {sandbox_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/project/{project_id}/sandbox/ensure-active")
async def ensure_project_sandbox_active(
    project_id: str,
    request: Request = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Ensure that a project's sandbox is active and running.
    Checks the sandbox status and starts it if it's not running.
    """
    client = await db.client
    
    # Find the project and sandbox information
    project_result = await client.table('projects').select('*').eq('project_id', project_id).execute()
    
    if not project_result.data or len(project_result.data) == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_data = project_result.data[0]
    account_id = project_data.get('account_id')
    
    # STRICT SECURITY: Only allow access to your own account's projects
    # This is the most restrictive approach to ensure complete isolation
    if account_id == user_id:
        logger.info(f"User {user_id} has direct ownership access to project {project_id}")
    else:
        logger.warning(f"Security: Denied access for user {user_id} to project {project_id} (account: {account_id})")
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    
    # Check if project has a sandbox
    sandbox_id = project_data.get('sandbox', {}).get('id')
    if not sandbox_id:
        raise HTTPException(status_code=404, detail="No sandbox found for this project")
    
    try:
        # Get or start sandbox instance
        logger.info(f"Ensuring sandbox {sandbox_id} is active for project {project_id}")
        sandbox = await get_or_start_sandbox(sandbox_id)
        
        return {
            "status": "success", 
            "sandbox_id": sandbox_id,
            "message": "Sandbox is active"
        }
    except Exception as e:
        logger.error(f"Error ensuring sandbox is active for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
