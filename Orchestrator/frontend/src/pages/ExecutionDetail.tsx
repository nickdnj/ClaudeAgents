import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Activity, Loader2 } from 'lucide-react';
import { executionsApi, type Execution, type ExecutionStatus } from '../api/client';

export function ExecutionDetail() {
  const { executionId } = useParams<{ executionId: string }>();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch execution details
  useEffect(() => {
    if (!executionId) return;

    async function fetchExecution() {
      try {
        const data = await executionsApi.get(executionId!);
        setExecution(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load execution');
        setIsLoading(false);
      }
    }

    fetchExecution();
  }, [executionId]);

  // Poll status for running executions
  useEffect(() => {
    if (!executionId || !execution || execution.status !== 'running') return;

    async function fetchStatus() {
      try {
        const data = await executionsApi.status(executionId!);
        setStatus(data);

        // If execution completed, refresh the full execution data
        if (data.status !== 'running') {
          const fullData = await executionsApi.get(executionId!);
          setExecution(fullData);
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    }

    // Fetch immediately
    fetchStatus();

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [executionId, execution?.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Execution not found'}</p>
        <Link to="/executions" className="text-primary hover:underline mt-4 inline-block">
          Back to Executions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/executions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Execution Details</h2>
          <p className="text-sm text-gray-500 font-mono">{execution.id}</p>
        </div>
        <StatusBadge status={execution.status} />
      </div>

      {/* Process Alive Indicator for running executions */}
      {execution.status === 'running' && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            {status?.process_alive ? (
              <>
                <Activity className="h-5 w-5 text-green-600 animate-pulse" />
                <div>
                  <p className="font-medium text-green-800">Process is running</p>
                  <p className="text-sm text-green-600">
                    PID: {status.pid} • Started {formatDuration(execution.started_at)} ago
                  </p>
                </div>
              </>
            ) : status ? (
              <>
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Waiting for process</p>
                  <p className="text-sm text-yellow-600">
                    Process not yet detected or initializing...
                  </p>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="font-medium text-blue-800">Checking process status...</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Agent</p>
              <Link
                to={`/agents/${encodeURIComponent(execution.agent_folder)}`}
                className="font-medium text-primary hover:underline"
              >
                {execution.agent_folder}
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500">Triggered By</p>
              <p className="font-medium text-gray-900">{execution.triggered_by}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Started</p>
              <p className="font-medium text-gray-900">
                {new Date(execution.started_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium text-gray-900">
                {execution.duration_seconds
                  ? `${execution.duration_seconds.toFixed(1)}s`
                  : execution.status === 'running'
                  ? formatDuration(execution.started_at)
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Task</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-wrap">{execution.task}</p>
        </div>
      </div>

      {/* Output */}
      {execution.output && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Output</h3>
          </div>
          <div className="p-6">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {execution.output}
            </pre>
          </div>
        </div>
      )}

      {/* Error */}
      {execution.error && (
        <div className="card border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900">Error</h3>
          </div>
          <div className="p-6 bg-red-50">
            <pre className="text-red-700 whitespace-pre-wrap text-sm">
              {execution.error}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return (
        <span className="badge badge-success flex items-center gap-1 text-base px-4 py-2">
          <CheckCircle className="h-4 w-4" />
          Success
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-error flex items-center gap-1 text-base px-4 py-2">
          <XCircle className="h-4 w-4" />
          Failed
        </span>
      );
    case 'timeout':
      return (
        <span className="badge badge-warning flex items-center gap-1 text-base px-4 py-2">
          <Clock className="h-4 w-4" />
          Timeout
        </span>
      );
    case 'running':
      return (
        <span className="badge badge-info flex items-center gap-1 text-base px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Running
        </span>
      );
    default:
      return <span className="badge badge-gray text-base px-4 py-2">{status}</span>;
  }
}

function formatDuration(startedAt: string): string {
  // Handle ISO date strings - append Z if no timezone to treat as UTC
  const isoString = startedAt.includes('Z') || startedAt.includes('+') ? startedAt : startedAt + 'Z';
  const start = new Date(isoString);
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
