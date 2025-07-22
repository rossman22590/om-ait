import json
from typing import Optional, Dict, Any
from agentpress.tool import ToolResult, openapi_schema, xml_schema
from agentpress.thread_manager import ThreadManager
from .base_tool import AgentBuilderBaseTool
from utils.logger import logger
from agent.config_helper import build_unified_config
from agent.versioning.facade import version_manager


class AgentConfigTool(AgentBuilderBaseTool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__(thread_manager, db_connection, agent_id)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "update_agent",
            "description": "Update the agent's configuration including name, description, system prompt, tools, and MCP servers. Call this whenever the user wants to modify any aspect of the agent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the agent. Should be descriptive and indicate the agent's purpose."
                    },
                    "description": {
                        "type": "string",
                        "description": "A brief description of what the agent does and its capabilities."
                    },
                    "system_prompt": {
                        "type": "string",
                        "description": "The system instructions that define the agent's behavior, expertise, and approach. This should be comprehensive and well-structured."
                    },
                    "agentpress_tools": {
                        "type": "object",
                        "description": "Configuration for AgentPress tools. Each key is a tool name, and the value is an object with 'enabled' (boolean) and 'description' (string) properties.",
                        "additionalProperties": {
                            "type": "object",
                            "properties": {
                                "enabled": {"type": "boolean"},
                                "description": {"type": "string"}
                            }
                        }
                    },
                    "configured_mcps": {
                        "type": "array",
                        "description": "List of configured MCP servers for external integrations.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "qualifiedName": {"type": "string"},
                                "config": {"type": "object"},
                                "enabledTools": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            }
                        }
                    },
                    "avatar": {
                        "type": "string",
                        "description": "Emoji to use as the agent's avatar."
                    },
                    "avatar_color": {
                        "type": "string",
                        "description": "Hex color code for the agent's avatar background."
                    }
                },
                "required": []
            }
        }
    })
    @xml_schema(
        tag_name="update-agent",
        mappings=[
            {"param_name": "name", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "description", "node_type": "element", "path": "description", "required": False},
            {"param_name": "system_prompt", "node_type": "element", "path": "system_prompt", "required": False},
            {"param_name": "agentpress_tools", "node_type": "element", "path": "agentpress_tools", "required": False},
            {"param_name": "configured_mcps", "node_type": "element", "path": "configured_mcps", "required": False},
            {"param_name": "avatar", "node_type": "attribute", "path": ".", "required": False},
            {"param_name": "avatar_color", "node_type": "attribute", "path": ".", "required": False}
        ],
        example='''
        <function_calls>
        <invoke name="update_agent">
        <parameter name="name">Research Assistant</parameter>
        <parameter name="description">An AI assistant specialized in conducting research and providing comprehensive analysis</parameter>
        <parameter name="system_prompt">You are a research assistant with expertise in gathering, analyzing, and synthesizing information. Your approach is thorough and methodical...</parameter>
        <parameter name="agentpress_tools">{"web_search": {"enabled": true, "description": "Search the web for information"}, "sb_files": {"enabled": true, "description": "Read and write files"}}</parameter>
        <parameter name="avatar">🔬</parameter>
        <parameter name="avatar_color">#4F46E5</parameter>
        </invoke>
        </function_calls>
        '''
    )
    async def update_agent(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        system_prompt: Optional[str] = None,
        agentpress_tools: Optional[Dict[str, Dict[str, Any]]] = None,
        configured_mcps: Optional[list] = None,
        avatar: Optional[str] = None,
        avatar_color: Optional[str] = None
    ) -> ToolResult:
        try:
            client = await self.db.client
            
            agent_result = await client.table('agents').select('*').eq('agent_id', self.agent_id).execute()
            if not agent_result.data:
                return self.fail_response("Agent not found")
            
            current_agent = agent_result.data[0]
            
            # Separate versioned fields from non-versioned fields
            versioned_fields = {}
            non_versioned_fields = {}
            
            if system_prompt is not None:
                versioned_fields["system_prompt"] = system_prompt
            if agentpress_tools is not None:
                formatted_tools = {}
                for tool_name, tool_config in agentpress_tools.items():
                    if isinstance(tool_config, dict):
                        formatted_tools[tool_name] = {
                            "enabled": tool_config.get("enabled", False),
                            "description": tool_config.get("description", "")
                        }
                versioned_fields["agentpress_tools"] = formatted_tools
            if configured_mcps is not None:
                if isinstance(configured_mcps, str):
                    configured_mcps = json.loads(configured_mcps)
                versioned_fields["configured_mcps"] = configured_mcps
            
            if name is not None:
                non_versioned_fields["name"] = name
            if description is not None:
                non_versioned_fields["description"] = description
            if avatar is not None:
                non_versioned_fields["avatar"] = avatar
            if avatar_color is not None:
                non_versioned_fields["avatar_color"] = avatar_color
                
            if not versioned_fields and not non_versioned_fields:
                return self.fail_response("No fields provided to update")
            
            # Handle versioned fields using version_manager
            if versioned_fields:
                # Get user_id for versioning
                user_id = await self._get_current_account_id()
                
                # Initialize version manager with database connection
                from agent.versioning.infrastructure.dependencies import set_db_connection
                set_db_connection(self.db)
                
                # Generate change description
                change_parts = []
                if "system_prompt" in versioned_fields:
                    change_parts.append("system prompt")
                if "agentpress_tools" in versioned_fields:
                    change_parts.append("tools configuration")
                if "configured_mcps" in versioned_fields:
                    change_parts.append("MCP servers")
                
                change_description = f"Updated {', '.join(change_parts)}"
                
                # Create new version with versioned fields
                version_result = await version_manager.create_version(
                    agent_id=self.agent_id,
                    user_id=user_id,
                    system_prompt=versioned_fields.get("system_prompt", current_agent.get('system_prompt', '')),
                    configured_mcps=versioned_fields.get("configured_mcps", current_agent.get('configured_mcps', [])),
                    custom_mcps=current_agent.get('custom_mcps', []),
                    agentpress_tools=versioned_fields.get("agentpress_tools", current_agent.get('agentpress_tools', {})),
                    change_description=change_description
                )
                
                if not version_result:
                    return self.fail_response("Failed to create new version")
                
                # Update agent record with new version info
                agent_update = {
                    "current_version_id": version_result["version_id"],
                    "version_count": current_agent.get("version_count", 0) + 1
                }
                
                if non_versioned_fields:
                    agent_update.update(non_versioned_fields)
                
                result = await client.table('agents').update(agent_update).eq('agent_id', self.agent_id).execute()
            else:
                # Only non-versioned fields, direct update
                result = await client.table('agents').update(non_versioned_fields).eq('agent_id', self.agent_id).execute()
            
            if not result.data:
                return self.fail_response("Failed to update agent")

            # Get the updated agent data
            updated_agent = result.data[0]
            
            # Include version info in response if versioned fields were updated
            response_data = {
                "message": "Agent updated successfully",
                "updated_fields": list(versioned_fields.keys()) + list(non_versioned_fields.keys()),
                "agent": updated_agent
            }
            
            if versioned_fields:
                response_data["version_info"] = {
                    "version_id": updated_agent.get("current_version_id"),
                    "version_count": updated_agent.get("version_count")
                }

            return self.success_response(response_data)
            
        except Exception as e:
            logger.error(f"Error updating agent {self.agent_id}: {str(e)}")
            return self.fail_response(f"Error updating agent: {str(e)}")

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_current_agent_config",
            "description": "Get the current configuration of the agent being edited. Use this to check what's already configured before making updates.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    @xml_schema(
        tag_name="get-current-agent-config",
        mappings=[],
        example='''
        <function_calls>
        <invoke name="get_current_agent_config">
        </invoke>
        </function_calls>
        '''
    )
    async def get_current_agent_config(self) -> ToolResult:
        try:
            agent = await self._get_agent_data()
            
            if not agent:
                return self.fail_response("Agent not found")
            
            config_summary = {
                "agent_id": agent["agent_id"],
                "name": agent.get("name", "Untitled Agent"),
                "description": agent.get("description", "No description set"),
                "system_prompt": agent.get("system_prompt", "No system prompt set"),
                "avatar": agent.get("avatar", "🤖"),
                "avatar_color": agent.get("avatar_color", "#6B7280"),
                "agentpress_tools": agent.get("agentpress_tools", {}),
                "configured_mcps": agent.get("configured_mcps", []),
                "custom_mcps": agent.get("custom_mcps", []),
                "created_at": agent.get("created_at"),
                "updated_at": agent.get("updated_at")
            }
            
            tools_count = len([t for t, cfg in config_summary["agentpress_tools"].items() if cfg.get("enabled")])
            mcps_count = len(config_summary["configured_mcps"])
            custom_mcps_count = len(config_summary["custom_mcps"])
            
            return self.success_response({
                "summary": f"Agent '{config_summary['name']}' has {tools_count} tools enabled, {mcps_count} MCP servers configured, and {custom_mcps_count} custom MCP integrations.",
                "configuration": config_summary
            })
            
        except Exception as e:
            return self.fail_response(f"Error getting agent configuration: {str(e)}") 