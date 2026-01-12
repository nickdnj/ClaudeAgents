"""
Agent Registry - Discovers and manages agents from the filesystem.
"""
import json
import re
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict, field


@dataclass
class Agent:
    """Represents an agent configuration."""
    folder: str
    name: str
    description: str = ''
    trigger: str = 'on-demand'
    mcp_servers: list = field(default_factory=list)
    schedule: Optional[str] = None
    skill_content: Optional[str] = None
    config_content: Optional[str] = None

    def to_dict(self, include_content: bool = False) -> dict:
        """Convert to dictionary for JSON serialization."""
        data = {
            'folder': self.folder,
            'name': self.name,
            'description': self.description,
            'trigger': self.trigger,
            'mcp_servers': self.mcp_servers,
            'schedule': self.schedule,
        }
        if include_content:
            data['skill_content'] = self.skill_content
            data['config_content'] = self.config_content
        return data


class AgentRegistry:
    """Discovers and manages agents from the filesystem."""

    # Folders to exclude from agent discovery
    EXCLUDED_FOLDERS = {
        '.git', '__pycache__', 'node_modules', 'venv', '.venv',
        'Orchestrator', 'examples', 'templates', 'assets'
    }

    def __init__(self, agents_root: str):
        self.agents_root = Path(agents_root)

    def discover_agents(self) -> list[Agent]:
        """Discover all agents in the repository."""
        agents = []

        if not self.agents_root.exists():
            return agents

        for folder in self.agents_root.iterdir():
            if not folder.is_dir():
                continue
            if folder.name in self.EXCLUDED_FOLDERS:
                continue
            if folder.name.startswith('.'):
                continue

            # Check for SKILL.md
            skill_path = folder / 'SKILL.md'
            if not skill_path.exists():
                continue

            agent = self._load_agent(folder)
            if agent:
                agents.append(agent)

        # Sort by name
        agents.sort(key=lambda a: a.name.lower())
        return agents

    def get_agent(self, folder_name: str) -> Optional[Agent]:
        """Get a specific agent by folder name."""
        if not self._is_valid_folder_name(folder_name):
            return None

        agent_path = self.agents_root / folder_name
        if not agent_path.exists() or not agent_path.is_dir():
            return None

        skill_path = agent_path / 'SKILL.md'
        if not skill_path.exists():
            return None

        return self._load_agent(agent_path, include_content=True)

    def create_agent(self, folder_name: str, name: str, description: str = '',
                     skill_content: str = '', config: dict = None) -> Agent:
        """Create a new agent."""
        if not self._is_valid_folder_name(folder_name):
            raise ValueError("Invalid folder name. Use only letters, numbers, and hyphens.")

        agent_path = self.agents_root / folder_name
        if agent_path.exists():
            raise ValueError(f"Agent folder '{folder_name}' already exists.")

        # Create folder
        agent_path.mkdir(parents=True)

        # Create SKILL.md
        skill_path = agent_path / 'SKILL.md'
        if not skill_content:
            skill_content = f"# {name}\n\n## Purpose\n\n{description}\n\n## Workflow\n\n1. TODO\n"
        skill_path.write_text(skill_content)

        # Create config.json
        config_path = agent_path / 'config.json'
        default_config = {
            'name': name,
            'description': description,
            'version': '1.0.0',
            'trigger': config.get('trigger', 'on-demand') if config else 'on-demand',
            'mcp_servers': config.get('mcp_servers', []) if config else [],
        }
        if config:
            default_config.update(config)
        config_path.write_text(json.dumps(default_config, indent=2))

        return self._load_agent(agent_path, include_content=True)

    def update_agent(self, folder_name: str, skill_content: str = None,
                     config_content: str = None) -> Agent:
        """Update an agent's files."""
        if not self._is_valid_folder_name(folder_name):
            raise ValueError("Invalid folder name.")

        agent_path = self.agents_root / folder_name
        if not agent_path.exists():
            raise ValueError(f"Agent '{folder_name}' not found.")

        if skill_content is not None:
            skill_path = agent_path / 'SKILL.md'
            skill_path.write_text(skill_content)

        if config_content is not None:
            # Validate JSON
            try:
                json.loads(config_content)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON in config: {e}")

            config_path = agent_path / 'config.json'
            config_path.write_text(config_content)

        return self._load_agent(agent_path, include_content=True)

    def delete_agent(self, folder_name: str) -> bool:
        """Delete an agent folder."""
        if not self._is_valid_folder_name(folder_name):
            raise ValueError("Invalid folder name.")

        agent_path = self.agents_root / folder_name
        if not agent_path.exists():
            raise ValueError(f"Agent '{folder_name}' not found.")

        # Remove all files in the folder
        for file in agent_path.iterdir():
            if file.is_file():
                file.unlink()
            elif file.is_dir():
                # Recursively remove subdirectories (e.g., examples/)
                import shutil
                shutil.rmtree(file)

        # Remove the folder
        agent_path.rmdir()
        return True

    def _load_agent(self, folder_path: Path, include_content: bool = False) -> Optional[Agent]:
        """Load agent from folder."""
        skill_path = folder_path / 'SKILL.md'
        config_path = folder_path / 'config.json'

        # Read SKILL.md
        skill_content = skill_path.read_text() if skill_path.exists() else ''

        # Read config.json
        config = {}
        config_content = ''
        if config_path.exists():
            config_content = config_path.read_text()
            try:
                config = json.loads(config_content)
            except json.JSONDecodeError:
                pass

        # Extract name from config or folder
        name = config.get('name', folder_path.name.replace('-', ' ').title())

        # Extract description from config or SKILL.md
        description = config.get('description', '')
        if not description and skill_content:
            # Try to extract from first paragraph after title
            lines = skill_content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('#') and i + 1 < len(lines):
                    # Skip empty lines after title
                    for next_line in lines[i + 1:]:
                        if next_line.strip() and not next_line.startswith('#'):
                            description = next_line.strip()
                            break
                    break

        agent = Agent(
            folder=folder_path.name,
            name=name,
            description=description[:200] if description else '',
            trigger=config.get('trigger', 'on-demand'),
            mcp_servers=config.get('mcp_servers', []),
            schedule=config.get('schedule'),
        )

        if include_content:
            agent.skill_content = skill_content
            agent.config_content = config_content

        return agent

    def _is_valid_folder_name(self, name: str) -> bool:
        """Validate folder name (alphanumeric, hyphens, spaces allowed)."""
        return bool(re.match(r'^[a-zA-Z0-9- ]+$', name))
