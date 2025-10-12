# Pipedream Integration System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Authentication Flow](#authentication-flow)
7. [MCP Integration](#mcp-integration)
8. [API Reference](#api-reference)
9. [Usage Examples](#usage-examples)
10. [Reimplementation Guide](#reimplementation-guide)

---

## Overview

The Pipedream Integration System provides seamless connectivity to 2,100+ apps through Pipedream's MCP (Model Context Protocol) servers. It enables agents to interact with external services like Gmail, Slack, GitHub, and more through OAuth-authenticated connections.

### Key Features
- 🔌 **2,100+ App Integrations**: Connect to any Pipedream-supported app
- 🔐 **OAuth Authentication**: Secure OAuth 2.0 flow with token management
- 🛠️ **MCP Server Discovery**: Automatic discovery of available tools per app
- 👤 **Profile Management**: Multiple profiles per app with isolated credentials
- 🔄 **Token Refresh**: Automatic OAuth token refresh handling
- 🎯 **Tool Selection**: Granular control over which tools are enabled
- 🔒 **Encrypted Storage**: Secure credential storage with encryption

### Comparison with Composio

| Feature | Pipedream | Composio |
|---------|-----------|----------|
| **Apps** | 2,100+ | 150+ |
| **Auth** | OAuth 2.0 | OAuth 2.0 |
| **MCP** | Native support | Native support |
| **Pricing** | Free tier available | Paid only |
| **Tool Discovery** | Automatic | Manual |
| **Profile Isolation** | Yes | Yes |
| **Status** | ✅ Active (May be removed in future) | ✅ Active |

**Current Strategy:** Both Composio and Pipedream are supported simultaneously. Users can choose either integration based on their needs. Pipedream may be removed in a future update but can be easily restored using this documentation.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pipedream  │  │   Profile    │  │   Tools      │      │
│  │   Connector  │  │   Manager    │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Profile    │  │  Connection  │  │     MCP      │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │     App      │  │    Token     │                        │
│  │   Service    │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   pipedream  │  │   pipedream  │  │   agent      │      │
│  │   _profiles  │  │ _connections │  │  _versions   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pipedream  │  │     OAuth    │  │     MCP      │      │
│  │     API      │  │   Providers  │  │   Servers    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### `pipedream_profiles`
Stores Pipedream integration profiles with encrypted credentials.

```sql
CREATE TABLE pipedream_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id),
    mcp_qualified_name VARCHAR(255) NOT NULL,
    profile_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    app_slug VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    external_user_id VARCHAR(255) NOT NULL,
    encrypted_config TEXT NOT NULL,  -- Encrypted JSON with OAuth tokens
    enabled_tools TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    is_connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,
    
    CONSTRAINT unique_profile_per_account_app 
        UNIQUE (account_id, app_slug, profile_name)
);

CREATE INDEX idx_pipedream_profiles_account ON pipedream_profiles(account_id);
CREATE INDEX idx_pipedream_profiles_app ON pipedream_profiles(app_slug);
CREATE INDEX idx_pipedream_profiles_external_user ON pipedream_profiles(external_user_id);
```

#### `pipedream_connections`
Tracks OAuth connection status and metadata.

```sql
CREATE TABLE pipedream_connections (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES pipedream_profiles(profile_id) ON DELETE CASCADE,
    external_user_id VARCHAR(255) NOT NULL,
    app_slug VARCHAR(255) NOT NULL,
    oauth_app_id VARCHAR(255),
    connection_status VARCHAR(50) DEFAULT 'pending',
    auth_type VARCHAR(50) DEFAULT 'oauth',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pipedream_connections_profile ON pipedream_connections(profile_id);
CREATE INDEX idx_pipedream_connections_external_user ON pipedream_connections(external_user_id);
```

### Encrypted Config Structure

```json
{
    "external_user_id": "user_abc123",
    "oauth_app_id": "oauth_xyz789",
    "app_slug": "gmail",
    "app_name": "Gmail",
    "access_token": "encrypted_token_here",
    "refresh_token": "encrypted_refresh_token",
    "token_expiry": "2025-12-31T23:59:59Z",
    "scopes": ["gmail.send", "gmail.read"],
    "metadata": {
        "email": "user@example.com"
    }
}
```

---

## Backend Implementation

### Service Architecture

#### 1. ProfileService
**Location:** `backend/core/pipedream/profile_service.py`

Manages Pipedream profiles with encrypted credential storage.

**Key Methods:**

```python
class ProfileService:
    async def create_profile(
        self,
        account_id: UUID,
        profile_name: str,
        app_slug: str,
        app_name: str,
        external_user_id: str,
        oauth_app_id: Optional[str] = None,
        enabled_tools: List[str] = [],
        is_default: bool = False
    ) -> Profile
    
    async def get_profiles(
        self,
        account_id: UUID,
        app_slug: Optional[str] = None
    ) -> List[Profile]
    
    async def get_profile_by_id(
        self,
        profile_id: UUID,
        account_id: UUID
    ) -> Profile
    
    async def update_profile(
        self,
        profile_id: UUID,
        account_id: UUID,
        **updates
    ) -> Profile
    
    async def delete_profile(
        self,
        profile_id: UUID,
        account_id: UUID
    ) -> bool
    
    async def get_profile_credentials(
        self,
        profile_id: UUID,
        account_id: UUID
    ) -> Dict[str, Any]
```

**Profile Model:**
```python
@dataclass
class Profile:
    profile_id: UUID
    account_id: UUID
    mcp_qualified_name: str
    profile_name: str
    display_name: str
    app_slug: str
    app_name: str
    external_user_id: str
    enabled_tools: List[str]
    is_active: bool
    is_default: bool
    is_connected: bool
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None
```

#### 2. ConnectionService
**Location:** `backend/core/pipedream/connection_service.py`

Handles OAuth connection flow and token management.

**Key Methods:**

```python
class ConnectionService:
    async def create_connection_token(
        self,
        account_id: UUID,
        app_slug: Optional[str] = None
    ) -> Dict[str, Any]
    
    async def get_connections(
        self,
        account_id: UUID,
        external_user_id: Optional[str] = None
    ) -> List[Connection]
    
    async def update_connection_status(
        self,
        connection_id: UUID,
        status: str
    ) -> Connection
    
    async def refresh_token(
        self,
        profile_id: UUID
    ) -> Dict[str, str]
```

**Connection Model:**
```python
@dataclass
class Connection:
    connection_id: UUID
    profile_id: Optional[UUID]
    external_user_id: str
    app_slug: str
    oauth_app_id: Optional[str]
    connection_status: str
    auth_type: AuthType
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
```

#### 3. AppService
**Location:** `backend/core/pipedream/app_service.py`

Discovers and manages Pipedream apps.

**Key Methods:**

```python
class AppService:
    async def search_apps(
        self,
        query: str,
        limit: int = 20
    ) -> List[App]
    
    async def get_app_by_slug(
        self,
        app_slug: str
    ) -> Optional[App]
    
    async def get_popular_apps(
        self,
        limit: int = 10
    ) -> List[App]
```

**App Model:**
```python
@dataclass
class App:
    slug: str
    name: str
    description: str
    icon_url: Optional[str]
    auth_type: str
    categories: List[str]
    is_verified: bool
```

#### 4. MCPService
**Location:** `backend/core/pipedream/mcp_service.py`

Discovers and connects to Pipedream MCP servers.

**Key Methods:**

```python
class MCPService:
    async def discover_mcp_servers(
        self,
        app_slug: Optional[str] = None,
        oauth_app_id: Optional[str] = None
    ) -> List[MCPServer]
    
    async def discover_mcp_servers_for_profile(
        self,
        external_user_id: str,
        app_slug: Optional[str] = None
    ) -> List[MCPServer]
    
    async def connect_to_mcp(
        self,
        app_slug: str,
        oauth_app_id: Optional[str] = None,
        external_user_id: Optional[str] = None
    ) -> Dict[str, Any]
    
    async def get_mcp_tools(
        self,
        mcp_server_url: str
    ) -> List[MCPTool]
```

**MCP Models:**
```python
@dataclass
class MCPServer:
    name: str
    qualified_name: str
    url: str
    app_slug: str
    oauth_app_id: Optional[str]
    tools: List[MCPTool]
    status: ConnectionStatus
    metadata: Dict[str, Any]

@dataclass
class MCPTool:
    name: str
    description: str
    input_schema: Dict[str, Any]
    qualified_name: str
```

#### 5. ConnectionTokenService
**Location:** `backend/core/pipedream/connection_token_service.py`

Manages temporary connection tokens for OAuth flow.

**Key Methods:**

```python
class ConnectionTokenService:
    async def create_token(
        self,
        account_id: UUID,
        app_slug: Optional[str] = None
    ) -> Dict[str, Any]
    
    async def validate_token(
        self,
        token: str
    ) -> bool
    
    async def get_token_metadata(
        self,
        token: str
    ) -> Dict[str, Any]
```

---

## Frontend Implementation

### Component Hierarchy

```
PipedreamConnector
├── PipedreamConnectionsSection
│   ├── PipedreamConnectButton
│   ├── ProfileList
│   └── ProfileCard
├── PipedreamToolsManager
│   ├── ToolSelector
│   └── ToolCard
└── PipedreamRegistry
    ├── AppSearch
    ├── AppGrid
    └── AppCard
```

### Key Components

#### 1. PipedreamConnector
**Location:** `frontend/src/components/agents/pipedream/pipedream-connector.tsx`

Main integration component for Pipedream connections.

**Props:**
```typescript
interface PipedreamConnectorProps {
    agentId: string;
    accountId: string;
    onProfilesChange?: (profiles: PipedreamProfile[]) => void;
    initialProfiles?: PipedreamProfile[];
}
```

#### 2. PipedreamConnectionsSection
**Location:** `frontend/src/components/agents/pipedream/pipedream-connections-section.tsx`

Displays and manages Pipedream connections.

**Features:**
- List all connected profiles
- Connect new apps
- Manage existing connections
- Enable/disable tools per profile

#### 3. PipedreamToolsManager
**Location:** `frontend/src/components/agents/mcp/pipedream-tools-manager.tsx`

Manages tool selection for Pipedream profiles.

**Features:**
- Display available tools per app
- Enable/disable individual tools
- Tool search and filtering
- Bulk tool management

#### 4. PipedreamRegistry
**Location:** `frontend/src/components/agents/pipedream/pipedream-registry.tsx`

App discovery and browsing interface.

**Features:**
- Search 2,100+ apps
- Filter by category
- View app details
- Quick connect button

### Frontend Hooks

#### usePipedreamProfiles
**Location:** `frontend/src/hooks/react-query/pipedream/use-pipedream-profiles.ts`

```typescript
const {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    refreshProfiles
} = usePipedreamProfiles(accountId, appSlug);
```

#### usePipedreamTools
**Location:** `frontend/src/hooks/react-query/agents/use-pipedream-tools.ts`

```typescript
const {
    tools,
    isLoading,
    discoverTools,
    enableTool,
    disableTool
} = usePipedreamTools(profileId);
```

#### usePipedream
**Location:** `frontend/src/hooks/react-query/pipedream/use-pipedream.ts`

```typescript
const {
    apps,
    connections,
    mcpServers,
    searchApps,
    createConnection,
    discoverMCP
} = usePipedream(accountId);
```

---

## Authentication Flow

### OAuth 2.0 Connection Flow

```
1. User clicks "Connect App"
   ↓
2. Frontend requests connection token
   POST /api/pipedream/connection-tokens
   ↓
3. Backend generates token and external_user_id
   Returns: { token, link, external_user_id }
   ↓
4. Frontend opens OAuth popup
   window.open(link, '_blank')
   ↓
5. User authorizes on Pipedream
   ↓
6. Pipedream redirects with auth code
   ↓
7. Backend exchanges code for tokens
   ↓
8. Backend creates encrypted profile
   Stores: access_token, refresh_token
   ↓
9. Frontend receives profile
   Updates UI with connected status
   ↓
10. MCP server discovery
    Discovers available tools
```

### Token Refresh Flow

```
1. Tool execution fails with 401
   ↓
2. Backend detects expired token
   ↓
3. Backend calls refresh_token()
   Uses stored refresh_token
   ↓
4. Pipedream returns new tokens
   ↓
5. Backend updates encrypted_config
   Stores new access_token
   ↓
6. Backend retries tool execution
   Uses new access_token
   ↓
7. Success - tool executes
```

---

## MCP Integration

### MCP Server Discovery

Pipedream MCP servers are automatically discovered based on:
- **App Slug**: e.g., `gmail`, `slack`, `github`
- **OAuth App ID**: Unique identifier for OAuth app
- **External User ID**: User-specific connection identifier

**Discovery Process:**
```python
# 1. Discover MCP servers for an app
mcp_servers = await mcp_service.discover_mcp_servers(
    app_slug="gmail",
    oauth_app_id="oauth_123"
)

# 2. Get tools from MCP server
tools = await mcp_service.get_mcp_tools(
    mcp_server_url=mcp_servers[0].url
)

# 3. Store in profile
profile = await profile_service.create_profile(
    account_id=account_id,
    app_slug="gmail",
    enabled_tools=[tool.name for tool in tools]
)
```

### MCP Qualified Names

Pipedream uses a specific naming convention:
```
pipedream:{app_slug}:{oauth_app_id}
```

**Examples:**
- `pipedream:gmail:oauth_abc123`
- `pipedream:slack:oauth_xyz789`
- `pipedream:github:oauth_def456`

### Tool Execution

Tools are executed through the MCP protocol:

```python
# backend/core/tools/mcp_tool_executor.py

async def _execute_pipedream_tool(
    self,
    tool_name: str,
    arguments: Dict[str, Any],
    mcp_qualified_name: str
) -> ToolResult:
    # 1. Extract app info from qualified name
    parts = mcp_qualified_name.split(':')
    app_slug = parts[1]
    oauth_app_id = parts[2] if len(parts) > 2 else None
    
    # 2. Get profile with credentials
    profile = await profile_service.get_profile_by_mcp_name(
        mcp_qualified_name=mcp_qualified_name
    )
    
    # 3. Get credentials
    credentials = await profile_service.get_profile_credentials(
        profile_id=profile.profile_id,
        account_id=profile.account_id
    )
    
    # 4. Execute tool via MCP
    result = await mcp_client.execute_tool(
        tool_name=tool_name,
        arguments=arguments,
        credentials=credentials
    )
    
    return result
```

---

## API Reference

### Backend Endpoints

#### Profile Management

##### Create Profile
```http
POST /api/pipedream/profiles
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
    "profile_name": "My Gmail",
    "app_slug": "gmail",
    "app_name": "Gmail",
    "external_user_id": "user_abc123",
    "oauth_app_id": "oauth_xyz789",
    "enabled_tools": ["send_email", "read_inbox"],
    "is_default": true
}
```

**Response:**
```json
{
    "profile_id": "uuid",
    "account_id": "uuid",
    "mcp_qualified_name": "pipedream:gmail:oauth_xyz789",
    "profile_name": "My Gmail",
    "app_slug": "gmail",
    "is_connected": true,
    "enabled_tools": ["send_email", "read_inbox"],
    "created_at": "2025-01-06T00:00:00Z"
}
```

##### Get Profiles
```http
GET /api/pipedream/profiles?app_slug=gmail
Authorization: Bearer {jwt_token}
```

##### Update Profile
```http
PUT /api/pipedream/profiles/{profile_id}
Content-Type: application/json

{
    "enabled_tools": ["send_email", "read_inbox", "search_emails"],
    "is_active": true
}
```

##### Delete Profile
```http
DELETE /api/pipedream/profiles/{profile_id}
```

#### Connection Management

##### Create Connection Token
```http
POST /api/pipedream/connection-tokens
Content-Type: application/json

{
    "app": "gmail"
}
```

**Response:**
```json
{
    "success": true,
    "token": "temp_token_abc123",
    "link": "https://pipedream.com/connect?token=...",
    "external_user_id": "user_xyz789",
    "app": "gmail",
    "expires_at": "2025-01-06T01:00:00Z"
}
```

##### Get Connections
```http
GET /api/pipedream/connections?external_user_id=user_xyz789
```

#### MCP Discovery

##### Discover MCP Servers
```http
POST /api/pipedream/mcp/discover
Content-Type: application/json

{
    "app_slug": "gmail",
    "oauth_app_id": "oauth_xyz789"
}
```

**Response:**
```json
{
    "success": true,
    "mcp_servers": [
        {
            "name": "Gmail MCP Server",
            "qualified_name": "pipedream:gmail:oauth_xyz789",
            "url": "https://mcp.pipedream.com/gmail/...",
            "tools": [
                {
                    "name": "send_email",
                    "description": "Send an email",
                    "input_schema": {...}
                }
            ],
            "status": "connected"
        }
    ],
    "count": 1
}
```

##### Connect to MCP
```http
POST /api/pipedream/mcp/connect
Content-Type: application/json

{
    "app_slug": "gmail",
    "oauth_app_id": "oauth_xyz789"
}
```

#### App Discovery

##### Search Apps
```http
GET /api/pipedream/apps/search?q=email&limit=20
```

##### Get App Details
```http
GET /api/pipedream/apps/{app_slug}
```

---

## Usage Examples

### Example 1: Connecting Gmail

```typescript
// Frontend
const connectGmail = async () => {
    // 1. Create connection token
    const { token, link, external_user_id } = await createConnectionToken({
        app: 'gmail'
    });
    
    // 2. Open OAuth popup
    const popup = window.open(link, '_blank', 'width=600,height=700');
    
    // 3. Wait for OAuth completion
    await waitForOAuthCompletion(popup);
    
    // 4. Create profile
    const profile = await createProfile({
        profile_name: 'My Gmail',
        app_slug: 'gmail',
        app_name: 'Gmail',
        external_user_id: external_user_id,
        enabled_tools: ['send_email', 'read_inbox'],
        is_default: true
    });
    
    // 5. Discover MCP tools
    const { mcp_servers } = await discoverMCP({
        app_slug: 'gmail',
        oauth_app_id: profile.oauth_app_id
    });
    
    console.log('Connected!', profile);
};
```

### Example 2: Executing a Tool

```python
# Backend
async def send_email_via_pipedream(
    to: str,
    subject: str,
    body: str,
    profile_id: UUID
):
    # 1. Get profile
    profile = await profile_service.get_profile_by_id(
        profile_id=profile_id,
        account_id=account_id
    )
    
    # 2. Get credentials
    credentials = await profile_service.get_profile_credentials(
        profile_id=profile_id,
        account_id=account_id
    )
    
    # 3. Execute tool
    result = await mcp_tool_executor.execute(
        tool_name='send_email',
        arguments={
            'to': to,
            'subject': subject,
            'body': body
        },
        mcp_qualified_name=profile.mcp_qualified_name,
        credentials=credentials
    )
    
    return result
```

### Example 3: Managing Tools

```typescript
// Frontend
const manageGmailTools = async (profileId: string) => {
    // 1. Get available tools
    const { tools } = await discoverTools(profileId);
    
    // 2. Enable specific tools
    await updateProfile(profileId, {
        enabled_tools: [
            'send_email',
            'read_inbox',
            'search_emails',
            'create_draft'
        ]
    });
    
    // 3. Disable a tool
    await disableTool(profileId, 'create_draft');
    
    // 4. Refresh profile
    await refreshProfiles();
};
```

---

## Reimplementation Guide

### 🔄 Dual Integration Strategy

**Current State:** Both Composio and Pipedream are active and supported simultaneously.

**Future Plans:** Pipedream may be removed in a future update, but this documentation ensures it can be easily restored.

### ⚠️ CRITICAL: What to Keep (NEVER DELETE)

#### KEEP ALL Integration Systems

**Composio Backend - KEEP:**
```
backend/core/composio_integration/
├── composio_profile_service.py    # KEEP - Composio profiles
├── composio_connection_service.py # KEEP - Composio OAuth
└── ...                            # KEEP - All Composio files
```

**Pipedream Backend - KEEP:**
```
backend/core/pipedream/
├── __init__.py                    # KEEP - Service initialization
├── api.py                         # KEEP - FastAPI routes
├── profile_service.py             # KEEP - Profile management
├── connection_service.py          # KEEP - OAuth connections
├── app_service.py                 # KEEP - App discovery
├── mcp_service.py                 # KEEP - MCP integration
└── connection_token_service.py    # KEEP - Token management
```

**Frontend Components - KEEP ALL:**
```
frontend/src/components/agents/composio/
└── ...                            # KEEP - All Composio components

frontend/src/components/agents/pipedream/
├── pipedream-connector.tsx        # KEEP - Main connector
├── pipedream-connections-section.tsx  # KEEP - Connections UI
├── pipedream-connect-button.tsx   # KEEP - Connect button
├── pipedream-registry.tsx         # KEEP - App registry
└── pipedream-types.ts             # KEEP - TypeScript types
```

**Database Tables - KEEP ALL:**
```sql
-- Composio tables
composio_profiles      # KEEP - Composio profile data
composio_connections   # KEEP - Composio connections

-- Pipedream tables
pipedream_profiles     # KEEP - Pipedream profile data
pipedream_connections  # KEEP - Pipedream connections
```

**Why Keep Both:**
- Users may have active connections in either system
- Allows gradual migration if needed
- Easy to restore if Pipedream is removed then needed again
- No data loss

### Temporary Removal Strategy (If Needed)

If you need to temporarily remove Pipedream:

#### Step 1: Disable Pipedream UI (Don't Delete Code)

```typescript
// frontend/src/components/agents/mcp/mcp-configuration.tsx

// Add feature flag
const ENABLE_PIPEDREAM = false; // Set to false to hide

// Conditionally render
{ENABLE_PIPEDREAM && (
    <PipedreamConnector agentId={agentId} />
)}
```

#### Step 2: Disable Pipedream API Routes (Don't Delete)

```python
# backend/core/pipedream/api.py

# Add at top of file
PIPEDREAM_ENABLED = False  # Set to False to disable

# Wrap all routes
if PIPEDREAM_ENABLED:
    @router.post("/profiles")
    async def create_profile(...):
        # ... existing code
else:
    @router.post("/profiles")
    async def create_profile(...):
        raise HTTPException(503, "Pipedream temporarily disabled")
```

#### Step 3: Keep Database Tables (Don't Drop)

```sql
-- DO NOT DROP TABLES
-- Just mark profiles as inactive if needed
UPDATE pipedream_profiles SET is_active = FALSE;
UPDATE pipedream_connections SET connection_status = 'disabled';
```

### Restoration Strategy

To restore Pipedream after removal:

#### Step 1: Re-enable Feature Flags

```typescript
// Frontend
const ENABLE_PIPEDREAM = true; // Set back to true
```

```python
# Backend
PIPEDREAM_ENABLED = True  # Set back to True
```

#### Step 2: Reactivate Profiles

```sql
-- Reactivate all Pipedream profiles
UPDATE pipedream_profiles 
SET is_active = TRUE 
WHERE is_active = FALSE;

UPDATE pipedream_connections 
SET connection_status = 'connected' 
WHERE connection_status = 'disabled';
```

#### Step 3: Verify Integration

```bash
# Test Pipedream endpoints
curl -X GET http://localhost:8000/api/pipedream/profiles

# Test frontend
# Navigate to agent configuration
# Verify Pipedream connector appears
```

### Dual Integration Support

Both systems work independently:

```python
# backend/core/tools/mcp_tool_executor.py

# Support BOTH Composio and Pipedream
if mcp_qualified_name.startswith('composio:'):
    from core.composio_integration.composio_profile_service import ComposioProfileService
    profile_service = ComposioProfileService(self.db)
    # Execute Composio tool
    
elif mcp_qualified_name.startswith('pipedream:'):
    from core.pipedream import profile_service
    # Execute Pipedream tool
```

```typescript
// Frontend - Show both connectors
<div className="integrations">
    <ComposioConnector agentId={agentId} />
    <PipedreamConnector agentId={agentId} />
</div>
```

### Testing Checklist

#### Before Migration
- [ ] Backup all Composio profile data
- [ ] Export list of all connected apps
- [ ] Document all enabled tools per profile
- [ ] Test Composio tool execution (baseline)

#### During Migration
- [ ] Verify data migration SQL
- [ ] Test Pipedream profile creation
- [ ] Verify OAuth flow works
- [ ] Test MCP discovery
- [ ] Validate tool execution

#### After Migration
- [ ] Verify all profiles migrated
- [ ] Test tool execution with Pipedream
- [ ] Confirm no Composio references remain
- [ ] Monitor error logs
- [ ] User acceptance testing

### Rollback Plan

If migration fails:

```sql
-- 1. Restore Composio tables from backup
pg_restore -d database_name composio_backup.dump

-- 2. Revert agent configs
-- Run migration script in reverse

-- 3. Re-enable Composio code
git revert <migration_commit>

-- 4. Clear Pipedream data
TRUNCATE pipedream_profiles CASCADE;
TRUNCATE pipedream_connections CASCADE;
```

### Performance Considerations

**Pipedream Advantages:**
- Faster MCP server discovery
- Better token refresh handling
- More reliable OAuth flow
- Broader app support (2,100+ vs 150+)

**Migration Impact:**
- Minimal downtime (< 5 minutes)
- No user action required
- Automatic credential migration
- Seamless tool execution

### Security Checklist

- [ ] Verify encryption for Pipedream credentials
- [ ] Test OAuth token refresh
- [ ] Validate RLS policies on pipedream_profiles
- [ ] Ensure external_user_id isolation
- [ ] Test profile deletion (cascade)
- [ ] Audit credential access logs

---

## Best Practices

### Profile Management
1. **Use descriptive names**: "Work Gmail" vs "Gmail 1"
2. **Set default profiles**: One default per app
3. **Regular cleanup**: Remove unused profiles
4. **Tool selection**: Only enable needed tools

### Security
1. **Encrypt all credentials**: Use ProfileService encryption
2. **Rotate tokens**: Implement automatic refresh
3. **Audit access**: Log all credential access
4. **Isolate profiles**: Account-based separation

### Performance
1. **Cache MCP discovery**: Store discovered tools
2. **Batch operations**: Update multiple tools at once
3. **Lazy load apps**: Load app list on demand
4. **Optimize queries**: Use indexes on app_slug, account_id

---

## Troubleshooting

### Common Issues

#### 1. OAuth Connection Fails
**Problem:** OAuth popup closes without connecting
**Solution:**
- Check connection token expiry
- Verify OAuth app configuration
- Ensure popup blockers are disabled
- Check Pipedream API status

#### 2. MCP Discovery Returns Empty
**Problem:** No tools found for connected app
**Solution:**
- Verify OAuth app ID is correct
- Check external_user_id matches
- Ensure app supports MCP
- Review Pipedream MCP documentation

#### 3. Tool Execution Fails
**Problem:** Tool returns 401 Unauthorized
**Solution:**
- Check token expiry
- Trigger token refresh
- Verify enabled_tools includes the tool
- Check profile is_active status

#### 4. Profile Not Found
**Problem:** Profile exists but not returned
**Solution:**
- Verify account_id matches
- Check RLS policies
- Ensure profile is_active = true
- Review database indexes

---

## Support & Resources

- **Pipedream Documentation**: https://pipedream.com/docs
- **MCP Protocol**: https://modelcontextprotocol.io
- **API Reference**: `/docs/PIPEDREAM_INTEGRATION_SYSTEM.md`
- **Migration Guide**: See Reimplementation Guide section
- **Issue Tracker**: GitHub Issues

---

*Last Updated: 2025-01-06*
*Version: 1.0.0*
*Status: Active (Replacing Composio)*
