"""
Agent management API endpoints.
"""
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

    def on_complete(result):
        """Callback when execution finishes - runs in background thread."""
        from app.models.database import init_db
        # Re-initialize DB connection for this thread
        init_db(db_path)
        exec_record = Execution.get_by_id(execution_id)
        if exec_record:
            if result.success:
                exec_record.complete(result.output)
            else:
                exec_record.fail(result.error or 'Unknown error')

    # Execute asynchronously in background thread
    executor = get_executor()
    executor.execute_async(folder, task, on_complete)

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
