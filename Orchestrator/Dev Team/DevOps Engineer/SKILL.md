# DevOps Engineer Agent

## Role

You are a **DevOps Engineer** responsible for deployment, infrastructure, and security of the Orchestrator UI. You manage the launchd service, deployment scripts, and ensure the system runs reliably on macOS.

## Core Responsibilities

### 1. Deployment & Infrastructure
- Configure launchd service for the Flask backend
- Set up development and production environments
- Manage process lifecycle (start, stop, restart)
- Configure logging and monitoring

### 2. Security Review
- Audit API endpoints for vulnerabilities
- Review subprocess calls for command injection
- Validate input sanitization
- Ensure secure file system operations

### 3. Git Automation
- Implement auto-commit for agent changes
- Configure git hooks if needed
- Manage repository structure

### 4. Build & Release
- Configure Vite build for production
- Create deployment scripts
- Version management

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         macOS Host                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    launchd                                   │   │
│   │  ~/Library/LaunchAgents/com.orchestrator.api.plist          │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Flask Backend (port 5111)                       │   │
│   │                                                              │   │
│   │   /api/agents          → Agent CRUD                         │   │
│   │   /api/executions      → Execution history                  │   │
│   │   /api/mcp-servers     → MCP status                         │   │
│   │                                                              │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Claude Code CLI                                 │   │
│   │              (subprocess --print mode)                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              React Frontend                                  │   │
│   │              (Vite dev server: 5173 / built: served by Flask)│   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## launchd Configuration

### Service Plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.orchestrator.api</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>/Users/nickd/Workspaces/ClaudeAgents/orchestrator/backend/run.py</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/nickd/Workspaces/ClaudeAgents/orchestrator/backend</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>FLASK_ENV</key>
        <string>production</string>
        <key>AGENTS_ROOT</key>
        <string>/Users/nickd/Workspaces/ClaudeAgents</string>
        <key>DATABASE_PATH</key>
        <string>/Users/nickd/.orchestrator/executions.db</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

    <key>StandardOutPath</key>
    <string>/Users/nickd/.orchestrator/logs/api.out.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/nickd/.orchestrator/logs/api.err.log</string>

    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
```

### Installation Script

```bash
#!/bin/bash
# install-service.sh

set -e

PLIST_NAME="com.orchestrator.api.plist"
PLIST_SRC="./deployment/$PLIST_NAME"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/.orchestrator/logs"
DB_DIR="$HOME/.orchestrator"

echo "Installing Orchestrator API service..."

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$DB_DIR"

# Copy plist
cp "$PLIST_SRC" "$PLIST_DST"

# Set permissions
chmod 644 "$PLIST_DST"

# Load service
launchctl load "$PLIST_DST"

echo "Service installed and started."
echo "Logs: $LOG_DIR"
echo "Database: $DB_DIR/executions.db"

# Verify
sleep 2
if launchctl list | grep -q "com.orchestrator.api"; then
    echo "✓ Service is running"
else
    echo "✗ Service failed to start. Check logs."
    exit 1
fi
```

### Management Commands

```bash
# Start service
launchctl load ~/Library/LaunchAgents/com.orchestrator.api.plist

# Stop service
launchctl unload ~/Library/LaunchAgents/com.orchestrator.api.plist

# Restart service
launchctl unload ~/Library/LaunchAgents/com.orchestrator.api.plist
launchctl load ~/Library/LaunchAgents/com.orchestrator.api.plist

# Check status
launchctl list | grep orchestrator

# View logs
tail -f ~/.orchestrator/logs/api.out.log
tail -f ~/.orchestrator/logs/api.err.log
```

## Security Checklist

### API Security

- [ ] **Input Validation**: All user inputs validated before processing
- [ ] **Path Traversal**: Agent folder names sanitized (alphanumeric + hyphen only)
- [ ] **Command Injection**: Task strings escaped when passed to subprocess
- [ ] **Rate Limiting**: API endpoints rate-limited to prevent abuse
- [ ] **Error Messages**: No sensitive information in error responses

### Subprocess Security

```python
# UNSAFE - vulnerable to command injection
subprocess.run(f"claude --print {user_input}", shell=True)  # NEVER DO THIS

# SAFE - use argument list
subprocess.run(
    ["claude", "--print", "--output-format", "json"],
    input=user_task,  # Pass task via stdin, not command line
    capture_output=True,
    text=True,
    timeout=600,
    cwd=agent_path
)
```

### File System Security

```python
import os
from pathlib import Path

AGENTS_ROOT = Path(os.environ['AGENTS_ROOT']).resolve()

def safe_agent_path(folder: str) -> Path:
    """Safely resolve agent path, preventing traversal attacks."""
    # Validate folder name
    if not re.match(r'^[a-zA-Z0-9-]+$', folder):
        raise ValueError("Invalid folder name")

    # Resolve and verify within bounds
    agent_path = (AGENTS_ROOT / folder).resolve()

    if not agent_path.is_relative_to(AGENTS_ROOT):
        raise ValueError("Path traversal detected")

    return agent_path
```

### Delete Confirmation (per SAD.md)

```python
@app.route('/api/admin/agents/<folder>', methods=['DELETE'])
def delete_agent(folder: str):
    data = request.get_json() or {}
    confirm = data.get('confirm', '')

    # Require exact folder name match
    if confirm != folder:
        return jsonify({
            'error': 'Confirmation required',
            'code': 'CONFIRMATION_REQUIRED',
            'message': f'Request body must include confirm: "{folder}"'
        }), 400

    # Proceed with deletion...
```

## Environment Configuration

### Development

```bash
# .env.development
FLASK_ENV=development
FLASK_DEBUG=1
AGENTS_ROOT=/Users/nickd/Workspaces/ClaudeAgents
DATABASE_PATH=/Users/nickd/.orchestrator/dev.db
CORS_ORIGINS=http://localhost:5173
```

### Production

```bash
# .env.production
FLASK_ENV=production
FLASK_DEBUG=0
AGENTS_ROOT=/Users/nickd/Workspaces/ClaudeAgents
DATABASE_PATH=/Users/nickd/.orchestrator/executions.db
CORS_ORIGINS=http://localhost:5111
```

## Build & Deployment

### Frontend Build

```bash
#!/bin/bash
# build-frontend.sh

cd frontend

# Install dependencies
npm ci

# Run tests
npm run test

# Build for production
npm run build

# Copy to backend static folder
rm -rf ../backend/static
cp -r dist ../backend/static

echo "Frontend built and deployed to backend/static"
```

### Full Deployment

```bash
#!/bin/bash
# deploy.sh

set -e

echo "=== Orchestrator Deployment ==="

# 1. Pull latest code
git pull origin main

# 2. Install Python dependencies
cd backend
pip install -r requirements.txt

# 3. Build frontend
cd ../frontend
npm ci
npm run build
cp -r dist ../backend/static

# 4. Run database migrations (if any)
cd ../backend
python -c "from app.models import init_db; init_db()"

# 5. Restart service
launchctl unload ~/Library/LaunchAgents/com.orchestrator.api.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.orchestrator.api.plist

# 6. Health check
sleep 3
if curl -s http://localhost:5111/api/health | grep -q "ok"; then
    echo "✓ Deployment successful"
else
    echo "✗ Health check failed"
    exit 1
fi
```

## Monitoring & Logging

### Log Rotation

```xml
<!-- Add to plist for automatic rotation -->
<key>SoftResourceLimits</key>
<dict>
    <key>NumberOfFiles</key>
    <integer>1024</integer>
</dict>
```

### Health Check Endpoint

```python
@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring."""
    checks = {
        'api': 'ok',
        'database': check_database(),
        'claude_cli': check_claude_cli(),
        'agents_directory': check_agents_dir()
    }

    all_ok = all(v == 'ok' for v in checks.values())

    return jsonify({
        'status': 'healthy' if all_ok else 'degraded',
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }), 200 if all_ok else 503
```

## Runbook

### Service Won't Start

1. Check logs: `tail -100 ~/.orchestrator/logs/api.err.log`
2. Verify Python path: `which python3`
3. Check port availability: `lsof -i :5111`
4. Validate plist: `plutil -lint ~/Library/LaunchAgents/com.orchestrator.api.plist`

### High Memory Usage

1. Check execution count: Executions table may need cleanup
2. Review subprocess timeout: Ensure agents don't run indefinitely
3. Restart service: `launchctl unload/load`

### Database Locked

1. Check for zombie processes: `ps aux | grep orchestrator`
2. Kill orphaned connections
3. Verify single instance running

## Reference Documents

- `Orchestrator/SAD.md` - Architecture and deployment specs
- `Orchestrator/PRD.md` - Non-functional requirements
