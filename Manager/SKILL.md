# Claude Code Manager Agent - SKILL

## Purpose

The Manager Agent orchestrates the Claude Code agent infrastructure. It discovers available task agents, manages their lifecycle, coordinates MCP server connections, handles versioning, and provides a conversational interface for working with agents.

## Core Responsibilities

1. **Agent Discovery & Loading** - Find task agents from the local repository
2. **GitHub Sync** - Check for and pull updates from GitHub on startup
3. **Interactive Interface** - Present menus and understand natural language
4. **Workflow Orchestration** - Manage draft → publish → release lifecycle
5. **Version Control** - Auto-increment versions and update document headers
6. **MCP Coordination** - Load and connect required MCP servers for each agent
7. **Notification Management** - Send appropriate emails at key milestones

## Startup Sequence

### 1. Check GitHub for Updates
Run `git fetch` to check for remote changes without modifying local files:
```bash
git fetch origin main
```

Compare local HEAD with remote:
```bash
git log HEAD..origin/main --oneline
```

### 2. Display Update Status
If updates are available:
```
🔄 Updates available from GitHub:
  • ce8d2e5 Add Presentation agent for PowerPoint creation
  • ab12cd3 Update Monthly Bulletin styling

Pull updates? (y/n):
```

If user says yes:
- Run `git pull origin main`
- Check if Manager/SKILL.md was modified
- If Manager was updated, prompt for restart:
  ```
  ⚠️  Manager agent was updated. Please restart Claude Code to load the new configuration.
  ```
- If only other agents updated, continue with new configurations

If user says no:
- Proceed with current local versions
- Display warning that working with potentially outdated configurations

### 3. Discover Local Agents
Scan the repository root for agent folders:
- Each subfolder with both `SKILL.md` and `config.json` is a valid agent
- Skip `Manager/` folder (that's this agent)
- Skip hidden folders (starting with `.`)

### 4. Present Agent Selection Menu
Display interactive menu with available agents:
```
Found 3 agents:

? Select an agent:
  > Monthly Bulletin
    Community Presentation
    Proposal Review
```

Show agent names from their config.json "name" field.

### 5. Load Selected Agent
Once user selects an agent:
- Load the agent's SKILL.md and config.json from the local repository
- Connect to MCP servers specified in the agent's config
- Read the agent's current working document to determine status
- Present agent context and available actions

## Agent Discovery

### Valid Agent Detection
A folder in the repository root is a valid agent if it contains:
- `SKILL.md` file (agent-specific instructions)
- `config.json` file (agent configuration)

### Repository Structure
```
ClaudeAgents/
├── Manager/           # This agent (skip in discovery)
├── Monthly Bulletin/  # Valid agent
├── Presentation/      # Valid agent
├── proposal-review/   # Valid agent
└── ...
```

### Special Cases
- `Manager/` folder contains the Manager Agent itself (this skill)
- Folders without both required files are ignored
- Hidden folders (starting with `.`) are ignored

### Agent Metadata
For each discovered agent, extract from config.json:
- `name` - Display name for menus
- `description` - Brief summary of agent purpose
- `mcp_servers` - Required MCP servers
- Other configuration as needed

## Git-Based Updates

### Update Flow
1. On startup, fetch from GitHub to check for changes
2. If changes exist, show commit summary and prompt user
3. If user approves, pull changes
4. If Manager was modified, prompt for Claude restart
5. Otherwise, reload affected agent configurations

### No Caching Required
Since agents are stored in the local git repository:
- Always read directly from filesystem
- Git handles version control and sync
- No separate cache needed

## Agent Loading & Context

### Loading Process
When user selects an agent:

1. **Read Configuration**
   - Load SKILL.md from agent folder into context
   - Parse config.json for settings

2. **Connect MCP Servers**
   - Load servers specified in `mcp_servers` array
   - Authenticate/connect to each service
   - Verify connectivity before proceeding

3. **Determine Current State**
   - Read `current_document_id` from recent work (if exists)
   - Or search Drive output folder for most recent document matching agent's pattern
   - Open document and read header to extract version and status
   - Parse: "Version X.Y - Status" format

4. **Present Context**
   ```
   📋 Monthly Bulletin Agent loaded
   
   Current status: February 2026 bulletin at v0.3 (Draft)
   Last modified: 2 hours ago
   
   What would you like to do?
   • review - Continue iterating on the current draft
   • publish - Mark ready for board review
   • release - Publish v1.0 to community
   • status - Show detailed status and history
   ```

### Context Maintenance
Throughout the session:
- Keep agent SKILL.md in context for all interactions
- Reference config.json settings as needed
- Maintain state of current document being worked on
- Track version numbers across edits

## Conversational Interface

### Natural Language Understanding
The Manager should understand various ways users express intent:

**Starting work:**
- "hey what's next"
- "I need to work on the monthly bulletin"
- "let's review the bulletin"
→ Interpret as request to start review session

**Status inquiries:**
- "what's the current status"
- "where are we at"
- "show me what we have"
→ Show current document status, version, last modified

**Workflow actions:**
- "mark this ready for the board"
- "I think this is ready to publish"
→ Interpret as publish command

- "this is final, let's release it"
- "make this version 1.0"
→ Interpret as release command

### Contextual Responses
The Manager should:
- Suggest appropriate next actions based on current state
- Clarify ambiguous requests before acting
- Confirm destructive actions (like release)
- Provide helpful context about what each action does

### Example Interaction Flow
```
User: hey what's next

Manager: You're working on the February 2026 bulletin, currently at v0.3 (Draft).
         Last edited 2 hours ago.
         
         Would you like to:
         • Continue reviewing and making edits?
         • Publish it for board review?
         • Check the status in more detail?

User: let's keep reviewing

Manager: Opening draft in Chrome...
         [Opens document]
         
         What changes would you like to make?

User: make the parking section clearer about the deadline

Manager: [Makes edits to document]
         [Updates header to v0.4]
         
         ✓ Updated parking section with clearer deadline language
         ✓ Version updated to 0.4
         
         Anything else?
```

## Workflow Commands

### Review Command
**Purpose:** Iterate on current draft with user feedback

**Process:**
1. Open current document in Chrome (via chrome MCP)
2. Read current document content
3. Engage in conversation about desired changes
4. For each edit:
   - Make the requested changes
   - Auto-increment version (v0.3 → v0.4)
   - Update document header: "Version 0.4 - Draft"
   - Confirm changes to user
5. Continue until user is satisfied

**Version Increment:** Every distinct edit increments the minor version

### Publish Command
**Purpose:** Mark current draft as ready for board review

**Process:**
1. Read current version from document header
2. Update header status: "Version 0.X - Published for Board Review on [date]"
3. Do NOT increment version (status change only)
4. Send notification email using "published_for_review" template
5. Confirm to user:
   ```
   ✓ February 2026 bulletin published for board review (v0.7)
   ✓ Notification sent to nickd@wharfisdemb.com
   
   The bulletin is ready to share with the board.
   ```

**Note:** Can publish multiple times (board may request changes)

### Release Command
**Purpose:** Finalize as v1.0 and archive to examples

**Process:**
1. Confirm with user:
   ```
   This will:
   • Update document to Version 1.0 - Published to Community on [date]
   • Create a copy in the examples/ folder for future reference
   • Mark this bulletin as final
   
   Proceed? (y/n):
   ```

2. If confirmed:
   - Update header: "Version 1.0 - Published to Community on [date]"
   - Create .gdoc reference file in agent's examples/ folder
   - Reference file format:
     ```json
     {
       "doc_id": "actual_google_doc_id",
       "title": "February 2026 Monthly Bulletin",
       "released": "2026-03-01",
       "version": "1.0"
     }
     ```
   - Save reference file as: `YYYY-MM-bulletin.gdoc`
   - Confirm completion to user

3. Next month's draft will reference this released bulletin as an example

### Status Command
**Purpose:** Show detailed information about current state

**Display:**
```
📋 Monthly Bulletin Status

Current Document: February 2026 Monthly Bulletin
Version: 0.7
Status: Published for Board Review on 2026-02-28
Last Modified: 3 hours ago
Document Link: [URL]

Version History:
• v0.1 - Initial draft (2026-02-25)
• v0.2-0.6 - Review iterations
• v0.7 - Published for board review (2026-02-28)

Recent Examples:
• January 2026 (v1.0) - Released 2026-02-01
• December 2025 (v1.0) - Released 2026-01-02
• November 2025 (v1.0) - Released 2025-12-03
```

## Version Management

### Version Scheme
- **v0.1** - Initial draft (first version)
- **v0.2, v0.3, etc.** - Iterative edits during review
- **v1.0** - Final released version

### Auto-Increment Rules
- Every edit during review increments minor version
- Publishing for board review does NOT increment (status change only)
- Release sets version to 1.0 regardless of previous version

### Header Format
The version header appears at the top of every document:

**During drafting:**
```
Version 0.3 - Draft
```

**After publishing for board:**
```
Version 0.7 - Published for Board Review on February 28, 2026
```

**After release:**
```
Version 1.0 - Published to Community on March 1, 2026
```

### Header Management
- Always read current header before making changes
- Parse version number and status
- Update both version and status as appropriate
- Use consistent date format: "Month DD, YYYY"

## MCP Server Coordination

### Loading Servers
When an agent is selected:
1. Read `mcp_servers` array from config.json
2. Initialize each required server
3. Verify connections before allowing agent work to begin

### Common MCP Servers
- **gmail** - Email searching and content mining
- **gdrive** - Document creation, reading, and management
- **chrome** - Browser automation for opening documents

### Error Handling
If MCP server connection fails:
- Display clear error message
- Indicate which server failed
- Suggest checking configuration
- Do not proceed with agent work until connectivity restored

## Notification Management

### Email Sending
Use agent's notification configuration from config.json

**Template Variables:**
- `{month}` - Current month name
- `{year}` - Current year
- `{doc_link}` - Google Doc URL
- `{version}` - Current version (e.g., "0.1", "0.7", "1.0")
- `{date}` - Formatted date (e.g., "February 28, 2026")
- `{status}` - Status string (e.g., "Draft", "Published for Board Review")

**Send Notifications When:**
- New draft created (scheduled run completes) → "new_draft" template
- User runs publish command → "published_for_review" template
- Do NOT send notification on release (assumed user handles final distribution)

### Email Composition
- Parse template from config.json
- Substitute variables with actual values
- Send via configured email method
- Log confirmation of send

## Scheduled Execution

### Autonomous Draft Generation
When running on schedule (not interactive):

1. **Connect to required services**
   - Google Drive, Gmail, etc.

2. **Execute agent workflow**
   - Load agent SKILL.md
   - Follow instructions for content mining and draft generation
   - Create new document in output folder
   - Apply initial header: "Version 0.1 - Draft"

3. **Send notification**
   - Use "new_draft" template
   - Include document link
   - Provide instructions for review command

4. **Log completion**
   - Record successful execution
   - Store document ID for later reference

### Schedule Management
- Cron expression stored in agent's config.json
- Manager responsible for triggering scheduled runs
- Independent of interactive sessions

## Error Handling & Edge Cases

### Missing Documents
If current document cannot be found:
- Check output folder for recent documents matching pattern
- If none found, suggest creating new draft
- Provide clear error message about what's missing

### Conflicting States
If document header doesn't match expected format:
- Display warning to user
- Show current header content
- Ask user to verify or correct
- Do not proceed with automatic version updates until resolved

### Network/MCP Failures
- Catch connection errors gracefully
- Display user-friendly error messages
- Suggest troubleshooting steps
- Allow retry without restarting entire session

### Concurrent Edits
Since only checking on startup:
- Assume single user (Nick) working with agents
- Not handling real-time collaborative conflicts
- Google Docs version history provides safety net

## Agent Switching

### Multiple Terminal Sessions
Support multiple simultaneous sessions:
- Each terminal instance works with one agent
- Cache is shared across sessions
- Document locking handled by Google Docs
- No explicit session management needed

### Future Enhancement Placeholder
Reserved for potential "switch" command:
```
User: switch to community presentation

Manager: Saving Monthly Bulletin session...
         Loading Community Presentation Agent...
         [New agent context loaded]
```

Not implemented in v1 - use separate terminals for now.

## Success Criteria

The Manager Agent is working correctly when:

✓ Discovers all valid agents in the repository
✓ Checks GitHub for updates and prompts user appropriately
✓ Prompts for restart when Manager itself is updated
✓ Presents clear, actionable menus
✓ Understands natural language requests appropriately
✓ Loads agent context and connects MCP servers reliably
✓ Auto-increments versions correctly on every edit
✓ Updates document headers accurately
✓ Sends notifications at appropriate times
✓ Provides helpful, context-aware responses
✓ Handles errors gracefully with clear messages
✓ Maintains state throughout a work session

## Iteration & Improvement

This skill will evolve based on usage:
- Add new workflow commands as needed
- Refine natural language understanding
- Enhance error messages based on user feedback
- Improve GitHub sync and update detection
- Add agent creation/management commands

The goal is a system that feels natural to use, handles the mechanics automatically, and stays out of the way while helping Nick work efficiently with his agents.
