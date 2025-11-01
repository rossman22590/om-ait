from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from core.agentpress.tool import ToolResult, openapi_schema, usage_example
from core.agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from core.utils.logger import logger

# NOTE: We avoid importing pipedream modules at top-level to prevent
# environment-specific import issues from blocking tool registration.
# We'll lazy-import inside each method.
try:
    from typing import TYPE_CHECKING
    if TYPE_CHECKING:
        from core.pipedream.profile_service import Profile  # type: ignore
except Exception:
    pass


class PipedreamMCPTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)

    async def _load_profile_for_account(self, profile_id: str) -> Optional["Profile"]:
        account_id = await self._get_current_account_id()
        try:
            from core.pipedream.profile_service import get_profile_service  # type: ignore
        except Exception as e:
            logger.error(f"Pipedream profile service not available: {e}")
            return None
        profile_service = get_profile_service()
        profiles = await profile_service.get_profiles(account_id)
        for p in profiles:
            if p.profile_id == profile_id:
                return p
        return None

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_pipedream_profiles",
            "description": "Get all existing Pipedream credential profiles for the current user. Optionally filter by app_slug.",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_slug": {"type": "string", "description": "Optional filter to show only profiles for a specific Pipedream app (e.g., 'slack')"}
                },
                "required": []
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="get_pipedream_profiles">
        <parameter name="app_slug">slack</parameter>
        </invoke>
        </function_calls>
    ''')
    async def get_pipedream_profiles(self, app_slug: Optional[str] = None) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            try:
                from core.pipedream.profile_service import get_profile_service  # type: ignore
            except Exception as e:
                return self.fail_response("Pipedream profile service not available in this environment")
            profile_service = get_profile_service()
            profiles = await profile_service.get_profiles(account_id)

            filtered: List[Profile] = []
            for p in profiles:
                # Pipedream profiles use mcp_qualified_name starting with 'pipedream:'
                if not p.mcp_qualified_name.startswith("pipedream:"):
                    continue
                if app_slug and p.app_slug != app_slug:
                    continue
                filtered.append(p)

            formatted = []
            for p in filtered:
                formatted.append({
                    "profile_id": p.profile_id,
                    "profile_name": p.profile_name,
                    "display_name": p.display_name,
                    "mcp_qualified_name": p.mcp_qualified_name,
                    "app_slug": p.app_slug,
                    "app_name": p.app_name,
                    "external_user_id": p.external_user_id,
                    "enabled_tools": p.enabled_tools,
                    "is_connected": p.is_connected,
                    "is_default": p.is_default,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None
                })

            return self.success_response({
                "message": f"Found {len(formatted)} Pipedream credential profile(s)",
                "profiles": formatted,
                "total_count": len(formatted)
            })
        except Exception as e:
            logger.error(f"Error getting Pipedream profiles: {e}", exc_info=True)
            return self.fail_response(f"Error getting Pipedream profiles: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_pipedream_profile",
            "description": "Create a new Pipedream credential profile for a specific app. Returns profile info and a suggested next step to generate a connection link.",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_slug": {"type": "string", "description": "The Pipedream app slug (e.g., 'slack')"},
                    "profile_name": {"type": "string", "description": "A name for this credential profile"},
                    "description": {"type": "string"},
                    "is_default": {"type": "boolean", "default": False},
                    "oauth_app_id": {"type": "string", "description": "Optional specific OAuth app ID to bind"},
                    "enabled_tools": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["app_slug", "profile_name"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="create_pipedream_profile">
        <parameter name="app_slug">slack</parameter>
        <parameter name="profile_name">Work Slack</parameter>
        </invoke>
        </function_calls>
    ''')
    async def create_pipedream_profile(
        self,
        app_slug: str,
        profile_name: str,
        description: Optional[str] = None,
        is_default: bool = False,
        oauth_app_id: Optional[str] = None,
        enabled_tools: Optional[List[str]] = None,
    ) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            try:
                from core.pipedream.profile_service import get_profile_service  # type: ignore
                from core.pipedream.app_service import get_app_service  # type: ignore
            except Exception:
                return self.fail_response("Pipedream services not available in this environment")
            profile_service = get_profile_service()
            app_service = get_app_service()

            # Resolve app name from slug
            app = await app_service.get_app_by_slug(app_slug)
            app_name = app.name if app else app_slug

            new_profile = await profile_service.create_profile(
                account_id=account_id,
                profile_name=profile_name,
                app_slug=app_slug,
                app_name=app_name,
                description=description,
                is_default=is_default,
                oauth_app_id=oauth_app_id,
                enabled_tools=enabled_tools or [],
            )

            return self.success_response({
                "message": f"Created Pipedream credential profile '{profile_name}' for {app_name}",
                "profile": {
                    "profile_id": new_profile.profile_id,
                    "profile_name": new_profile.profile_name,
                    "display_name": new_profile.display_name,
                    "mcp_qualified_name": new_profile.mcp_qualified_name,
                    "app_slug": new_profile.app_slug,
                    "app_name": new_profile.app_name,
                    "external_user_id": new_profile.external_user_id,
                    "enabled_tools": new_profile.enabled_tools,
                    "is_connected": new_profile.is_connected,
                    "is_default": new_profile.is_default,
                },
                "next_step": "Use create_pipedream_connection_link to generate the user connection link."
            })
        except Exception as e:
            logger.error(f"Error creating Pipedream profile: {e}", exc_info=True)
            return self.fail_response(f"Error creating Pipedream profile: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "discover_pipedream_mcp_servers",
            "description": "Discover available Pipedream MCP servers for a specific credential profile (uses the profile's external_user_id). Returns server URLs and available tools.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {"type": "string", "description": "Pipedream credential profile ID"},
                    "app_slug": {"type": "string", "description": "Optional app slug to filter (e.g., 'slack')"}
                },
                "required": ["profile_id"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="discover_pipedream_mcp_servers">
        <parameter name="profile_id">profile-uuid-123</parameter>
        <parameter name="app_slug">slack</parameter>
        </invoke>
        </function_calls>
    ''')
    async def discover_pipedream_mcp_servers(self, profile_id: str, app_slug: Optional[str] = None) -> ToolResult:
        try:
            profile = await self._load_profile_for_account(profile_id)
            if not profile:
                return self.fail_response("Pipedream profile not found for this account")

            try:
                from core.pipedream.mcp_service import get_mcp_service, ExternalUserId, AppSlug  # type: ignore
            except Exception:
                return self.fail_response("Pipedream MCP service not available in this environment")
            mcp_service = get_mcp_service()
            external_user = ExternalUserId(profile.external_user_id)
            app = AppSlug(app_slug) if app_slug else None

            servers = await mcp_service.discover_servers_for_user(external_user, app)

            server_data: List[Dict[str, Any]] = []
            for server in servers:
                tools_data = []
                for tool in server.available_tools:
                    tools_data.append({
                        "name": tool.name,
                        "description": tool.description,
                        "inputSchema": tool.input_schema,
                    })
                server_data.append({
                    "app_slug": server.app_slug,
                    "app_name": server.app_name,
                    "server_url": server.server_url,
                    "project_id": server.project_id,
                    "environment": server.environment,
                    "external_user_id": server.external_user_id,
                    "oauth_app_id": server.oauth_app_id,
                    "status": server.status.value,
                    "available_tools": tools_data,
                    "error": server.error_message,
                })

            return self.success_response({
                "message": f"Discovered {len(server_data)} Pipedream MCP server(s)",
                "mcp_servers": server_data,
                "count": len(server_data),
            })
        except Exception as e:
            logger.error(f"Error discovering Pipedream MCP servers: {e}", exc_info=True)
            return self.fail_response(f"Error discovering Pipedream MCP servers: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "create_pipedream_connection_link",
            "description": "Create a Pipedream Connect token and link for the given profile. The link is used by the user to connect their account to the specified app.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {"type": "string", "description": "Pipedream credential profile ID"},
                    "app_slug": {"type": "string", "description": "Optional app slug to preselect in the connect flow"}
                },
                "required": ["profile_id"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="create_pipedream_connection_link">
        <parameter name="profile_id">profile-uuid-123</parameter>
        <parameter name="app_slug">slack</parameter>
        </invoke>
        </function_calls>
    ''')
    async def create_pipedream_connection_link(self, profile_id: str, app_slug: Optional[str] = None) -> ToolResult:
        try:
            profile = await self._load_profile_for_account(profile_id)
            if not profile:
                return self.fail_response("Pipedream profile not found for this account")

            try:
                from core.pipedream.connection_token_service import get_connection_token_service, ExternalUserId, AppSlug  # type: ignore
            except Exception:
                return self.fail_response("Pipedream connection service not available in this environment")
            token_service = get_connection_token_service()
            external_user = ExternalUserId(profile.external_user_id)
            # Default to the profile's app_slug if none was provided by caller
            effective_app_slug = app_slug or getattr(profile, 'app_slug', None)
            app = AppSlug(effective_app_slug) if effective_app_slug else None

            result = await token_service.create(external_user, app)

            link_url = result.get("connect_link_url")
            response = {
                "message": "Created Pipedream connection link",
                # Preserve existing key and add UI-expected alias
                "link": link_url,
                "connection_link": link_url,
                "token": result.get("token"),
                "external_user_id": profile.external_user_id,
                "app": effective_app_slug,
                "expires_at": result.get("expires_at"),
                "instructions": "Click the connection link to authorize, then return to Agent Builder to continue."
            }

            return self.success_response(response)
        except Exception as e:
            logger.error(f"Error creating Pipedream connection link: {e}", exc_info=True)
            return self.fail_response(f"Error creating Pipedream connection link: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "connect_pipedream_mcp",
            "description": "Create and test an MCP connection for the given Pipedream profile and app. Also dynamically registers the tools in the current runtime.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {"type": "string", "description": "Pipedream credential profile ID"},
                    "app_slug": {"type": "string", "description": "App slug to connect (e.g., 'slack')"},
                    "oauth_app_id": {"type": "string", "description": "Optional specific OAuth app ID to use"}
                },
                "required": ["profile_id", "app_slug"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="connect_pipedream_mcp">
        <parameter name="profile_id">profile-uuid-123</parameter>
        <parameter name="app_slug">slack</parameter>
        </invoke>
        </function_calls>
    ''')
    async def connect_pipedream_mcp(self, profile_id: str, app_slug: str, oauth_app_id: Optional[str] = None) -> ToolResult:
        try:
            profile = await self._load_profile_for_account(profile_id)
            if not profile:
                return self.fail_response("Pipedream profile not found for this account")

            try:
                from core.pipedream.mcp_service import get_mcp_service, ExternalUserId, AppSlug  # type: ignore
            except Exception:
                return self.fail_response("Pipedream MCP service not available in this environment")
            mcp_service = get_mcp_service()
            external_user = ExternalUserId(profile.external_user_id)
            app = AppSlug(app_slug)

            server = await mcp_service.create_connection(external_user, app, oauth_app_id)

            # Save to agent config (same format as Composio)
            try:
                account_id = await self._get_current_account_id()
                client = await self.db.client
                
                agent_result = await client.table('agents').select('current_version_id').eq('agent_id', self.agent_id).execute()
                if not agent_result.data or not agent_result.data[0].get('current_version_id'):
                    logger.warning(f"Could not find agent config for agent {self.agent_id}")
                else:
                    version_result = await client.table('agent_versions')\
                        .select('config')\
                        .eq('version_id', agent_result.data[0]['current_version_id'])\
                        .maybe_single()\
                        .execute()
                    
                    if version_result.data and version_result.data.get('config'):
                        current_config = version_result.data['config']
                        current_tools = current_config.get('tools', {})
                        current_custom_mcps = current_tools.get('custom_mcp', [])
                        
                        new_mcp_config = {
                            'name': profile.app_name or app_slug,
                            'type': 'pipedream',
                            'config': {
                                'profile_id': profile_id,
                                'app_slug': app_slug,
                                'external_user_id': profile.external_user_id,
                                'oauth_app_id': oauth_app_id
                            },
                            'enabledTools': profile.enabled_tools or []
                        }
                        
                        updated_mcps = [mcp for mcp in current_custom_mcps 
                                      if not (mcp.get('type') == 'pipedream' and mcp.get('config', {}).get('profile_id') == profile_id)]
                        
                        updated_mcps.append(new_mcp_config)
                        
                        current_tools['custom_mcp'] = updated_mcps
                        current_config['tools'] = current_tools
                        
                        from core.versioning.version_service import get_version_service
                        version_service = await get_version_service()
                        new_version = await version_service.create_version(
                            agent_id=self.agent_id,
                            user_id=account_id,
                            system_prompt=current_config.get('system_prompt', ''),
                            configured_mcps=current_config.get('tools', {}).get('mcp', []),
                            custom_mcps=updated_mcps,
                            agentpress_tools=current_config.get('tools', {}).get('agentpress', {}),
                            change_description=f"Connected Pipedream {app_slug} with {len(profile.enabled_tools or [])} tools"
                        )
                        
                        # Update agent's current_version_id to the newly created version
                        client = await self.db.client
                        update_result = await client.table('agents').update({
                            'current_version_id': new_version.version_id,
                            'updated_at': datetime.now(timezone.utc).isoformat()
                        }).eq('agent_id', self.agent_id).execute()
                        
                        logger.info(f"✅ Saved Pipedream profile {profile_id} ({app_slug}) to agent version {new_version.version_id}")
                        logger.info(f"✅ Updated agent {self.agent_id} to use new version {new_version.version_id}")
                        logger.info(f"✅ Database update result: {update_result.data if hasattr(update_result, 'data') else 'success'}")
            except Exception as e:
                logger.warning(f"Could not save Pipedream profile to agent config: {e}", exc_info=True)

            # Dynamically register tools (standard MCP of type 'pipedream')
            try:
                from core.tools.mcp_tool_wrapper import MCPToolWrapper

                # If the profile doesn't have explicit enabled tools, enable all tools returned by the server
                server_tool_names = [t.name for t in getattr(server, 'available_tools', [])] if server else []
                enabled_tools = (profile.enabled_tools or []) or server_tool_names

                # Register as a standard MCP (NOT custom). Custom handler doesn't support 'pipedream'.
                mcp_config_for_wrapper = {
                    'name': profile.app_name or app_slug,
                    'qualifiedName': f"pipedream:{app_slug}",
                    'type': 'pipedream',
                    'config': {
                        'profile_id': profile_id,
                        'app_slug': app_slug,
                        'external_user_id': profile.external_user_id,
                        'oauth_app_id': oauth_app_id
                    },
                    'enabledTools': enabled_tools,
                    'instructions': ''
                }

                mcp_wrapper_instance = MCPToolWrapper(mcp_configs=[mcp_config_for_wrapper])
                await mcp_wrapper_instance.initialize_and_register_tools()
                updated_schemas = mcp_wrapper_instance.get_schemas()

                for method_name, schema_list in updated_schemas.items():
                    for schema in schema_list:
                        self.thread_manager.tool_registry.tools[method_name] = {
                            "instance": mcp_wrapper_instance,
                            "schema": schema
                        }
                        logger.info(f"Dynamically registered Pipedream MCP tool: {method_name}")
            except Exception as e:
                logger.warning(f"Could not dynamically register Pipedream MCP tools: {e}")

            tools_data = []
            for tool in server.available_tools:
                tools_data.append({
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.input_schema,
                })

            return self.success_response({
                "message": f"Connected to Pipedream MCP for {server.app_name}",
                "mcp_config": {
                    "app_slug": server.app_slug,
                    "app_name": server.app_name,
                    "server_url": server.server_url,
                    "project_id": server.project_id,
                    "environment": server.environment,
                    "external_user_id": server.external_user_id,
                    "oauth_app_id": server.oauth_app_id,
                    "status": server.status.value,
                    "available_tools": tools_data
                }
            })
        except Exception as e:
            logger.error(f"Error connecting Pipedream MCP: {e}", exc_info=True)
            return self.fail_response(f"Error connecting Pipedream MCP: {str(e)}")

    def get_schemas(self):
        """Get tool schemas. Override to include auto-discovery of Pipedream tools.
        
        This follows the same pattern as Composio - auto-discovering and registering
        tools from enabled Pipedream profiles when the agent loads.
        """
        # Get base schemas from parent class
        schemas = super().get_schemas()
        
        # Auto-discover Pipedream profiles for this agent and register their tools
        # This will be called during tool registration in run.py
        try:
            self._auto_register_pipedream_tools_sync()
        except Exception as e:
            logger.debug(f"Could not auto-register Pipedream tools: {e}")
        
        return schemas
    
    def _auto_register_pipedream_tools_sync(self) -> None:
        """Synchronously auto-discover and register Pipedream profiles for this agent.
        
        This discovers any Pipedream profiles linked to this agent and registers
        their tools in the tool_registry immediately, without needing async.
        """
        try:
            # This is called during tool registration, which is synchronous
            # We can't do async DB queries here, so profiles must be loaded
            # through connect_pipedream_mcp when the user connects an app
            
            logger.debug(f"Pipedream MCP tool registered for agent {self.agent_id}")
            logger.debug("Note: Pipedream tools will be available once profiles are connected via connect_pipedream_mcp")
            
        except Exception as e:
            logger.debug(f"Pipedream auto-registration: {e}")

    async def configure_profile_for_agent(self, profile_id: str) -> ToolResult:
        """Configure a Pipedream profile for the current agent and register its tools.
        
        This mirrors the Composio credential_profile_tool.configure_profile_for_agent method.
        It loads a Pipedream profile and automatically registers all its tools in the 
        tool registry, making them available for the agent to use.
        
        Args:
            profile_id: ID of the Pipedream profile to configure
            
        Returns:
            ToolResult with configuration status
        """
        try:
            profile = await self._load_profile_for_account(profile_id)
            if not profile:
                return self.fail_response(f"Pipedream profile {profile_id} not found")
            
            app_slug = profile.app_slug
            oauth_app_id = profile.oauth_app_id
            
            # Connect and register the MCP tools
            result = await self.connect_pipedream_mcp(profile_id, app_slug, oauth_app_id)
            
            if result.success:
                logger.info(f"✅ Configured Pipedream profile {profile_id} ({app_slug}) for agent {self.agent_id}")
            else:
                logger.error(f"❌ Failed to configure Pipedream profile {profile_id}: {result.output}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in configure_profile_for_agent: {e}", exc_info=True)
            return self.fail_response(f"Error configuring profile: {str(e)}")
