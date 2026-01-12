"""
Git Service - Auto-commits agent changes.
"""
import subprocess
from pathlib import Path
from typing import Optional
from datetime import datetime


class GitService:
    """Manages git operations for the agents repository."""

    def __init__(self, repo_root: str):
        self.repo_root = Path(repo_root)

    def is_git_repo(self) -> bool:
        """Check if the directory is a git repository."""
        git_dir = self.repo_root / '.git'
        return git_dir.exists() and git_dir.is_dir()

    def auto_commit(self, agent_folder: str, message: Optional[str] = None) -> bool:
        """
        Auto-commit changes to an agent's files.

        Args:
            agent_folder: Name of the agent folder
            message: Optional commit message (auto-generated if not provided)

        Returns:
            True if commit was successful, False otherwise
        """
        if not self.is_git_repo():
            return False

        agent_path = self.repo_root / agent_folder

        if not agent_path.exists():
            return False

        try:
            # Stage the agent folder
            subprocess.run(
                ['git', 'add', str(agent_path)],
                cwd=str(self.repo_root),
                capture_output=True,
                check=True
            )

            # Check if there are staged changes
            result = subprocess.run(
                ['git', 'diff', '--cached', '--quiet'],
                cwd=str(self.repo_root),
                capture_output=True
            )

            if result.returncode == 0:
                # No changes to commit
                return True

            # Generate commit message
            if not message:
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                message = f"Update {agent_folder} via Orchestrator UI ({timestamp})"

            # Commit
            subprocess.run(
                ['git', 'commit', '-m', message],
                cwd=str(self.repo_root),
                capture_output=True,
                check=True
            )

            return True

        except subprocess.CalledProcessError:
            return False
        except Exception:
            return False

    def get_file_history(self, file_path: str, limit: int = 10) -> list[dict]:
        """
        Get commit history for a specific file.

        Args:
            file_path: Relative path to the file
            limit: Maximum number of commits to return

        Returns:
            List of commit info dictionaries
        """
        if not self.is_git_repo():
            return []

        try:
            result = subprocess.run(
                [
                    'git', 'log',
                    f'-{limit}',
                    '--format=%H|%an|%ae|%ai|%s',
                    '--', file_path
                ],
                cwd=str(self.repo_root),
                capture_output=True,
                text=True,
                check=True
            )

            commits = []
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                parts = line.split('|')
                if len(parts) >= 5:
                    commits.append({
                        'hash': parts[0],
                        'author_name': parts[1],
                        'author_email': parts[2],
                        'date': parts[3],
                        'message': parts[4]
                    })

            return commits

        except subprocess.CalledProcessError:
            return []
        except Exception:
            return []

    def get_status(self) -> dict:
        """Get current git status."""
        if not self.is_git_repo():
            return {'is_repo': False}

        try:
            # Get current branch
            branch_result = subprocess.run(
                ['git', 'branch', '--show-current'],
                cwd=str(self.repo_root),
                capture_output=True,
                text=True
            )
            branch = branch_result.stdout.strip()

            # Get status
            status_result = subprocess.run(
                ['git', 'status', '--porcelain'],
                cwd=str(self.repo_root),
                capture_output=True,
                text=True
            )

            modified = []
            untracked = []
            for line in status_result.stdout.strip().split('\n'):
                if not line:
                    continue
                status_code = line[:2]
                file_path = line[3:]
                if status_code.strip() == '??':
                    untracked.append(file_path)
                else:
                    modified.append(file_path)

            return {
                'is_repo': True,
                'branch': branch,
                'modified_files': modified,
                'untracked_files': untracked,
                'clean': len(modified) == 0 and len(untracked) == 0
            }

        except Exception:
            return {'is_repo': True, 'error': 'Failed to get status'}
