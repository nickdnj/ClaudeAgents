import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { useExecutions } from '../hooks/useExecutions';
import { useAgents } from '../hooks/useAgents';

export function ExecutionsList() {
  const { agents } = useAgents();
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { executions, isLoading, isError } = useExecutions({
    agent: agentFilter || undefined,
    status: statusFilter || undefined,
    limit: 50,
  });

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load executions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900">Executions</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="input pl-10"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.folder} value={agent.folder}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-[180px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No executions found
                </td>
              </tr>
            ) : (
              executions.map((execution) => (
                <tr
                  key={execution.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <Link to={`/executions/${execution.id}`}>
                      <StatusBadge status={execution.status} />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/executions/${execution.id}`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {execution.agent_folder}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/executions/${execution.id}`}
                      className="text-gray-600 truncate max-w-[300px] block"
                    >
                      {execution.task}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {execution.duration_seconds
                      ? `${execution.duration_seconds.toFixed(1)}s`
                      : '--'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {formatTime(execution.started_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return (
        <span className="badge badge-success flex items-center gap-1 w-fit">
          <CheckCircle className="h-3 w-3" />
          Success
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-error flex items-center gap-1 w-fit">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    case 'timeout':
      return (
        <span className="badge badge-warning flex items-center gap-1 w-fit">
          <Clock className="h-3 w-3" />
          Timeout
        </span>
      );
    case 'running':
      return (
        <span className="badge badge-info flex items-center gap-1 w-fit">
          <Clock className="h-3 w-3 animate-pulse" />
          Running
        </span>
      );
    default:
      return <span className="badge badge-gray">{status}</span>;
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
