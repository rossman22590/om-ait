import os
import time
import uuid
from dotenv import load_dotenv
from agentpress.tool import ToolResult, openapi_schema, xml_schema
from sandbox.tool_base import SandboxToolsBase
from utils.files_utils import clean_path
from agentpress.thread_manager import ThreadManager

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
        
    def generate_unique_id(self, name: str) -> str:
        """Generate a unique identifier for a deployment"""
        timestamp = int(time.time())
        # Remove any spaces and special characters from name
        clean_name = ''.join(c for c in name if c.isalnum() or c == '-').lower()
        # Add the first 6 characters of a UUID to ensure uniqueness
        unique_suffix = str(uuid.uuid4())[:6]
        return f"{clean_name}-{timestamp}-{unique_suffix}"

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "deploy",
            "description": "Deploy a static website (HTML+CSS+JS) from a directory in the sandbox to Cloudflare Pages. Only use this tool when permanent deployment to a production environment is needed. The directory path must be relative to /workspace. The website will be deployed to {name}.kortix.cloud.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name for the deployment, will be used in the URL as {name}.machine.cloud"
                    },
                    "directory_path": {
                        "type": "string",
                        "description": "Path to the directory containing the static website files to deploy, relative to /workspace (e.g., 'build')"
                    },
                    "setup_custom_domain": {
                        "type": "boolean",
                        "description": "Whether to set up a custom domain on mymachine.space (requires Cloudflare credentials)",
                        "default": True
                    },
                    "create_new": {
                        "type": "boolean",
                        "description": "Whether to create a new deployment even if the name has been used before. If true, a unique deployment will be created; if false, an existing deployment may be updated.",
                        "default": False
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
            {"param_name": "directory_path", "node_type": "attribute", "path": "directory_path"},
            {"param_name": "setup_custom_domain", "node_type": "attribute", "path": "setup_custom_domain"},
            {"param_name": "create_new", "node_type": "attribute", "path": "create_new"}
        ],
        example='''
        <!-- 
        IMPORTANT: Only use this tool when:
        1. The user explicitly requests permanent deployment to production
        2. You have a complete, ready-to-deploy directory 
        
        NOTE: By default (create_new=false), if the same name is used, it will redeploy to the same project
        Set create_new=true to always create a new deployment even if the name was used before
        -->
        <deploy name="my-site" directory_path="website" setup_custom_domain="true" create_new="false">
        </deploy>
        '''
    )
    async def deploy(self, name: str, directory_path: str, setup_custom_domain: bool = True, create_new: bool = False) -> ToolResult:
        """
        Deploy a static website (HTML+CSS+JS) from the sandbox to Cloudflare Pages.
        Only use this tool when permanent deployment to a production environment is needed.
        
        Args:
            name: Name for the deployment, will be used in the URL
            directory_path: Path to the directory to deploy, relative to /workspace
            setup_custom_domain: Whether to set up a custom domain on mymachine.space (requires Cloudflare credentials)
            create_new: Whether to create a new deployment even if the name has been used before
            
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
                
                # Determine project name based on create_new flag
                if create_new:
                    # Always create a new deployment with unique ID
                    project_name = f"{self.sandbox_id}-{self.generate_unique_id(name)}"
                else:
                    # Use original naming scheme (may update existing deployment)
                    project_name = f"{self.sandbox_id}-{name}"
                    
                # Single command that creates the project if it doesn't exist and then deploys
                deploy_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
                    (npx wrangler pages deploy {full_path} --project-name {project_name} || 
                    (npx wrangler pages project create {project_name} --production-branch production && 
                    npx wrangler pages deploy {full_path} --project-name {project_name}))'''

                # Execute the command directly using the sandbox's process.exec method
                response = self.sandbox.process.exec(deploy_cmd, timeout=300)
                
                print(f"Deployment command output: {response.result}")
                
                if response.exit_code == 0:
                    # Get the deployed URL format
                    deployed_url = f"https://{project_name}.pages.dev"
                    custom_domain = f"{name}.kortix.cloud"  # This assumes DNS is configured to point *.kortix.cloud to Cloudflare
                    
                    return self.success_response({
                        "message": f"Website deployed successfully",
                        "project_name": project_name,
                        "deployed_url": deployed_url,
                        "custom_domain": custom_domain,
                        "output": response.result
                    })
                else:
                    return self.fail_response(f"Deployment failed with exit code {response.exit_code}: {response.result}")
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
            name="test-site",
            directory_path="website",  # Directory containing static site files
            setup_custom_domain=True,
            create_new=False
        )
        print(f"Deployment result: {result}")
            
    asyncio.run(test_deploy())
