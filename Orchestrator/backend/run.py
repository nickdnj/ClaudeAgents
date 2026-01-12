#!/usr/bin/env python3
"""
Orchestrator API - Entry Point

Run with:
    python run.py

Or for production:
    gunicorn -w 2 -b 127.0.0.1:5111 'app:create_app()'
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

if __name__ == '__main__':
    # Development server
    port = int(os.environ.get('PORT', 5111))
    debug = os.environ.get('FLASK_DEBUG', '1') == '1'

    print(f"Starting Orchestrator API on http://localhost:{port}")
    print(f"Debug mode: {debug}")
    print(f"Agents root: {app.config['AGENTS_ROOT']}")
    print(f"Database: {app.config['DATABASE_PATH']}")

    app.run(
        host='127.0.0.1',
        port=port,
        debug=debug
    )
