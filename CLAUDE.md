# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Getting Started

**Always start by loading the Manager agent.** Read `Manager/SKILL.md` and follow its startup sequence. The Manager will:
1. Discover available agents from Google Drive
2. Check for and sync configuration updates
3. Present an agent selection menu
4. Load the selected agent's SKILL.md and connect required MCP servers

Do not directly load other agents - let the Manager orchestrate agent selection and delegation.

## Repository Overview

This repository contains Claude Code agent configurations (skills) for Wharfside Manor Condominium Association automation tasks. Each agent is defined by a `SKILL.md` file (instructions) and a `config.json` file (configuration).

## Architecture

### Agent Structure

Each agent lives in its own folder with two required files:
- `SKILL.md` - Detailed instructions for the agent's behavior, workflow, and output expectations
- `config.json` - Configuration including MCP servers, schedules, notification templates, and settings

### Key Agents

| Agent | Purpose | Trigger |
|-------|---------|---------|
| **Manager** | Orchestrates agent infrastructure, handles discovery, caching, and workflow lifecycle | On startup |
| **Monthly Bulletin** | Generates community bulletins from Gmail content mining | Scheduled (25th of month) or on-demand |
| **proposal-review** | Analyzes vendor proposals and delivers structured assessments | On-demand |

### MCP Server Dependencies

Agents rely on these MCP servers (specified in each agent's `config.json`):
- `gmail` - Email searching and content extraction
- `gdrive` - Google Drive document management
- `chrome` - Browser automation for opening documents

### Workflow Lifecycle

Documents follow a versioning lifecycle managed by the Manager:
1. **Draft** (v0.1, v0.2, ...) - Iterative edits during review
2. **Published for Board Review** - Status change, no version increment
3. **Released** (v1.0) - Final version, archived to examples folder

### Cache System

Agent configurations are cached locally at `~/.claude-code/cache/` with metadata tracking:
- `last_synced` timestamp
- `drive_modified` timestamp
- File checksums for change detection
- Drive folder IDs

The Manager checks for updates on startup and prompts before syncing changes from Google Drive.

### Google Drive Integration

- Agents folder: `Claude Agents/` in Google Drive
- Each agent may have an `examples/` folder for reference materials
- Output folders are specified per-agent in config.json
