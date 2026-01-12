# Claude Agents

A collection of AI-powered automation agents built on [Claude Code](https://claude.ai/code), featuring a web-based Orchestrator UI for visual agent management.

## Highlights

### Orchestrator UI (In Development)

A web-based control center for managing Claude Code agents. Create, edit, run, and monitor agents from your browser.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard │ Agents │ Executions │ Schedules │ MCP Servers          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│   │ 12 Agents   │  │ 47 Runs/24h │  │ 3 Failed    │  │ 1 Running │ │
│   └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                                      │
│   Recent Executions                    Quick Actions                 │
│   ● Monthly Bulletin    2m ago   ✓     [+ Create Agent]             │
│   ● Email Research     15m ago   ✓     [▶ Run Agent]                │
│   ○ Proposal Review     1h ago   ✗     [Check MCP Status]           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Visual agent editor with Monaco (VS Code's editor)
- Real-time execution monitoring
- MCP server status dashboard
- 4-step agent creation wizard
- Execution history and re-run capability

**Tech Stack:** React + TypeScript + Flask + SQLite

[View Orchestrator Documentation →](Orchestrator/)

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

### Orchestrator Dev Team

Specialized agents for building the Orchestrator UI itself.

| Agent | Role | Skills |
|-------|------|--------|
| [Full-Stack Developer](Orchestrator/Dev%20Team/Full-Stack%20Developer/) | React + Flask implementation | TypeScript, Python, TailwindCSS |
| [QA Engineer](Orchestrator/Dev%20Team/QA%20Engineer/) | Testing and accessibility | Jest, Playwright, WCAG |
| [DevOps Engineer](Orchestrator/Dev%20Team/DevOps%20Engineer/) | Deployment and security | launchd, subprocess, security |

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

### Option 1: Command Line (Current)

```bash
# Clone and enter
git clone https://github.com/nickdnj/ClaudeAgents.git
cd ClaudeAgents

# Start Claude Code
claude

# Manager agent loads automatically via CLAUDE.md
```

### Option 2: Orchestrator UI (Coming Soon)

```bash
# Start the Orchestrator
cd orchestrator
./start.sh

# Open browser
open http://localhost:5111
```

---

## Repository Structure

```
ClaudeAgents/
├── CLAUDE.md                        # Global Claude Code instructions
├── README.md                        # This file
│
├── Orchestrator/                    # Web UI for agent management
│   ├── README.md                    # Project overview
│   ├── PRD.md                       # Product requirements
│   ├── SAD.md                       # Software architecture
│   ├── UXD.md                       # UX design specs
│   ├── DESIGN.md                    # Original design notes
│   └── Dev Team/                    # Development agents
│       ├── Full-Stack Developer/
│       ├── QA Engineer/
│       └── DevOps Engineer/
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
User Request → Manager → Select Agent → Load SKILL.md → Execute with MCP → Output
```

### Document Lifecycle
```
Draft (v0.1) → Review (v0.2, v0.3...) → Approved → Final (v1.0)
```

---

## Roadmap

### Now
- [x] Product Development Suite agents
- [x] Administrative automation agents
- [x] Orchestrator UI design (PRD, SAD, UXD)
- [x] Dev team agent definitions

### Next
- [ ] Orchestrator backend (Flask API)
- [ ] Orchestrator frontend (React)
- [ ] launchd service deployment
- [ ] Execution history database

### Future
- [ ] Agent templates marketplace
- [ ] Webhook integrations
- [ ] Multi-user support
- [ ] Mobile app

---

## Contributing

1. Review the relevant agent's `SKILL.md`
2. Check `config.json` for required MCP servers
3. Test changes locally with Claude Code
4. Submit PR with updated documentation

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

*Built with [Claude Code](https://claude.ai/code) by Anthropic*
