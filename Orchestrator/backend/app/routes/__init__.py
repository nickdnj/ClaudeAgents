"""Routes package."""
from app.routes.agents import agents_bp
from app.routes.executions import executions_bp
from app.routes.mcp import mcp_bp
from app.routes.health import health_bp

__all__ = ['agents_bp', 'executions_bp', 'mcp_bp', 'health_bp']
