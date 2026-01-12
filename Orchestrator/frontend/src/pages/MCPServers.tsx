import { Server, CheckCircle, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import type { MCPServer } from '../api/client';
import { mcpApi } from '../api/client';

export function MCPServers() {
  const { data: servers, isLoading, error } = useSWR('/api/mcp-servers', () => mcpApi.list());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">MCP Servers</h2>

      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Server className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Model Context Protocol Servers</p>
            <p className="text-blue-700 mt-1">
              MCP servers provide external integrations like Gmail, Google Drive, and Chrome automation.
              Status is read from your Claude Code settings.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200">
          <p className="text-red-600">Failed to load MCP servers</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : servers && servers.length > 0 ? (
        <div className="space-y-4">
          {servers.map((server) => (
            <MCPServerCard key={server.name} server={server} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No MCP servers configured</p>
          <p className="text-sm text-gray-400 mt-2">
            Add MCP servers to ~/.claude/settings.json
          </p>
        </div>
      )}
    </div>
  );
}

function MCPServerCard({ server }: { server: MCPServer }) {
  const isConfigured = server.status === 'configured';

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isConfigured ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            <Server
              className={`h-5 w-5 ${
                isConfigured ? 'text-green-600' : 'text-yellow-600'
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{server.name}</h3>
            {server.description && (
              <p className="text-sm text-gray-500">{server.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Configured</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600">{server.status}</span>
            </>
          )}
        </div>
      </div>

      {/* Command info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-500 mb-1">Command</p>
        <code className="text-sm text-gray-700 font-mono">
          {server.command} {server.args.join(' ')}
        </code>
      </div>
    </div>
  );
}
