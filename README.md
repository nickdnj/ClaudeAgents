# Claude Agents

A collection of AI-powered automation agents built on [Claude Code](https://claude.ai/code), including both administrative automation for Wharfside Manor Condominium Association and a Product Development Agent Suite for software projects.

## Overview

This repository contains Claude Code agent configurations (skills) that automate various tasks. Each agent is defined by a `SKILL.md` file (behavior instructions) and a `config.json` file (settings and MCP server dependencies).

## Agent Categories

### Product Development Suite

A comprehensive suite of agents that work together through the software development lifecycle. See [PRODUCT_DEVELOPMENT_SUITE.md](PRODUCT_DEVELOPMENT_SUITE.md) for the full vision.

| Agent | Description | Trigger |
|-------|-------------|---------|
| **Product Requirements** | Builds PRDs through interactive conversation | On-demand |
| **Software Architecture** | Designs technical architectures with diagrams and ADRs | On-demand |
| **UX Design** | Creates UX specs, wireframes, and interaction designs | On-demand |
| **Email Research** | Mines Gmail for information and produces research reports | On-demand |

### Administrative Agents

Automation for Wharfside Manor Condominium Association operations.

| Agent | Description | Trigger |
|-------|-------------|---------|
| **Manager** | Orchestrates agent infrastructure, handles GitHub sync and workflow lifecycle | On startup |
| **Monthly Bulletin** | Mines Gmail for updates, generates branded HTML community bulletins | Scheduled or on-demand |
| **Presentation** | Creates PowerPoint presentations from content using branded templates | On-demand |
| **Proposal Review** | Analyzes vendor proposals and delivers structured assessments | On-demand |

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/nickdnj/ClaudeAgents.git
   cd ClaudeAgents
   ```

2. **Install required MCP servers** (see [MCP Server Setup](#mcp-server-setup) below)

3. **Start Claude Code** in the repository directory
   ```bash
   claude
   ```

4. The Manager agent will automatically load via `CLAUDE.md` and:
   - Check GitHub for updates
   - Discover available agents
   - Present an agent selection menu

## Repository Structure

```
ClaudeAgents/
├── CLAUDE.md                    # Global instructions for Claude Code
├── PRODUCT_DEVELOPMENT_SUITE.md # Vision doc for development agents
├── Orchestrator/                # Future: Automated agent execution system
│   └── DESIGN.md                # Orchestrator architecture design
│
├── # Product Development Agents
├── Product Requirements/
│   ├── SKILL.md                 # PRD building workflow
│   └── config.json              # Google Docs integration
├── Software Architecture/
│   ├── SKILL.md                 # Architecture design workflow
│   └── config.json              # GitHub + Google Docs output
├── UX Design/
│   ├── SKILL.md                 # UX specification workflow
│   └── config.json              # Wireframe and component specs
├── Email Research/
│   ├── SKILL.md                 # Gmail mining workflow
│   ├── config.json              # Search and report settings
│   └── reports/                 # Generated research reports
│
├── # Administrative Agents
├── Manager/
│   ├── SKILL.md                 # Agent orchestration logic
│   └── config.json              # GitHub sync and discovery settings
├── Monthly Bulletin/
│   ├── SKILL.md                 # Bulletin generation workflow
│   ├── config.json              # Gmail, styling, versioning config
│   └── examples/                # Past bulletins for reference
├── Presentation/
│   ├── SKILL.md                 # PowerPoint creation workflow
│   ├── config.json              # Template and output settings
│   └── templates/               # Branded PPTX templates
├── proposal-review/
│   ├── SKILL.md                 # Proposal analysis framework
│   └── config.json              # Review criteria and output format
└── Wharfside_Logo.png           # Branding asset
```

## MCP Server Setup

Agents rely on [Model Context Protocol](https://modelcontextprotocol.io/) servers for external integrations. If an MCP server is not installed, the Manager will warn you and the dependent agent won't be available.

### Required Servers

| Server | Purpose | Agents Using |
|--------|---------|--------------|
| `gmail` | Email search, read, send | Monthly Bulletin, Proposal Review |
| `gdrive` | Google Drive document management | Monthly Bulletin, Presentation |
| `google-docs` | Document creation and editing | Monthly Bulletin |
| `powerpoint` | PowerPoint presentation creation | Presentation |

### Installation

**Gmail MCP Server**
```bash
# Install from npm
npm install -g @anthropic/mcp-gmail
# Or follow setup at: https://github.com/anthropics/mcp-gmail
```

**Google Drive MCP Server**
```bash
npm install -g @anthropic/mcp-gdrive
# Requires Google Cloud OAuth credentials
```

**Google Docs MCP Server**
```bash
npm install -g @anthropic/mcp-google-docs
```

**PowerPoint MCP Server**
```bash
# Clone and set up the Office PowerPoint MCP Server
git clone https://github.com/anthropics/Office-PowerPoint-MCP-Server.git
cd Office-PowerPoint-MCP-Server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### Claude Code Configuration

Add MCP servers to your Claude Code settings (`~/.claude/settings.json`):

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
    },
    "powerpoint": {
      "command": "/path/to/Office-PowerPoint-MCP-Server/.venv/bin/python",
      "args": ["/path/to/Office-PowerPoint-MCP-Server/ppt_mcp_server.py"]
    }
  }
}
```

## How It Works

### Manager Agent
The Manager is the entry point and orchestrator:
- Checks GitHub for updates on startup and prompts to pull
- Discovers available agents from the local repository
- Validates MCP server availability for each agent
- Presents agent selection menu
- Tracks document versioning lifecycle (Draft → Review → Final)
- Prompts for Claude restart if Manager itself was updated

### Monthly Bulletin Agent
Automates community newsletter creation:
- Mines Gmail for the past 30 days of board communications
- Categorizes content (projects, governance, seasonal, safety)
- Generates HTML email with professional styling
- Supports iterative review via email replies
- Version tracking: v0.1 → v0.2 → ... → v1.0 (final)

### Presentation Agent
Creates professional PowerPoint presentations:
- Uses branded templates with Wharfside Manor styling
- Supports board meetings, project updates, community announcements
- Can convert bulletins, emails, or documents to slides
- Saves to Desktop or Google Drive

### Proposal Review Agent
Streamlines vendor proposal analysis:
- Extracts key terms, pricing, and scope
- Compares against budget and past contracts
- Generates structured assessment with recommendations

## Configuration

Each agent's `config.json` defines:
- **MCP servers** required for operation
- **Schedule** (cron syntax for automated runs)
- **Styling** (colors, fonts, layout)
- **Versioning** (draft/review/final workflow)
- **Notifications** (email templates)

## License

Private repository for Wharfside Manor Condominium Association.

---

*Built with [Claude Code](https://claude.ai/code) by Anthropic*
