"""
Database initialization and connection management.
"""
import sqlite3
from contextlib import contextmanager
from flask import g, current_app


def get_db():
    """Get database connection for current request."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE_PATH'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    """Close database connection at end of request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db(db_path: str):
    """Initialize the database schema."""
    conn = sqlite3.connect(db_path)
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS executions (
            id TEXT PRIMARY KEY,
            agent_folder TEXT NOT NULL,
            task TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'running',
            output TEXT,
            error TEXT,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            duration_seconds REAL,
            triggered_by TEXT DEFAULT 'manual'
        );

        CREATE INDEX IF NOT EXISTS idx_executions_agent ON executions(agent_folder);
        CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
        CREATE INDEX IF NOT EXISTS idx_executions_started ON executions(started_at);
    ''')
    conn.commit()
    conn.close()


@contextmanager
def get_db_connection(db_path: str):
    """Context manager for database connections outside request context."""
    conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
