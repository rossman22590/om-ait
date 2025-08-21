import json
from typing import Optional
from agentpress.tool import ToolResult, openapi_schema, usage_example
from agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from composio_integration.toolkit_service import ToolkitService
from composio_integration.composio_service import get_integration_service
from utils.logger import logger
from pipedream.app_service import get_app_service


class MCPSearchTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_mcp_servers",
            "description": "Search for Composio toolkits based on user requirements. Use this when the user wants to add MCP tools to their agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query for finding relevant Composio toolkits (e.g., 'linear', 'github', 'database', 'search')"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of toolkits to return (default: 10)",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="search_mcp_servers">
        <parameter name="query">linear</parameter>
        <parameter name="limit">5</parameter>
        </invoke>
        </function_calls>
        ''')
    async def search_mcp_servers(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10
    ) -> ToolResult:
        try:
            toolkit_service = ToolkitService()
            integration_service = get_integration_service()
            
            if query:
                toolkits_response = await integration_service.search_toolkits(query, category=category)
                toolkits = toolkits_response.get("items", [])
            else:
                toolkits_response = await toolkit_service.list_toolkits(limit=limit, category=category)
                toolkits = toolkits_response.get("items", [])
            
            # Respect limit for Composio first to preserve existing behavior
            if len(toolkits) > limit:
                toolkits = toolkits[:limit]
            
            formatted_toolkits = []
            for toolkit in toolkits:
                formatted_toolkits.append({
                    "name": toolkit.name,
                    "toolkit_slug": toolkit.slug,
                    "description": toolkit.description or f"Toolkit for {toolkit.name}",
                    "logo_url": toolkit.logo or '',
                    "auth_schemes": toolkit.auth_schemes,
                    "tags": toolkit.tags,
                    "categories": toolkit.categories
                })
            
            # If we still have room, supplement with Pipedream app search results
            remaining = max(0, limit - len(formatted_toolkits))
            if remaining > 0 and query:
                try:
                    app_service = get_app_service()
                    pd_result = await app_service.search_apps(query=query, category=category)
                    pd_apps = pd_result.get("apps", [])
                    pd_formatted = []
                    for app in pd_apps:
                        try:
                            pd_formatted.append({
                                "name": getattr(app, "name", ""),
                                "toolkit_slug": getattr(app, "slug", ""),
                                "description": getattr(app, "description", None) or f"Toolkit for {getattr(app, 'name', '')}",
                                "logo_url": getattr(app, "logo_url", "") or '',
                                # Map single auth_type into list to match Composio schema
                                "auth_schemes": [getattr(getattr(app, "auth_type", None), "value", "").upper()] if getattr(app, "auth_type", None) else [],
                                "tags": getattr(app, "tags", []) or [],
                                # Pipedream has a single category string; wrap as list
                                "categories": [getattr(app, "category", "")] if getattr(app, "category", None) else []
                            })
                        except Exception as map_err:
                            logger.warning(f"Failed to map Pipedream app to toolkit shape: {map_err}")
                            continue
                    if pd_formatted:
                        formatted_toolkits.extend(pd_formatted[:remaining])
                except Exception as pd_err:
                    # Non-fatal: if Pipedream search fails, keep Composio-only results
                    logger.warning(f"Pipedream search failed or unavailable: {pd_err}")
            
            if not formatted_toolkits:
                return ToolResult(
                    success=False,
                    output=json.dumps([], ensure_ascii=False)
                )
            
            return ToolResult(
                success=True,
                output=json.dumps(formatted_toolkits[:limit], ensure_ascii=False)
            )
                
        except Exception as e:
            return self.fail_response(f"Error searching MCP toolkits: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_app_details",
            "description": "Get detailed information about a specific Composio toolkit, including available tools and authentication requirements.",
            "parameters": {
                "type": "object",
                "properties": {
                    "toolkit_slug": {
                        "type": "string",
                        "description": "The toolkit slug to get details for (e.g., 'github', 'linear', 'slack')"
                    }
                },
                "required": ["toolkit_slug"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="get_app_details">
        <parameter name="toolkit_slug">github</parameter>
        </invoke>
        </function_calls>
        ''')
    async def get_app_details(self, toolkit_slug: str) -> ToolResult:
        try:
            toolkit_service = ToolkitService()
            # Detect pipedream-qualified slug and normalize
            is_pipedream = toolkit_slug.startswith("pipedream:")
            pd_slug = toolkit_slug.split(":", 1)[1] if is_pipedream else toolkit_slug

            toolkit_data = None
            if not is_pipedream:
                # Try Composio first (preserve existing behavior)
                toolkit_data = await toolkit_service.get_toolkit_by_slug(toolkit_slug)

            if toolkit_data:
                formatted_toolkit = {
                    "name": toolkit_data.name,
                    "toolkit_slug": toolkit_data.slug,
                    "description": toolkit_data.description or f"Toolkit for {toolkit_data.name}",
                    "logo_url": toolkit_data.logo or '',
                    "auth_schemes": toolkit_data.auth_schemes,
                    "tags": toolkit_data.tags,
                    "categories": toolkit_data.categories
                }
                result = {
                    "message": f"Retrieved details for {formatted_toolkit['name']}",
                    "toolkit": formatted_toolkit,
                    "supports_oauth": "OAUTH2" in toolkit_data.auth_schemes,
                    "auth_schemes": toolkit_data.auth_schemes
                }
                return self.success_response(result)

            # Fallback or explicit Pipedream slug: fetch from Pipedream app service
            try:
                app_service = get_app_service()
                app = await app_service.get_app_by_slug(pd_slug)
            except Exception as e:
                app = None
                logger.warning(f"Pipedream get_app_by_slug failed for '{pd_slug}': {e}")

            if not app:
                return self.fail_response(f"Could not find toolkit details for '{toolkit_slug}'")

            # Map Pipedream App -> toolkit shape
            auth_value = getattr(getattr(app, "auth_type", None), "value", "")
            formatted_toolkit = {
                "name": getattr(app, "name", pd_slug),
                "toolkit_slug": getattr(app, "slug", pd_slug),
                "description": getattr(app, "description", None) or f"Toolkit for {getattr(app, 'name', pd_slug)}",
                "logo_url": getattr(app, "logo_url", "") or '',
                "auth_schemes": [auth_value.upper()] if auth_value else [],
                "tags": getattr(app, "tags", []) or [],
                "categories": [getattr(app, "category", "")] if getattr(app, "category", None) else []
            }

            result = {
                "message": f"Retrieved details for {formatted_toolkit['name']}",
                "toolkit": formatted_toolkit,
                "supports_oauth": (auth_value == "oauth"),
                "auth_schemes": formatted_toolkit["auth_schemes"]
            }
            return self.success_response(result)
            
        except Exception as e:
            return self.fail_response(f"Error getting toolkit details: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "discover_user_mcp_servers",
            "description": "Discover available MCP tools for a specific Composio profile. Use this to see what MCP tools are available for a connected profile.",
            "parameters": {
                "type": "object",
                "properties": {
                    "profile_id": {
                        "type": "string",
                        "description": "The profile ID from the Composio credential profile"
                    }
                },
                "required": ["profile_id"]
            }
        }
    })
    @usage_example('''
        <function_calls>
        <invoke name="discover_user_mcp_servers">
        <parameter name="profile_id">profile-uuid-123</parameter>
        </invoke>
        </function_calls>
        ''')
    async def discover_user_mcp_servers(self, profile_id: str) -> ToolResult:
        try:
            account_id = await self._get_current_account_id()
            from composio_integration.composio_profile_service import ComposioProfileService
            from mcp_module.mcp_service import mcp_service
            
            profile_service = ComposioProfileService(self.db)
            profiles = await profile_service.get_profiles(account_id)
            
            profile = None
            for p in profiles:
                if p.profile_id == profile_id:
                    profile = p
                    break
            
            if not profile:
                return self.fail_response(f"Composio profile {profile_id} not found")
            
            if not profile.is_connected:
                return self.fail_response("Profile is not connected yet. Please connect the profile first.")
            
            if not profile.mcp_url:
                return self.fail_response("Profile has no MCP URL")
            
            result = await mcp_service.discover_custom_tools(
                request_type="http",
                config={"url": profile.mcp_url}
            )
            
            if not result.success:
                return self.fail_response(f"Failed to discover tools: {result.message}")
            
            available_tools = result.tools or []
            
            return self.success_response({
                "message": f"Found {len(available_tools)} MCP tools available for {profile.toolkit_name} profile '{profile.profile_name}'",
                "profile_info": {
                    "profile_id": profile.profile_id,
                    "profile_name": profile.profile_name,
                    "toolkit_name": profile.toolkit_name,
                    "toolkit_slug": profile.toolkit_slug,
                    "is_connected": profile.is_connected
                },
                "tools": available_tools,
                "total_tools": len(available_tools)
            })
            
        except Exception as e:
            return self.fail_response(f"Error discovering MCP tools: {str(e)}")