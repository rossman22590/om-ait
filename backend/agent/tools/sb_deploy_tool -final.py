import os
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
        return clean_path(path, "/workspace")
        
    def _file_exists(self, path: str) -> bool:
        """Check if a file exists in the sandbox"""
        try:
            self.sandbox.fs.get_file_info(path)
            return True
        except Exception:
            return False
            
    def _read_file(self, file_path: str, start_line: int = 1, end_line: int = None) -> str:
        """Read file content with optional line range specification.
        
        Args:
            file_path: Path to the file
            start_line: Starting line number (1-based), defaults to 1
            end_line: Ending line number (inclusive), defaults to None (end of file)
            
        Returns:
            File content as string or empty string if file doesn't exist or is binary
        """
        try:
            if not self._file_exists(file_path):
                print(f"File '{file_path}' does not exist")
                return ""
            
            # Try multiple file reading methods for robustness
            content = None
            
            # Method 1: Using fs.read_file if available
            try:
                content = self.sandbox.fs.read_file(file_path)
            except (AttributeError, Exception) as e:
                print(f"Could not read file using fs.read_file: {str(e)}")
            
            # Method 2: Using fs.download_file if available and Method 1 failed
            if content is None:
                try:
                    content = self.sandbox.fs.download_file(file_path).decode()
                except (AttributeError, Exception) as e:
                    print(f"Could not read file using fs.download_file: {str(e)}")
            
            # Method 3: Using shell command if both API methods failed
            if content is None:
                try:
                    # Escape file path for shell use
                    escaped_path = file_path.replace('"', '\"')
                    cat_cmd = f"cat \"{escaped_path}\""
                    result = self.sandbox.process.exec(cat_cmd, timeout=10)
                    content = result.result
                except Exception as e:
                    print(f"Could not read file using shell command: {str(e)}")
                    return ""
            
            # Handle line range if specified
            if start_line > 1 or end_line is not None:
                # Split content into lines
                lines = content.split('\n')
                total_lines = len(lines)
                
                # Convert to 0-based indices
                start_idx = max(0, start_line - 1)
                end_idx = end_line if end_line is not None else total_lines
                end_idx = min(end_idx, total_lines)  # Ensure we don't exceed file length
                
                # Extract the requested lines
                content = '\n'.join(lines[start_idx:end_idx])
            
            return content
            
        except UnicodeDecodeError:
            print(f"File '{file_path}' appears to be binary and cannot be read as text")
            return ""
        except Exception as e:
            print(f"Error reading file: {str(e)}")
            return ""
        
    def _load_project_mappings(self):
        """Load project name mappings from file or create empty dict if doesn't exist"""
        try:
            if self.sandbox and self.sandbox.fs.file_exists(self.mappings_file):
                content = self._read_file(self.mappings_file)
                if content:
                    return json.loads(content)
            else:
                # Create empty mappings file if it doesn't exist
                print(f"Creating new project mappings file at {self.mappings_file}")
                self._save_project_mappings()
            return {}
        except Exception as e:
            print(f"Warning: Could not load project mappings: {str(e)}")
            return {}
            
    def _save_project_mappings(self):
        """Save project mappings to file"""
        try:
            if self.sandbox:
                content = json.dumps(self.project_mappings, indent=2)
                # Try both potential file writing methods
                try:
                    self.sandbox.fs.write_file(self.mappings_file, content)
                    print(f"Saved project mappings to {self.mappings_file}")
                except AttributeError:
                    # Try alternative method if write_file doesn't exist
                    write_cmd = f"echo '{content}' > {self.mappings_file}"
                    self.sandbox.process.exec(write_cmd, timeout=10)
                    print(f"Saved project mappings using shell command")
        except Exception as e:
            print(f"Warning: Could not save project mappings: {str(e)}")
        
    def format_subdomain(self, project_name):
        """Format a readable subdomain from a project name"""
        # Keep subdomain short and clean
        # For project names like m12345-myproject
        return project_name

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

    def prepare_deployment_directory(self, source_path: str) -> tuple:
        """Prepare a directory for deployment by ensuring an index.html file exists
        
        Args:
            source_path (str): Path to the source directory
            
        Returns:
            tuple: (prepared_directory_path, file_count, status_message)
        """
        try:
            import os
            import shutil
            import glob
            import tempfile
            
            # Create a temporary directory for deployment
            temp_dir = tempfile.mkdtemp(prefix="deploy_", dir=source_path)
            print(f"Created temporary deployment directory: {temp_dir}")
            
            # Copy all files from source to temp directory
            file_count = 0
            has_index_html = False
            html_files = []
            
            # Find all files in the source directory
            for root, dirs, files in os.walk(source_path):
                # Skip the temp directory itself
                if os.path.abspath(root) == os.path.abspath(temp_dir):
                    continue
                    
                for file in files:
                    source_file = os.path.join(root, file)
                    # Get relative path from source_path
                    rel_path = os.path.relpath(source_file, source_path)
                    dest_file = os.path.join(temp_dir, rel_path)
                    
                    # Create directories if they don't exist
                    os.makedirs(os.path.dirname(dest_file), exist_ok=True)
                    
                    # Copy the file
                    shutil.copy2(source_file, dest_file)
                    file_count += 1
                    
                    # Track HTML files and check for index.html
                    if file.lower().endswith('.html'):
                        html_files.append(rel_path)
                        if file.lower() == 'index.html':
                            has_index_html = True
            
            # If no index.html found but other HTML files exist, rename the first one
            if not has_index_html and html_files:
                first_html = html_files[0]
                first_html_path = os.path.join(temp_dir, first_html)
                index_html_path = os.path.join(os.path.dirname(first_html_path), 'index.html')
                
                # Only rename if it's not already in a subdirectory
                if os.path.dirname(first_html) == '':
                    shutil.copy2(first_html_path, index_html_path)
                    print(f"Renamed {first_html} to index.html")
                else:
                    # If HTML file is in a subdirectory, create a redirect in root index.html
                    with open(os.path.join(temp_dir, 'index.html'), 'w') as f:
                        f.write(f"<meta http-equiv=\"refresh\" content=\"0; url={first_html}\" />")
                    print(f"Created redirect index.html pointing to {first_html}")
            elif not has_index_html and not html_files:
                # Create a simple index.html if no HTML files found
                with open(os.path.join(temp_dir, 'index.html'), 'w') as f:
                    f.write("<html><body><h1>Deployed Files</h1><p>The deployed files don't include an HTML file. This is a placeholder.</p></body></html>")
                print("Created placeholder index.html")
                
            return temp_dir, file_count, f"Prepared {file_count} files for deployment"
        except Exception as e:
            print(f"Error preparing deployment directory: {str(e)}")
            return source_path, 0, f"Failed to prepare deployment directory: {str(e)}"

    def _clear_wrangler_cache(self, directory_path):
        """Clear Wrangler cache to avoid conflicts with existing projects
        
        Args:
            directory_path (str): Path to the directory where node_modules is located
        """
        try:
            # Find node_modules directory
            node_modules = os.path.join(directory_path, "node_modules")
            if os.path.exists(node_modules):
                cache_dir = os.path.join(node_modules, ".cache", "wrangler")
                if os.path.exists(cache_dir):
                    pages_json = os.path.join(cache_dir, "pages.json")
                    if os.path.exists(pages_json):
                        print(f"Removing Wrangler cache file: {pages_json}")
                        os.remove(pages_json)
                        print(f"Wrangler cache cleared successfully")
            
            # Also create a wrangler.toml file in the deployment directory
            wrangler_toml = os.path.join(directory_path, "wrangler.toml")
            if not os.path.exists(wrangler_toml):
                try:
                    with open(wrangler_toml, "w") as f:
                        f.write(f"[site]\nname = \"{os.path.basename(directory_path)}\"\n")
                    print("Created wrangler.toml file")
                except Exception as e:
                    print(f"Warning: Failed to create wrangler.toml: {str(e)}")
        except Exception as e:
            print(f"Error clearing Wrangler cache: {str(e)}")

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
            
            # Normalize the directory path for sandbox
            if directory_path == ".":
                # Special case for current directory
                full_path = "/workspace"
            else:
                # For other paths, normalize them
                directory_path = self.clean_path(directory_path)
                full_path = os.path.join("/workspace", directory_path.lstrip("/")) if not directory_path.startswith("/workspace") else directory_path
            
            print(f"Source directory: {full_path}")
            
            # Check if directory exists using sandbox file system API
            try:
                dir_info = self.sandbox.fs.get_file_info(full_path)
                if not dir_info.is_dir:
                    return self.fail_response(f"'{directory_path}' is not a directory")
            except Exception as e:
                return self.fail_response(f"Directory '{directory_path}' does not exist: {str(e)}")
            
            # Prepare the deployment directory
            print("Preparing deployment directory...")
            deploy_dir, files_count, prep_message = self.prepare_deployment_directory(full_path)
            print(prep_message)
            
            # Use the prepared directory for deployment
            full_path = deploy_dir
            print(f"Deploying from prepared directory: {full_path}")
            
            # Clear Wrangler cache to avoid conflicts with existing projects
            self._clear_wrangler_cache(full_path)
            
            # Deploy to Cloudflare Pages directly using API instead of Wrangler
            try:
                # Get Cloudflare API token from environment
                if not self.cloudflare_api_token:
                    return self.fail_response("CLOUDFLARE_API_TOKEN environment variable not set")
                
                # Validate the project name meets Cloudflare Pages requirements
                if not name or not re.match(r'^[a-z0-9]([a-z0-9-]{0,56}[a-z0-9])?$', name):
                    return self.fail_response(
                        "Invalid project name. Project names must be 1-58 lowercase characters "
                        "or numbers with optional dashes, and cannot start or end with a dash."
                    )
                
                # Determine project name based on parameters
                final_project_name = None
                
                # If specific project name is provided, use it
                if name:
                    final_project_name = name
                    print(f"Using specified project name: {final_project_name}")
                # Check if we should use existing project
                elif name in self.project_mappings:
                    final_project_name = self.project_mappings[name]
                    print(f"Using existing project mapping: {final_project_name}")
                # Generate a new project name
                else:
                    import random
                    random_digits = str(random.randint(10000, 99999))
                    import datetime
                    timestamp = datetime.datetime.now().strftime("%y%m%d%H%M%S")
                    # Keep project name short: 5-digit number and name only
                    final_project_name = f"m{random_digits}-{name}"
                    print(f"Creating new project: {final_project_name}")
                    
                # Store the project name for future reference
                self.project_mappings[name] = final_project_name
                self._save_project_mappings()
                
                # Use consistent variable name throughout
                project_name = final_project_name
                
                # Deploy using Wrangler CLI
                print(f"Using Wrangler CLI for deployment...")
                
                # Use the Daytona SDK's recommended session approach for managing long-running processes
                deploy_session_id = f"deploy-{project_name}"
                print(f"Creating deployment session {deploy_session_id}...")
                
                try:
                    # Create a new session for the deployment
                    self.sandbox.process.create_session(deploy_session_id)
                    
                    # Set up environment variables for the deployment
                    env_vars = {"CLOUDFLARE_API_TOKEN": self.cloudflare_api_token}
                    
                    # First run npm init to create package.json if it doesn't exist
                    print("Initializing npm project...")
                    init_cmd = "npm init -y"
                    init_result = self.sandbox.process.exec(init_cmd, cwd=full_path, timeout=30)
                    print(f"Init result: Exit code {init_result.exit_code}")
                    
                    if init_result.exit_code != 0:
                        return self.fail_response(f"Failed to initialize npm project: {init_result.result}")
                    
                    # Install wrangler locally
                    print("Installing wrangler locally...")
                    install_cmd = "npm install wrangler --no-save"
                    install_result = self.sandbox.process.exec(install_cmd, cwd=full_path, timeout=120)
                    print(f"Install result: Exit code {install_result.exit_code}")
                    
                    if install_result.exit_code != 0:
                        return self.fail_response(f"Failed to install wrangler: {install_result.result}")
                    
                    # First create the project, then deploy to it
                    print("Creating new Cloudflare Pages project...")
                    create_cmd = f"./node_modules/.bin/wrangler pages project create {project_name} --production-branch production"
                    create_result = self.sandbox.process.exec(create_cmd, cwd=full_path, env=env_vars, timeout=60)
                    print(f"Project creation result: Exit code {create_result.exit_code}")
                    
                    if create_result.exit_code != 0:
                        print(f"Warning: Project creation may have failed: {create_result.result}")
                        print("Attempting to deploy anyway in case the project already exists...")
                    
                    # Now deploy to the project
                    print("Starting deployment with Wrangler...")
                    deploy_cmd = f"./node_modules/.bin/wrangler pages deploy . --project-name {project_name} --commit-dirty=true"
                    response = self.sandbox.process.exec(deploy_cmd, cwd=full_path, env=env_vars, timeout=300)
                    
                    print(f"Deployment exit code: {response.exit_code}")
                    print(f"Deployment output: {response.result}")
                
                finally:
                    # Clean up the session properly as per Daytona SDK best practices
                    try:
                        print(f"Cleaning up deployment session...")
                        self.sandbox.process.delete_session(deploy_session_id)
                    except Exception as e:
                        print(f"Warning: Failed to clean up deployment session: {str(e)}")
                
                # Determine success based on exit code and output
                success = response.exit_code == 0
                if not success:
                    return self.fail_response(f"Deployment failed with exit code {response.exit_code}: {response.result}")
                
                # Mapping is now stored right after project name generation
                
                
                # Result is already processed above
                
                
                # Extract subdomain for custom domain
                # Extract deployment URL from response
                default_url = f"https://{project_name}.pages.dev"
                custom_subdomain = self.format_subdomain(project_name)
                custom_url = f"https://{custom_subdomain}.{self.custom_domain}"
                
                # Create a success result with direct URLs
                result = {
                    "message": "✅ Website deployed successfully!",
                    "urls": {
                        "cloudflare": default_url
                    },
                    "output": f"Successfully deployed {files_count} files to {final_project_name}"
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
