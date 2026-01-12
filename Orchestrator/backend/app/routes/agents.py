"""
Agent management API endpoints.
"""
import subprocess
import json
from flask import Blueprint, jsonify, request, current_app
from app.services.agent_registry import AgentRegistry
from app.services.claude_executor import ClaudeExecutor
from app.services.git_service import GitService
from app.models.execution import Execution

agents_bp = Blueprint('agents', __name__)


def get_registry() -> AgentRegistry:
    """Get agent registry instance."""
    return AgentRegistry(current_app.config['AGENTS_ROOT'])


def get_executor() -> ClaudeExecutor:
    """Get Claude executor instance."""
    return ClaudeExecutor(
        agents_root=current_app.config['AGENTS_ROOT'],
        claude_cli_path=current_app.config['CLAUDE_CLI_PATH'],
        timeout=current_app.config['CLAUDE_TIMEOUT']
    )


def get_git_service() -> GitService:
    """Get git service instance."""
    return GitService(current_app.config['AGENTS_ROOT'])


# ============================================================================
# Agent CRUD Endpoints
# ============================================================================

@agents_bp.route('/agents', methods=['GET'])
def list_agents():
    """
    List all agents.

    Returns:
        JSON array of agent objects
    """
    registry = get_registry()
    agents = registry.discover_agents()
    return jsonify([agent.to_dict() for agent in agents])


@agents_bp.route('/agents/<folder>', methods=['GET'])
def get_agent(folder: str):
    """
    Get a specific agent by folder name.

    Args:
        folder: Agent folder name

    Returns:
        JSON agent object with full content
    """
    registry = get_registry()
    agent = registry.get_agent(folder)

    if not agent:
        return jsonify({
            'error': 'Agent not found',
            'code': 'AGENT_NOT_FOUND'
        }), 404

    return jsonify(agent.to_dict(include_content=True))


@agents_bp.route('/agents', methods=['POST'])
def create_agent():
    """
    Create a new agent.

    Request body:
        - folder: Agent folder name (required)
        - name: Display name (required)
        - description: Agent description
        - skill_content: Initial SKILL.md content
        - trigger: 'on-demand' or 'scheduled'
        - mcp_servers: List of MCP server names

    Returns:
        JSON agent object
    """
    data = request.get_json()

    if not data:
        return jsonify({
            'error': 'Request body required',
            'code': 'MISSING_BODY'
        }), 400

    folder = data.get('folder', '').strip()
    name = data.get('name', '').strip()

    if not folder:
        return jsonify({
            'error': 'Folder name is required',
            'code': 'MISSING_FOLDER'
        }), 400

    if not name:
        return jsonify({
            'error': 'Name is required',
            'code': 'MISSING_NAME'
        }), 400

    registry = get_registry()

    try:
        agent = registry.create_agent(
            folder_name=folder,
            name=name,
            description=data.get('description', ''),
            skill_content=data.get('skill_content', ''),
            config={
                'trigger': data.get('trigger', 'on-demand'),
                'mcp_servers': data.get('mcp_servers', []),
            }
        )

        # Auto-commit the new agent
        git_service = get_git_service()
        git_service.auto_commit(folder, f"Create agent: {name}")

        return jsonify(agent.to_dict(include_content=True)), 201

    except ValueError as e:
        return jsonify({
            'error': str(e),
            'code': 'VALIDATION_ERROR'
        }), 400


@agents_bp.route('/agents/<folder>', methods=['PUT'])
def update_agent(folder: str):
    """
    Update an agent's files.

    Args:
        folder: Agent folder name

    Request body:
        - skill_content: New SKILL.md content
        - config_content: New config.json content (as string)

    Returns:
        JSON agent object
    """
    data = request.get_json()

    if not data:
        return jsonify({
            'error': 'Request body required',
            'code': 'MISSING_BODY'
        }), 400

    registry = get_registry()

    # Check agent exists
    existing = registry.get_agent(folder)
    if not existing:
        return jsonify({
            'error': 'Agent not found',
            'code': 'AGENT_NOT_FOUND'
        }), 404

    try:
        agent = registry.update_agent(
            folder_name=folder,
            skill_content=data.get('skill_content'),
            config_content=data.get('config_content')
        )

        # Auto-commit changes
        git_service = get_git_service()
        git_service.auto_commit(folder, f"Update agent: {agent.name}")

        return jsonify(agent.to_dict(include_content=True))

    except ValueError as e:
        return jsonify({
            'error': str(e),
            'code': 'VALIDATION_ERROR'
        }), 400


@agents_bp.route('/admin/agents/<folder>', methods=['DELETE'])
def delete_agent(folder: str):
    """
    Delete an agent (requires confirmation).

    Args:
        folder: Agent folder name

    Request body:
        - confirm: Must match the folder name exactly

    Returns:
        Success message or error
    """
    data = request.get_json() or {}
    confirm = data.get('confirm', '')

    # Require confirmation matching folder name
    if confirm != folder:
        return jsonify({
            'error': 'Confirmation required',
            'code': 'CONFIRMATION_REQUIRED',
            'message': f'Request body must include confirm: "{folder}"'
        }), 400

    registry = get_registry()

    # Check agent exists
    existing = registry.get_agent(folder)
    if not existing:
        return jsonify({
            'error': 'Agent not found',
            'code': 'AGENT_NOT_FOUND'
        }), 404

    try:
        registry.delete_agent(folder)

        # Note: We don't auto-commit deletions to allow recovery
        # User should manually commit if they want to persist

        return jsonify({
            'success': True,
            'message': f"Agent '{folder}' deleted"
        })

    except ValueError as e:
        return jsonify({
            'error': str(e),
            'code': 'DELETE_ERROR'
        }), 400


# ============================================================================
# Agent Execution Endpoint
# ============================================================================

@agents_bp.route('/agents/<folder>/execute', methods=['POST'])
def execute_agent(folder: str):
    """
    Execute an agent with a task (async - returns immediately).

    Args:
        folder: Agent folder name

    Request body:
        - task: Task description (required)
        - timeout: Execution timeout in seconds (optional)

    Returns:
        Execution record with status 'running'
    """
    data = request.get_json()

    if not data:
        return jsonify({
            'error': 'Request body required',
            'code': 'MISSING_BODY'
        }), 400

    task = data.get('task', '').strip()

    if not task:
        return jsonify({
            'error': 'Task is required',
            'code': 'MISSING_TASK'
        }), 400

    registry = get_registry()

    # Check agent exists
    agent = registry.get_agent(folder)
    if not agent:
        return jsonify({
            'error': 'Agent not found',
            'code': 'AGENT_NOT_FOUND'
        }), 404

    # Create execution record
    execution = Execution.create(
        agent_folder=folder,
        task=task,
        triggered_by='manual'
    )

    # Capture values needed for background thread
    execution_id = execution.id
    db_path = current_app.config['DATABASE_PATH']

    def on_pid(pid: int):
        """Callback when process starts - saves PID for status checking."""
        from app.models.database import get_db_connection
        # Use context manager for thread-safe DB access
        with get_db_connection(db_path) as conn:
            conn.execute('UPDATE executions SET pid = ? WHERE id = ?', (pid, execution_id))
            conn.commit()

    def on_complete(result):
        """Callback when execution finishes - runs in background thread."""
        from app.models.database import get_db_connection
        # Use context manager for thread-safe DB access
        with get_db_connection(db_path) as conn:
            if result.success:
                conn.execute('''
                    UPDATE executions
                    SET status = 'success', output = ?, completed_at = datetime('now'),
                        duration_seconds = (julianday(datetime('now')) - julianday(started_at)) * 86400
                    WHERE id = ?
                ''', (result.output, execution_id))
            else:
                conn.execute('''
                    UPDATE executions
                    SET status = 'failed', error = ?, completed_at = datetime('now'),
                        duration_seconds = (julianday(datetime('now')) - julianday(started_at)) * 86400
                    WHERE id = ?
                ''', (result.error or 'Unknown error', execution_id))
            conn.commit()

    # Execute asynchronously in background thread
    executor = get_executor()
    executor.execute_async(folder, task, on_complete, on_pid)

    # Return immediately with 'running' status
    return jsonify(execution.to_dict()), 202


# ============================================================================
# Agent History Endpoint
# ============================================================================

@agents_bp.route('/agents/<folder>/history', methods=['GET'])
def get_agent_history(folder: str):
    """
    Get git history for an agent.

    Args:
        folder: Agent folder name

    Query params:
        - limit: Maximum commits to return (default 10)

    Returns:
        List of commit records
    """
    registry = get_registry()

    # Check agent exists
    agent = registry.get_agent(folder)
    if not agent:
        return jsonify({
            'error': 'Agent not found',
            'code': 'AGENT_NOT_FOUND'
        }), 404

    limit = request.args.get('limit', 10, type=int)

    git_service = get_git_service()
    history = git_service.get_file_history(f"{folder}/SKILL.md", limit=limit)

    return jsonify(history)


# ============================================================================
# Agent Generation Endpoint
# ============================================================================

@agents_bp.route('/agents/generate', methods=['POST'])
def generate_agent():
    """
    Generate agent content using Claude.

    Request body:
        - prompt: Description of what the agent should do (required)
        - mcp_servers: List of available MCP servers for context

    Returns:
        JSON with generated name, description, and skill_content
    """
    data = request.get_json()

    if not data:
        return jsonify({
            'error': 'Request body required',
            'code': 'MISSING_BODY'
        }), 400

    prompt = data.get('prompt', '').strip()

    if not prompt:
        return jsonify({
            'error': 'Prompt is required',
            'code': 'MISSING_PROMPT'
        }), 400

    mcp_servers = data.get('mcp_servers', [])

    # Build the generation prompt
    system_prompt = """You are an AI assistant that generates Claude Code agent configurations.

Given a user's description of what they want an agent to do, generate:
1. A short, descriptive name for the agent
2. A brief description (1-2 sentences)
3. A SKILL.md file with detailed instructions

The SKILL.md should follow this structure:
- Purpose section explaining what the agent does
- Workflow section with numbered steps
- Any specific instructions or constraints
- Output format expectations

Respond ONLY with valid JSON in this exact format:
{
  "name": "Agent Name",
  "description": "Brief description of what the agent does",
  "skill_content": "# Agent Name\\n\\n## Purpose\\n...full markdown content..."
}"""

    user_prompt = f"""Create an agent with the following requirements:

{prompt}

Available MCP servers that can be used: {', '.join(mcp_servers) if mcp_servers else 'gmail, gdrive, google-docs, chrome'}

Generate the agent configuration as JSON."""

    try:
        # Call Claude CLI to generate content
        result = subprocess.run(
            [current_app.config['CLAUDE_CLI_PATH'], '-p', user_prompt, '--output-format', 'text'],
            capture_output=True,
            text=True,
            timeout=60,
            input=system_prompt
        )

        if result.returncode != 0:
            return jsonify({
                'error': 'Failed to generate content',
                'code': 'GENERATION_FAILED',
                'details': result.stderr
            }), 500

        output = result.stdout.strip()

        # Try to extract JSON from the response
        try:
            # Look for JSON in the output
            json_start = output.find('{')
            json_end = output.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = output[json_start:json_end]
                generated = json.loads(json_str)
                return jsonify(generated)
            else:
                return jsonify({
                    'error': 'Could not parse generated content',
                    'code': 'PARSE_ERROR',
                    'raw_output': output
                }), 500
        except json.JSONDecodeError as e:
            return jsonify({
                'error': 'Invalid JSON in generated content',
                'code': 'JSON_ERROR',
                'raw_output': output,
                'details': str(e)
            }), 500

    except subprocess.TimeoutExpired:
        return jsonify({
            'error': 'Generation timed out',
            'code': 'TIMEOUT'
        }), 504
    except Exception as e:
        return jsonify({
            'error': str(e),
            'code': 'GENERATION_ERROR'
        }), 500
