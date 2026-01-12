# Orchestrator UI

> A web-based control center for managing Claude Code agents

The Orchestrator UI provides a visual interface for creating, editing, running, and monitoring Claude Code agents. It transforms the command-line agent workflow into an accessible web application.

## Features

### Agent Management
- **Browse Agents**: View all agents in a searchable, filterable list
- **Create Agents**: 4-step wizard with templates and AI-assisted generation
- **Edit Agents**: Monaco-powered editor for SKILL.md and config.json
- **MCP Server Selection**: Visual selector for available MCP integrations

### Execution Control
- **Run Agents**: Execute agents with custom task descriptions
- **Real-time Status**: Monitor running executions
- **History**: Browse execution history with output and error details
- **Re-run**: Quickly retry failed executions

### Dashboard
- **At-a-glance Stats**: Total agents, executions, failures, running count
- **Recent Activity**: Quick view of latest executions
- **MCP Status**: Health indicators for all connected servers
- **Quick Actions**: One-click access to common tasks

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Orchestrator UI                              │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                       │
│   React Frontend             │   Flask Backend                       │
│   ├── Dashboard              │   ├── /api/agents                    │
│   ├── Agent Editor           │   ├── /api/executions                │
│   ├── Execution Viewer       │   ├── /api/mcp-servers               │
│   └── MCP Status             │   └── Claude CLI Integration         │
│                              │                                       │
├──────────────────────────────┴──────────────────────────────────────┤
│                                                                      │
│   Claude Code CLI (subprocess --print mode)                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Agent Repository (Git-versioned SKILL.md + config.json)           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, SWR, Monaco Editor |
| Backend | Flask, Python 3.11+, SQLite |
| Integration | Claude Code CLI, subprocess |
| Deployment | launchd (macOS) |

## Quick Start

### Prerequisites

- macOS 12+
- Python 3.11+
- Node.js 18+
- Claude Code CLI installed and authenticated

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-agents.git
cd claude-agents/orchestrator

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Start development servers
npm run dev          # Frontend on http://localhost:5173
cd ../backend && python run.py  # Backend on http://localhost:5111
```

### Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Install launchd service
./deployment/install-service.sh

# Verify
curl http://localhost:5111/api/health
```

## Project Structure

```
Orchestrator/
├── README.md           # This file
├── PRD.md              # Product Requirements Document
├── SAD.md              # Software Architecture Document
├── UXD.md              # User Experience Design Document
├── DESIGN.md           # Original technical design notes
│
├── Dev Team/           # Development team agent definitions
│   ├── Full-Stack Developer/
│   ├── QA Engineer/
│   └── DevOps Engineer/
│
├── frontend/           # React application (to be created)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/            # Flask API (to be created)
│   ├── app/
│   ├── requirements.txt
│   └── run.py
│
└── deployment/         # Deployment scripts (to be created)
    ├── install-service.sh
    └── com.orchestrator.api.plist
```

## Documentation

| Document | Purpose |
|----------|---------|
| [PRD.md](PRD.md) | Product requirements and user stories |
| [SAD.md](SAD.md) | System architecture, API spec, data models |
| [UXD.md](UXD.md) | Wireframes, design system, accessibility |
| [DESIGN.md](DESIGN.md) | Original technical design concepts |

## Development Team

The project uses Claude Code agents to assist development:

| Agent | Role |
|-------|------|
| [Full-Stack Developer](Dev%20Team/Full-Stack%20Developer/) | React + Flask implementation |
| [QA Engineer](Dev%20Team/QA%20Engineer/) | Testing, automation, accessibility |
| [DevOps Engineer](Dev%20Team/DevOps%20Engineer/) | Deployment, security, infrastructure |

## API Overview

### Agents
```
GET    /api/agents              # List all agents
GET    /api/agents/:folder      # Get agent details
POST   /api/agents              # Create new agent
PUT    /api/agents/:folder      # Update agent
DELETE /api/admin/agents/:folder # Delete agent (requires confirmation)
POST   /api/agents/:folder/execute # Run agent
```

### Executions
```
GET    /api/executions          # List execution history
GET    /api/executions/:id      # Get execution details
```

### MCP Servers
```
GET    /api/mcp-servers         # List MCP server status
```

See [SAD.md](SAD.md) for complete API specification.

## Roadmap

### Phase 1 (MVP)
- [ ] Agent CRUD operations
- [ ] Basic execution with output display
- [ ] Dashboard with stats
- [ ] MCP server status (read-only)

### Phase 2
- [ ] Schedules management page
- [ ] Chat-style execution interface
- [ ] Execution streaming (live output)
- [ ] Agent templates marketplace

### Phase 3
- [ ] Multi-user support
- [ ] Execution analytics
- [ ] Webhook integrations
- [ ] Mobile app

## Contributing

1. Read the [PRD.md](PRD.md) for requirements
2. Review [SAD.md](SAD.md) for architecture decisions
3. Follow [UXD.md](UXD.md) for design patterns
4. Use the Dev Team agents for guidance

## License

MIT License - See LICENSE file for details.

---

Built with Claude Code
