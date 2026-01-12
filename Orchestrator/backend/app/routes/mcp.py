"""
MCP Server status API endpoints.
"""
from flask import Blueprint, jsonify
import json
import os
from pathlib import Path

mcp_bp = Blueprint('mcp', __name__)


def get_mcp_servers() -> list[dict]:
    """
    Read MCP server configuration from Claude Code settings.

    Returns:
        List of MCP server configurations
    """
    # Claude Code settings location
    settings_paths = [
        Path.home() / '.claude' / 'settings.json',
        Path.home() / '.config' / 'claude' / 'settings.json',
    ]

    servers = []

    for settings_path in settings_paths:
        if not settings_path.exists():
            continue

        try:
            with open(settings_path) as f:
                settings = json.load(f)

            mcp_config = settings.get('mcpServers', {})

            for name, config in mcp_config.items():
                servers.append({
                    'name': name,
                    'command': config.get('command', ''),
                    'args': config.get('args', []),
                    'env': config.get('env', {}),
                    'status': 'configured',  # We can't easily check running status
                })

            break  # Use first found settings file

        except (json.JSONDecodeError, IOError):
            continue

    return servers


@mcp_bp.route('/mcp-servers', methods=['GET'])
def list_mcp_servers():
    """
    List all configured MCP servers.

    Returns:
        JSON array of MCP server configurations
    """
    servers = get_mcp_servers()

    # Add some common server descriptions
    descriptions = {
        'gmail': 'Gmail access for email operations',
        'gmail-personal': 'Gmail access (personal account)',
        'gdrive': 'Google Drive file operations',
        'google-docs': 'Google Docs creation and editing',
        'chrome': 'Browser automation',
        'voicemode': 'Voice input/output',
        'powerpoint': 'PowerPoint presentation creation',
    }

    for server in servers:
        server['description'] = descriptions.get(server['name'], '')

    return jsonify(servers)


@mcp_bp.route('/mcp-servers/<name>', methods=['GET'])
def get_mcp_server(name: str):
    """
    Get a specific MCP server configuration.

    Args:
        name: MCP server name

    Returns:
        JSON MCP server configuration
    """
    servers = get_mcp_servers()

    for server in servers:
        if server['name'] == name:
            return jsonify(server)

    return jsonify({
        'error': 'MCP server not found',
        'code': 'MCP_NOT_FOUND'
    }), 404
