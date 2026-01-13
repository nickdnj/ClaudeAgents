"""MCP Server model for managing MCP configurations."""
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import json
from pathlib import Path

# Path to orchestrator-managed MCP config
MCP_CONFIG_PATH = Path(__file__).parent.parent.parent / 'mcp_servers.json'


@dataclass
class MCPServer:
    """Represents an MCP server configuration."""
    name: str
    command: str
    args: List[str] = field(default_factory=list)
    env: Dict[str, str] = field(default_factory=dict)

    @classmethod
    def load_all(cls) -> Dict[str, 'MCPServer']:
        """Load all orchestrator-managed MCP servers from config file."""
        if not MCP_CONFIG_PATH.exists():
            return {}
        try:
            with open(MCP_CONFIG_PATH) as f:
                data = json.load(f)
            return {
                name: cls(
                    name=name,
                    command=config.get('command', ''),
                    args=config.get('args', []),
                    env=config.get('env', {})
                )
                for name, config in data.get('mcpServers', {}).items()
            }
        except (json.JSONDecodeError, KeyError):
            return {}

    @classmethod
    def save_all(cls, servers: Dict[str, 'MCPServer']) -> None:
        """Persist all servers to config file."""
        data = {
            'mcpServers': {
                name: {
                    'command': s.command,
                    'args': s.args,
                    'env': s.env
                }
                for name, s in servers.items()
            }
        }
        with open(MCP_CONFIG_PATH, 'w') as f:
            json.dump(data, f, indent=2)

    @classmethod
    def get(cls, name: str) -> Optional['MCPServer']:
        """Get a specific server by name."""
        servers = cls.load_all()
        return servers.get(name)

    @classmethod
    def create(cls, name: str, command: str, args: Optional[List[str]] = None,
               env: Optional[Dict[str, str]] = None) -> 'MCPServer':
        """Create a new MCP server configuration."""
        servers = cls.load_all()
        if name in servers:
            raise ValueError(f"Server '{name}' already exists")
        server = cls(
            name=name,
            command=command,
            args=args if args is not None else [],
            env=env if env is not None else {}
        )
        servers[name] = server
        cls.save_all(servers)
        return server

    @classmethod
    def update(cls, name: str, command: str, args: Optional[List[str]] = None,
               env: Optional[Dict[str, str]] = None) -> 'MCPServer':
        """Update an existing MCP server configuration."""
        servers = cls.load_all()
        if name not in servers:
            raise ValueError(f"Server '{name}' not found")
        server = cls(
            name=name,
            command=command,
            args=args if args is not None else [],
            env=env if env is not None else {}
        )
        servers[name] = server
        cls.save_all(servers)
        return server

    @classmethod
    def delete(cls, name: str) -> None:
        """Delete an MCP server configuration."""
        servers = cls.load_all()
        if name not in servers:
            raise ValueError(f"Server '{name}' not found")
        del servers[name]
        cls.save_all(servers)

    @classmethod
    def copy(cls, source_name: str, new_name: str) -> 'MCPServer':
        """Copy an existing server to a new name."""
        servers = cls.load_all()
        if source_name not in servers:
            raise ValueError(f"Server '{source_name}' not found")
        if new_name in servers:
            raise ValueError(f"Server '{new_name}' already exists")
        source = servers[source_name]
        new_server = cls(
            name=new_name,
            command=source.command,
            args=source.args.copy(),
            env=source.env.copy()
        )
        servers[new_name] = new_server
        cls.save_all(servers)
        return new_server

    def to_dict(self) -> dict:
        """Convert server to dictionary."""
        return {
            'name': self.name,
            'command': self.command,
            'args': self.args,
            'env': self.env
        }
