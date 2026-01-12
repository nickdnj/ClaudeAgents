# Orchestrator UI - Product Requirements Document

**Version:** 0.2
**Last Updated:** January 12, 2026
**Status:** Approved for Phase 1

---

## 1. Overview

### 1.1 Product Summary

The Orchestrator UI is a web-based administration interface for managing Claude Code agents. It provides a centralized dashboard for creating, configuring, monitoring, and triggering autonomous agents that perform tasks using MCP (Model Context Protocol) server integrations.

### 1.2 Problem Statement

Currently, managing Claude Code agents requires:
- Manual editing of SKILL.md and config.json files via text editor
- Command-line execution for triggering agents
- No visibility into execution history or results
- No centralized view of MCP server status and authentication

The Orchestrator UI solves these problems by providing a unified web interface for all agent management operations.

### 1.3 Goals

| Goal | Success Metric |
|------|----------------|
| Reduce agent configuration time | 50% reduction in time to create/edit agents |
| Improve execution visibility | 100% of executions logged and viewable |
| Simplify MCP server management | Zero command-line interactions required for auth checks |
| Enable non-technical users | Board members can trigger agents without CLI knowledge |

### 1.4 Non-Goals

- Real-time collaborative editing (single-user focus)
- Mobile-optimized interface (desktop-first)
- Agent code execution within the browser (Claude Code CLI executes externally)
- MCP server installation or configuration (read-only from Claude Code settings)

---

## 2. User Personas

### 2.1 Primary User: System Administrator

**Name:** Nick (Condo Association Tech Admin)

**Characteristics:**
- Technical background, comfortable with code
- Manages the agent infrastructure
- Needs to create new agents, edit configurations, monitor health

**Key Tasks:**
- Create and configure new agents
- Edit SKILL.md files to refine agent behavior
- Assign MCP servers to agents
- Debug failed executions
- Monitor system health

### 2.2 Secondary User: Agent Operator

**Name:** Board Member

**Characteristics:**
- Limited technical knowledge
- Needs to trigger specific agents for tasks
- Wants simple, guided interactions

**Key Tasks:**
- Browse available agents
- Trigger agents with custom task descriptions
- View execution results
- Re-run failed tasks

### 2.3 Future User: Consulting Client

**Characteristics:**
- External organization adopting the agent framework
- Varying technical capabilities
- Needs self-service agent management

**Key Tasks:**
- Configure agents for their own use cases
- Monitor their agent executions
- Customize workflows

---

## 3. Feature Requirements

### 3.1 Agent Management (P0 - Critical)

#### 3.1.1 Agent List View

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Display all agents | Show cards for each discovered agent | P0 |
| Agent metadata | Show name, description, trigger type, schedule | P0 |
| MCP server badges | Display which MCP servers each agent uses | P0 |
| Search/filter | Filter agents by name, MCP server, or trigger type | P1 |
| Quick actions | Run, Edit, Delete buttons per agent | P0 |

**Acceptance Criteria:**
- [ ] Agents auto-discovered from filesystem on page load
- [ ] Cards update when new agents are added
- [ ] Visual distinction between scheduled and on-demand agents

#### 3.1.2 Agent Editor

| Requirement | Description | Priority |
|-------------|-------------|----------|
| SKILL.md editor | Markdown editor with syntax highlighting | P0 |
| config.json editor | JSON editor with validation | P0 |
| MCP server selector | Checkbox UI for assigning servers | P0 |
| Save with backup | Git-based versioning with auto-commit | P0 |
| Preview mode | Render SKILL.md as formatted markdown + email preview | P0 |
| Diff view | Show changes before saving | P2 |

**Acceptance Criteria:**
- [ ] Unsaved changes warning before navigation
- [ ] JSON validation errors displayed inline
- [ ] Backup files created in same directory

#### 3.1.3 Agent Creation Wizard

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Folder name input | Validate unique, filesystem-safe name | P0 |
| Name/description | Basic metadata fields | P0 |
| MCP server selection | Multi-select from available servers | P0 |
| Trigger configuration | Schedule picker or on-demand toggle | P0 |
| Pre-built templates | Start from existing agent templates (Email Research, Document Generation, Data Analysis) | P0 |
| AI-generated templates | Claude generates SKILL.md based on user description | P0 |

**Acceptance Criteria:**
- [ ] Creates folder with SKILL.md and config.json
- [ ] SKILL.md uses standard template structure
- [ ] Agent appears in list immediately after creation
- [ ] AI template generation integrates with Claude CLI

### 3.2 MCP Server Management (P0 - Critical)

#### 3.2.1 Server List View

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Display all servers | Read from Claude Code settings | P0 |
| Status indicator | Available, Connected, Error states | P0 |
| Auth status | Authenticated, Needs Auth, Expired | P0 |
| Server details | Command, args, environment vars | P1 |
| Agent usage | Which agents use each server | P1 |

**Acceptance Criteria:**
- [ ] Servers loaded from ~/.claude/settings.json
- [ ] Status checks run on page load
- [ ] Visual indicators for auth issues

#### 3.2.2 Server Health Check

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Manual health check | Button to test server connectivity | P1 |
| Auth refresh | Link to re-authenticate if expired | P2 |
| Error details | Show last error message if failed | P1 |

### 3.3 Execution Monitor (P0 - Critical)

#### 3.3.1 Execution History

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Run history list | Paginated list of all executions | P0 |
| Status column | Success, Failed, Running, Timeout | P0 |
| Duration column | Execution time in seconds | P0 |
| Agent filter | Filter by agent name | P0 |
| Date range filter | Filter by execution date | P1 |
| Result preview | Truncated output in list view | P1 |

**Acceptance Criteria:**
- [ ] Results stored in output/ directory as JSON
- [ ] List sorted by most recent first
- [ ] Running executions show spinner/progress

#### 3.3.2 Execution Detail View

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Full output display | Scrollable, monospace output | P0 |
| Error display | Stderr shown separately in red | P0 |
| Task/prompt display | What was sent to the agent | P0 |
| Re-run button | Trigger same agent with same task | P0 |
| Copy output | Copy to clipboard button | P1 |
| Download output | Save as .txt or .json | P2 |

#### 3.3.3 Manual Trigger

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Agent selector | Dropdown of available agents | P0 |
| Task input | Textarea for custom task description | P0 |
| Default task option | Use agent's configured default task | P0 |
| Timeout override | Optional custom timeout | P2 |
| Execute button | Start execution, show progress | P0 |

**Acceptance Criteria:**
- [ ] Execution starts in background
- [ ] UI shows "Running..." status immediately
- [ ] Result appears in history when complete

### 3.4 Dashboard (P1 - Important)

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Agent count | Total agents discovered | P1 |
| Recent executions | Last 5 runs with status | P1 |
| Failed jobs | Count of failures in last 24h | P1 |
| Scheduled jobs | Upcoming scheduled executions | P2 |
| System health | Orchestrator API status | P1 |

---

## 4. UI/UX Requirements

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Claude Agents Orchestrator                    [Health: ●]  │
├─────────────────────────────────────────────────────────────────────┤
│  NAV: [Agents] [MCP Servers] [Executions] [Dashboard]               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                                                                 ││
│  │                     MAIN CONTENT AREA                           ││
│  │                                                                 ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| Simplicity | Minimal chrome, content-focused |
| Clarity | Clear visual hierarchy, obvious actions |
| Feedback | Loading states, success/error messages |
| Consistency | Same patterns across all views |

### 4.3 Component Library

Use standard components:
- **Cards** - Agent display, execution results
- **Tables** - MCP servers, execution history
- **Forms** - Agent creation, manual trigger
- **Modals** - Confirmations, quick edits
- **Editors** - Monaco-style for SKILL.md/config.json
- **Toasts** - Success/error notifications

### 4.4 Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Primary | #1a5f7a | Buttons, links, selected states |
| Success | #155724 / #d4edda | Success badges, healthy status |
| Warning | #856404 / #fff3cd | Auth needed, pending states |
| Error | #721c24 / #f8d7da | Failed, expired, error states |
| Neutral | #e0e0e0 | Borders, dividers |
| Background | #f8f9fa | Page background |

### 4.5 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1200px) | Full layout, side-by-side panels |
| Tablet (768-1200px) | Stacked layout, collapsible sidebar |
| Mobile (<768px) | Not optimized (show warning) |

---

## 5. Technical Requirements

### 5.1 Frontend Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React 18+ | Component-based, ecosystem |
| State | React Query or SWR | Server state caching, refetching |
| Styling | Tailwind CSS or CSS Modules | Rapid development |
| Editor | Monaco Editor | VS Code-like editing experience |
| Build | Vite | Fast development, ESM-native |

### 5.2 Backend API

The UI consumes the existing Flask-based REST API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/agents` | GET | List all agents |
| `/agents/<name>/run` | POST | Trigger agent execution |
| `/admin/agents` | GET | Detailed agent list |
| `/admin/agents/<folder>/skill` | GET/PUT | Read/write SKILL.md |
| `/admin/agents/<folder>/config` | GET/PUT | Read/write config.json |
| `/admin/agents` | POST | Create new agent |
| `/admin/mcp-servers` | GET | List MCP servers |
| `/admin/mcp-servers/<name>/status` | GET | Server health check |
| `/health` | GET | API health check |

### 5.3 Data Requirements

| Data | Storage | Format |
|------|---------|--------|
| Agent configs | Filesystem + Git | JSON + Markdown (version controlled) |
| Execution results | SQLite database | Structured with full-text search |
| MCP server list | Claude Code settings | JSON |
| UI preferences | Browser localStorage | JSON |

### 5.4 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Local access only | Bind to 127.0.0.1 by default |
| Optional auth | API key header for remote access |
| No secrets in UI | MCP server env vars not displayed |
| Input validation | Sanitize all user inputs |

### 5.5 Performance Requirements

| Metric | Target |
|--------|--------|
| Initial load | < 2 seconds |
| API response | < 500ms |
| Editor save | < 1 second |
| Agent list refresh | < 1 second |

---

## 6. API Specification Additions

### 6.1 New Endpoints Required

```
GET /admin/executions
  - Returns: List of execution results
  - Query params: agent, status, limit, offset

GET /admin/executions/<id>
  - Returns: Full execution details

POST /admin/executions/<id>/rerun
  - Triggers re-execution of same agent/task

GET /admin/agents/<folder>/delete
  - Deletes agent folder (with confirmation)

GET /admin/dashboard/stats
  - Returns: Aggregate stats for dashboard
```

### 6.2 WebSocket Support (P2)

For live execution monitoring:
```
WS /ws/executions
  - Real-time execution status updates
  - Live log streaming during execution
```

---

## 7. User Flows

### 7.1 Create New Agent

```
1. User clicks "+ New Agent" button
2. Modal opens with creation wizard
   a. Enter folder name (validated for uniqueness)
   b. Enter display name and description
   c. Select trigger type (scheduled/on-demand)
   d. If scheduled, configure cron expression
   e. Select MCP servers needed
3. User clicks "Create Agent"
4. System creates folder, SKILL.md, config.json
5. Success toast appears
6. User redirected to edit SKILL.md
7. User customizes SKILL.md content
8. User clicks "Save"
9. Agent ready for use
```

### 7.2 Trigger Agent Manually

```
1. User navigates to Agents view
2. User clicks "Run" button on agent card
3. Modal opens with task input
   - Default task pre-filled if configured
   - User can modify or use custom task
4. User clicks "Execute"
5. Modal closes, toast shows "Execution started"
6. Execution appears in monitor with "Running" status
7. When complete, status updates to Success/Failed
8. User can click to view full output
```

### 7.3 Debug Failed Execution

```
1. User sees failed execution in monitor
2. User clicks on failed row
3. Detail view shows:
   - Original task/prompt
   - Full stderr output
   - Duration and timestamp
4. User identifies issue (e.g., MCP server auth expired)
5. User fixes issue (refreshes auth)
6. User clicks "Re-run"
7. New execution starts
8. Success - user verifies output
```

---

## 8. Milestones and Phases

### Phase 1: Foundation (MVP)

**Scope:**
- Agent List View with search/filter
- Agent Editor (SKILL.md + config.json)
- Markdown preview with email preview capability
- Manual Trigger with task input
- SQLite-backed execution history
- Git-based versioning

**Deliverables:**
- [ ] Flask API endpoints for agent CRUD
- [ ] SQLite database for execution history
- [ ] React app skeleton with routing
- [ ] Agent list component with search/filter
- [ ] SKILL.md editor with preview and email preview
- [ ] Git auto-commit on save
- [ ] Run agent modal
- [ ] Execution list with SQLite backend

### Phase 2: Full CRUD + Templates

**Scope:**
- Agent creation wizard with templates
- Pre-built template library
- AI-generated templates (Claude integration)
- Agent deletion with confirmation
- MCP server assignment

**Deliverables:**
- [ ] Creation wizard with template selection
- [ ] Pre-built templates (Email Research, Document Generation, Data Analysis)
- [ ] AI template generation via Claude CLI
- [ ] Delete confirmation modal
- [ ] MCP server selector
- [ ] Input validation

### Phase 3: Monitoring

**Scope:**
- Enhanced execution monitor
- Execution detail view
- Re-run capability
- Basic dashboard

**Deliverables:**
- [ ] Paginated execution history
- [ ] Execution detail panel
- [ ] Re-run API and UI
- [ ] Dashboard stats

### Phase 4: Polish

**Scope:**
- MCP server health checks
- WebSocket live updates
- Markdown preview
- Diff view for edits

**Deliverables:**
- [ ] Health check endpoints
- [ ] WebSocket integration
- [ ] Markdown renderer
- [ ] Diff component

---

## 9. Decisions Log

| Question | Status | Decision |
|----------|--------|----------|
| Use React or Vue? | **Decided** | React (per DESIGN.md) |
| Include auth in MVP? | **Decided** | No auth - local-only (127.0.0.1) for MVP |
| Store execution history in DB? | **Decided** | SQLite database for better querying |
| Support agent versioning? | **Decided** | Git-based versioning with auto-commit on save |
| Allow SKILL.md templates? | **Decided** | Yes - both pre-built AND AI-generated templates |
| Live updates approach? | **Decided** | Polling only for MVP; WebSocket deferred to Phase 4 |
| Deployment target? | **Decided** | Mac-only for MVP; network/internet access in future phases |

### Open Items

| Item | Notes |
|------|-------|
| Claude CLI integration | Need to handle follow-up questions during agent execution |
| Template library | Define initial set of pre-built templates |

---

## 10. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Agent creation time | 15 min (CLI) | 5 min (UI) | User testing |
| Execution visibility | 0% tracked | 100% tracked | SQLite audit log |
| Failed execution resolution | 30 min | 10 min | Support tickets |
| User adoption | 1 (admin only) | 5+ (Nick, board members, clients) | Usage logs |
| Template usage | N/A | 80% of new agents use templates | Creation stats |

---

## 11. Appendix

### A. Wireframes Reference

See DESIGN.md for component sketches and React component structure.

### B. API Documentation

Full API spec to be generated from Flask routes using OpenAPI/Swagger.

### C. Related Documents

- `Orchestrator/DESIGN.md` - Technical architecture and code samples
- `Manager/SKILL.md` - Agent discovery and lifecycle management
- `~/.claude/settings.json` - MCP server configuration source
