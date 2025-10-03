import os
import re
import json
import time
import requests
from dotenv import load_dotenv
from core.agentpress.tool import ToolResult, openapi_schema
from core.sandbox.tool_base import SandboxToolsBase
from core.utils.files_utils import clean_path
from core.agentpress.thread_manager import ThreadManager

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
            "Content-Type": "application/json",
        }

        # Project mapping persistence in workspace
        self.mappings_file = "/workspace/cloudflare_mappings.json"
        self.project_mappings = {}

    def clean_path(self, path: str) -> str:
        """Clean and normalize a path to be relative to /workspace"""
        return clean_path(path, self.workspace_path)

    async def _file_exists(self, path: str) -> bool:
        try:
            await self.sandbox.fs.get_file_info(path)
            return True
        except Exception:
            return False

    async def _read_file(self, file_path: str, start_line: int = 1, end_line: int = None) -> str:
        try:
            if not await self._file_exists(file_path):
                return ""

            content = None
            try:
                content = await self.sandbox.fs.read_file(file_path)
            except Exception:
                pass

            if content is None:
                try:
                    content = (await self.sandbox.fs.download_file(file_path)).decode()
                except Exception:
                    pass

            if content is None:
                try:
                    escaped = file_path.replace('"', '\\"')
                    res = await self.sandbox.process.exec(f'cat "{escaped}"', timeout=10)
                    content = res.result
                except Exception:
                    return ""

            if start_line > 1 or end_line is not None:
                lines = content.split('\n')
                total = len(lines)
                s = max(0, start_line - 1)
                e = end_line if end_line is not None else total
                e = min(e, total)
                content = '\n'.join(lines[s:e])
            return content
        except UnicodeDecodeError:
            return ""
        except Exception:
            return ""

    async def _load_project_mappings(self):
        try:
            if self.sandbox and await self._file_exists(self.mappings_file):
                content = await self._read_file(self.mappings_file)
                if content:
                    return json.loads(content)
            else:
                await self._save_project_mappings()
            return {}
        except Exception:
            return {}

    async def _save_project_mappings(self):
        try:
            if self.sandbox:
                content = json.dumps(self.project_mappings, indent=2)
                try:
                    await self.sandbox.fs.write_file(self.mappings_file, content)
                except AttributeError:
                    await self.sandbox.process.exec(f"echo '{content}' > {self.mappings_file}", timeout=10)
        except Exception:
            pass

    def format_subdomain(self, project_name: str) -> str:
        return project_name

    def check_dns_record_exists(self, subdomain: str) -> bool:
        if not all([self.cloudflare_api_token, self.cloudflare_zone_id]):
            return False
        url = f"https://api.cloudflare.com/client/v4/zones/{self.cloudflare_zone_id}/dns_records"
        params = {"name": f"{subdomain}.{self.custom_domain}"}
        try:
            response = requests.get(url, headers=self.cf_headers, params=params)
            if response.status_code != 200:
                return False
            data = response.json()
            if not data.get("success", False):
                return False
            return len(data.get("result", [])) > 0
        except Exception:
            return False

    def create_dns_record(self, subdomain: str, target: str) -> bool:
        if not all([self.cloudflare_api_token, self.cloudflare_zone_id]):
            print(f"Missing DNS credentials: token={bool(self.cloudflare_api_token)}, zone_id={bool(self.cloudflare_zone_id)}")
            return False
        
        full_domain = f"{subdomain}.{self.custom_domain}"
        if self.check_dns_record_exists(subdomain):
            print(f"DNS record for {full_domain} already exists")
            return True
            
        url = f"https://api.cloudflare.com/client/v4/zones/{self.cloudflare_zone_id}/dns_records"
        payload = {"type": "CNAME", "name": subdomain, "content": target, "ttl": 1, "proxied": True}
        
        try:
            response = requests.post(url, headers=self.cf_headers, json=payload)
            print(f"DNS record creation response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                if response_data.get("success", False):
                    print(f"Successfully created DNS record for {full_domain} -> {target}")
                    return True
                else:
                    print(f"DNS creation failed: {response_data.get('errors', 'Unknown error')}")
                    return False
            else:
                print(f"HTTP error during DNS creation: {response.status_code}")
                return False
        except Exception as e:
            print(f"Exception during DNS record creation: {str(e)}")
            return False

    def assign_custom_domain_to_pages(self, project_name: str, subdomain: str) -> bool:
        if not all([self.cloudflare_api_token, self.cloudflare_account_id]):
            print(f"Missing credentials: token={bool(self.cloudflare_api_token)}, account={bool(self.cloudflare_account_id)}")
            return False
        
        full_domain = f"{subdomain}.{self.custom_domain}"
        check_url = f"https://api.cloudflare.com/client/v4/accounts/{self.cloudflare_account_id}/pages/projects/{project_name}/domains"
        
        try:
            # Check if domain already exists
            check_response = requests.get(check_url, headers=self.cf_headers)
            if check_response.status_code == 200:
                existing = check_response.json().get("result", [])
                names = [d.get("name") for d in existing]
                if full_domain in names:
                    print(f"Custom domain {full_domain} already exists for project {project_name}")
                    return True
            else:
                print(f"Failed to check existing domains: {check_response.status_code} - {check_response.text}")
        except Exception as e:
            print(f"Error checking existing domains: {str(e)}")

        # Add custom domain to project
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.cloudflare_account_id}/pages/projects/{project_name}/domains"
        payload = {"name": full_domain}
        
        try:
            response = requests.post(url, headers=self.cf_headers, json=payload)
            print(f"Custom domain assignment response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                if response_data.get("success", False):
                    print(f"Successfully assigned custom domain {full_domain} to project {project_name}")
                    time.sleep(2)  # Allow time for propagation
                    return True
                else:
                    print(f"Domain assignment failed: {response_data.get('errors', 'Unknown error')}")
                    return False
            else:
                print(f"HTTP error during domain assignment: {response.status_code}")
                return False
        except Exception as e:
            print(f"Exception during custom domain assignment: {str(e)}")
            return False

    def prepare_deployment_directory(self, source_path: str) -> tuple:
        try:
            import shutil
            import tempfile
            temp_dir = tempfile.mkdtemp(prefix="deploy_", dir=source_path)
            file_count = 0
            has_index = False
            html_files = []
            for root, dirs, files in os.walk(source_path):
                if os.path.abspath(root) == os.path.abspath(temp_dir):
                    continue
                for file in files:
                    src = os.path.join(root, file)
                    rel = os.path.relpath(src, source_path)
                    dst = os.path.join(temp_dir, rel)
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    shutil.copy2(src, dst)
                    file_count += 1
                    if file.lower().endswith('.html'):
                        html_files.append(rel)
                        if file.lower() == 'index.html':
                            has_index = True
            if not has_index and html_files:
                first_html = html_files[0]
                first_path = os.path.join(temp_dir, first_html)
                index_path = os.path.join(os.path.dirname(first_path), 'index.html')
                if os.path.dirname(first_html) == '':
                    shutil.copy2(first_path, index_path)
                else:
                    with open(os.path.join(temp_dir, 'index.html'), 'w') as f:
                        f.write(f"<meta http-equiv=\"refresh\" content=\"0; url={first_html}\" />")
            elif not has_index and not html_files:
                with open(os.path.join(temp_dir, 'index.html'), 'w') as f:
                    f.write("<html><body><h1>Deployed Files</h1><p>The deployed files don't include an HTML file. This is a placeholder.</p></body></html>")
            return temp_dir, file_count, f"Prepared {file_count} files for deployment"
        except Exception as e:
            return source_path, 0, f"Failed to prepare deployment directory: {str(e)}"

    def _clear_wrangler_cache(self, directory_path: str):
        try:
            node_modules = os.path.join(directory_path, "node_modules")
            if os.path.exists(node_modules):
                cache_dir = os.path.join(node_modules, ".cache", "wrangler")
                if os.path.exists(cache_dir):
                    pages_json = os.path.join(cache_dir, "pages.json")
                    if os.path.exists(pages_json):
                        os.remove(pages_json)
            wrangler_toml = os.path.join(directory_path, "wrangler.toml")
            if not os.path.exists(wrangler_toml):
                try:
                    with open(wrangler_toml, "w") as f:
                        f.write(f"[site]\nname = \"{os.path.basename(directory_path)}\"\n")
                except Exception:
                    pass
        except Exception:
            pass

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
                        "default": True
                    }
                },
                "required": ["name", "directory_path"]
            }
        }
    })
    @usage_example('''
        <!-- 
        IMPORTANT: Only use this tool when:
        1. The user explicitly requests permanent deployment to production
        2. You have a complete, ready-to-deploy directory 
        
        NOTE: If the same name is used, it will redeploy to the same project as before
        -->

        <function_calls>
        <invoke name="deploy">
        <parameter name="name">my-site</parameter>
        <parameter name="directory_path">website</parameter>
        <parameter name="setup_custom_domain">true</parameter>
        </invoke>
        </function_calls>
        ''')
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
                dir_info = await self.sandbox.fs.get_file_info(full_path)
                if not dir_info.is_dir:
                    return self.fail_response(f"'{directory_path}' is not a directory")
            except Exception as e:
                return self.fail_response(f"Directory '{directory_path}' does not exist: {str(e)}")
            
            # Prepare the deployment directory to ensure an index.html exists
            deploy_dir, files_count, _ = self.prepare_deployment_directory(full_path)
            full_path = deploy_dir
            # Clear Wrangler cache
            self._clear_wrangler_cache(full_path)

            # Deploy to Cloudflare Pages directly from the container
            try:
                # Get Cloudflare API token from environment
                if not self.cloudflare_api_token:
                    return self.fail_response("CLOUDFLARE_API_TOKEN environment variable not set")
                # Validate project name for Cloudflare Pages
                if not name or not re.match(r'^[a-z0-9]([a-z0-9-]{0,56}[a-z0-9])?$', name):
                    return self.fail_response("Invalid project name. Project names must be 1-58 lowercase characters or numbers with optional dashes, and cannot start or end with a dash.")

                # Add random prefix to avoid collisions
                import random
                random_digits = str(random.randint(10000, 99999))
                project_name = f"{random_digits}-{name}"

                # Ensure npm project exists and wrangler installed
                init_cmd = "npm init -y"
                await self.sandbox.process.exec(init_cmd, cwd=full_path, timeout=30)
                install_cmd = "npm install wrangler --no-save"
                await self.sandbox.process.exec(install_cmd, cwd=full_path, timeout=120)

                env_vars = {"CLOUDFLARE_API_TOKEN": self.cloudflare_api_token}
                # Create project then deploy (create may already exist)
                create_cmd = f"./node_modules/.bin/wrangler pages project create {project_name} --production-branch production"
                await self.sandbox.process.exec(create_cmd, cwd=full_path, env=env_vars, timeout=60)
                deploy_cmd = f"./node_modules/.bin/wrangler pages deploy . --project-name {project_name} --commit-dirty=true"
                response = await self.sandbox.process.exec(deploy_cmd, cwd=full_path, env=env_vars, timeout=300)

                if response.exit_code != 0:
                    return self.fail_response(f"Deployment failed with exit code {response.exit_code}: {response.result}")

                # Extract deployment URL from wrangler output
                deployment_url = None
                if "https://" in response.result:
                    # Extract URL from wrangler output
                    import re
                    url_match = re.search(r'https://[^\s]+\.pages\.dev', response.result)
                    if url_match:
                        deployment_url = url_match.group(0)
                
                # Build URLs and optionally assign custom domain
                default_url = deployment_url or f"https://{project_name}.pages.dev"
                result = {
                    "message": "✅ Website deployed successfully!",
                    "urls": {"cloudflare": default_url},
                    "output": f"Successfully deployed website to {project_name}\n\n🌐 **Deployment URL:** {default_url}\n📁 **Files processed:** {files_count}",
                }

                if setup_custom_domain:
                    if not all([self.cloudflare_account_id, self.cloudflare_zone_id, self.cloudflare_api_token]):
                        result["custom_domain_status"] = "❌ Missing Cloudflare credentials for custom domain setup"
                    else:
                        sub = self.format_subdomain(project_name)
                        # Correct order: assign domain to Pages first, then Cloudflare creates CNAME automatically
                        assigned = self.assign_custom_domain_to_pages(project_name, sub)
                        if assigned:
                            custom_url = f"https://{sub}.{self.custom_domain}"
                            result["custom_domain_status"] = "✅ Custom domain set up successfully"
                            result["urls"]["custom_domain"] = custom_url
                            result["output"] += f"\n🔗 **Custom Domain:** {custom_url}"
                        else:
                            result["custom_domain_status"] = "❌ Failed to assign custom domain to Pages project"
                            result["output"] += f"\n❌ Custom DNS failed - using Cloudflare URL"

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
            directory_path="website"  # Directory containing static site files
        )
        print(f"Deployment result: {result}")
            
    asyncio.run(test_deploy())

