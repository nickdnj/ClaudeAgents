# Claude Agents

A collection of AI-powered automation agents for Wharfside Manor Condominium Association, built on [Claude Code](https://claude.ai/code).

![Wharfside Manor](Wharfside_Logo.png)

## Overview

This repository contains Claude Code agent configurations (skills) that automate routine administrative tasks for a condominium association. Each agent is defined by a `SKILL.md` file (behavior instructions) and a `config.json` file (settings and MCP server dependencies).

## Agents

| Agent | Description | Trigger |
|-------|-------------|---------|
| **Manager** | Orchestrates agent infrastructure, handles discovery and workflow lifecycle | On startup |
| **Monthly Bulletin** | Mines Gmail for updates, generates branded HTML community bulletins | Scheduled or on-demand |
| **Presentation** | Creates PowerPoint presentations from content using branded templates | On-demand |
| **Proposal Review** | Analyzes vendor proposals and delivers structured assessments | On-demand |

## Architecture

```
ClaudeAgents/
├── CLAUDE.md              # Global instructions for Claude Code
├── Manager/
│   ├── SKILL.md           # Agent orchestration logic
│   └── config.json        # Cache and discovery settings
├── Monthly Bulletin/
│   ├── SKILL.md           # Bulletin generation workflow
│   ├── config.json        # Gmail, styling, versioning config
│   └── examples/          # Past bulletins for reference
├── Presentation/
│   ├── SKILL.md           # PowerPoint creation workflow
│   ├── config.json        # Template and output settings
│   └── templates/         # Branded PPTX templates
├── proposal-review/
│   ├── SKILL.md           # Proposal analysis framework
│   └── config.json        # Review criteria and output format
└── Wharfside_Logo.png     # Branding asset
```

## How It Works

### 1. Manager Agent
The Manager agent is the entry point. It:
- Discovers available agents from local filesystem or Google Drive
- Manages configuration caching and sync
- Presents agent selection and handles delegation
- Tracks document versioning lifecycle (Draft → Review → Final)

### 2. Monthly Bulletin Agent
Automates community newsletter creation:
- **Mines Gmail** for the past 30 days of board communications
- **Categorizes content** (projects, governance, seasonal, safety, etc.)
- **Generates HTML email** with professional styling and embedded logo
- **Iterates via email** - reply with feedback, receive updated draft
- **Version tracking** - v0.1 → v0.2 → ... → v1.0 (final)

### 3. Presentation Agent
Creates professional PowerPoint presentations:
- **Uses branded templates** with Wharfside Manor styling
- **Multiple presentation types** - board meetings, project updates, community announcements
- **Content from any source** - bulletins, emails, documents
- **Saves to Desktop or Google Drive**

### 4. Proposal Review Agent
Streamlines vendor proposal analysis:
- Extracts key terms, pricing, and scope
- Compares against budget and past contracts
- Generates structured assessment with recommendations

## MCP Server Dependencies

Agents leverage these [Model Context Protocol](https://modelcontextprotocol.io/) servers:

| Server | Purpose |
|--------|---------|
| `gmail` | Email search, read, send |
| `gdrive` | Google Drive document management |
| `google-docs` | Document creation and editing |
| `powerpoint` | PowerPoint presentation creation |

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/nickdnj/ClaudeAgents.git
   cd ClaudeAgents
   ```

2. **Configure MCP servers** in your Claude Code settings

3. **Start Claude Code** in the repository directory
   ```bash
   claude
   ```

4. The Manager agent will automatically load via `CLAUDE.md`

## Configuration

Each agent's `config.json` defines:
- **MCP servers** required for operation
- **Schedule** (cron syntax for automated runs)
- **Styling** (colors, fonts, layout)
- **Versioning** (draft/review/final workflow)
- **Notifications** (email templates)

## Example: Monthly Bulletin

The bulletin agent produces professional HTML emails like:

- Branded masthead with logo
- Emergency contacts box
- Organized sections with emoji headers
- Highlight boxes for key updates
- Clean, mobile-friendly formatting

## License

Private repository for Wharfside Manor Condominium Association.

---

*Built with [Claude Code](https://claude.ai/code) by Anthropic*
