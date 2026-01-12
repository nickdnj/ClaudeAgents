import { Link } from 'react-router-dom';
import { Bot, Play, Server, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useExecutions, useExecutionStats } from '../hooks/useExecutions';

export function Dashboard() {
  const { agents, isLoading: agentsLoading } = useAgents();
  const { stats, isLoading: statsLoading } = useExecutionStats(24);
  const { executions: recentExecutions } = useExecutions({ limit: 5 });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Agents"
          value={agentsLoading ? '-' : agents.length}
          icon={Bot}
          color="blue"
        />
        <StatsCard
          label="Executions (24h)"
          value={statsLoading ? '-' : stats.recent_24h}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          label="Failed (24h)"
          value={statsLoading ? '-' : stats.failed_24h}
          icon={XCircle}
          color="red"
        />
        <StatsCard
          label="Running"
          value={statsLoading ? '-' : stats.running}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Executions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Executions</h3>
          <div className="space-y-3">
            {recentExecutions.length === 0 ? (
              <p className="text-gray-500 text-sm">No executions yet</p>
            ) : (
              recentExecutions.map((exec) => (
                <Link
                  key={exec.id}
                  to={`/executions/${exec.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={exec.status} />
                    <div>
                      <p className="font-medium text-gray-900">{exec.agent_folder}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {exec.task}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTimeAgo(exec.started_at)}
                  </span>
                </Link>
              ))
            )}
          </div>
          {recentExecutions.length > 0 && (
            <Link
              to="/executions"
              className="block mt-4 text-sm text-primary hover:text-primary-600"
            >
              View All Executions →
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/agents/new"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-medium">Create New Agent</span>
            </Link>
            <Link
              to="/agents"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Play className="h-5 w-5 text-green-600" />
              <span className="font-medium">Run Agent</span>
            </Link>
            <Link
              to="/mcp-servers"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Server className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Check MCP Status</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
    case 'timeout':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'running':
      return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
