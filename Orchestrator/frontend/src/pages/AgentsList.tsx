import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Play, Settings, Server, Calendar } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import type { Agent } from '../api/client';

export function AgentsList() {
  const { agents, isLoading, isError } = useAgents();
  const [search, setSearch] = useState('');

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description.toLowerCase().includes(search.toLowerCase()) ||
      agent.folder.toLowerCase().includes(search.toLowerCase())
  );

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load agents</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Agents</h2>
        <Link to="/agents/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Agent
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {search ? 'No agents match your search' : 'No agents found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.folder} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-900">{agent.name}</h3>
        {agent.schedule && (
          <span className="badge badge-info flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Scheduled
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {agent.description || 'No description'}
      </p>

      {/* MCP Servers */}
      {agent.mcp_servers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {agent.mcp_servers.map((server) => (
            <span
              key={server}
              className="badge badge-gray flex items-center gap-1"
            >
              <Server className="h-3 w-3" />
              {server}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Link
          to={`/agents/${encodeURIComponent(agent.folder)}`}
          className="btn btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
        >
          <Settings className="h-4 w-4" />
          Edit
        </Link>
        <Link
          to={`/agents/${encodeURIComponent(agent.folder)}?run=true`}
          className="btn btn-success text-sm flex-1 flex items-center justify-center gap-1"
        >
          <Play className="h-4 w-4" />
          Run
        </Link>
      </div>
    </div>
  );
}
