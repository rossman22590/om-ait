import os
import re
import json
import requests
import time
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
        
        # Additional Cloudflare credentials for custom domain
        self.cloudflare_account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        self.cloudflare_zone_id = os.getenv("CLOUDFLARE_ZONE_ID")
        self.custom_domain = os.getenv("CUSTOM_DOMAIN", "mymachine.space")
        
        # Headers for Cloudflare API requests
        self.cf_headers = {
            "Authorization": f"Bearer {self.cloudflare_api_token}",
            "Content-Type": "application/json"
        }
        
        # Dictionary to store project name mappings - store in workspace
        self.mappings_file = "/workspace/cloudflare_mappings.json"
        self.project_mappings = self._load_project_mappings()

    def clean_path(self, path: str) -> str:
        """Clean and normalize a path to be relative to /workspace"""
        return clean_path(path, self.workspace_path)
        
    def _load_project_mappings(self):
        """Load project name mappings from file or create empty dict if doesn't exist"""
        try:
            if self.sandbox and self.sandbox.fs.file_exists(self.mappings_file):
                content = self.sandbox.fs.read_file(self.mappings_file)
                return json.loads(content)
            else:
                return {}
        except Exception as e:
            print(f"Warning: Could not load project mappings: {str(e)}")
            return {}
            
    def _save_project_mappings(self):
        """Save project mappings to file"""
        try:
            if self.sandbox:
                content = json.dumps(self.project_mappings, indent=2)
                self.sandbox.fs.write_file(self.mappings_file, content)
                print(f"Saved project mappings to {self.mappings_file}")
        except Exception as e:
            print(f"Warning: Could not save project mappings: {str(e)}")
        
    def format_subdomain(self, project_name):
        """Format a readable subdomain from a project name"""
        # For names like machine-51210-epic-tech-ai-platform
        # Extract the meaningful parts after the random number
        prefixed_pattern = re.compile(r'^[a-z]+-[0-9]+-(.+)$')
        match_prefixed = prefixed_pattern.match(project_name)
        
        if match_prefixed:
            # Return everything after the prefix-number pattern
            return match_prefixed.group(1).lower()
        
        # If name has hyphens but doesn't match patterns above, take everything after first hyphen
        parts = project_name.split('-')
        if len(parts) > 1:
            return '-'.join(parts[1:]).lower()
        
        # Fallback: just use the name itself with basic sanitization
        simple_name = re.sub(r'[^a-zA-Z0-9\-]', '', project_name.lower())
        
        # Ensure domain name is not too long
        return simple_name[:20]
    
    def check_dns_record_exists(self, subdomain):
        """Check if a DNS record already exists for this subdomain"""
        if not all([self.cloudflare_api_token, self.cloudflare_zone_id]):
            print("Missing Cloudflare credentials for DNS check")
            return False
            
        url = f"https://api.cloudflare.com/client/v4/zones/{self.cloudflare_zone_id}/dns_records"
        params = {"name": f"{subdomain}.{self.custom_domain}"}
        
        try:
            response = requests.get(url, headers=self.cf_headers, params=params)
            
            if response.status_code != 200:
                print(f"Error checking DNS records: {response.text}")
                return False
            
            data = response.json()
            if not data.get("success", False):
                print(f"API returned error: {data}")
                return False
            
            # If we find any records, return True
            return len(data.get("result", [])) > 0
        except Exception as e:
            print(f"Exception checking DNS records: {str(e)}")
            return False
    
    def create_dns_record(self, subdomain, target):
        """Create a CNAME DNS record for the subdomain pointing to the Pages domain"""
        if not all([self.cloudflare_api_token, self.cloudflare_zone_id]):
            print("Missing Cloudflare credentials for DNS creation")
            return False
            
        if self.check_dns_record_exists(subdomain):
            print(f"DNS record for {subdomain}.{self.custom_domain} already exists")
            return True
        
        url = f"https://api.cloudflare.com/client/v4/zones/{self.cloudflare_zone_id}/dns_records"
        
        payload = {
            "type": "CNAME",
            "name": subdomain,
            "content": target,
            "ttl": 1,  # Auto TTL
            "proxied": True  # Use Cloudflare proxy
        }
        
        print(f"Creating DNS record: {subdomain}.{self.custom_domain} -> {target}")
        try:
            response = requests.post(url, headers=self.cf_headers, json=payload)
            
            if response.status_code == 200:
                print(f"Successfully created DNS record for {subdomain}.{self.custom_domain}")
                return True
            else:
                print(f"Failed to create DNS record: {response.text}")
                return False
        except Exception as e:
            print(f"Exception creating DNS record: {str(e)}")
            return False
    
    def assign_custom_domain_to_pages(self, project_name, subdomain):
        """Assign a custom subdomain to a Pages project"""
        if not all([self.cloudflare_api_token, self.cloudflare_account_id]):
            print("Missing Cloudflare credentials for domain assignment")
            return False
            
        # Check existing custom domains first
        check_url = f"https://api.cloudflare.com/client/v4/accounts/{self.cloudflare_account_id}/pages/projects/{project_name}/domains"
        try:
            check_response = requests.get(check_url, headers=self.cf_headers)
            
            if check_response.status_code == 200:
                existing_domains = check_response.json().get("result", [])
                domain_names = [d.get("name") for d in existing_domains]
                
                full_domain = f"{subdomain}.{self.custom_domain}"
                if full_domain in domain_names:
                    print(f"Domain {full_domain} is already assigned to Pages project: {project_name}")
                    return True
        except Exception as e:
            print(f"Error checking existing domains: {str(e)}")
        
        # Add the custom domain to the Pages project
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.cloudflare_account_id}/pages/projects/{project_name}/domains"
        
        full_domain = f"{subdomain}.{self.custom_domain}"
        print(f"Assigning custom domain {full_domain} to Pages project: {project_name}")
        
        payload = {
            "name": full_domain
        }
        
        try:
            response = requests.post(url, headers=self.cf_headers, json=payload)
            
            if response.status_code == 200:
                print(f"Successfully assigned domain {full_domain} to Pages project: {project_name}")
                # After custom domain assignment, need to wait a bit for verification to complete
                time.sleep(2)
                return True
            else:
                print(f"Failed to assign domain to Pages project {project_name}: {response.text}")
                return False
        except Exception as e:
            print(f"Exception when assigning domain to {project_name}: {str(e)}")
            return False

    def fail_response(self, message):
        return ToolResult(success=False, output={"error": message})
        
    def success_response(self, result):
        # Return the result directly as a dictionary to avoid JSON serialization issues
        return ToolResult(success=True, output=result)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "deploy",
            "description": "Deploy a static website (HTML+CSS+JS) from a directory in the sandbox to Cloudflare Pages with optional custom domain setup. Only use this tool when permanent deployment to a production environment is needed. The directory path must be relative to /workspace.",
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
                    },
                    "setup_custom_domain": {
                        "type": "boolean",
                        "description": "Whether to set up a custom domain on mymachine.space (requires Cloudflare credentials)",
                        "default":True
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
            {"param_name": "setup_custom_domain", "node_type": "attribute", "path": "setup_custom_domain"}
        ],
        example='''
        <!-- 
        IMPORTANT: Only use this tool when:
        1. The user explicitly requests permanent deployment to production
        2. You have a complete, ready-to-deploy directory 
        
        NOTE: If the same name is used, it will redeploy to the same project as before
                -->

        <deploy name="my-site" directory_path="website" setup_custom_domain="true">
        </deploy>
        '''
    )
    async def deploy(self, name: str, directory_path: str, setup_custom_domain: bool = True) -> ToolResult:
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
                
                # Validate the project name meets Cloudflare Pages requirements
                import re
                if not name or not re.match(r'^[a-z0-9]([a-z0-9-]{0,56}[a-z0-9])?$', name):
                    return self.fail_response(
                        "Invalid project name. Project names must be 1-58 lowercase characters "
                        "or numbers with optional dashes, and cannot start or end with a dash."
                    )
                
                # Check if we already have a project mapping for this name
                # This ensures redeployments use the same project name and custom domain
                is_redeployment = False
                if name in self.project_mappings:
                    project_name = self.project_mappings[name]
                    print(f"Reusing existing project name {project_name} for {name}")
                    is_redeployment = True
                else:
                    # Generate a 5-digit random number for the project name
                    import random
                    random_digits = str(random.randint(10000, 99999))
                    
                    # Construct the project name and check the final length
                    project_name = f"machine-{random_digits}-{name}"
                
                # Verify the final project name's length (Cloudflare limit is 58 chars)
                if len(project_name) > 58:
                    return self.fail_response(
                        f"Final project name '{project_name}' exceeds 58 characters. "
                        f"Please use a shorter name (your name portion should be {58 - len('machine-' + random_digits + '-')} chars or less)."
                    )
                # First check if the project exists to avoid error messages
                check_project_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
                    npx wrangler pages project list --json | grep -q '"name":\s*"{project_name}"' || echo "NOT_FOUND"'''
                
                check_result = self.sandbox.process.exec(check_project_cmd, timeout=30)
                project_exists = "NOT_FOUND" not in check_result.result
                
                if project_exists:
                    # Project exists, just deploy directly
                    deploy_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
                        npx wrangler pages deploy {full_path} --project-name {project_name}'''
                else:
                    # Project doesn't exist, create first then deploy
                    deploy_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
                        npx wrangler pages project create {project_name} --production-branch production && 
                        npx wrangler pages deploy {full_path} --project-name {project_name}'''

                # Execute the command directly using the sandbox's process.exec method
                response = self.sandbox.process.exec(deploy_cmd, timeout=300)
                
                print(f"Deployment command output: {response.result}")
                
                if response.exit_code == 0:
                    # Store mapping for future redeployments if new project
                    if not is_redeployment:
                        self.project_mappings[name] = project_name
                        self._save_project_mappings()
                    
                    # Extract subdomain for custom domain
                    custom_subdomain = self.format_subdomain(project_name)
                    default_url = f"https://{project_name}.pages.dev"
                    custom_url = f"https://{custom_subdomain}.{self.custom_domain}"
                    
                    # Prepare the success response
                    result = {
                        "message": "✅ Website deployed successfully!",
                        "urls": {
                            "cloudflare": default_url
                        },
                        "output": response.result
                    }
                    
                    # Setup custom domain if requested
                    if setup_custom_domain:
                        if not all([self.cloudflare_account_id, self.cloudflare_zone_id, self.cloudflare_api_token]):
                            result["custom_domain_status"] = "❌ Missing Cloudflare credentials for custom domain setup"
                        else:
                            # Attempt to set up DNS and custom domain
                            dns_created = self.create_dns_record(custom_subdomain, f"{project_name}.pages.dev")
                            
                            if dns_created:
                                domain_assigned = self.assign_custom_domain_to_pages(project_name, custom_subdomain)
                                if domain_assigned:
                                    result["custom_domain_status"] = "✅ Custom domain set up successfully"
                                    result["urls"]["custom_domain"] = custom_url
                                else:
                                    result["custom_domain_status"] = "⚠️ DNS record created but failed to assign custom domain to project"
                            else:
                                result["custom_domain_status"] = "❌ Failed to create DNS record for custom domain"
                    
                    return self.success_response(result)
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
            name="test-site-1x",
            directory_path="website",  # Directory containing static site files
            setup_custom_domain=True
        )
        print(f"Deployment result: {result}")
            
    asyncio.run(test_deploy())

# import os
# from dotenv import load_dotenv
# from agentpress.tool import ToolResult, openapi_schema, xml_schema
# from sandbox.tool_base import SandboxToolsBase
# from utils.files_utils import clean_path
# from agentpress.thread_manager import ThreadManager

# # Load environment variables
# load_dotenv()

# class SandboxDeployTool(SandboxToolsBase):
#     """Tool for deploying static websites from a Daytona sandbox to Cloudflare Pages."""

#     def __init__(self, project_id: str, thread_manager: ThreadManager):
#         super().__init__(project_id, thread_manager)
#         self.workspace_path = "/workspace"  # Ensure we're always operating in /workspace
#         self.cloudflare_api_token = os.getenv("CLOUDFLARE_API_TOKEN")

#     def clean_path(self, path: str) -> str:
#         """Clean and normalize a path to be relative to /workspace"""
#         return clean_path(path, self.workspace_path)

#     @openapi_schema({
#         "type": "function",
#         "function": {
#             "name": "deploy",
#             "description": "Deploy a static website (HTML+CSS+JS) from a directory in the sandbox to Cloudflare Pages. Only use this tool when permanent deployment to a production environment is needed. The directory path must be relative to /workspace. The website will be deployed to {name}.kortix.cloud.",
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "name": {
#                         "type": "string",
#                         "description": "Name for the deployment, will be used in the URL as {name}.kortix.cloud"
#                     },
#                     "directory_path": {
#                         "type": "string",
#                         "description": "Path to the directory containing the static website files to deploy, relative to /workspace (e.g., 'build')"
#                     }
#                 },
#                 "required": ["name", "directory_path"]
#             }
#         }
#     })
#     @xml_schema(
#         tag_name="deploy",
#         mappings=[
#             {"param_name": "name", "node_type": "attribute", "path": "name"},
#             {"param_name": "directory_path", "node_type": "attribute", "path": "directory_path"}
#         ],
#         example='''
#         <!-- 
#         IMPORTANT: Only use this tool when:
#         1. The user explicitly requests permanent deployment to production
#         2. You have a complete, ready-to-deploy directory 
        
#         NOTE: If the same name is used, it will redeploy to the same project as before
#                 -->

#         <deploy name="my-site" directory_path="website">
#         </deploy>
#         '''
#     )
#     async def deploy(self, name: str, directory_path: str) -> ToolResult:
#         """
#         Deploy a static website (HTML+CSS+JS) from the sandbox to Cloudflare Pages.
#         Only use this tool when permanent deployment to a production environment is needed.
        
#         Args:
#             name: Name for the deployment, will be used in the URL as {name}.kortix.cloud
#             directory_path: Path to the directory to deploy, relative to /workspace
            
#         Returns:
#             ToolResult containing:
#             - Success: Deployment information including URL
#             - Failure: Error message if deployment fails
#         """
#         try:
#             # Ensure sandbox is initialized
#             await self._ensure_sandbox()
            
#             directory_path = self.clean_path(directory_path)
#             full_path = f"{self.workspace_path}/{directory_path}"
            
#             # Verify the directory exists
#             try:
#                 dir_info = self.sandbox.fs.get_file_info(full_path)
#                 if not dir_info.is_dir:
#                     return self.fail_response(f"'{directory_path}' is not a directory")
#             except Exception as e:
#                 return self.fail_response(f"Directory '{directory_path}' does not exist: {str(e)}")
            
#             # Deploy to Cloudflare Pages directly from the container
#             try:
#                 # Get Cloudflare API token from environment
#                 if not self.cloudflare_api_token:
#                     return self.fail_response("CLOUDFLARE_API_TOKEN environment variable not set")
                    
#                 # Single command that creates the project if it doesn't exist and then deploys
#                 project_name = f"{self.sandbox_id}-{name}"
#                 deploy_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
#                     (npx wrangler pages deploy {full_path} --project-name {project_name} || 
#                     (npx wrangler pages project create {project_name} --production-branch production && 
#                     npx wrangler pages deploy {full_path} --project-name {project_name}))'''

#                 # Execute the command directly using the sandbox's process.exec method
#                 response = self.sandbox.process.exec(deploy_cmd, timeout=300)
                
#                 print(f"Deployment command output: {response.result}")
                
#                 if response.exit_code == 0:
#                     return self.success_response({
#                         "message": f"Website deployed successfully",
#                         "output": response.result
#                     })
#                 else:
#                     return self.fail_response(f"Deployment failed with exit code {response.exit_code}: {response.result}")
#             except Exception as e:
#                 return self.fail_response(f"Error during deployment: {str(e)}")
#         except Exception as e:
#             return self.fail_response(f"Error deploying website: {str(e)}")

# if __name__ == "__main__":
#     import asyncio
#     import sys
    
#     async def test_deploy():
#         # Replace these with actual values for testing
#         sandbox_id = "sandbox-ccb30b35"
#         password = "test-password"
        
#         # Initialize the deploy tool
#         deploy_tool = SandboxDeployTool(sandbox_id, password)
        
#         # Test deployment - replace with actual directory path and site name
#         result = await deploy_tool.deploy(
#             name="test-site-1x",
#             directory_path="website"  # Directory containing static site files
#         )
#         print(f"Deployment result: {result}")
            
#     asyncio.run(test_deploy())

# import os
# from dotenv import load_dotenv
# from agentpress.tool import ToolResult, openapi_schema, xml_schema
# from sandbox.tool_base import SandboxToolsBase
# from utils.files_utils import clean_path
# from agentpress.thread_manager import ThreadManager

# # Load environment variables
# load_dotenv()

# class SandboxDeployTool(SandboxToolsBase):
#     """Tool for deploying static websites from a Daytona sandbox to Cloudflare Pages."""

#     def __init__(self, project_id: str, thread_manager: ThreadManager):
#         super().__init__(project_id, thread_manager)
#         self.workspace_path = "/workspace"  # Ensure we're always operating in /workspace
#         self.cloudflare_api_token = os.getenv("CLOUDFLARE_API_TOKEN")

#     def clean_path(self, path: str) -> str:
#         """Clean and normalize a path to be relative to /workspace"""
#         return clean_path(path, self.workspace_path)

#     @openapi_schema({
#         "type": "function",
#         "function": {
#             "name": "deploy",
#             "description": "Deploy a static website (HTML+CSS+JS) from a directory in the sandbox to Cloudflare Pages. Only use this tool when permanent deployment to a production environment is needed. The directory path must be relative to /workspace. The website will be deployed to {name}.kortix.cloud.",
#             "parameters": {
#                 "type": "object",
#                 "properties": {
#                     "name": {
#                         "type": "string",
#                         "description": "Name for the deployment, will be used in the URL as {name}.kortix.cloud"
#                     },
#                     "directory_path": {
#                         "type": "string",
#                         "description": "Path to the directory containing the static website files to deploy, relative to /workspace (e.g., 'build')"
#                     }
#                 },
#                 "required": ["name", "directory_path"]
#             }
#         }
#     })
#     @xml_schema(
#         tag_name="deploy",
#         mappings=[
#             {"param_name": "name", "node_type": "attribute", "path": "name"},
#             {"param_name": "directory_path", "node_type": "attribute", "path": "directory_path"}
#         ],
#         example='''
#         <!-- 
#         IMPORTANT: Only use this tool when:
#         1. The user explicitly requests permanent deployment to production
#         2. You have a complete, ready-to-deploy directory 
        
#         NOTE: If the same name is used, it will redeploy to the same project as before
#                 -->

#         <deploy name="my-site" directory_path="website">
#         </deploy>
#         '''
#     )
#     async def deploy(self, name: str, directory_path: str) -> ToolResult:
#         """
#         Deploy a static website (HTML+CSS+JS) from the sandbox to Cloudflare Pages.
#         Only use this tool when permanent deployment to a production environment is needed.
        
#         Args:
#             name: Name for the deployment, will be used in the URL as {name}.kortix.cloud
#             directory_path: Path to the directory to deploy, relative to /workspace
            
#         Returns:
#             ToolResult containing:
#             - Success: Deployment information including URL
#             - Failure: Error message if deployment fails
#         """
#         try:
#             # Ensure sandbox is initialized
#             await self._ensure_sandbox()
            
#             directory_path = self.clean_path(directory_path)
#             full_path = f"{self.workspace_path}/{directory_path}"
            
#             # Verify the directory exists
#             try:
#                 dir_info = self.sandbox.fs.get_file_info(full_path)
#                 if not dir_info.is_dir:
#                     return self.fail_response(f"'{directory_path}' is not a directory")
#             except Exception as e:
#                 return self.fail_response(f"Directory '{directory_path}' does not exist: {str(e)}")
            
#             # Deploy to Cloudflare Pages directly from the container
#             try:
#                 # Get Cloudflare API token from environment
#                 if not self.cloudflare_api_token:
#                     return self.fail_response("CLOUDFLARE_API_TOKEN environment variable not set")
                    
#                 # Single command that creates the project if it doesn't exist and then deploys
#                 project_name = f"{self.sandbox_id}-{name}"
#                 deploy_cmd = f'''cd {self.workspace_path} && export CLOUDFLARE_API_TOKEN={self.cloudflare_api_token} && 
#                     (npx wrangler pages deploy {full_path} --project-name {project_name} || 
#                     (npx wrangler pages project create {project_name} --production-branch production && 
#                     npx wrangler pages deploy {full_path} --project-name {project_name}))'''

#                 # Execute the command directly using the sandbox's process.exec method
#                 response = self.sandbox.process.exec(deploy_cmd, timeout=300)
                
#                 print(f"Deployment command output: {response.result}")
                
#                 if response.exit_code == 0:
#                     return self.success_response({
#                         "message": f"Website deployed successfully",
#                         "output": response.result
#                     })
#                 else:
#                     return self.fail_response(f"Deployment failed with exit code {response.exit_code}: {response.result}")
#             except Exception as e:
#                 return self.fail_response(f"Error during deployment: {str(e)}")
#         except Exception as e:
#             return self.fail_response(f"Error deploying website: {str(e)}")

# if __name__ == "__main__":
#     import asyncio
#     import sys
    
#     async def test_deploy():
#         # Replace these with actual values for testing
#         sandbox_id = "sandbox-ccb30b35"
#         password = "test-password"
        
#         # Initialize the deploy tool
#         deploy_tool = SandboxDeployTool(sandbox_id, password)
        
#         # Test deployment - replace with actual directory path and site name
#         result = await deploy_tool.deploy(
#             name="test-site-1x",
#             directory_path="website"  # Directory containing static site files
#         )
#         print(f"Deployment result: {result}")
            
#     asyncio.run(test_deploy())
