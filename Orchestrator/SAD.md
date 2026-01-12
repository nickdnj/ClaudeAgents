# Orchestrator UI - Software Architecture Document

**Version:** 0.2
**Last Updated:** January 12, 2026
**Status:** Approved with Notes

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | Jan 12, 2026 | Initial draft |
| 0.2 | Jan 12, 2026 | All ADRs approved (A), tech stack approved, DELETE confirmation added |

---

## 1. Executive Summary

This document describes the software architecture for the Orchestrator UI, a web-based administration interface for managing Claude Code agents. The system follows a client-server architecture with a React frontend consuming a Flask REST API, backed by SQLite for execution history and filesystem for agent configurations.

---

## 2. System Context

### 2.1 Context Diagram

```
                                    ┌─────────────────────┐
                                    │   Claude Code CLI   │
                                    │   (External)        │
                                    └──────────┬──────────┘
                                               │
                                               │ subprocess
                                               │
┌─────────────┐     HTTP/JSON      ┌───────────▼───────────┐
│   Browser   │◄──────────────────►│   Orchestrator API    │
│   (React)   │                    │   (Flask)             │
└─────────────┘                    └───────────┬───────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
                   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                   │  Filesystem  │    │   SQLite     │    │ Claude Code  │
                   │  (Agents)    │    │   (History)  │    │ Settings     │
                   └──────────────┘    └──────────────┘    └──────────────┘
```

### 2.2 System Boundaries

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| Frontend | User interface, state management | React 18, Vite |
| Backend API | Business logic, data access | Flask, Python 3.11+ |
| Agent Storage | Agent configs, SKILL.md files | Filesystem + Git |
| Execution Storage | History, logs, results | SQLite |
| MCP Server Config | Server definitions | Claude Code settings.json |
| Agent Executor | Run agents | Claude Code CLI (subprocess) |

---

## 3. Component Architecture

### 3.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │    Router     │  │  State Mgmt   │  │   API Client  │  │  Components  │ │
│  │ (React Router)│  │  (SWR/Query)  │  │    (Fetch)    │  │   Library    │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────────┘ │
│                                                                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ HTTP/JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Flask)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           API Layer (Blueprints)                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │ /agents      │  │ /admin       │  │ /executions  │  │ /health    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Service Layer                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │ AgentService │  │ MCPService   │  │ ExecService  │  │ GitService │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           Data Layer                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │AgentRegistry │  │ MCPRegistry  │  │ExecutionRepo │                 │ │
│  │  │ (Filesystem) │  │ (Settings)   │  │  (SQLite)    │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Backend Components

#### 3.2.1 API Layer

| Blueprint | Endpoints | Purpose |
|-----------|-----------|---------|
| `agents_bp` | `/agents/*` | Public agent operations |
| `admin_bp` | `/admin/*` | Administrative operations |
| `exec_bp` | `/executions/*` | Execution history |
| `health_bp` | `/health` | Health checks |

#### 3.2.2 Service Layer

```python
# services/agent_service.py
class AgentService:
    """Business logic for agent operations"""

    def list_agents() -> List[Agent]
    def get_agent(folder: str) -> Agent
    def create_agent(data: AgentCreateDTO) -> Agent
    def update_skill(folder: str, content: str) -> None
    def update_config(folder: str, config: dict) -> None
    def delete_agent(folder: str) -> None
    def run_agent(folder: str, task: str) -> Execution

# services/execution_service.py
class ExecutionService:
    """Business logic for execution operations"""

    def list_executions(filters: ExecutionFilters) -> List[Execution]
    def get_execution(id: str) -> Execution
    def create_execution(agent: str, task: str) -> Execution
    def update_status(id: str, status: str) -> None
    def rerun_execution(id: str) -> Execution

# services/mcp_service.py
class MCPService:
    """Business logic for MCP server operations"""

    def list_servers() -> List[MCPServer]
    def get_server(name: str) -> MCPServer
    def check_health(name: str) -> HealthStatus

# services/git_service.py
class GitService:
    """Git versioning for agent files"""

    def commit_changes(path: str, message: str) -> str
    def get_history(path: str, limit: int) -> List[Commit]
    def get_diff(path: str) -> str
```

#### 3.2.3 Data Layer

```python
# data/agent_registry.py
class AgentRegistry:
    """Filesystem-based agent storage"""

    def __init__(self, agents_dir: Path)
    def discover_agents() -> Dict[str, Agent]
    def read_skill(folder: str) -> str
    def write_skill(folder: str, content: str) -> None
    def read_config(folder: str) -> dict
    def write_config(folder: str, config: dict) -> None
    def create_folder(folder: str) -> Path
    def delete_folder(folder: str) -> None

# data/execution_repo.py
class ExecutionRepository:
    """SQLite-based execution storage"""

    def __init__(self, db_path: str)
    def create(execution: Execution) -> str
    def update(id: str, data: dict) -> None
    def find_by_id(id: str) -> Execution
    def find_all(filters: dict, limit: int, offset: int) -> List[Execution]
    def count(filters: dict) -> int

# data/mcp_registry.py
class MCPRegistry:
    """Read-only MCP server configuration"""

    def __init__(self, settings_path: Path)
    def load_servers() -> Dict[str, MCPServer]
    def get_server(name: str) -> MCPServer
```

### 3.3 Frontend Components

#### 3.3.1 Page Components

| Page | Route | Purpose |
|------|-------|---------|
| `DashboardPage` | `/` | System overview, stats |
| `AgentsPage` | `/agents` | Agent list and management |
| `AgentDetailPage` | `/agents/:folder` | Agent editor |
| `MCPServersPage` | `/mcp-servers` | MCP server status |
| `ExecutionsPage` | `/executions` | Execution history |
| `ExecutionDetailPage` | `/executions/:id` | Execution details |

#### 3.3.2 Shared Components

```
components/
├── layout/
│   ├── Header.tsx          # App header with health indicator
│   ├── Navigation.tsx      # Main navigation
│   └── PageContainer.tsx   # Page wrapper with breadcrumbs
├── agents/
│   ├── AgentCard.tsx       # Agent summary card
│   ├── AgentList.tsx       # Grid of agent cards
│   ├── AgentEditor.tsx     # SKILL.md/config editor
│   ├── AgentForm.tsx       # Create/edit form
│   ├── MCPSelector.tsx     # MCP server checkbox list
│   └── RunAgentModal.tsx   # Task input dialog
├── executions/
│   ├── ExecutionList.tsx   # Paginated table
│   ├── ExecutionRow.tsx    # Single row with status
│   ├── ExecutionDetail.tsx # Full output display
│   └── StatusBadge.tsx     # Success/Failed/Running
├── mcp/
│   ├── ServerList.tsx      # Server table
│   ├── ServerCard.tsx      # Server status card
│   └── AuthStatus.tsx      # Auth status indicator
├── editors/
│   ├── MarkdownEditor.tsx  # Monaco for SKILL.md
│   ├── JsonEditor.tsx      # Monaco for config.json
│   └── MarkdownPreview.tsx # Rendered markdown
└── common/
    ├── Button.tsx
    ├── Modal.tsx
    ├── Toast.tsx
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── ConfirmDialog.tsx
```

---

## 4. Data Architecture

### 4.1 Database Schema (SQLite)

```sql
-- Execution history table
CREATE TABLE executions (
    id TEXT PRIMARY KEY,
    agent_folder TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    task TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed', 'timeout')),
    output TEXT,
    error TEXT,
    duration_seconds REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    triggered_by TEXT DEFAULT 'manual'  -- 'manual', 'scheduled', 'api', 'rerun'
);

-- Indexes for common queries
CREATE INDEX idx_executions_agent ON executions(agent_folder);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created ON executions(created_at DESC);

-- Full-text search on output
CREATE VIRTUAL TABLE executions_fts USING fts5(
    id,
    task,
    output,
    error,
    content='executions',
    content_rowid='rowid'
);

-- Dashboard statistics view
CREATE VIEW execution_stats AS
SELECT
    COUNT(*) as total_executions,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
    AVG(duration_seconds) as avg_duration,
    MAX(created_at) as last_execution
FROM executions
WHERE created_at > datetime('now', '-24 hours');
```

### 4.2 Agent Configuration Schema

```json
// config.json schema
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "version"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Display name for the agent"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "description": {
      "type": "string"
    },
    "mcp_servers": {
      "type": "array",
      "items": { "type": "string" }
    },
    "trigger": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["on-demand", "scheduled"]
        },
        "schedule": {
          "type": "string",
          "description": "Cron expression for scheduled triggers"
        },
        "default_task": {
          "type": "string"
        }
      }
    },
    "output": {
      "type": "object",
      "properties": {
        "folder": { "type": "string" },
        "format": { "type": "string" }
      }
    },
    "timeout_seconds": {
      "type": "integer",
      "default": 600
    }
  }
}
```

### 4.3 Data Transfer Objects

```python
# dto/agent.py
@dataclass
class AgentDTO:
    name: str
    folder: str
    description: str
    mcp_servers: List[str]
    trigger_type: str
    schedule: Optional[str]

@dataclass
class AgentCreateDTO:
    folder: str
    name: str
    description: str
    mcp_servers: List[str]
    trigger_type: str
    schedule: Optional[str]
    template: Optional[str]

@dataclass
class AgentDetailDTO(AgentDTO):
    skill_content: str
    config: dict
    last_execution: Optional[ExecutionSummaryDTO]

# dto/execution.py
@dataclass
class ExecutionDTO:
    id: str
    agent_folder: str
    agent_name: str
    task: str
    status: str
    duration_seconds: Optional[float]
    created_at: datetime

@dataclass
class ExecutionDetailDTO(ExecutionDTO):
    output: str
    error: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    triggered_by: str

# dto/mcp.py
@dataclass
class MCPServerDTO:
    name: str
    description: str
    status: str
    auth_required: bool
    auth_status: str
    used_by_agents: List[str]
```

---

## 5. API Specification

### 5.1 RESTful Endpoints

#### Agents

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/agents` | - | `AgentDTO[]` | List all agents |
| GET | `/admin/agents` | - | `AgentDetailDTO[]` | List with details |
| GET | `/admin/agents/:folder` | - | `AgentDetailDTO` | Get agent details |
| POST | `/admin/agents` | `AgentCreateDTO` | `AgentDTO` | Create agent |
| DELETE | `/admin/agents/:folder` | `{confirm: str}` | `{success: bool}` | Delete agent (requires confirmation) |
| GET | `/admin/agents/:folder/skill` | - | `{content: str}` | Get SKILL.md |
| PUT | `/admin/agents/:folder/skill` | `{content: str}` | `{success: bool}` | Update SKILL.md |
| GET | `/admin/agents/:folder/config` | - | `{config: obj}` | Get config.json |
| PUT | `/admin/agents/:folder/config` | `{config: obj}` | `{success: bool}` | Update config.json |
| POST | `/agents/:name/run` | `{task: str}` | `ExecutionDTO` | Trigger execution |

#### Executions

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/admin/executions` | `?agent=&status=&limit=&offset=` | `{items: ExecutionDTO[], total: int}` | List executions |
| GET | `/admin/executions/:id` | - | `ExecutionDetailDTO` | Get execution |
| POST | `/admin/executions/:id/rerun` | - | `ExecutionDTO` | Re-run execution |

#### MCP Servers

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/admin/mcp-servers` | - | `MCPServerDTO[]` | List servers |
| GET | `/admin/mcp-servers/:name` | - | `MCPServerDTO` | Get server details |
| GET | `/admin/mcp-servers/:name/health` | - | `{status: str}` | Health check |

#### System

| Method | Endpoint | Response | Description |
|--------|----------|----------|-------------|
| GET | `/health` | `{status: str, version: str}` | API health |
| GET | `/admin/dashboard/stats` | `DashboardStatsDTO` | Dashboard metrics |

### 5.2 Error Response Format

```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent 'my-agent' does not exist",
    "details": {
      "folder": "my-agent"
    }
  }
}
```

### 5.3 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AGENT_NOT_FOUND` | 404 | Agent folder does not exist |
| `AGENT_EXISTS` | 409 | Agent folder already exists |
| `INVALID_CONFIG` | 400 | Invalid config.json format |
| `INVALID_FOLDER_NAME` | 400 | Folder name contains invalid characters |
| `EXECUTION_NOT_FOUND` | 404 | Execution ID not found |
| `MCP_SERVER_NOT_FOUND` | 404 | MCP server not configured |
| `EXECUTION_IN_PROGRESS` | 409 | Cannot modify running execution |
| `GIT_ERROR` | 500 | Git operation failed |
| `DELETE_CONFIRMATION_REQUIRED` | 400 | Agent deletion requires confirmation string matching agent name |

### 5.4 Delete Confirmation

Agent deletion requires explicit confirmation to prevent accidental data loss:

```python
# DELETE /admin/agents/:folder
# Request body must include confirm field matching agent name
{
    "confirm": "monthly-bulletin"  # Must match the folder name exactly
}

# If confirm doesn't match, returns 400:
{
    "error": {
        "code": "DELETE_CONFIRMATION_REQUIRED",
        "message": "Confirmation string must match agent folder name"
    }
}
```

---

## 6. Integration Architecture

### 6.1 Claude Code CLI Integration

```python
# executor/claude_runner.py

class ClaudeRunner:
    """Executes agents via Claude Code CLI"""

    def __init__(self,
                 claude_path: str = "claude",
                 agents_dir: Path = None,
                 default_timeout: int = 600):
        self.claude_path = claude_path
        self.agents_dir = agents_dir
        self.default_timeout = default_timeout

    def build_prompt(self, agent_folder: str, task: str) -> str:
        """Construct the prompt that loads an agent"""
        skill_path = self.agents_dir / agent_folder / "SKILL.md"
        config_path = self.agents_dir / agent_folder / "config.json"

        return f"""First, read the agent skill file at {skill_path} and config at {config_path}.

Then execute the following task according to the agent's instructions:

{task}

Follow the agent's workflow exactly as specified in SKILL.md."""

    async def execute(self,
                      agent_folder: str,
                      task: str,
                      timeout: int = None) -> ExecutionResult:
        """Run agent asynchronously"""

        prompt = self.build_prompt(agent_folder, task)
        timeout = timeout or self.default_timeout

        process = await asyncio.create_subprocess_exec(
            self.claude_path,
            "--print",
            "-p", prompt,
            "--output-format", "text",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self.agents_dir)
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            return ExecutionResult(
                success=process.returncode == 0,
                output=stdout.decode(),
                error=stderr.decode(),
                returncode=process.returncode
            )
        except asyncio.TimeoutError:
            process.kill()
            return ExecutionResult(
                success=False,
                output="",
                error=f"Execution timed out after {timeout}s",
                returncode=-1
            )
```

### 6.2 Git Integration

```python
# services/git_service.py

class GitService:
    """Git operations for agent versioning"""

    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.repo = git.Repo(repo_path)

    def commit_agent_change(self,
                            agent_folder: str,
                            file_type: str,
                            message: str = None) -> str:
        """Commit changes to an agent file"""

        relative_path = f"{agent_folder}/{file_type}"

        # Stage the file
        self.repo.index.add([relative_path])

        # Build commit message
        if not message:
            message = f"Update {file_type} for {agent_folder}"

        # Commit
        commit = self.repo.index.commit(
            message,
            author=git.Actor("Orchestrator UI", "orchestrator@local")
        )

        return commit.hexsha

    def get_file_history(self,
                         agent_folder: str,
                         file_type: str,
                         limit: int = 10) -> List[CommitInfo]:
        """Get commit history for an agent file"""

        relative_path = f"{agent_folder}/{file_type}"
        commits = list(self.repo.iter_commits(
            paths=relative_path,
            max_count=limit
        ))

        return [
            CommitInfo(
                sha=c.hexsha[:7],
                message=c.message.strip(),
                author=c.author.name,
                date=c.committed_datetime
            )
            for c in commits
        ]

    def get_file_at_commit(self,
                           agent_folder: str,
                           file_type: str,
                           commit_sha: str) -> str:
        """Retrieve file content at a specific commit"""

        relative_path = f"{agent_folder}/{file_type}"
        commit = self.repo.commit(commit_sha)
        blob = commit.tree / relative_path
        return blob.data_stream.read().decode()
```

### 6.3 MCP Server Configuration

```python
# data/mcp_registry.py

class MCPRegistry:
    """Reads MCP server config from Claude Code settings"""

    SETTINGS_PATH = Path.home() / ".claude" / "settings.json"

    KNOWN_SERVERS = {
        "gmail": {
            "description": "Gmail access (board email)",
            "auth_required": True
        },
        "gmail-personal": {
            "description": "Gmail access (personal)",
            "auth_required": True
        },
        "gdrive": {
            "description": "Google Drive file access",
            "auth_required": True
        },
        "google-docs": {
            "description": "Google Docs creation",
            "auth_required": True
        },
        "chrome": {
            "description": "Browser automation",
            "auth_required": False
        },
        "voicemode": {
            "description": "Voice input/output",
            "auth_required": False
        }
    }

    def __init__(self):
        self.servers = {}
        self._load_config()

    def _load_config(self):
        """Load MCP servers from Claude Code settings"""

        if not self.SETTINGS_PATH.exists():
            return

        with open(self.SETTINGS_PATH) as f:
            settings = json.load(f)

        mcp_servers = settings.get("mcpServers", {})

        for name, config in mcp_servers.items():
            known = self.KNOWN_SERVERS.get(name, {})

            self.servers[name] = MCPServer(
                name=name,
                description=known.get("description", f"MCP Server: {name}"),
                command=config.get("command", ""),
                args=config.get("args", []),
                auth_required=known.get("auth_required", False),
                status="available"
            )

    def get_servers_for_agent(self, agent_mcp_list: List[str]) -> List[MCPServer]:
        """Get server details for servers used by an agent"""
        return [
            self.servers[name]
            for name in agent_mcp_list
            if name in self.servers
        ]
```

---

## 7. Security Architecture

### 7.1 Security Controls

| Layer | Control | Implementation |
|-------|---------|----------------|
| Network | Local binding | Flask binds to 127.0.0.1 only |
| API | Input validation | Pydantic models, JSON schema |
| Filesystem | Path traversal prevention | Whitelist agent folders |
| Secrets | No exposure | MCP env vars never returned |
| Git | Safe operations | No force push, no destructive ops |

### 7.2 Input Validation

```python
# validation/agent_validators.py

import re
from pydantic import BaseModel, validator

class AgentCreateRequest(BaseModel):
    folder: str
    name: str
    description: str = ""
    mcp_servers: List[str] = []

    @validator('folder')
    def validate_folder(cls, v):
        # Only allow alphanumeric, hyphen, underscore
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Folder name contains invalid characters')

        # Prevent reserved names
        if v.lower() in ['orchestrator', 'manager', 'output', 'logs', '.git']:
            raise ValueError(f'"{v}" is a reserved folder name')

        return v

    @validator('name')
    def validate_name(cls, v):
        if len(v) < 2 or len(v) > 100:
            raise ValueError('Name must be 2-100 characters')
        return v

class SkillUpdateRequest(BaseModel):
    content: str

    @validator('content')
    def validate_content(cls, v):
        if len(v) > 500000:  # 500KB limit
            raise ValueError('SKILL.md content too large')
        return v
```

### 7.3 Path Traversal Prevention

```python
# utils/path_security.py

from pathlib import Path

def safe_join(base_dir: Path, *paths: str) -> Path:
    """Safely join paths, preventing directory traversal"""

    result = base_dir
    for p in paths:
        # Remove any path separators
        clean = p.replace('/', '').replace('\\', '').replace('..', '')
        result = result / clean

    # Ensure result is still under base_dir
    try:
        result.resolve().relative_to(base_dir.resolve())
    except ValueError:
        raise ValueError("Path traversal detected")

    return result

def validate_agent_path(agents_dir: Path, folder: str) -> Path:
    """Validate and return safe agent path"""

    agent_path = safe_join(agents_dir, folder)

    if not agent_path.is_dir():
        raise FileNotFoundError(f"Agent folder not found: {folder}")

    if not (agent_path / "SKILL.md").exists():
        raise FileNotFoundError(f"Agent missing SKILL.md: {folder}")

    return agent_path
```

---

## 8. Deployment Architecture

### 8.1 Development Environment

```
┌────────────────────────────────────────────────────────────────────┐
│                        Developer Machine                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐        ┌──────────────────┐                 │
│  │   Vite Dev       │  :3000 │   Flask Dev      │  :5000          │
│  │   (React HMR)    │───────►│   (Debug Mode)   │                 │
│  └──────────────────┘        └────────┬─────────┘                 │
│                                       │                            │
│                              ┌────────▼─────────┐                 │
│                              │   SQLite DB      │                 │
│                              │   (dev.sqlite)   │                 │
│                              └──────────────────┘                 │
│                                                                     │
│  File Watchers:                                                    │
│  - Frontend: Vite HMR                                              │
│  - Backend: Flask reloader                                         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 Production Environment (Local Mac)

```
┌────────────────────────────────────────────────────────────────────┐
│                          Mac Mini                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    launchd Service                            │ │
│  │               com.nickd.orchestrator.plist                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Gunicorn + Flask                           │ │
│  │                    (127.0.0.1:5000)                          │ │
│  │   • 2 workers                                                 │ │
│  │   • Static files served from /static                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                      │
│            ┌─────────────────┼─────────────────┐                   │
│            ▼                 ▼                 ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Agents Dir   │  │   SQLite     │  │    Logs      │            │
│  │ /ClaudeAgents│  │orchestrator.db│  │ /logs/*.log │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 8.3 launchd Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nickd.orchestrator</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/gunicorn</string>
        <string>--bind</string>
        <string>127.0.0.1:5000</string>
        <string>--workers</string>
        <string>2</string>
        <string>--timeout</string>
        <string>120</string>
        <string>orchestrator.app:create_app()</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/nickd/Workspaces/ClaudeAgents/Orchestrator</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>FLASK_ENV</key>
        <string>production</string>
        <key>DATABASE_PATH</key>
        <string>/Users/nickd/Workspaces/ClaudeAgents/orchestrator.db</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/Users/nickd/Workspaces/ClaudeAgents/logs/orchestrator.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/nickd/Workspaces/ClaudeAgents/logs/orchestrator.error.log</string>
</dict>
</plist>
```

---

## 9. Performance Considerations

### 9.1 Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|--------------|
| Agent list | Memory | 60s | On create/delete |
| MCP servers | Memory | 5min | On settings change |
| Execution list | None | - | Real-time |
| Dashboard stats | Memory | 30s | On execution complete |

### 9.2 Database Optimization

```python
# Pagination for execution list
def get_executions(filters: dict, page: int = 1, per_page: int = 20):
    offset = (page - 1) * per_page

    # Use indexed columns for filtering
    query = """
        SELECT * FROM executions
        WHERE (:agent IS NULL OR agent_folder = :agent)
        AND (:status IS NULL OR status = :status)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """

    return db.execute(query, {
        'agent': filters.get('agent'),
        'status': filters.get('status'),
        'limit': per_page,
        'offset': offset
    })

# Prune old executions
def cleanup_old_executions(days: int = 30):
    """Remove executions older than N days"""
    db.execute("""
        DELETE FROM executions
        WHERE created_at < datetime('now', :days)
    """, {'days': f'-{days} days'})
```

### 9.3 Frontend Optimization

- **Code splitting**: Lazy load editor components
- **Virtual scrolling**: For large execution lists
- **Debounced saves**: 500ms debounce for editor autosave
- **Optimistic updates**: Immediate UI feedback on save

---

## 10. Monitoring and Logging

### 10.1 Logging Configuration

```python
# config/logging.py

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'json': {
            'class': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'level': 'INFO'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/orchestrator.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json'
        }
    },
    'loggers': {
        'orchestrator': {
            'handlers': ['console', 'file'],
            'level': 'INFO'
        },
        'orchestrator.executor': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG'
        }
    }
}
```

### 10.2 Health Check Endpoint

```python
@app.route('/health')
def health_check():
    """Comprehensive health check"""

    checks = {
        'api': 'healthy',
        'database': check_database(),
        'filesystem': check_agents_dir(),
        'claude_cli': check_claude_available()
    }

    overall = 'healthy' if all(v == 'healthy' for v in checks.values()) else 'degraded'

    return jsonify({
        'status': overall,
        'version': __version__,
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }), 200 if overall == 'healthy' else 503
```

---

## 11. Directory Structure

```
Orchestrator/
├── PRD.md                    # Product requirements
├── SAD.md                    # This document
├── UXD.md                    # UX design document
├── DESIGN.md                 # Original design notes
│
├── backend/
│   ├── __init__.py
│   ├── app.py                # Flask app factory
│   ├── config.py             # Configuration
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── agents.py         # Agent endpoints
│   │   ├── executions.py     # Execution endpoints
│   │   ├── mcp_servers.py    # MCP endpoints
│   │   └── health.py         # Health endpoints
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── agent_service.py
│   │   ├── execution_service.py
│   │   ├── mcp_service.py
│   │   └── git_service.py
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── agent_registry.py
│   │   ├── execution_repo.py
│   │   └── mcp_registry.py
│   │
│   ├── executor/
│   │   ├── __init__.py
│   │   └── claude_runner.py
│   │
│   ├── dto/
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── execution.py
│   │   └── mcp.py
│   │
│   ├── validation/
│   │   ├── __init__.py
│   │   └── validators.py
│   │
│   └── utils/
│       ├── __init__.py
│       └── path_security.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AgentsPage.tsx
│   │   │   ├── AgentDetailPage.tsx
│   │   │   ├── ExecutionsPage.tsx
│   │   │   └── MCPServersPage.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── agents/
│   │   │   ├── executions/
│   │   │   ├── mcp/
│   │   │   ├── editors/
│   │   │   └── common/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAgents.ts
│   │   │   ├── useExecutions.ts
│   │   │   └── useMCPServers.ts
│   │   │
│   │   ├── api/
│   │   │   └── client.ts
│   │   │
│   │   └── styles/
│   │       └── global.css
│   │
│   └── public/
│       └── index.html
│
├── tests/
│   ├── backend/
│   │   ├── test_agents.py
│   │   ├── test_executions.py
│   │   └── test_security.py
│   │
│   └── frontend/
│       └── components/
│
└── scripts/
    ├── setup.sh              # Development setup
    ├── build.sh              # Production build
    └── deploy.sh             # Deployment script
```

---

## 12. Appendix

### A. Technology Versions

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Flask | 3.0+ | Web framework |
| SQLite | 3.x | Database |
| React | 18+ | Frontend framework |
| TypeScript | 5.x | Frontend language |
| Vite | 5.x | Build tool |
| Monaco Editor | 0.45+ | Code editor |
| GitPython | 3.1+ | Git integration |
| Gunicorn | 21+ | Production server |

### B. Related Documents

- `PRD.md` - Product Requirements Document
- `UXD.md` - User Experience Design Document
- `DESIGN.md` - Original technical design notes
