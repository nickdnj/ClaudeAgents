"""
Health check endpoint.
"""
from flask import Blueprint, jsonify, current_app
from datetime import datetime
import os

health_bp = Blueprint('health', __name__)


@health_bp.route('/api/health')
def health_check():
    """Health check endpoint for monitoring."""
    checks = {
        'api': 'ok',
        'agents_directory': _check_agents_dir(),
        'database': _check_database(),
    }

    all_ok = all(v == 'ok' for v in checks.values())

    return jsonify({
        'status': 'healthy' if all_ok else 'degraded',
        'checks': checks,
        'timestamp': datetime.now().isoformat()
    }), 200 if all_ok else 503


def _check_agents_dir() -> str:
    """Check if agents directory exists and is readable."""
    agents_root = current_app.config.get('AGENTS_ROOT')
    if not agents_root:
        return 'not_configured'
    if not os.path.exists(agents_root):
        return 'not_found'
    if not os.path.isdir(agents_root):
        return 'not_directory'
    return 'ok'


def _check_database() -> str:
    """Check if database is accessible."""
    db_path = current_app.config.get('DATABASE_PATH')
    if not db_path:
        return 'not_configured'

    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        return 'directory_missing'

    # Try to connect
    try:
        import sqlite3
        conn = sqlite3.connect(db_path)
        conn.execute('SELECT 1')
        conn.close()
        return 'ok'
    except Exception:
        return 'connection_failed'
