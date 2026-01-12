"""
Execution history API endpoints.
"""
from flask import Blueprint, jsonify, request
from app.models.execution import Execution

executions_bp = Blueprint('executions', __name__)


@executions_bp.route('/executions', methods=['GET'])
def list_executions():
    """
    List execution history.

    Query params:
        - agent: Filter by agent folder name
        - status: Filter by status (running, success, failed, timeout)
        - limit: Maximum results (default 50)
        - offset: Pagination offset (default 0)

    Returns:
        JSON array of execution records
    """
    agent_folder = request.args.get('agent')
    status = request.args.get('status')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)

    # Validate limit
    if limit > 100:
        limit = 100
    if limit < 1:
        limit = 1

    executions = Execution.list_all(
        agent_folder=agent_folder,
        status=status,
        limit=limit,
        offset=offset
    )

    return jsonify([e.to_dict() for e in executions])


@executions_bp.route('/executions/<execution_id>', methods=['GET'])
def get_execution(execution_id: str):
    """
    Get a specific execution by ID.

    Args:
        execution_id: Execution ID

    Returns:
        JSON execution record
    """
    execution = Execution.get_by_id(execution_id)

    if not execution:
        return jsonify({
            'error': 'Execution not found',
            'code': 'EXECUTION_NOT_FOUND'
        }), 404

    return jsonify(execution.to_dict())


@executions_bp.route('/executions/<execution_id>/status', methods=['GET'])
def get_execution_status(execution_id: str):
    """
    Get the live status of an execution, including whether the process is alive.

    Args:
        execution_id: Execution ID

    Returns:
        JSON with status, process_alive flag, and pid
    """
    execution = Execution.get_by_id(execution_id)

    if not execution:
        return jsonify({
            'error': 'Execution not found',
            'code': 'EXECUTION_NOT_FOUND'
        }), 404

    return jsonify({
        'id': execution.id,
        'status': execution.status,
        'pid': execution.pid,
        'process_alive': execution.is_process_alive() if execution.status == 'running' else False,
        'started_at': execution.started_at,
        'completed_at': execution.completed_at,
        'duration_seconds': execution.duration_seconds
    })


@executions_bp.route('/executions/stats', methods=['GET'])
def get_execution_stats():
    """
    Get execution statistics.

    Query params:
        - hours: Time window in hours (default 24)

    Returns:
        JSON object with stats
    """
    hours = request.args.get('hours', 24, type=int)
    stats = Execution.get_stats(hours=hours)
    return jsonify(stats)
