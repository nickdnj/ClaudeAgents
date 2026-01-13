"""
MCP Server management API endpoints.
Supports CRUD operations for MCP server configurations.
"""
from flask import Blueprint, jsonify, request
import json
import os
import subprocess
import time
from pathlib import Path

from ..models.mcp_server import MCPServer

mcp_bp = Blueprint('mcp', __name__)


def get_user_mcp_servers() -> dict:
    """
    Read MCP server configuration from user's Claude Code settings.
    These servers are read-only (not managed by orchestrator).

    Returns:
        Dict of server name -> config
    """
    settings_paths = [
        Path.home() / '.claude.json',
        Path.home() / '.claude' / 'settings.json',
        Path.home() / '.config' / 'claude' / 'settings.json',
    ]

    for settings_path in settings_paths:
        if not settings_path.exists():
            continue
        try:
            with open(settings_path) as f:
                settings = json.load(f)
            return settings.get('mcpServers', {})
        except (json.JSONDecodeError, IOError):
            continue

    return {}


# Common server descriptions
SERVER_DESCRIPTIONS = {
    'gmail': 'Gmail access for email operations',
    'gmail-personal': 'Gmail access (personal account)',
    'gmail-board': 'Gmail access (board account)',
    'gdrive': 'Google Drive file operations',
    'google-drive': 'Google Drive file operations',
    'google-docs': 'Google Docs creation and editing',
    'google-docs-mcp': 'Google Docs creation and editing',
    'chrome': 'Browser automation',
    'voicemode': 'Voice input/output',
    'powerpoint': 'PowerPoint presentation creation',
}


@mcp_bp.route('/mcp/servers', methods=['GET'])
def list_mcp_servers():
    """
    List all MCP servers (merged from user config and orchestrator config).
    User servers are marked as read-only.
    """
    # Get user's servers (read-only)
    user_servers = get_user_mcp_servers()

    # Get orchestrator-managed servers
    orchestrator_servers = MCPServer.load_all()

    # Build merged list
    merged = {}

    # Add user servers first (will be overwritten by orchestrator if same name)
    for name, config in user_servers.items():
        merged[name] = {
            'name': name,
            'command': config.get('command', ''),
            'args': config.get('args', []),
            'env': config.get('env', {}),
            'source': 'user',  # Read-only
            'description': SERVER_DESCRIPTIONS.get(name, ''),
        }

    # Add/override with orchestrator servers
    for name, server in orchestrator_servers.items():
        merged[name] = {
            **server.to_dict(),
            'source': 'orchestrator',  # Editable
            'description': SERVER_DESCRIPTIONS.get(name, ''),
        }

    return jsonify({'servers': list(merged.values())})


@mcp_bp.route('/mcp/servers/<name>', methods=['GET'])
def get_mcp_server(name: str):
    """Get a specific MCP server configuration."""
    # Check orchestrator servers first
    server = MCPServer.get(name)
    if server:
        return jsonify({
            **server.to_dict(),
            'source': 'orchestrator',
            'description': SERVER_DESCRIPTIONS.get(name, ''),
        })

    # Check user servers
    user_servers = get_user_mcp_servers()
    if name in user_servers:
        config = user_servers[name]
        return jsonify({
            'name': name,
            'command': config.get('command', ''),
            'args': config.get('args', []),
            'env': config.get('env', {}),
            'source': 'user',
            'description': SERVER_DESCRIPTIONS.get(name, ''),
        })

    return jsonify({'error': 'MCP server not found'}), 404


@mcp_bp.route('/mcp/servers', methods=['POST'])
def create_mcp_server():
    """Create a new MCP server configuration."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    command = data.get('command', '').strip()

    if not name:
        return jsonify({'error': 'Server name is required'}), 400
    if not command:
        return jsonify({'error': 'Command is required'}), 400

    # Check if name exists in user config (can't override user servers)
    user_servers = get_user_mcp_servers()
    if name in user_servers:
        return jsonify({'error': f"Server '{name}' exists in user config and cannot be overridden"}), 409

    try:
        server = MCPServer.create(
            name=name,
            command=command,
            args=data.get('args', []),
            env=data.get('env', {})
        )
        return jsonify({
            **server.to_dict(),
            'source': 'orchestrator',
            'description': SERVER_DESCRIPTIONS.get(name, ''),
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 409


@mcp_bp.route('/mcp/servers/<name>', methods=['PUT'])
def update_mcp_server(name: str):
    """Update an existing MCP server configuration."""
    # Can only update orchestrator-managed servers
    server = MCPServer.get(name)
    if not server:
        return jsonify({'error': f"Server '{name}' not found or is read-only"}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    command = data.get('command', '').strip()
    if not command:
        return jsonify({'error': 'Command is required'}), 400

    try:
        server = MCPServer.update(
            name=name,
            command=command,
            args=data.get('args', []),
            env=data.get('env', {})
        )
        return jsonify({
            **server.to_dict(),
            'source': 'orchestrator',
            'description': SERVER_DESCRIPTIONS.get(name, ''),
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@mcp_bp.route('/mcp/servers/<name>', methods=['DELETE'])
def delete_mcp_server(name: str):
    """Delete an MCP server configuration."""
    # Can only delete orchestrator-managed servers
    server = MCPServer.get(name)
    if not server:
        return jsonify({'error': f"Server '{name}' not found or is read-only"}), 404

    try:
        MCPServer.delete(name)
        return jsonify({'success': True})
    except ValueError as e:
        return jsonify({'error': str(e)}), 404


@mcp_bp.route('/mcp/servers/<name>/copy', methods=['POST'])
def copy_mcp_server(name: str):
    """Copy an MCP server to a new name."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    new_name = data.get('new_name', '').strip()
    if not new_name:
        return jsonify({'error': 'New name is required'}), 400

    # Check if new name exists in user config
    user_servers = get_user_mcp_servers()
    if new_name in user_servers:
        return jsonify({'error': f"Server '{new_name}' exists in user config"}), 409

    # Check if source exists
    server = MCPServer.get(name)
    source_config = None

    if server:
        source_config = server.to_dict()
    else:
        # Try copying from user config
        if name in user_servers:
            config = user_servers[name]
            source_config = {
                'name': name,
                'command': config.get('command', ''),
                'args': config.get('args', []),
                'env': config.get('env', {}),
            }

    if not source_config:
        return jsonify({'error': f"Server '{name}' not found"}), 404

    try:
        # Create new server with source config
        new_server = MCPServer.create(
            name=new_name,
            command=source_config['command'],
            args=source_config['args'].copy() if source_config['args'] else [],
            env=source_config['env'].copy() if source_config['env'] else {}
        )
        return jsonify({
            **new_server.to_dict(),
            'source': 'orchestrator',
            'description': SERVER_DESCRIPTIONS.get(new_name, ''),
        }), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 409


@mcp_bp.route('/mcp/servers/<name>/test', methods=['POST'])
def test_mcp_server(name: str):
    """Test if an MCP server can start successfully."""
    # Get server config
    server = MCPServer.get(name)
    if not server:
        # Try user config
        user_servers = get_user_mcp_servers()
        if name not in user_servers:
            return jsonify({'success': False, 'message': 'Server not found'}), 404
        config = user_servers[name]
        command = config.get('command', '')
        args = config.get('args', [])
        env_vars = config.get('env', {})
    else:
        command = server.command
        args = server.args
        env_vars = server.env

    if not command:
        return jsonify({'success': False, 'message': 'No command configured'})

    try:
        # Set up environment
        env = os.environ.copy()
        env.update(env_vars)

        # Start the process
        proc = subprocess.Popen(
            [command] + args,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE
        )

        # Wait briefly to see if it starts
        time.sleep(2)

        if proc.poll() is None:
            # Process is still running - success
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
            return jsonify({
                'success': True,
                'message': 'Server started successfully'
            })
        else:
            # Process exited - check error
            _, stderr = proc.communicate()
            error_msg = stderr.decode('utf-8', errors='replace')[:500]
            return jsonify({
                'success': False,
                'message': f'Server exited immediately: {error_msg}'
            })

    except FileNotFoundError:
        return jsonify({
            'success': False,
            'message': f"Command not found: {command}"
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })


# Legacy endpoint for backwards compatibility
@mcp_bp.route('/mcp-servers', methods=['GET'])
def list_mcp_servers_legacy():
    """Legacy endpoint - redirects to new endpoint format."""
    return list_mcp_servers()
