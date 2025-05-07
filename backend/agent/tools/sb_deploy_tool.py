import os
from dotenv import load_dotenv
from agentpress.tool import ToolResult, openapi_schema, xml_schema
from sandbox.sandbox import SandboxToolsBase, Sandbox
from utils.files_utils import clean_path
from agentpress.thread_manager import ThreadManager
import json
import re

# Load environment variables
load_dotenv()

class SandboxDeployTool(SandboxToolsBase):
    """Tool for deploying static websites from a Daytona sandbox to Cloudflare Pages."""

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.workspace_path = "/workspace"  # Ensure we're always operating in /workspace
        self.cloudflare_api_token = os.getenv("CLOUDFLARE_API_TOKEN")

    def clean_path(self, path: str) -> str:
        """Clean and normalize a path to be relative to /workspace"""
        return clean_path(path, self.workspace_path)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "deploy",
            "description": "Deploy a static website (HTML+CSS+JS) from a directory in the sandbox to Cloudflare Pages. Only use this tool when permanent deployment to a production environment is needed. The directory path must be relative to /workspace. The website will be deployed to {name}.mymachine.space",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name for the deployment, will be used in the URL as {name}.mymachine.space"
                    },
                    "directory_path": {
                        "type": "string",
                        "description": "Path to the directory containing the static website files to deploy, relative to /workspace (e.g., 'build')"
                    }
                },
                "required": ["name", "directory_path"]
            }
        }
    })
    @xml_schema(
        tag_name="deploy",
        mappings=[
            {"param_name": "name", "node_type": "attribute", "path": "name"},
            {"param_name": "directory_path", "node_type": "attribute", "path": "directory_path"}
        ],
        example='''
        <!-- 
        IMPORTANT: Only use this tool when:
        1. The user explicitly requests permanent deployment to production
        2. You have a complete, ready-to-deploy directory 
        
        NOTE: If the same name is used, it will redeploy to the same project as before
                -->

        <deploy name="my-site" directory_path="website">
        </deploy>
        '''
    )
    async def deploy(self, name: str, directory_path: str) -> ToolResult:
        """
        Deploy a static website (HTML+CSS+JS) from the sandbox to Cloudflare Pages.
        Only use this tool when permanent deployment to a production environment is needed.
        
        Args:
            name: Name for the deployment, will be used in the URL as {name}.mymachine.space
            directory_path: Path to the directory to deploy, relative to /workspace
            
        Returns:
            ToolResult containing:
            - Success: Deployment information including URL
            - Failure: Error message if deployment fails
        """
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            directory_path = self.clean_path(directory_path)
            full_path = f"{self.workspace_path}/{directory_path}"
            
            # Verify the directory exists
            try:
                dir_info = self.sandbox.fs.get_file_info(full_path)
                if not dir_info.is_dir:
                    return self.fail_response(f"'{directory_path}' is not a directory")
            except Exception as e:
                return self.fail_response(f"Directory '{directory_path}' does not exist: {str(e)}")
            
            # Deploy to Cloudflare Pages directly from the container
            try:
                # Get Cloudflare API token from environment
                if not self.cloudflare_api_token:
                    return self.fail_response("CLOUDFLARE_API_TOKEN environment variable not set")
                    
                # Single command that creates the project if it doesn't exist and then deploys
                project_name = f"{self.sandbox_id}-{name}"
                deploy_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
                    (npx wrangler pages deploy {full_path} --project-name {project_name} || 
                    (npx wrangler pages project create {project_name} --production-branch production && 
                    npx wrangler pages deploy {full_path} --project-name {project_name}))'''

                # Execute the command directly using the sandbox's process.exec method
                response = self.sandbox.process.exec(deploy_cmd, timeout=300)
                
                print(f"Deployment command output: {response.result}")
                
                if response.exit_code == 0:
                    # Extract the correct URL from the output using regex
                    # First, aggressively clean the output of all special characters and escape sequences
                    # This ensures we have plain text with no color codes or unicode symbols
                    raw_output = response.result
                    
                    # Remove ANSI color codes and escape sequences completely
                    clean_output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', raw_output)
                    # Remove unicode special characters that cause display issues
                    clean_output = re.sub(r'[\u2718\u2728\ud83c\udf0e]', '', clean_output)
                    # Fix escape sequences that might be in the string representation
                    clean_output = clean_output.replace('\\n', '\n').replace('\\r', '\r')
                    
                    # Log clean output for debugging
                    print(f"Cleaned deployment output for processing: {clean_output[:100]}...")
                    
                    # Extract the deployment URL using multiple patterns to ensure we catch it
                    deployment_url = None
                    
                    # Try different URL patterns with very generous matching
                    url_patterns = [
                        r'https://[a-zA-Z0-9.-]+\.pages\.dev/?',  # Most general pattern
                        r'Deployment complete.*?(https://[a-zA-Z0-9.-]+\.pages\.dev/?)',
                        r'Success.*?(https://[a-zA-Z0-9.-]+\.pages\.dev/?)',
                        r'available at\s*(https://[a-zA-Z0-9.-]+\.pages\.dev/?)',
                        r'peek over at\s*(https://[a-zA-Z0-9.-]+\.pages\.dev/?)',
                        r'will be available at\s*(https://[a-zA-Z0-9.-]+\.pages\.dev/?)',
                    ]
                    
                    # Try each pattern until we find a match
                    for pattern in url_patterns:
                        matches = re.findall(pattern, clean_output, re.IGNORECASE | re.DOTALL)
                        if matches:
                            # Use the last match as it's typically the final deployed URL
                            deployment_url = matches[-1].strip()
                            if isinstance(deployment_url, tuple) and len(deployment_url) > 0:
                                deployment_url = deployment_url[0].strip()
                            break
                    
                    # If no URL was found through regex, use fallback to project name
                    if not deployment_url:
                        deployment_url = f"https://{project_name}.pages.dev"
                        print(f"No URL found in output, using fallback: {deployment_url}")
                    else:
                        print(f"Extracted deployment URL: {deployment_url}")
                    
                    # Remove any trailing slashes or whitespace for consistency
                    deployment_url = deployment_url.rstrip('/').strip()
                    
                    # Check if this was a new project creation
                    is_new_project = 'project created' in clean_output.lower() or 'new project' in clean_output.lower() or 'first deployment' in clean_output.lower()
                    
                    # Create a clean, bold, user-friendly response
                    result = {
                        "message": "✅ WEBSITE DEPLOYED SUCCESSFULLY",
                        "url": deployment_url,
                        "note": "Your site is now live! The URL may take a few minutes to become fully accessible.",
                        "type": "new project" if is_new_project else "update"
                    }
                    
                    # Return a very clean JSON response with no chance of escape sequence issues
                    return ToolResult(
                        success=True,
                        output=json.dumps(result, ensure_ascii=True)
                    )
                else:
                    # Clean up error message
                    error_output = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', response.result)  # Remove ANSI codes
                    error_output = re.sub(r'[\u2718\u2728\ud83c\udf0e]', '', error_output)  # Remove unicode symbols
                    
                    # Create a clean error message
                    error_result = {
                        "error": "DEPLOYMENT FAILED",
                        "details": f"Exit code: {response.exit_code}",
                        "suggestion": "Check your files and try again"
                    }
                    
                    return ToolResult(
                        success=False,
                        output=json.dumps(error_result, ensure_ascii=True)
                    )
            except Exception as e:
                return self.fail_response(f"Error during deployment: {str(e)}")
        except Exception as e:
            return self.fail_response(f"Error deploying website: {str(e)}")

if __name__ == "__main__":
    import asyncio
    import sys
    
    async def test_deploy():
        # Replace these with actual values for testing
        sandbox_id = "sandbox-ccb30b35"
        password = "test-password"
        
        # Initialize the deploy tool
        deploy_tool = SandboxDeployTool(sandbox_id, password)
        
        # Test deployment - replace with actual directory path and site name
        result = await deploy_tool.deploy(
            name="test-site-1x",
            directory_path="website"  # Directory containing static site files
        )
        print(f"Deployment result: {result}")
            
    asyncio.run(test_deploy())

