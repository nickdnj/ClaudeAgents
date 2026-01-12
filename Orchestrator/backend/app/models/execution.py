"""
Execution model for tracking agent runs.
"""
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional
import uuid
import os

from app.models.database import get_db


@dataclass
class Execution:
    """Represents an agent execution record."""
    id: str
    agent_folder: str
    task: str
    status: str  # 'running', 'success', 'failed', 'timeout'
    output: Optional[str] = None
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    triggered_by: str = 'manual'
    pid: Optional[int] = None

    @classmethod
    def create(cls, agent_folder: str, task: str, triggered_by: str = 'manual') -> 'Execution':
        """Create a new execution record."""
        execution = cls(
            id=f"exec_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}",
            agent_folder=agent_folder,
            task=task,
            status='running',
            started_at=datetime.utcnow().isoformat(),
            triggered_by=triggered_by
        )
        execution.save()
        return execution

    def save(self):
        """Save execution to database."""
        db = get_db()
        db.execute('''
            INSERT OR REPLACE INTO executions
            (id, agent_folder, task, status, output, error, started_at, completed_at, duration_seconds, triggered_by, pid)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            self.id, self.agent_folder, self.task, self.status,
            self.output, self.error, self.started_at, self.completed_at,
            self.duration_seconds, self.triggered_by, self.pid
        ))
        db.commit()

    def complete(self, output: str, status: str = 'success'):
        """Mark execution as complete."""
        self.status = status
        self.output = output
        self.completed_at = datetime.utcnow().isoformat()
        if self.started_at:
            start = datetime.fromisoformat(self.started_at)
            end = datetime.fromisoformat(self.completed_at)
            self.duration_seconds = (end - start).total_seconds()
        self.save()

    def fail(self, error: str):
        """Mark execution as failed."""
        self.status = 'failed'
        self.error = error
        self.completed_at = datetime.utcnow().isoformat()
        if self.started_at:
            start = datetime.fromisoformat(self.started_at)
            end = datetime.fromisoformat(self.completed_at)
            self.duration_seconds = (end - start).total_seconds()
        self.save()

    def set_pid(self, pid: int):
        """Set the process ID for this execution."""
        self.pid = pid
        db = get_db()
        db.execute('UPDATE executions SET pid = ? WHERE id = ?', (pid, self.id))
        db.commit()

    def is_process_alive(self) -> bool:
        """Check if the execution process is still running."""
        if not self.pid:
            return False
        try:
            os.kill(self.pid, 0)  # Signal 0 checks if process exists
            return True
        except (OSError, ProcessLookupError):
            return False

    def kill_process(self) -> bool:
        """Kill the execution process if running. Returns True if killed."""
        if not self.pid or self.status != 'running':
            return False
        try:
            os.kill(self.pid, 9)  # SIGKILL
            self.status = 'failed'
            self.error = 'Process killed by user'
            self.completed_at = datetime.utcnow().isoformat()
            if self.started_at:
                start = datetime.fromisoformat(self.started_at)
                end = datetime.fromisoformat(self.completed_at)
                self.duration_seconds = (end - start).total_seconds()
            self.save()
            return True
        except (OSError, ProcessLookupError):
            return False

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)

    @classmethod
    def get_by_id(cls, execution_id: str) -> Optional['Execution']:
        """Fetch execution by ID."""
        db = get_db()
        row = db.execute(
            'SELECT * FROM executions WHERE id = ?',
            (execution_id,)
        ).fetchone()
        if row:
            return cls(**dict(row))
        return None

    @classmethod
    def list_all(cls, agent_folder: str = None, status: str = None, limit: int = 50, offset: int = 0) -> list:
        """List executions with optional filters."""
        db = get_db()
        query = 'SELECT * FROM executions WHERE 1=1'
        params = []

        if agent_folder:
            query += ' AND agent_folder = ?'
            params.append(agent_folder)
        if status:
            query += ' AND status = ?'
            params.append(status)

        query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])

        rows = db.execute(query, params).fetchall()
        return [cls(**dict(row)) for row in rows]

    @classmethod
    def get_stats(cls, hours: int = 24) -> dict:
        """Get execution statistics."""
        db = get_db()
        cutoff = datetime.utcnow().isoformat()[:10]  # Today's date

        total = db.execute('SELECT COUNT(*) FROM executions').fetchone()[0]
        running = db.execute("SELECT COUNT(*) FROM executions WHERE status = 'running'").fetchone()[0]
        recent = db.execute(
            "SELECT COUNT(*) FROM executions WHERE started_at >= datetime('now', '-24 hours')"
        ).fetchone()[0]
        failed = db.execute(
            "SELECT COUNT(*) FROM executions WHERE status = 'failed' AND started_at >= datetime('now', '-24 hours')"
        ).fetchone()[0]

        return {
            'total': total,
            'running': running,
            'recent_24h': recent,
            'failed_24h': failed
        }
