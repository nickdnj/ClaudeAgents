"""
Claude Executor - Runs agents via Claude Code CLI.
"""
import subprocess
import json
import threading
import base64
import requests
from pathlib import Path
from typing import Optional, Callable, Dict, Any
from dataclasses import dataclass


@dataclass
class ExecutionResult:
    """Result of a Claude Code execution."""
    success: bool
    output: str
    error: Optional[str] = None
    return_code: int = 0
    pid: Optional[int] = None


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

    def _fetch_url_content(self, url: str, max_size: int = 50000) -> str:
        """Fetch content from a URL."""
        try:
            response = requests.get(url, timeout=30, headers={
                'User-Agent': 'Orchestrator/1.0'
            })
            response.raise_for_status()
            content = response.text[:max_size]
            if len(response.text) > max_size:
                content += f"\n\n[Truncated - original size: {len(response.text)} chars]"
            return content
        except Exception as e:
            return f"[Error fetching URL: {str(e)}]"

    def _read_file_content(self, path: str, max_size: int = 50000) -> str:
        """Read content from a local file."""
        try:
            file_path = Path(path)
            if not file_path.exists():
                return f"[File not found: {path}]"

            # Check file size first
            size = file_path.stat().st_size
            if size > max_size * 2:  # Allow some buffer for text files
                return f"[File too large: {size} bytes]"

            content = file_path.read_text(errors='replace')[:max_size]
            if len(content) == max_size:
                content += f"\n\n[Truncated - original size: {size} bytes]"
            return content
        except Exception as e:
            return f"[Error reading file: {str(e)}]"

    def _encode_image_base64(self, path: str, max_size: int = 5_000_000) -> str:
        """Encode an image file as base64."""
        try:
            file_path = Path(path)
            if not file_path.exists():
                return f"[Image not found: {path}]"

            size = file_path.stat().st_size
            if size > max_size:
                return f"[Image too large: {size} bytes, max: {max_size}]"

            with open(file_path, 'rb') as f:
                data = f.read()
            return base64.b64encode(data).decode('utf-8')
        except Exception as e:
            return f"[Error encoding image: {str(e)}]"

    def _build_context_section(self, context: Optional[Dict[str, Any]]) -> str:
        """Build the context section for the prompt."""
        if not context:
            return ""

        parts = []

        # Process URLs
        if context.get('urls'):
            for url in context['urls']:
                content = self._fetch_url_content(url)
                parts.append(f'<url src="{url}">\n{content}\n</url>')

        # Process file paths
        if context.get('file_paths'):
            for path in context['file_paths']:
                content = self._read_file_content(path)
                parts.append(f'<document path="{path}">\n{content}\n</document>')

        # Process images
        if context.get('images'):
            for img_path in context['images']:
                b64 = self._encode_image_base64(img_path)
                filename = Path(img_path).name
                parts.append(f'<image filename="{filename}">\n{b64}\n</image>')

        if not parts:
            return ""

        return "<context>\n" + "\n\n".join(parts) + "\n</context>\n\n"

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
                      on_complete: Callable[[ExecutionResult], None],
                      on_pid: Optional[Callable[[int], None]] = None,
                      context: Optional[Dict[str, Any]] = None) -> threading.Thread:
        """
        Execute an agent asynchronously in a background thread.

        Args:
            agent_folder: Name of the agent folder
            task: Task description
            on_complete: Callback when execution completes
            on_pid: Optional callback with PID when process starts
            context: Optional context dict with urls, file_paths, and images

        Returns:
            The thread running the execution
        """
        def run_with_pid():
            agent_path = self.agents_root / agent_folder

            if not agent_path.exists():
                on_complete(ExecutionResult(
                    success=False,
                    output='',
                    error=f"Agent folder '{agent_folder}' not found",
                    return_code=-1
                ))
                return

            skill_path = agent_path / 'SKILL.md'
            if not skill_path.exists():
                on_complete(ExecutionResult(
                    success=False,
                    output='',
                    error=f"SKILL.md not found in '{agent_folder}'",
                    return_code=-1
                ))
                return

            try:
                # Build the command
                cmd = [
                    self.claude_cli_path,
                    '--print',
                    '--output-format', 'text',
                    '--verbose',
                    '--dangerously-skip-permissions',
                ]

                # Add MCP server configs if agent requires them
                required_mcp = self._get_agent_mcp_servers(agent_path)
                if required_mcp:
                    mcp_config_json = self._build_mcp_config_arg(required_mcp)
                    if mcp_config_json:
                        cmd.extend(['--mcp-config', mcp_config_json])

                # Build the context section (URLs, files, images)
                context_section = self._build_context_section(context)

                # Build the prompt including the SKILL context
                skill_content = skill_path.read_text()
                full_prompt = f"""You are executing as the agent defined in SKILL.md below.

<skill>
{skill_content}
</skill>

{context_section}Task: {task}

Execute this task according to your SKILL.md instructions."""

                # Use Popen to get the PID immediately
                process = subprocess.Popen(
                    cmd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    cwd=str(agent_path)
                )

                # Notify caller of PID
                if on_pid:
                    on_pid(process.pid)

                # Wait for completion with timeout
                try:
                    stdout, stderr = process.communicate(input=full_prompt, timeout=self.timeout)
                    execution_result = ExecutionResult(
                        success=process.returncode == 0,
                        output=stdout,
                        error=stderr if process.returncode != 0 else None,
                        return_code=process.returncode,
                        pid=process.pid
                    )
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.communicate()  # Clean up
                    execution_result = ExecutionResult(
                        success=False,
                        output='',
                        error=f"Execution timed out after {self.timeout} seconds",
                        return_code=-2,
                        pid=process.pid
                    )

                on_complete(execution_result)

            except FileNotFoundError:
                on_complete(ExecutionResult(
                    success=False,
                    output='',
                    error=f"Claude CLI not found at '{self.claude_cli_path}'",
                    return_code=-3
                ))
            except Exception as e:
                on_complete(ExecutionResult(
                    success=False,
                    output='',
                    error=str(e),
                    return_code=-4
                ))

        thread = threading.Thread(target=run_with_pid, daemon=True)
        thread.start()
        return thread
