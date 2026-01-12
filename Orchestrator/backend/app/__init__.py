"""
Orchestrator API - Flask Application Factory
"""
import os
from flask import Flask
from flask_cors import CORS


def create_app(config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Default configuration
    app.config.update(
        AGENTS_ROOT=os.environ.get('AGENTS_ROOT', os.path.expanduser('~/Workspaces/ClaudeAgents')),
        DATABASE_PATH=os.environ.get('DATABASE_PATH', os.path.expanduser('~/.orchestrator/executions.db')),
        CLAUDE_CLI_PATH=os.environ.get('CLAUDE_CLI_PATH', 'claude'),
        CLAUDE_TIMEOUT=int(os.environ.get('CLAUDE_TIMEOUT', 600)),
    )

    # Override with provided config
    if config:
        app.config.update(config)

    # Enable CORS for development
    CORS(app, origins=[
        'http://localhost:5173',  # Vite dev server
        'http://localhost:5111',  # Production
    ])

    # Ensure database directory exists
    db_dir = os.path.dirname(app.config['DATABASE_PATH'])
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    # Initialize database
    from app.models.database import init_db
    with app.app_context():
        init_db(app.config['DATABASE_PATH'])

    # Register blueprints
    from app.routes.agents import agents_bp
    from app.routes.executions import executions_bp
    from app.routes.mcp import mcp_bp
    from app.routes.health import health_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(agents_bp, url_prefix='/api')
    app.register_blueprint(executions_bp, url_prefix='/api')
    app.register_blueprint(mcp_bp, url_prefix='/api')

    return app
