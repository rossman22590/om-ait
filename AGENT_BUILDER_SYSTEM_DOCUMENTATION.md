# Agent Builder System - Comprehensive Documentation

## Overview

The Agent Builder System is a sophisticated AI-powered interface that allows users to configure and customize AI agents through natural language conversation. It consists of a frontend chat interface, backend AI tools, and a comprehensive system prompt that guides the AI in building agents.

## 🏗️ Architecture Overview

### System Components

1. **Frontend Chat Interface** (`AgentBuilderChat` component)
2. **Backend Agent Builder Tools** (Python tools for configuration)
3. **Agent Builder System Prompt** (AI instructions)
4. **API Endpoints** for managing the builder session
5. **React Query Hooks** for state management
6. **Real-time Streaming** for AI responses
7. **UI Components** (Chat input, message display, tool calls)
8. **Styling & Layout** (Tailwind CSS, responsive design)

### Data Flow

```
User Input → Frontend Chat → API Call → Backend Agent Run → AI Builder Prompt → Tool Execution → Response Streaming → Frontend Update
```

## 📁 Key Files and Their Purposes

### Frontend Components

#### 1. Agent Builder Chat Component
**File**: `frontend/src/components/agents/agent-builder-chat.tsx`

**Purpose**: Main chat interface where users interact with the AI builder

**Key Features**:
- Handles message submission and streaming
- Manages agent builder session state
- Integrates with React Query for data management
- Provides real-time feedback during agent configuration
- Responsive design with proper loading states

**Key Functions**:
```typescript
const handleSubmitFirstMessage = async (message: string, options?: {...}) => {
  // Initiates first agent builder session
  const agentFormData = new FormData();
  agentFormData.append('prompt', message);
  agentFormData.append('is_agent_builder', String(true));
  agentFormData.append('target_agent_id', agentId);
  
  const result = await initiateAgentMutation.mutateAsync(agentFormData);
};

const handleSubmitMessage = useCallback(async (message: string, options?: {...}) => {
  // Handles subsequent messages in existing session
  // Manages streaming responses and tool execution
});

const handleStopAgent = useCallback(async () => {
  setAgentStatus('idle');
  await stopStreaming();
  if (agentRunId) {
    try {
      await stopAgentMutation.mutateAsync(agentRunId);
    } catch (error) {
      console.error('[AGENT BUILDER] Error stopping agent:', error);
    }
  }
}, [stopStreaming, agentRunId, stopAgentMutation]);
```

**UI Structure**:
```typescript
return (
  <div className="flex flex-col h-full">
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto scrollbar-hide px-8">
        <ThreadContent
          messages={messages || []}
          streamingTextContent={streamingTextContent}
          streamingToolCall={streamingToolCall}
          agentStatus={agentStatus}
          handleToolClick={() => { }}
          handleOpenFileViewer={handleOpenFileViewer}
          streamHookStatus={streamHookStatus}
          agentName="Agent Builder"
          agentAvatar={undefined}
          emptyStateComponent={
            <div className="mt-6 flex flex-col items-center text-center text-muted-foreground/80">
              <div className="flex w-20 aspect-square items-center justify-center rounded-2xl bg-muted-foreground/10 p-4 mb-4">
                <div className="text-4xl">🤖</div>
              </div>
              <p className='w-[60%] text-2xl'>I'm your <span className='text-primary/80 font-semibold'>Agent Builder</span>. Describe the exact workflows and tasks you want to automate, and I'll configure your agent to handle them.</p>
            </div>
          }
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
    <div className="flex-shrink-0 md:pb-4 px-8">
      <ChatInput
        ref={chatInputRef}
        onSubmit={threadId ? handleSubmitMessage : handleSubmitFirstMessage}
        loading={isSubmitting}
        placeholder="Tell me how you'd like to configure your agent..."
        value={inputValue}
        onChange={setInputValue}
        disabled={isSubmitting}
        isAgentRunning={agentStatus === 'running' || agentStatus === 'connecting'}
        onStopAgent={handleStopAgent}
        agentName="Agent Builder"
        hideAttachments={true}
        bgColor='bg-muted-foreground/10'
        hideAgentSelection={true}
      />
    </div>
  </div>
);
```

#### 2. Chat Input Component
**File**: `frontend/src/components/thread/chat-input/chat-input.tsx`

**Purpose**: Handles user input and message submission

**Key Features**:
- Text input with placeholder
- Submit button with loading states
- Stop agent functionality
- File attachment support (hidden in agent builder)
- Responsive design

**Props Interface**:
```typescript
interface ChatInputProps {
  onSubmit: (message: string, options?: any) => void;
  loading?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isAgentRunning?: boolean;
  onStopAgent?: () => void;
  agentName?: string;
  hideAttachments?: boolean;
  bgColor?: string;
  hideAgentSelection?: boolean;
}
```

#### 3. Thread Content Component
**File**: `frontend/src/components/thread/content/ThreadContent.tsx`

**Purpose**: Displays chat messages and streaming content

**Key Features**:
- Message rendering with different types
- Streaming text display
- Tool call visualization
- Agent status indicators
- Empty state handling

**Props Interface**:
```typescript
interface ThreadContentProps {
  messages: UnifiedMessage[];
  streamingTextContent?: string;
  streamingToolCall?: ParsedContent | null;
  agentStatus?: string;
  handleToolClick: (tool: any) => void;
  handleOpenFileViewer: () => void;
  streamHookStatus?: string;
  agentName?: string;
  agentAvatar?: string;
  emptyStateComponent?: React.ReactNode;
}
```

#### 4. Message Components
**File**: `frontend/src/components/thread/messages/`

**Purpose**: Individual message rendering components

**Key Components**:
- `UserMessage.tsx` - User message display
- `AssistantMessage.tsx` - AI response display
- `ToolCallMessage.tsx` - Tool execution display
- `SystemMessage.tsx` - System status messages

**Message Types**:
```typescript
export type UnifiedMessage = {
  message_id: string;
  thread_id: string;
  type: 'user' | 'assistant' | 'system' | 'tool_call';
  is_llm_message: boolean;
  content: string;
  metadata: string;
  created_at: string;
  updated_at: string;
  sequence: number;
  agent_id?: string;
  agents?: {
    name: string;
    avatar?: string;
    avatar_color?: string;
  };
};
```

#### 5. React Query Hooks

**File**: `frontend/src/hooks/react-query/agents/use-agents.ts`

**Key Hooks**:
```typescript
// Fetches agent builder chat history
export const useAgentBuilderChatHistory = (agentId: string) =>
  createQueryHook(
    agentKeys.builderChatHistory(agentId),
    () => getAgentBuilderChatHistory(agentId),
    {
      enabled: !!agentId,
      retry: 1,
    }
  )();

// Manages streaming chat sessions
export const useAgentBuilderChat = () => {
  const sendMessage = useCallback(async (
    request: AgentBuilderChatRequest,
    callbacks: {
      onData: (data: AgentBuilderStreamData) => void;
      onComplete: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    // Handles streaming chat with abort controller
  });
  
  return { sendMessage, cancelStream };
};
```

**File**: `frontend/src/hooks/react-query/dashboard/use-initiate-agent.ts`

**Purpose**: Initiates new agent builder sessions

```typescript
export const useInitiateAgentWithInvalidation = () => {
  const queryClient = useQueryClient();
  return useInitiateAgentMutation({
    onSuccess: (data) => {
      // Invalidate related queries after successful initiation
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: threadKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.agents });
    },
  });
};
```

#### 6. Agent Stream Hook

**File**: `frontend/src/hooks/useAgentStream.ts`

**Purpose**: Manages real-time streaming of AI responses and tool calls

**Key Features**:
- Real-time message streaming
- Tool call handling
- Status management
- Error handling

```typescript
export function useAgentStream(
  callbacks: AgentStreamCallbacks,
  threadId: string,
  setMessages: (messages: UnifiedMessage[]) => void,
): UseAgentStreamResult {
  // Manages streaming state and provides streaming controls
}
```

### API Layer

#### 7. API Client Functions

**File**: `frontend/src/lib/api.ts`

**Key Functions**:
```typescript
export const initiateAgent = async (formData: FormData): Promise<InitiateAgentResponse> => {
  // Starts agent builder session
  const response = await fetch(`${API_URL}/agent/initiate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: formData,
    cache: 'no-store',
  });
  
  // Handles billing errors, run limits, and other edge cases
  if (response.status === 402) {
    throw new BillingError(response.status, detail);
  }
  
  if (response.status === 429) {
    throw new AgentRunLimitError(response.status, detail);
  }
  
  return await response.json();
};
```

**File**: `frontend/src/hooks/react-query/agents/utils.ts`

**Key Functions**:
```typescript
// Fetches agent builder chat history
export const getAgentBuilderChatHistory = async (agentId: string): Promise<{messages: any[], thread_id: string | null}> => {
  const response = await fetch(`${API_URL}/agents/${agentId}/builder-chat-history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  
  return await response.json();
};

// Starts streaming agent builder chat
export const startAgentBuilderChat = async (
  request: AgentBuilderChatRequest,
  onData: (data: AgentBuilderStreamData) => void,
  onComplete: () => void,
  signal?: AbortSignal
): Promise<void> => {
  // Handles streaming chat with proper error handling
};
```

#### 8. React Query Keys

**File**: `frontend/src/hooks/react-query/agents/keys.ts`

**Purpose**: Manages cache keys for React Query

```typescript
export const agentKeys = createQueryKeys({
  all: agentKeysBase,
  lists: () => [...agentKeysBase, 'list'] as const,
  list: (filters?: Record<string, any>) => [...agentKeysBase, 'list', filters] as const,
  details: () => [...agentKeysBase, 'detail'] as const,
  detail: (id: string) => [...agentKeysBase, 'detail', id] as const,
  threadAgents: () => [...agentKeysBase, 'thread-agent'] as const,
  threadAgent: (threadId: string) => [...agentKeysBase, 'thread-agent', threadId] as const,
  builderChatHistory: (agentId: string) => [...agentKeysBase, 'builderChatHistory', agentId] as const,
  limits: () => [...agentKeysBase, 'limits'] as const,
});
```

### Backend Core

#### 9. Agent Builder System Prompt

**File**: `backend/agent/agent_builder_prompt.py`

**Purpose**: Contains comprehensive AI instructions for building agents

**Key Features**:
- Dual platform integration (Composio + Pipedream)
- Tool selection guidance
- Workflow and automation instructions
- Integration protocols and error handling

**Critical System Directives**:
```python
AGENT_BUILDER_SYSTEM_PROMPT = f"""You are an AI Agent Builder Assistant developed by the Machine team - think of yourself as a friendly, knowledgeable guide who's genuinely excited to help users create amazing AI agents! 🚀

🚨 **CRITICAL SYSTEM DIRECTIVE** 🚨
You have access to BOTH Composio AND Pipedream credential tools. When any integration fails with Composio, you MUST immediately try Pipedream. Never suggest alternatives or manual setup - always use the dual platform system.

## 🚨 CRITICAL INTEGRATION PROTOCOL 🚨
**MANDATORY DUAL PLATFORM FALLBACK FOR ALL INTEGRATIONS:**

**❌ WRONG BEHAVIOR (NEVER DO THIS):**
- Try Composio → Fails → Suggest alternatives ❌
- Try Composio → Fails → Give Composio link anyway ❌  
- Try Composio → Fails → Say "authentication required" ❌

**✅ CORRECT BEHAVIOR (ALWAYS DO THIS):**
1. User requests integration (e.g., "fal_ai", "gmail", etc.)
2. Try `create_credential_profile(app_slug, profile_name)` first
3. **IF IT FAILS** with ANY error containing "Toolkit" and "not found" → IMMEDIATELY try `create_pipedream_profile(app_slug, profile_name)`
4. **NEVER GIVE UP** - one of the two platforms will work
5. **NEVER SUGGEST ALTERNATIVES** - always use the dual platform system
"""
```

#### 10. Agent Run Engine

**File**: `backend/agent/run.py`

**Key Methods**:
```python
def _register_agent_builder_tools(self, agent_id: str, disabled_tools: List[str]):
    """Register agent builder tools."""
    from agent.tools.agent_builder_tools.agent_config_tool import AgentConfigTool
    from agent.tools.agent_builder_tools.mcp_search_tool import MCPSearchTool
    from agent.tools.agent_builder_tools.credential_profile_tool import CredentialProfileTool
    from agent.tools.agent_builder_tools.workflow_tool import WorkflowTool
    from agent.tools.agent_builder_tools.trigger_tool import TriggerTool
    from agent.tools.agent_builder_tools.pipedream_mcp_tool import PipedreamMCPTool
    from services.supabase import DBConnection
    
    db = DBConnection()
    
    agent_builder_tools = [
        ('agent_config_tool', AgentConfigTool),
        ('mcp_search_tool', MCPSearchTool),
        ('credential_profile_tool', CredentialProfileTool),
        ('workflow_tool', WorkflowTool),
        ('trigger_tool', TriggerTool),
        ('pipedream_mcp_tool', PipedreamMCPTool),
    ]
    
    for tool_name, tool_class in agent_builder_tools:
        if tool_name not in disabled_tools:
            try:
                self.thread_manager.add_tool(
                    tool_class, 
                    thread_manager=self.thread_manager, 
                    db_connection=db, 
                    agent_id=agent_id
                )
                logger.info(f"✅ Successfully registered {tool_name}")
            except Exception as e:
                logger.error(f"❌ Failed to register {tool_name}: {e}")
```

**Prompt Selection Logic**:
```python
if is_agent_builder:
    system_content = get_agent_builder_prompt()  # Specialized builder instructions
elif agent_config and agent_config.get('system_prompt'):
    system_content = agent_config['system_prompt'].strip()  # Custom agent prompt
else:
    system_content = default_system_content  # Default Suna prompt
```

#### 11. API Endpoints

**File**: `backend/agent/api.py`

**Key Endpoints**:
```python
@router.post("/agent/initiate", response_model=InitiateAgentResponse)
async def initiate_agent_with_files(
    prompt: str = Form(...),
    model_name: Optional[str] = Form(None),
    enable_thinking: Optional[bool] = Form(False),
    reasoning_effort: Optional[str] = Form("low"),
    stream: Optional[bool] = Form(True),
    enable_context_manager: Optional[bool] = Form(False),
    agent_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    is_agent_builder: Optional[bool] = Form(False),
    target_agent_id: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Initiate a new agent session with optional file attachments."""
    
    # Store agent builder metadata if this is an agent builder session
    if is_agent_builder:
        thread_data["metadata"] = {
            "is_agent_builder": True,
            "target_agent_id": target_agent_id
        }
        logger.debug(f"Storing agent builder metadata in thread: target_agent_id={target_agent_id}")
        structlog.contextvars.bind_contextvars(
            target_agent_id=target_agent_id,
        )
    
    # Run agent in background with agent builder mode
    run_agent_background.send(
        agent_run_id=agent_run_id, 
        thread_id=thread_id, 
        instance_id=instance_id,
        project_id=project_id,
        model_name=model_name,
        enable_thinking=enable_thinking, 
        reasoning_effort=reasoning_effort,
        stream=stream, 
        enable_context_manager=enable_context_manager,
        agent_config=agent_config,
        is_agent_builder=is_agent_builder,
        target_agent_id=target_agent_id,
        request_id=request_id,
    )
    
    return {"thread_id": thread_id, "agent_run_id": agent_run_id}

@router.get("/agents/{agent_id}/builder-chat-history")
async def get_agent_builder_chat_history(
    agent_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get agent builder chat history for a specific agent."""
    
    # Find agent builder threads
    agent_builder_threads = []
    for thread in threads_result.data:
        metadata = thread.get('metadata', {})
        if (metadata.get('is_agent_builder') and 
            metadata.get('target_agent_id') == agent_id):
            agent_builder_threads.append({
                'thread_id': thread['thread_id'],
                'created_at': thread['created_at']
            })
    
    if not agent_builder_threads:
        return {"messages": [], "thread_id": None}
    
    # Use latest thread for chat history
    latest_thread_id = agent_builder_threads[0]['thread_id']
    messages_result = await client.table('messages').select('*').eq('thread_id', latest_thread_id).neq('type', 'status').neq('type', 'summary').order('created_at', desc=False).execute()
    
    return {
        "messages": messages_result.data,
        "thread_id": latest_thread_id
    }
```

### Agent Builder Tools

#### 12. Tool Registry

**File**: `backend/agent/tools/agent_builder_tools/__init__.py`

**Purpose**: Manages registration of all builder tools

```python
class AgentBuilderToolRegistry:
    """Registry for managing and registering agent builder tools."""
    
    def __init__(self):
        self.tools: Dict[str, Type[AgentBuilderBaseTool]] = {
            'agent_config': AgentConfigTool,
            'mcp_search': MCPSearchTool,
            'credential_profile': CredentialProfileTool,
            'workflow': WorkflowTool,
            'trigger': TriggerTool,
            'pipedream_mcp': PipedreamMCPTool,
        }
    
    def register_all_tools(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        """Register all agent builder tools with the thread manager."""
        logger.debug(f"Registering {len(self.tools)} agent builder tools")
        
        for tool_name, tool_class in self.tools.items():
            try:
                thread_manager.add_tool(
                    tool_class,
                    thread_manager=thread_manager,
                    db_connection=db_connection,
                    agent_id=agent_id
                )
                logger.debug(f"Successfully registered agent builder tool: {tool_name}")
            except Exception as e:
                logger.error(f"Failed to register agent builder tool {tool_name}: {e}")

# Create a global registry instance
agent_builder_registry = AgentBuilderToolRegistry()
```

#### 13. Core Tools

**File**: `backend/agent/tools/agent_builder_tools/base_tool.py`

**Purpose**: Base class for all agent builder tools

```python
class AgentBuilderBaseTool(Tool):
    def __init__(self, thread_manager: ThreadManager, db_connection, agent_id: str):
        super().__init__()
        self.thread_manager = thread_manager
        self.db = db_connection
        self.agent_id = agent_id
    
    async def _get_current_account_id(self) -> str:
        """Get current account ID from thread context."""
        try:
            context_vars = structlog.contextvars.get_contextvars()
            thread_id = context_vars.get('thread_id')
            
            if not thread_id:
                raise ValueError("No thread_id available from execution context")
            
            client = await self.db.client
            
            thread_result = await client.table('threads').select('account_id').eq('thread_id', thread_id).limit(1).execute()
            if not thread_result.data:
                raise ValueError(f"Could not find thread with ID: {thread_id}")
            
            account_id = thread_result.data[0]['account_id']
            if not account_id:
                raise ValueError("Thread has no associated account_id")
            
            return account_id
            
        except Exception as e:
            logger.error(f"Error getting current account_id: {e}")
            raise

    async def _get_agent_data(self) -> Optional[dict]:
        """Get current agent data."""
        try:
            client = await self.db.client
            result = await client.table('agents').select('*').eq('agent_id', self.agent_id).execute()
            
            if not result.data:
                return None
                
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error getting agent data: {e}")
            return None
```

## 🎨 UI Styling & Components

### Tailwind CSS Classes Used

**Layout & Spacing**:
```css
flex flex-col h-full          /* Main container */
flex-1 overflow-hidden        /* Content area */
flex-shrink-0                 /* Fixed footer */
px-8                         /* Horizontal padding */
md:pb-4                      /* Responsive bottom padding */
```

**Chat Interface**:
```css
overflow-y-auto scrollbar-hide  /* Scrollable chat area */
bg-muted-foreground/10         /* Input background */
text-muted-foreground/80       /* Secondary text */
text-primary/80                /* Primary accent text */
```

**Responsive Design**:
```css
w-[60%]                       /* Responsive width */
aspect-square                 /* Square aspect ratio */
rounded-2xl                   /* Rounded corners */
```

### Component Hierarchy

```
AgentBuilderChat
├── ThreadContent (messages display)
│   ├── UserMessage
│   ├── AssistantMessage
│   ├── ToolCallMessage
│   └── SystemMessage
└── ChatInput (user input)
    ├── TextInput
    ├── SubmitButton
    └── StopButton
```

### State Management

**Local State**:
```typescript
const [threadId, setThreadId] = useState<string | null>(null);
const [agentRunId, setAgentRunId] = useState<string | null>(null);
const [messages, setMessages] = useState<UnifiedMessage[]>([]);
const [inputValue, setInputValue] = useState('');
const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'connecting' | 'error'>('idle');
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
const [isSubmitting, setIsSubmitting] = useState(false);
const [hasStartedConversation, setHasStartedConversation] = useState(false);
```

**React Query State**:
```typescript
const chatHistoryQuery = useAgentBuilderChatHistory(agentId);
const agentRunsQuery = useAgentRunsQuery(threadId || '');
const queryClient = useQueryClient();
```

## 🔄 How the System Works

### 1. Session Initialization

1. **User starts agent builder chat** in the frontend
2. **Frontend calls** `initiateAgent()` with `is_agent_builder=true`
3. **Backend creates thread** with agent builder metadata
4. **Agent run starts** with specialized system prompt
5. **Tools are registered** for the AI to use

### 2. Tool Registration Flow

```python
# In backend/agent/run.py
def _register_agent_builder_tools(self, agent_id: str, disabled_tools: List[str]):
    agent_builder_tools = [
        ('agent_config_tool', AgentConfigTool),
        ('mcp_search_tool', MCPSearchTool),
        ('credential_profile_tool', CredentialProfileTool),
        ('workflow_tool', WorkflowTool),
        ('trigger_tool', TriggerTool),
        ('pipedream_mcp_tool', PipedreamMCPTool),
    ]
    
    for tool_name, tool_class in agent_builder_tools:
        if tool_name not in disabled_tools:
            self.thread_manager.add_tool(tool_class, ...)
```

### 3. Prompt Selection Logic

```python
# In backend/agent/run.py
if is_agent_builder:
    system_content = get_agent_builder_prompt()  # Specialized builder instructions
elif agent_config and agent_config.get('system_prompt'):
    system_content = agent_config['system_prompt'].strip()  # Custom agent prompt
else:
    system_content = default_system_content  # Default Suna prompt
```

### 4. AI Builder Workflow

The AI follows this process:

1. **Analyze user request** - Understand what agent capabilities are needed
2. **Search for integrations** - Find relevant MCP servers and tools
3. **Set up credentials** - Create credential profiles for external services
4. **Configure tools** - Enable appropriate AgentPress tools
5. **Create workflows** - Build multi-step automation processes
6. **Set up triggers** - Configure scheduled or event-based execution
7. **Update agent** - Apply all changes to the agent configuration

### 5. Dual Platform Integration

The system automatically handles both Composio and Pipedream:

- **Composio**: Enterprise apps (GitHub, Linear, Notion) with OAuth
- **Pipedream**: Workflow apps, AI services, custom integrations
- **Automatic Fallback**: If one platform fails, it tries the other

```python
# Example dual platform workflow
User: "Connect fal_ai"
→ Try: create_credential_profile("fal_ai", "My Fal Profile")
→ Gets: "Toolkit 'fal_ai' not found"  
→ IMMEDIATELY try: create_pipedream_profile("fal_ai", "My Fal Profile")
→ Success!
```

## 🎯 Key Features

### Smart Configuration Merging

When adding new MCP servers:
- **MCPs are automatically merged** with existing ones
- **All previously configured integrations are preserved**
- **Smart duplicate detection** prevents conflicts
- **Version management** tracks all changes

### Workflow and Automation

- **Multi-step workflows** for complex processes
- **Scheduled triggers** for regular execution
- **Event-based triggers** for real-time automation
- **Conditional logic** for intelligent decision making

### Tool Selection Guidance

The AI automatically recommends tools based on user needs:

- **Data Analysis**: `data_providers_tool`, `sb_files_tool`
- **Research**: `web_search_tool`, `browser_tool`
- **Development**: `sb_shell_tool`, `sb_files_tool`
- **Communication**: `data_providers_tool` for APIs
- **File Management**: `sb_files_tool`, `sb_vision_tool`

## 🚀 User Experience Flow

### 1. Discovery Phase
- User describes what they want their agent to do
- AI analyzes requirements and asks clarifying questions
- AI recommends specific tools and integrations

### 2. Research Phase
- AI searches for available MCP servers
- AI explains capabilities and setup requirements
- AI presents options with usage statistics

### 3. Building Phase
- AI guides through credential setup
- AI configures tools and creates workflows
- AI sets up automation and scheduling
- AI tests and verifies configuration

### 4. Success Phase
- AI provides usage instructions
- AI shows examples of how to interact
- AI suggests future enhancements

## ⚠️ Critical System Requirements

### Mandatory Error Recovery

1. **Dual Platform Fallback**: If Composio fails, immediately try Pipedream
2. **No Alternatives**: Never suggest workarounds - use the dual platform system
3. **Automatic Fallback**: Never stop at errors - always try the other platform

### Tool Registration Requirements

1. **All tools must be registered** before use
2. **Proper error handling** for failed registrations
3. **Logging and monitoring** for debugging

### Configuration Integrity

1. **Version management** for all changes
2. **Smart merging** of configurations
3. **Validation** of all inputs
4. **Rollback capability** if needed

## 🔧 Technical Dependencies

### Frontend Dependencies

- **Next.js 15+** with App Router
- **React 18+** with TypeScript
- **@tanstack/react-query** for state management
- **@supabase/supabase-js** for authentication
- **Tailwind CSS** for styling

### Backend Dependencies

- **FastAPI 0.115+** for API framework
- **Python 3.11+** with type hints
- **AgentPress** for tool execution
- **LiteLLM** for AI model integration
- **Dramatiq** for background processing

### Database Dependencies

- **Supabase** for database and auth
- **PostgreSQL** with Row Level Security
- **Redis** for caching and sessions

## 🚨 Troubleshooting

### Common Issues

1. **Tool Registration Failures**
   - Check tool dependencies
   - Verify database connections
   - Review error logs

2. **Streaming Issues**
   - Check WebSocket connections
   - Verify agent run status
   - Review streaming configuration

3. **Integration Failures**
   - Verify platform credentials
   - Check API rate limits
   - Review error responses

### Debug Information

- **Frontend logs**: Browser console and React DevTools
- **Backend logs**: Python logging and structlog
- **Database logs**: Supabase query logs
- **Streaming logs**: WebSocket connection status

## 📚 Additional Resources

### Related Documentation

- **AgentPress Framework**: Tool execution system
- **MCP Protocol**: Model Context Protocol integration
- **Supabase Integration**: Database and authentication
- **React Query**: State management patterns

### Code Examples

- **Tool Implementation**: See individual tool files
- **API Integration**: See API endpoint implementations
- **Frontend Patterns**: See React component examples
- **State Management**: See React Query hook patterns

---

## 🚨 RESTORATION CHECKLIST

If you need to restore the Agent Builder System, use this checklist:

### Frontend Components ✅
- [ ] `AgentBuilderChat` component with all state management
- [ ] `ChatInput` component with proper props
- [ ] `ThreadContent` component for message display
- [ ] Message type components (User, Assistant, Tool Call)
- [ ] React Query hooks for data management
- [ ] Agent stream hook for real-time updates

### Backend Tools ✅
- [ ] Agent builder system prompt
- [ ] Tool registration in agent run engine
- [ ] All agent builder tool classes
- [ ] API endpoints for initiation and chat history
- [ ] Dual platform integration logic

### Styling & UI ✅
- [ ] Tailwind CSS classes for layout
- [ ] Responsive design patterns
- [ ] Loading states and error handling
- [ ] Empty state components
- [ ] Proper component hierarchy

### State Management ✅
- [ ] React Query for server state
- [ ] Local state for UI interactions
- [ ] Streaming state management
- [ ] Error state handling
- [ ] Cache invalidation patterns

This documentation provides a comprehensive overview of how the Agent Builder System works with the Agent Builder Chat. It covers all the key files, architecture, implementation details, UI components, and usage patterns. If any part of the system is removed or needs to be restored, this document serves as a complete reference for rebuilding the functionality.
