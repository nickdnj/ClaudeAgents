"""
Claude Executor - Runs agents via Claude Code CLI.
"""
import subprocess
import json
import threading
from pathlib import Path
from typing import Optional, Callable
from dataclasses import dataclass


@dataclass
class ExecutionResult:
    """Result of a Claude Code execution."""
    success: bool
    output: str
    error: Optional[str] = None
    return_code: int = 0


class ClaudeExecutor:
    """Executes agents via Claude Code CLI."""

    def __init__(self, agents_root: str, claude_cli_path: str = 'claude', timeout: int = 600):
        self.agents_root = Path(agents_root)
        self.claude_cli_path = claude_cli_path
        self.timeout = timeout
        self._mcp_configs = self._load_mcp_configs()

    def _load_mcp_configs(self) -> dict:
        """Load MCP server configurations from Claude settings."""
        settings_paths = [
            Path.home() / '.claude.json',
            Path.home() / '.claude' / 'settings.json',
        ]

        for settings_path in settings_paths:
            if settings_path.exists():
                try:
                    with open(settings_path) as f:
                        settings = json.load(f)
                    return settings.get('mcpServers', {})
                except (json.JSONDecodeError, IOError):
                    continue
        return {}

    def _get_agent_mcp_servers(self, agent_path: Path) -> list[str]:
        """Get required MCP servers from agent's config.json."""
        config_path = agent_path / 'config.json'
        if not config_path.exists():
            return []

        try:
            with open(config_path) as f:
                config = json.load(f)
            return config.get('mcp_servers', [])
        except (json.JSONDecodeError, IOError):
            return []

    def _build_mcp_config_arg(self, required_servers: list[str]) -> Optional[str]:
        """Build MCP config JSON string for required servers."""
        if not required_servers or not self._mcp_configs:
            return None

        # Filter to only include required servers that we have configs for
        filtered_configs = {}
        for server_name in required_servers:
            if server_name in self._mcp_configs:
                filtered_configs[server_name] = self._mcp_configs[server_name]

        if not filtered_configs:
            return None

        return json.dumps({"mcpServers": filtered_configs})

    def execute(self, agent_folder: str, task: str,
                on_complete: Optional[Callable[[ExecutionResult], None]] = None) -> ExecutionResult:
        """
        Execute an agent with a task.

        Args:
            agent_folder: Name of the agent folder
            task: Task description to pass to the agent
            on_complete: Optional callback when execution completes

        Returns:
            ExecutionResult with output or error
        """
        agent_path = self.agents_root / agent_folder

        if not agent_path.exists():
            return ExecutionResult(
                success=False,
                output='',
                error=f"Agent folder '{agent_folder}' not found",
                return_code=-1
            )

        skill_path = agent_path / 'SKILL.md'
        if not skill_path.exists():
            return ExecutionResult(
                success=False,
                output='',
                error=f"SKILL.md not found in '{agent_folder}'",
                return_code=-1
            )

        try:
            # Build the command
            # Using --print mode for non-interactive execution
            cmd = [
                self.claude_cli_path,
                '--print',
                '--output-format', 'text',
                '--verbose',
                '--dangerously-skip-permissions',  # Required for non-interactive MCP access
            ]

            # Add MCP server configs if agent requires them
            required_mcp = self._get_agent_mcp_servers(agent_path)
            if required_mcp:
                mcp_config_json = self._build_mcp_config_arg(required_mcp)
                if mcp_config_json:
                    cmd.extend(['--mcp-config', mcp_config_json])

            # Build the prompt including the SKILL context
            skill_content = skill_path.read_text()
            full_prompt = f"""You are executing as the agent defined in SKILL.md below.

<skill>
{skill_content}
</skill>

Task: {task}

Execute this task according to your SKILL.md instructions."""

            # Execute the command
            result = subprocess.run(
                cmd,
                input=full_prompt,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=str(agent_path)
            )

            execution_result = ExecutionResult(
                success=result.returncode == 0,
                output=result.stdout,
                error=result.stderr if result.returncode != 0 else None,
                return_code=result.returncode
            )

            if on_complete:
                on_complete(execution_result)

            return execution_result

        except subprocess.TimeoutExpired:
            return ExecutionResult(
                success=False,
                output='',
                error=f"Execution timed out after {self.timeout} seconds",
                return_code=-2
            )
        except FileNotFoundError:
            return ExecutionResult(
                success=False,
                output='',
                error=f"Claude CLI not found at '{self.claude_cli_path}'",
                return_code=-3
            )
        except Exception as e:
            return ExecutionResult(
                success=False,
                output='',
                error=str(e),
                return_code=-4
            )

    def execute_async(self, agent_folder: str, task: str,
                      on_complete: Callable[[ExecutionResult], None]) -> threading.Thread:
        """
        Execute an agent asynchronously in a background thread.

        Args:
            agent_folder: Name of the agent folder
            task: Task description
            on_complete: Callback when execution completes

        Returns:
            The thread running the execution
        """
        thread = threading.Thread(
            target=self.execute,
            args=(agent_folder, task, on_complete),
            daemon=True
        )
        thread.start()
        return thread
