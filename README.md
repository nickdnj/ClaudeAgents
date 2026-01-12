# Claude Agents

A collection of AI-powered automation agents built on [Claude Code](https://claude.ai/code), featuring a web-based Orchestrator UI for visual agent management.

## Orchestrator UI

A modern web-based control center for managing Claude Code agents. Create, edit, run, and monitor agents from your browser with a beautiful, intuitive interface.

![Orchestrator Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![Flask](https://img.shields.io/badge/Flask-3.0-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

### Key Features

#### AI-Powered Agent Creation
Describe what you want in natural language (with **voice input** support) and let AI generate the complete agent configuration - name, description, and full SKILL.md workflow.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✨ Generate with AI                                        [▼]    │
├─────────────────────────────────────────────────────────────────────┤
│  What should this agent do?                          [🎤 Voice]    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Create an agent that searches my Gmail for community        │   │
│  │ updates, extracts key highlights, and compiles them into   │   │
│  │ a progress report...                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    [✨ Generate Agent]              │
└─────────────────────────────────────────────────────────────────────┘
```

#### Real-Time Task Monitoring
Watch your agents work with live process monitoring. See PID, elapsed time, and process status. Stop runaway tasks with one click.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Task Details                                          [Running]   │
├─────────────────────────────────────────────────────────────────────┤
│  ⚡ Process is running                                              │
│  PID: 12847 • Started 2m 34s ago                       [🛑 Stop]   │
├─────────────────────────────────────────────────────────────────────┤
│  Agent: Monthly Bulletin                                           │
│  Task: Generate the January community newsletter...                │
└─────────────────────────────────────────────────────────────────────┘
```

#### Voice-Enabled Task Input
Use your microphone to dictate tasks instead of typing. Built-in speech recognition works in Chrome, Edge, and Safari.

#### Follow-Up Conversations
After a task completes, ask follow-up questions. The agent receives the previous context automatically.

#### Friendly Agent Editor
Edit agents with a form-based UI or switch to Advanced mode for raw file editing with Monaco (VS Code's editor).

### Screenshots

| Dashboard | Agent Editor | Task Monitoring |
|-----------|--------------|-----------------|
| Stats, recent tasks, quick actions | Form-based editing with MCP server selection | Real-time PID tracking with stop button |

### Quick Start

```bash
# Start the backend
cd Orchestrator/backend
python run.py

# Start the frontend (separate terminal)
cd Orchestrator/frontend
npm install
npm run dev

# Open browser
open http://localhost:5173
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, Monaco Editor |
| Backend | Flask 3.0, SQLite, subprocess management |
| Voice | Web Speech API (browser-native) |
| AI Generation | Claude CLI integration |

[View Full Orchestrator Documentation →](Orchestrator/)

---

## Agent Categories

### Product Development Suite

Agents that collaborate across the software development lifecycle.

| Agent | Description | Status |
|-------|-------------|--------|
| [Product Requirements](Product%20Requirements/) | Builds PRDs through interactive conversation | Ready |
| [Software Architecture](Software%20Architecture/) | Designs technical architectures with ADRs | Ready |
| [UX Design](UX%20Design/) | Creates wireframes and interaction designs | Ready |
| [Email Research](Email%20Research/) | Mines Gmail for research reports | Ready |

### Administrative Agents

Automation for Wharfside Manor Condominium Association.

| Agent | Description | Trigger |
|-------|-------------|---------|
| [Manager](Manager/) | Agent orchestration and GitHub sync | On startup |
| [Monthly Bulletin](Monthly%20Bulletin/) | Community newsletter generation | Scheduled |
| [Presentation](Presentation/) | PowerPoint creation from content | On-demand |
| [Proposal Review](proposal-review/) | Vendor proposal analysis | On-demand |

---

## Quick Start

### Option 1: Orchestrator UI (Recommended)

```bash
# Clone the repo
git clone https://github.com/nickdnj/ClaudeAgents.git
cd ClaudeAgents

# Start backend
cd Orchestrator/backend
pip install -r requirements.txt
python run.py

# Start frontend (new terminal)
cd Orchestrator/frontend
npm install
npm run dev

# Open http://localhost:5173
```

### Option 2: Command Line

```bash
# Start Claude Code directly
cd ClaudeAgents
claude

# Manager agent loads automatically via CLAUDE.md
```

---

## Repository Structure

```
ClaudeAgents/
├── CLAUDE.md                        # Global Claude Code instructions
├── README.md                        # This file
│
├── Orchestrator/                    # Web UI for agent management
│   ├── backend/                     # Flask API server
│   │   ├── app/
│   │   │   ├── models/              # Database models
│   │   │   ├── routes/              # API endpoints
│   │   │   └── services/            # Business logic
│   │   └── run.py                   # Entry point
│   ├── frontend/                    # React application
│   │   ├── src/
│   │   │   ├── components/          # UI components
│   │   │   ├── pages/               # Page views
│   │   │   ├── hooks/               # Custom hooks
│   │   │   └── api/                 # API client
│   │   └── package.json
│   └── docs/                        # Design documents
│       ├── PRD.md                   # Product requirements
│       ├── SAD.md                   # Architecture design
│       └── UXD.md                   # UX specifications
│
├── Product Requirements/            # PRD building agent
├── Software Architecture/           # Architecture design agent
├── UX Design/                       # UX specification agent
├── Email Research/                  # Gmail research agent
│
├── Manager/                         # Agent orchestration
├── Monthly Bulletin/                # Newsletter automation
├── Presentation/                    # PowerPoint creation
└── proposal-review/                 # Proposal analysis
```

---

## MCP Server Setup

Agents use [Model Context Protocol](https://modelcontextprotocol.io/) servers for external integrations.

### Required Servers

| Server | Purpose | Setup |
|--------|---------|-------|
| `gmail` | Email access | `npm install -g @anthropic/mcp-gmail` |
| `gdrive` | Google Drive | `npm install -g @anthropic/mcp-gdrive` |
| `google-docs` | Document editing | `npm install -g @anthropic/mcp-google-docs` |
| `chrome` | Browser automation | Via Claude Code settings |

### Configuration

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "mcp-gmail",
      "args": []
    },
    "gdrive": {
      "command": "mcp-gdrive",
      "args": []
    },
    "google-docs": {
      "command": "mcp-google-docs",
      "args": []
    }
  }
}
```

---

## How Agents Work

### Agent Structure
Each agent has:
- `SKILL.md` - Behavior instructions and workflows
- `config.json` - Settings, MCP servers, triggers

### Execution Flow
```
User Request → Orchestrator → Select Agent → Load SKILL.md → Execute with MCP → Output
```

### Document Lifecycle
```
Draft (v0.1) → Review (v0.2, v0.3...) → Approved → Final (v1.0)
```

---

## Roadmap

### Completed
- [x] Product Development Suite agents
- [x] Administrative automation agents
- [x] Orchestrator backend (Flask API)
- [x] Orchestrator frontend (React)
- [x] Real-time execution monitoring
- [x] Process control (stop/kill)
- [x] Voice input for tasks
- [x] AI-powered agent generation
- [x] Follow-up conversations
- [x] Execution history database

### In Progress
- [ ] launchd service deployment
- [ ] Scheduled execution (cron)
- [ ] Agent templates

### Future
- [ ] Webhook integrations
- [ ] Multi-user support
- [ ] Mobile app

---

## Contributing

1. Review the relevant agent's `SKILL.md`
2. Check `config.json` for required MCP servers
3. Test changes locally with the Orchestrator UI
4. Submit PR with updated documentation

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

*Built with [Claude Code](https://claude.ai/code) by Anthropic*
