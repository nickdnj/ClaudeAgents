# Claude Agents Orchestrator - Design Document

## Overview

A lightweight orchestration layer that wraps Claude Code CLI to automate agent execution. The orchestrator handles scheduling, triggering, and routing while Claude Code does the heavy lifting with MCP server integrations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Triggers   │  │   Executor   │  │   Router     │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ • Cron/Sched │  │ • CLI Runner │  │ • Email      │          │
│  │ • Web API    │  │ • Timeout    │  │ • File Store │          │
│  │ • Webhooks   │  │ • Retry      │  │ • Notify     │          │
│  │ • File Watch │  │ • Logging    │  │ • Dashboard  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         └────────────────┼─────────────────┘                   │
│                          │                                      │
│                          ▼                                      │
│              ┌──────────────────────┐                          │
│              │   Agent Registry     │                          │
│              │   (reads from disk)  │                          │
│              └──────────────────────┘                          │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────┐
              │   Claude Code CLI    │
              │   (--print mode)     │
              ├──────────────────────┤
              │ MCP Servers:         │
              │ • Gmail (2 accounts) │
              │ • Google Drive       │
              │ • Google Docs        │
              │ • PowerPoint         │
              │ • Chrome             │
              └──────────────────────┘
```

## Components

### 1. Agent Registry

Discovers and catalogs available agents from the filesystem.

```python
# orchestrator/registry.py

import os
import json
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Agent:
    name: str
    folder: str
    description: str
    mcp_servers: List[str]
    trigger_type: str  # "scheduled", "on-demand", "webhook"
    schedule: Optional[str]  # cron expression if scheduled

class AgentRegistry:
    def __init__(self, agents_dir: str = "/Users/nickd/Workspaces/ClaudeAgents"):
        self.agents_dir = Path(agents_dir)
        self.agents = {}
        self._discover_agents()

    def _discover_agents(self):
        """Scan filesystem for valid agents (folders with SKILL.md + config.json)"""
        for folder in self.agents_dir.iterdir():
            if folder.is_dir() and folder.name not in ['.git', 'Orchestrator', 'Manager']:
                skill_file = folder / "SKILL.md"
                config_file = folder / "config.json"

                if skill_file.exists() and config_file.exists():
                    with open(config_file) as f:
                        config = json.load(f)

                    self.agents[config['name']] = Agent(
                        name=config['name'],
                        folder=folder.name,
                        description=config.get('description', ''),
                        mcp_servers=config.get('mcp_servers', []),
                        trigger_type=config.get('trigger', {}).get('type', 'on-demand'),
                        schedule=config.get('trigger', {}).get('schedule')
                    )

    def get_agent(self, name: str) -> Optional[Agent]:
        return self.agents.get(name)

    def list_agents(self) -> List[Agent]:
        return list(self.agents.values())

    def get_scheduled_agents(self) -> List[Agent]:
        return [a for a in self.agents.values() if a.trigger_type == 'scheduled']
```

### 2. Executor

Runs Claude Code CLI in non-interactive mode and captures output.

```python
# orchestrator/executor.py

import subprocess
import logging
from pathlib import Path
from typing import Optional, Tuple
from dataclasses import dataclass
import time

@dataclass
class ExecutionResult:
    success: bool
    output: str
    error: str
    duration: float
    agent_name: str
    prompt: str

class ClaudeExecutor:
    def __init__(
        self,
        agents_dir: str = "/Users/nickd/Workspaces/ClaudeAgents",
        timeout: int = 600,  # 10 minute default timeout
        claude_path: str = "claude"  # assumes claude is in PATH
    ):
        self.agents_dir = Path(agents_dir)
        self.timeout = timeout
        self.claude_path = claude_path
        self.logger = logging.getLogger(__name__)

    def build_prompt(self, agent_folder: str, task: str) -> str:
        """Build the prompt that loads the agent and executes a task"""
        skill_path = self.agents_dir / agent_folder / "SKILL.md"

        return f"""First, read the agent skill file at {skill_path} and the corresponding config.json.

Then execute the following task according to the agent's instructions:

{task}

Follow the agent's workflow exactly as specified in the SKILL.md file."""

    def execute(
        self,
        agent_folder: str,
        task: str,
        timeout: Optional[int] = None
    ) -> ExecutionResult:
        """Execute a task using Claude Code CLI"""

        start_time = time.time()
        prompt = self.build_prompt(agent_folder, task)
        timeout = timeout or self.timeout

        self.logger.info(f"Executing agent '{agent_folder}' with task: {task[:100]}...")

        try:
            result = subprocess.run(
                [
                    self.claude_path,
                    "--print",           # Non-interactive mode
                    "-p", prompt,        # Pass the prompt
                    "--output-format", "text"  # Plain text output
                ],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.agents_dir)  # Run from agents directory
            )

            duration = time.time() - start_time

            return ExecutionResult(
                success=result.returncode == 0,
                output=result.stdout,
                error=result.stderr,
                duration=duration,
                agent_name=agent_folder,
                prompt=task
            )

        except subprocess.TimeoutExpired:
            duration = time.time() - start_time
            self.logger.error(f"Agent '{agent_folder}' timed out after {timeout}s")
            return ExecutionResult(
                success=False,
                output="",
                error=f"Execution timed out after {timeout} seconds",
                duration=duration,
                agent_name=agent_folder,
                prompt=task
            )
        except Exception as e:
            duration = time.time() - start_time
            self.logger.error(f"Agent '{agent_folder}' failed: {e}")
            return ExecutionResult(
                success=False,
                output="",
                error=str(e),
                duration=duration,
                agent_name=agent_folder,
                prompt=task
            )
```

### 3. Trigger System

Multiple ways to trigger agent execution.

```python
# orchestrator/triggers.py

from abc import ABC, abstractmethod
from typing import Callable, Dict, Any
import schedule
import threading
from flask import Flask, request, jsonify
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class Trigger(ABC):
    @abstractmethod
    def start(self):
        pass

    @abstractmethod
    def stop(self):
        pass

# ─────────────────────────────────────────────────────────────────
# SCHEDULED TRIGGER (Cron-like)
# ─────────────────────────────────────────────────────────────────

class ScheduledTrigger(Trigger):
    """Run agents on a schedule using cron-like expressions"""

    def __init__(self, executor, registry):
        self.executor = executor
        self.registry = registry
        self.running = False
        self.thread = None

    def _schedule_agent(self, agent):
        """Set up schedule for a single agent"""
        # Parse cron expression and schedule
        # Example: "0 9 25 * *" = 9 AM on the 25th of each month

        cron = agent.schedule
        if not cron:
            return

        # Simple schedule parsing (expand for full cron support)
        parts = cron.split()
        if len(parts) >= 5:
            minute, hour, day, month, dow = parts[:5]

            # For monthly tasks (like bulletin on 25th)
            if day != '*':
                schedule.every().day.at(f"{hour}:{minute}").do(
                    self._run_if_day_matches,
                    agent=agent,
                    target_day=int(day)
                )

    def _run_if_day_matches(self, agent, target_day):
        """Only run if today matches the target day"""
        from datetime import datetime
        if datetime.now().day == target_day:
            self.executor.execute(agent.folder, agent.default_task)

    def start(self):
        """Start the scheduler in a background thread"""
        self.running = True

        # Schedule all scheduled agents
        for agent in self.registry.get_scheduled_agents():
            self._schedule_agent(agent)

        def run_scheduler():
            while self.running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute

        self.thread = threading.Thread(target=run_scheduler, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False

# ─────────────────────────────────────────────────────────────────
# WEB API TRIGGER
# ─────────────────────────────────────────────────────────────────

class WebAPITrigger(Trigger):
    """REST API for triggering agents"""

    def __init__(self, executor, registry, host='127.0.0.1', port=5000):
        self.executor = executor
        self.registry = registry
        self.host = host
        self.port = port
        self.app = Flask(__name__)
        self._setup_routes()

    def _setup_routes(self):
        @self.app.route('/agents', methods=['GET'])
        def list_agents():
            """List all available agents"""
            agents = [
                {
                    'name': a.name,
                    'description': a.description,
                    'trigger_type': a.trigger_type
                }
                for a in self.registry.list_agents()
            ]
            return jsonify(agents)

        @self.app.route('/agents/<agent_name>/run', methods=['POST'])
        def run_agent(agent_name):
            """Trigger an agent with a task"""
            agent = self.registry.get_agent(agent_name)
            if not agent:
                return jsonify({'error': 'Agent not found'}), 404

            data = request.get_json() or {}
            task = data.get('task', 'Execute the default workflow')

            # Run in background thread to not block
            def run_async():
                result = self.executor.execute(agent.folder, task)
                # Store result somewhere accessible

            thread = threading.Thread(target=run_async)
            thread.start()

            return jsonify({
                'status': 'started',
                'agent': agent_name,
                'task': task
            })

        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({'status': 'healthy'})

    def start(self):
        """Start the web server"""
        self.app.run(host=self.host, port=self.port, threaded=True)

    def stop(self):
        # Flask doesn't have a clean shutdown in this simple setup
        pass

# ─────────────────────────────────────────────────────────────────
# FILE WATCHER TRIGGER
# ─────────────────────────────────────────────────────────────────

class FileWatcherTrigger(Trigger):
    """Trigger agents when specific files change"""

    def __init__(self, executor, watch_config: Dict[str, Any]):
        self.executor = executor
        self.watch_config = watch_config  # {path: {agent, task}}
        self.observer = Observer()

    def start(self):
        for path, config in self.watch_config.items():
            handler = self._create_handler(config['agent'], config['task'])
            self.observer.schedule(handler, path, recursive=False)
        self.observer.start()

    def stop(self):
        self.observer.stop()
        self.observer.join()

    def _create_handler(self, agent_folder, task):
        executor = self.executor

        class Handler(FileSystemEventHandler):
            def on_modified(self, event):
                if not event.is_directory:
                    executor.execute(agent_folder, task)

        return Handler()
```

### 4. Output Router

Routes execution results to appropriate destinations.

```python
# orchestrator/router.py

import os
import json
import smtplib
from email.mime.text import MIMEText
from pathlib import Path
from datetime import datetime
from typing import Optional
from abc import ABC, abstractmethod

class OutputHandler(ABC):
    @abstractmethod
    def handle(self, result) -> bool:
        pass

class FileStorageHandler(OutputHandler):
    """Save results to filesystem"""

    def __init__(self, output_dir: str = "/Users/nickd/Workspaces/ClaudeAgents/output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

    def handle(self, result) -> bool:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{result.agent_name}_{timestamp}.json"

        output = {
            'agent': result.agent_name,
            'task': result.prompt,
            'success': result.success,
            'output': result.output,
            'error': result.error,
            'duration': result.duration,
            'timestamp': datetime.now().isoformat()
        }

        with open(self.output_dir / filename, 'w') as f:
            json.dump(output, f, indent=2)

        return True

class NotificationHandler(OutputHandler):
    """Send notifications on completion"""

    def __init__(self, email_to: str, notify_on_success: bool = False):
        self.email_to = email_to
        self.notify_on_success = notify_on_success

    def handle(self, result) -> bool:
        # Only notify on failure, or if configured for success too
        if result.success and not self.notify_on_success:
            return True

        status = "completed" if result.success else "FAILED"
        subject = f"Agent {result.agent_name} {status}"
        body = f"""
Agent: {result.agent_name}
Task: {result.prompt}
Status: {status}
Duration: {result.duration:.1f}s

Output:
{result.output[:1000]}

Errors:
{result.error}
"""

        # Use system mail or configured SMTP
        # For now, just log it
        print(f"NOTIFICATION: {subject}")
        return True

class OutputRouter:
    """Routes results to multiple handlers"""

    def __init__(self):
        self.handlers = []

    def add_handler(self, handler: OutputHandler):
        self.handlers.append(handler)

    def route(self, result):
        for handler in self.handlers:
            try:
                handler.handle(result)
            except Exception as e:
                print(f"Handler {handler.__class__.__name__} failed: {e}")
```

### 5. Main Orchestrator

Ties everything together.

```python
# orchestrator/main.py

import logging
from .registry import AgentRegistry
from .executor import ClaudeExecutor
from .triggers import ScheduledTrigger, WebAPITrigger
from .router import OutputRouter, FileStorageHandler, NotificationHandler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class Orchestrator:
    def __init__(self, agents_dir: str = "/Users/nickd/Workspaces/ClaudeAgents"):
        self.registry = AgentRegistry(agents_dir)
        self.executor = ClaudeExecutor(agents_dir)
        self.router = OutputRouter()
        self.triggers = []

        # Set up default output handlers
        self.router.add_handler(FileStorageHandler())
        self.router.add_handler(NotificationHandler(
            email_to="nickd@wharfsidemb.com",
            notify_on_success=False  # Only notify on failures
        ))

    def run_agent(self, agent_name: str, task: str):
        """Manually run an agent"""
        agent = self.registry.get_agent(agent_name)
        if not agent:
            raise ValueError(f"Agent '{agent_name}' not found")

        result = self.executor.execute(agent.folder, task)
        self.router.route(result)
        return result

    def start_scheduler(self):
        """Start the scheduled trigger"""
        trigger = ScheduledTrigger(self.executor, self.registry)
        trigger.start()
        self.triggers.append(trigger)

    def start_api(self, host='127.0.0.1', port=5000):
        """Start the web API trigger"""
        trigger = WebAPITrigger(self.executor, self.registry, host, port)
        trigger.start()  # This blocks
        self.triggers.append(trigger)

    def stop(self):
        """Stop all triggers"""
        for trigger in self.triggers:
            trigger.stop()

# ─────────────────────────────────────────────────────────────────
# CLI ENTRY POINT
# ─────────────────────────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Claude Agents Orchestrator')
    parser.add_argument('command', choices=['run', 'serve', 'list'])
    parser.add_argument('--agent', help='Agent name for run command')
    parser.add_argument('--task', help='Task description for run command')
    parser.add_argument('--port', type=int, default=5000, help='API port')

    args = parser.parse_args()

    orchestrator = Orchestrator()

    if args.command == 'list':
        print("\nAvailable Agents:")
        print("-" * 50)
        for agent in orchestrator.registry.list_agents():
            print(f"  {agent.name}")
            print(f"    Description: {agent.description}")
            print(f"    Trigger: {agent.trigger_type}")
            if agent.schedule:
                print(f"    Schedule: {agent.schedule}")
            print()

    elif args.command == 'run':
        if not args.agent:
            print("Error: --agent required for run command")
            return
        task = args.task or "Execute the default workflow"
        result = orchestrator.run_agent(args.agent, task)
        print(f"\nResult: {'Success' if result.success else 'Failed'}")
        print(f"Duration: {result.duration:.1f}s")
        if result.output:
            print(f"\nOutput:\n{result.output}")
        if result.error:
            print(f"\nErrors:\n{result.error}")

    elif args.command == 'serve':
        print(f"Starting orchestrator API on port {args.port}...")
        orchestrator.start_scheduler()
        orchestrator.start_api(port=args.port)

if __name__ == '__main__':
    main()
```

## Usage Examples

### Run an agent manually from command line

```bash
# List available agents
python -m orchestrator list

# Run the email research agent
python -m orchestrator run --agent "email-research" \
    --task "Research all emails about the parking policy changes"

# Run the monthly bulletin agent
python -m orchestrator run --agent "monthly-bulletin" \
    --task "Generate the February 2026 bulletin draft"
```

### Start the API server

```bash
# Start the orchestrator with web API
python -m orchestrator serve --port 5000
```

Then trigger agents via HTTP:

```bash
# List agents
curl http://localhost:5000/agents

# Run an agent
curl -X POST http://localhost:5000/agents/email-research/run \
    -H "Content-Type: application/json" \
    -d '{"task": "Research the boiler project and send me a report"}'
```

### Run as a service (launchd on macOS)

Create `~/Library/LaunchAgents/com.nickd.claude-orchestrator.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.nickd.claude-orchestrator</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>-m</string>
        <string>orchestrator</string>
        <string>serve</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/nickd/Workspaces/ClaudeAgents</string>
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

Load with:
```bash
launchctl load ~/Library/LaunchAgents/com.nickd.claude-orchestrator.plist
```

## Configuration

### Agent Config Extensions

Add to each agent's `config.json`:

```json
{
  "name": "monthly-bulletin",
  "trigger": {
    "type": "scheduled",
    "schedule": "0 9 25 * *",
    "default_task": "Generate the monthly bulletin draft for the upcoming month"
  }
}
```

### Orchestrator Config

Create `orchestrator/config.json`:

```json
{
  "agents_dir": "/Users/nickd/Workspaces/ClaudeAgents",
  "output_dir": "/Users/nickd/Workspaces/ClaudeAgents/output",
  "claude_path": "/usr/local/bin/claude",
  "default_timeout": 600,
  "api": {
    "host": "127.0.0.1",
    "port": 5000
  },
  "notifications": {
    "email": "nickd@wharfsidemb.com",
    "notify_on_success": false,
    "notify_on_failure": true
  }
}
```

## Web Admin Interface

A web-based UI for managing agents, editing skills, and configuring MCP servers.

### UI Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEB ADMIN INTERFACE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Agent Manager  │  │   MCP Server    │  │   Execution     │         │
│  │                 │  │   Manager       │  │   Monitor       │         │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤         │
│  │ • List agents   │  │ • Available     │  │ • Run history   │         │
│  │ • Edit SKILL.md │  │   servers       │  │ • Live logs     │         │
│  │ • Edit config   │  │ • Server status │  │ • Trigger runs  │         │
│  │ • Create new    │  │ • Assign to     │  │ • View results  │         │
│  │ • Delete agent  │  │   agents        │  │ • Re-run failed │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### MCP Server Registry

Global registry of available MCP servers that agents can use.

```python
# orchestrator/mcp_registry.py

from dataclasses import dataclass
from typing import List, Dict, Optional
import json
from pathlib import Path

@dataclass
class MCPServer:
    name: str
    description: str
    command: str
    args: List[str]
    env: Dict[str, str]
    status: str  # "available", "connected", "error"
    required_auth: bool
    auth_status: str  # "authenticated", "needs_auth", "expired"

class MCPRegistry:
    """Central registry of all available MCP servers"""

    def __init__(self, config_path: str = None):
        self.servers: Dict[str, MCPServer] = {}
        self._load_global_config()

    def _load_global_config(self):
        """Load MCP servers from Claude Code's config"""
        # Read from ~/.claude/settings.json or similar
        claude_config = Path.home() / ".claude" / "settings.json"

        if claude_config.exists():
            with open(claude_config) as f:
                config = json.load(f)
                mcp_servers = config.get('mcpServers', {})

                for name, server_config in mcp_servers.items():
                    self.servers[name] = MCPServer(
                        name=name,
                        description=self._get_server_description(name),
                        command=server_config.get('command', ''),
                        args=server_config.get('args', []),
                        env=server_config.get('env', {}),
                        status='available',
                        required_auth=name in ['gmail', 'gmail-personal', 'gdrive', 'google-docs'],
                        auth_status='unknown'
                    )

    def _get_server_description(self, name: str) -> str:
        """Human-readable descriptions for known MCP servers"""
        descriptions = {
            'gmail': 'Gmail access for board email (nickd@wharfsidemb.com)',
            'gmail-personal': 'Gmail access for personal email (nickd@demarconet.com)',
            'gdrive': 'Google Drive file access',
            'google-docs': 'Google Docs creation and editing',
            'chrome': 'Chrome browser automation',
            'powerpoint': 'PowerPoint presentation creation',
            'voicemode': 'Voice input/output capabilities'
        }
        return descriptions.get(name, f'MCP Server: {name}')

    def list_servers(self) -> List[MCPServer]:
        return list(self.servers.values())

    def get_server(self, name: str) -> Optional[MCPServer]:
        return self.servers.get(name)

    def get_servers_for_agent(self, agent_mcp_list: List[str]) -> List[MCPServer]:
        """Get server details for servers used by an agent"""
        return [self.servers[name] for name in agent_mcp_list if name in self.servers]

    def check_auth_status(self, server_name: str) -> str:
        """Check if a server's authentication is valid"""
        # Would ping the server or check token expiry
        return "authenticated"  # Placeholder
```

### Web API Extensions

Additional endpoints for the admin UI.

```python
# orchestrator/admin_api.py

from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path
import json

def setup_admin_routes(app: Flask, registry, mcp_registry, agents_dir: str):
    """Add admin UI routes to the Flask app"""

    agents_path = Path(agents_dir)

    # ─────────────────────────────────────────────────────────────────
    # AGENT MANAGEMENT
    # ─────────────────────────────────────────────────────────────────

    @app.route('/admin/agents', methods=['GET'])
    def list_agents_detailed():
        """List all agents with full details"""
        agents = []
        for agent in registry.list_agents():
            skill_path = agents_path / agent.folder / "SKILL.md"
            config_path = agents_path / agent.folder / "config.json"

            agents.append({
                'name': agent.name,
                'folder': agent.folder,
                'description': agent.description,
                'mcp_servers': agent.mcp_servers,
                'trigger_type': agent.trigger_type,
                'schedule': agent.schedule,
                'skill_path': str(skill_path),
                'config_path': str(config_path),
                'mcp_details': [
                    {
                        'name': s.name,
                        'description': s.description,
                        'auth_status': s.auth_status
                    }
                    for s in mcp_registry.get_servers_for_agent(agent.mcp_servers)
                ]
            })
        return jsonify(agents)

    @app.route('/admin/agents/<folder>/skill', methods=['GET'])
    def get_agent_skill(folder):
        """Get an agent's SKILL.md content"""
        skill_path = agents_path / folder / "SKILL.md"
        if not skill_path.exists():
            return jsonify({'error': 'Agent not found'}), 404

        return jsonify({
            'folder': folder,
            'content': skill_path.read_text(),
            'path': str(skill_path)
        })

    @app.route('/admin/agents/<folder>/skill', methods=['PUT'])
    def update_agent_skill(folder):
        """Update an agent's SKILL.md content"""
        skill_path = agents_path / folder / "SKILL.md"
        if not skill_path.exists():
            return jsonify({'error': 'Agent not found'}), 404

        data = request.get_json()
        content = data.get('content')
        if not content:
            return jsonify({'error': 'No content provided'}), 400

        # Backup current version
        backup_path = skill_path.with_suffix('.md.bak')
        backup_path.write_text(skill_path.read_text())

        # Write new content
        skill_path.write_text(content)

        return jsonify({
            'success': True,
            'message': f'SKILL.md updated for {folder}',
            'backup': str(backup_path)
        })

    @app.route('/admin/agents/<folder>/config', methods=['GET'])
    def get_agent_config(folder):
        """Get an agent's config.json content"""
        config_path = agents_path / folder / "config.json"
        if not config_path.exists():
            return jsonify({'error': 'Agent not found'}), 404

        with open(config_path) as f:
            config = json.load(f)

        return jsonify({
            'folder': folder,
            'config': config,
            'path': str(config_path)
        })

    @app.route('/admin/agents/<folder>/config', methods=['PUT'])
    def update_agent_config(folder):
        """Update an agent's config.json"""
        config_path = agents_path / folder / "config.json"
        if not config_path.exists():
            return jsonify({'error': 'Agent not found'}), 404

        data = request.get_json()
        config = data.get('config')
        if not config:
            return jsonify({'error': 'No config provided'}), 400

        # Backup current version
        backup_path = config_path.with_suffix('.json.bak')
        with open(config_path) as f:
            backup_path.write_text(f.read())

        # Write new config
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        # Refresh registry
        registry._discover_agents()

        return jsonify({
            'success': True,
            'message': f'config.json updated for {folder}'
        })

    @app.route('/admin/agents', methods=['POST'])
    def create_agent():
        """Create a new agent"""
        data = request.get_json()
        folder = data.get('folder')
        name = data.get('name')
        description = data.get('description', '')
        mcp_servers = data.get('mcp_servers', [])

        if not folder or not name:
            return jsonify({'error': 'folder and name required'}), 400

        agent_path = agents_path / folder
        if agent_path.exists():
            return jsonify({'error': 'Agent folder already exists'}), 400

        # Create folder and files
        agent_path.mkdir()

        # Create config.json
        config = {
            'name': name,
            'description': description,
            'version': '1.0',
            'mcp_servers': mcp_servers,
            'trigger': {
                'type': 'on-demand',
                'description': 'Triggered manually'
            }
        }
        with open(agent_path / 'config.json', 'w') as f:
            json.dump(config, f, indent=2)

        # Create SKILL.md template
        skill_template = f"""# {name} Agent - SKILL

## Purpose

{description}

## Core Workflow

1. **Step 1** - Description
2. **Step 2** - Description
3. **Step 3** - Description

## Input Requirements

(Define what inputs this agent needs)

## Output Format

(Define what this agent produces)

## Usage Examples

```
User: Example request

Agent: Example response
```

## Success Criteria

The agent is working correctly when:

- Criterion 1
- Criterion 2
"""
        (agent_path / 'SKILL.md').write_text(skill_template)

        # Refresh registry
        registry._discover_agents()

        return jsonify({
            'success': True,
            'folder': folder,
            'message': f'Agent {name} created'
        })

    # ─────────────────────────────────────────────────────────────────
    # MCP SERVER MANAGEMENT
    # ─────────────────────────────────────────────────────────────────

    @app.route('/admin/mcp-servers', methods=['GET'])
    def list_mcp_servers():
        """List all available MCP servers"""
        servers = [
            {
                'name': s.name,
                'description': s.description,
                'status': s.status,
                'required_auth': s.required_auth,
                'auth_status': s.auth_status
            }
            for s in mcp_registry.list_servers()
        ]
        return jsonify(servers)

    @app.route('/admin/mcp-servers/<name>/status', methods=['GET'])
    def get_mcp_server_status(name):
        """Get detailed status for an MCP server"""
        server = mcp_registry.get_server(name)
        if not server:
            return jsonify({'error': 'Server not found'}), 404

        return jsonify({
            'name': server.name,
            'description': server.description,
            'command': server.command,
            'args': server.args,
            'status': server.status,
            'auth_status': mcp_registry.check_auth_status(name)
        })

    @app.route('/admin/agents/<folder>/mcp-servers', methods=['PUT'])
    def update_agent_mcp_servers(folder):
        """Update which MCP servers an agent uses"""
        config_path = agents_path / folder / "config.json"
        if not config_path.exists():
            return jsonify({'error': 'Agent not found'}), 404

        data = request.get_json()
        mcp_servers = data.get('mcp_servers', [])

        # Validate all servers exist
        for server_name in mcp_servers:
            if not mcp_registry.get_server(server_name):
                return jsonify({'error': f'Unknown MCP server: {server_name}'}), 400

        # Update config
        with open(config_path) as f:
            config = json.load(f)

        config['mcp_servers'] = mcp_servers

        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        registry._discover_agents()

        return jsonify({
            'success': True,
            'mcp_servers': mcp_servers
        })

    # ─────────────────────────────────────────────────────────────────
    # STATIC UI FILES
    # ─────────────────────────────────────────────────────────────────

    @app.route('/admin')
    @app.route('/admin/')
    def admin_ui():
        """Serve the admin UI"""
        return send_from_directory('static', 'index.html')

    @app.route('/admin/<path:path>')
    def admin_static(path):
        """Serve static files for admin UI"""
        return send_from_directory('static', path)
```

### React Admin UI Components

```jsx
// orchestrator/static/src/App.jsx

import React, { useState, useEffect } from 'react';
import AgentList from './components/AgentList';
import AgentEditor from './components/AgentEditor';
import MCPServerPanel from './components/MCPServerPanel';
import ExecutionMonitor from './components/ExecutionMonitor';

function App() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div className="app">
      <header>
        <h1>Claude Agents Orchestrator</h1>
        <nav>
          <button onClick={() => setActiveTab('agents')}>Agents</button>
          <button onClick={() => setActiveTab('mcp')}>MCP Servers</button>
          <button onClick={() => setActiveTab('monitor')}>Execution Monitor</button>
        </nav>
      </header>

      <main>
        {activeTab === 'agents' && (
          <div className="agents-view">
            <AgentList
              onSelect={setSelectedAgent}
              selected={selectedAgent}
            />
            {selectedAgent && (
              <AgentEditor agent={selectedAgent} />
            )}
          </div>
        )}

        {activeTab === 'mcp' && (
          <MCPServerPanel />
        )}

        {activeTab === 'monitor' && (
          <ExecutionMonitor />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AGENT LIST COMPONENT
// ─────────────────────────────────────────────────────────────────

function AgentList({ onSelect, selected }) {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetch('/admin/agents')
      .then(r => r.json())
      .then(setAgents);
  }, []);

  return (
    <div className="agent-list">
      <h2>Agents</h2>
      <button onClick={() => {/* Show create dialog */}}>+ New Agent</button>

      {agents.map(agent => (
        <div
          key={agent.folder}
          className={`agent-card ${selected?.folder === agent.folder ? 'selected' : ''}`}
          onClick={() => onSelect(agent)}
        >
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <div className="mcp-tags">
            {agent.mcp_servers.map(s => (
              <span key={s} className="mcp-tag">{s}</span>
            ))}
          </div>
          <span className={`trigger-badge ${agent.trigger_type}`}>
            {agent.trigger_type}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AGENT EDITOR COMPONENT
// ─────────────────────────────────────────────────────────────────

function AgentEditor({ agent }) {
  const [activeEditor, setActiveEditor] = useState('skill');
  const [skillContent, setSkillContent] = useState('');
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load skill content
    fetch(`/admin/agents/${agent.folder}/skill`)
      .then(r => r.json())
      .then(data => setSkillContent(data.content));

    // Load config
    fetch(`/admin/agents/${agent.folder}/config`)
      .then(r => r.json())
      .then(data => setConfig(data.config));
  }, [agent.folder]);

  const saveSkill = async () => {
    setSaving(true);
    await fetch(`/admin/agents/${agent.folder}/skill`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: skillContent })
    });
    setSaving(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    await fetch(`/admin/agents/${agent.folder}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    setSaving(false);
  };

  return (
    <div className="agent-editor">
      <div className="editor-header">
        <h2>{agent.name}</h2>
        <div className="editor-tabs">
          <button
            className={activeEditor === 'skill' ? 'active' : ''}
            onClick={() => setActiveEditor('skill')}
          >
            SKILL.md
          </button>
          <button
            className={activeEditor === 'config' ? 'active' : ''}
            onClick={() => setActiveEditor('config')}
          >
            config.json
          </button>
          <button
            className={activeEditor === 'mcp' ? 'active' : ''}
            onClick={() => setActiveEditor('mcp')}
          >
            MCP Servers
          </button>
        </div>
      </div>

      {activeEditor === 'skill' && (
        <div className="skill-editor">
          <textarea
            value={skillContent}
            onChange={(e) => setSkillContent(e.target.value)}
            rows={30}
          />
          <button onClick={saveSkill} disabled={saving}>
            {saving ? 'Saving...' : 'Save SKILL.md'}
          </button>
        </div>
      )}

      {activeEditor === 'config' && (
        <div className="config-editor">
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                setConfig(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            rows={20}
          />
          <button onClick={saveConfig} disabled={saving}>
            {saving ? 'Saving...' : 'Save config.json'}
          </button>
        </div>
      )}

      {activeEditor === 'mcp' && (
        <MCPServerSelector
          agent={agent}
          currentServers={config.mcp_servers || []}
          onUpdate={(servers) => setConfig({...config, mcp_servers: servers})}
        />
      )}

      <div className="editor-actions">
        <button onClick={() => {/* Trigger run */}}>
          ▶ Run Agent
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MCP SERVER SELECTOR (for agent config)
// ─────────────────────────────────────────────────────────────────

function MCPServerSelector({ agent, currentServers, onUpdate }) {
  const [allServers, setAllServers] = useState([]);

  useEffect(() => {
    fetch('/admin/mcp-servers')
      .then(r => r.json())
      .then(setAllServers);
  }, []);

  const toggleServer = (serverName) => {
    if (currentServers.includes(serverName)) {
      onUpdate(currentServers.filter(s => s !== serverName));
    } else {
      onUpdate([...currentServers, serverName]);
    }
  };

  return (
    <div className="mcp-selector">
      <h3>MCP Servers for {agent.name}</h3>
      <p>Select which MCP servers this agent can use:</p>

      <div className="server-grid">
        {allServers.map(server => (
          <div
            key={server.name}
            className={`server-option ${currentServers.includes(server.name) ? 'selected' : ''}`}
            onClick={() => toggleServer(server.name)}
          >
            <input
              type="checkbox"
              checked={currentServers.includes(server.name)}
              readOnly
            />
            <div>
              <strong>{server.name}</strong>
              <p>{server.description}</p>
              <span className={`auth-status ${server.auth_status}`}>
                {server.auth_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MCP SERVER PANEL (global view)
// ─────────────────────────────────────────────────────────────────

function MCPServerPanel() {
  const [servers, setServers] = useState([]);

  useEffect(() => {
    fetch('/admin/mcp-servers')
      .then(r => r.json())
      .then(setServers);
  }, []);

  return (
    <div className="mcp-panel">
      <h2>Available MCP Servers</h2>
      <p>These are all the MCP servers configured in Claude Code that agents can use.</p>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Auth Required</th>
            <th>Auth Status</th>
          </tr>
        </thead>
        <tbody>
          {servers.map(server => (
            <tr key={server.name}>
              <td><strong>{server.name}</strong></td>
              <td>{server.description}</td>
              <td>
                <span className={`status-badge ${server.status}`}>
                  {server.status}
                </span>
              </td>
              <td>{server.required_auth ? 'Yes' : 'No'}</td>
              <td>
                <span className={`auth-badge ${server.auth_status}`}>
                  {server.auth_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### CSS Styles

```css
/* orchestrator/static/styles.css */

.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

nav button {
  margin-left: 10px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

nav button:hover {
  background: #f5f5f5;
}

.agents-view {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.agent-list {
  border-right: 1px solid #e0e0e0;
  padding-right: 20px;
}

.agent-card {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
}

.agent-card:hover {
  background: #f8f9fa;
}

.agent-card.selected {
  border-color: #1a5f7a;
  background: #e8f4f8;
}

.mcp-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e0e0e0;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 5px;
}

.trigger-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.trigger-badge.scheduled {
  background: #d4edda;
  color: #155724;
}

.trigger-badge.on-demand {
  background: #cce5ff;
  color: #004085;
}

.agent-editor {
  padding: 20px;
}

.editor-tabs button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
}

.editor-tabs button.active {
  background: white;
  border-bottom-color: white;
}

.skill-editor textarea,
.config-editor textarea {
  width: 100%;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.server-option {
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
}

.server-option.selected {
  border-color: #1a5f7a;
  background: #e8f4f8;
}

.status-badge, .auth-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.available { background: #d4edda; color: #155724; }
.status-badge.error { background: #f8d7da; color: #721c24; }

.auth-badge.authenticated { background: #d4edda; color: #155724; }
.auth-badge.needs_auth { background: #fff3cd; color: #856404; }
.auth-badge.expired { background: #f8d7da; color: #721c24; }
```

## Future Enhancements

1. **Web Dashboard** - React/Vue UI for monitoring and triggering agents
2. **Job Queue** - Redis-backed queue for handling concurrent executions
3. **Result Caching** - Cache expensive research results
4. **Agent Chaining** - Output of one agent feeds into another
5. **Webhooks** - Trigger agents from external services (GitHub, email rules)
6. **Multi-machine** - Distribute agents across multiple Mac Minis
7. **Authentication** - Secure the API with tokens/OAuth
8. **Metrics** - Prometheus/Grafana for monitoring agent performance

## Directory Structure

```
ClaudeAgents/
├── orchestrator/
│   ├── __init__.py
│   ├── main.py
│   ├── registry.py
│   ├── executor.py
│   ├── triggers.py
│   ├── router.py
│   ├── config.json
│   └── DESIGN.md        # This file
├── output/              # Execution results
├── logs/                # Orchestrator logs
├── Manager/
├── Monthly Bulletin/
├── Email Research/
├── Presentation/
└── proposal-review/
```
