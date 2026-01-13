import { useState } from 'react';
import { Server, Plus, Edit, Copy, Trash2, TestTube2, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import useSWR from 'swr';
import type { MCPServer, MCPTestResult } from '../api/client';
import { mcpApi } from '../api/client';
import { MCPServerModal } from '../components/mcp/MCPServerModal';

export function MCPServers() {
  const { data, isLoading, error, mutate } = useSWR('/api/mcp/servers', () => mcpApi.list());
  const servers = data?.servers || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | undefined>();
  const [copyDialogServer, setCopyDialogServer] = useState<MCPServer | null>(null);
  const [newCopyName, setNewCopyName] = useState('');
  const [copyError, setCopyError] = useState<string | null>(null);
  const [deleteConfirmServer, setDeleteConfirmServer] = useState<MCPServer | null>(null);
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, MCPTestResult>>({});

  const handleCreate = () => {
    setEditingServer(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (server: MCPServer) => {
    setEditingServer(server);
    setIsModalOpen(true);
  };

  const handleCopyClick = (server: MCPServer) => {
    setCopyDialogServer(server);
    setNewCopyName(`${server.name}-copy`);
    setCopyError(null);
  };

  const handleCopyConfirm = async () => {
    if (!copyDialogServer || !newCopyName.trim()) return;
    try {
      await mcpApi.copy(copyDialogServer.name, newCopyName.trim());
      mutate();
      setCopyDialogServer(null);
    } catch (e) {
      setCopyError(e instanceof Error ? e.message : 'Copy failed');
    }
  };

  const handleDeleteClick = (server: MCPServer) => {
    setDeleteConfirmServer(server);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmServer) return;
    try {
      await mcpApi.delete(deleteConfirmServer.name);
      mutate();
      setDeleteConfirmServer(null);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleTest = async (server: MCPServer) => {
    setTestingServer(server.name);
    setTestResults((prev) => ({ ...prev, [server.name]: undefined as unknown as MCPTestResult }));
    try {
      const result = await mcpApi.test(server.name);
      setTestResults((prev) => ({ ...prev, [server.name]: result }));
    } catch (e) {
      setTestResults((prev) => ({
        ...prev,
        [server.name]: { success: false, message: e instanceof Error ? e.message : 'Test failed' },
      }));
    } finally {
      setTestingServer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="text-2xl font-bold text-gray-900">MCP Servers</h2>
        <button
          className="button button-primary"
          onClick={handleCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          Add Server
        </button>
      </div>

      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Server className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Model Context Protocol Servers</p>
            <p className="text-blue-700 mt-1">
              MCP servers provide external integrations like Gmail, Google Drive, and Chrome automation.
              Servers from ~/.claude.json are read-only (shown with lock icon).
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
      ) : servers.length > 0 ? (
        <div className="space-y-4">
          {servers.map((server) => (
            <MCPServerCard
              key={server.name}
              server={server}
              onEdit={() => handleEdit(server)}
              onCopy={() => handleCopyClick(server)}
              onDelete={() => handleDeleteClick(server)}
              onTest={() => handleTest(server)}
              isTesting={testingServer === server.name}
              testResult={testResults[server.name]}
            />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No MCP servers configured</p>
          <p className="text-sm text-gray-400 mt-2">
            Click "Add Server" to create your first MCP server
          </p>
        </div>
      )}

      {/* Server Modal */}
      <MCPServerModal
        server={editingServer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => mutate()}
      />

      {/* Copy Dialog */}
      {copyDialogServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCopyDialogServer(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Copy Server</h3>
            </div>
            <div className="p-6">
              <p className="mb-4 text-gray-700">
                Copy <strong>{copyDialogServer.name}</strong> to a new server:
              </p>
              <input
                type="text"
                value={newCopyName}
                onChange={(e) => setNewCopyName(e.target.value)}
                placeholder="New server name"
                className="input"
              />
              {copyError && (
                <p className="text-red-600 text-sm mt-2">{copyError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button className="btn btn-secondary" onClick={() => setCopyDialogServer(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCopyConfirm}>
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmServer(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Delete Server</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{deleteConfirmServer.name}</strong>?
              </p>
              <p className="text-gray-500 text-sm mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmServer(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MCPServerCardProps {
  server: MCPServer;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onTest: () => void;
  isTesting: boolean;
  testResult?: MCPTestResult;
}

function MCPServerCard({ server, onEdit, onCopy, onDelete, onTest, isTesting, testResult }: MCPServerCardProps) {
  const isUserServer = server.source === 'user';
  const isOrchestratorServer = server.source === 'orchestrator';

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isUserServer ? 'bg-gray-100' : 'bg-green-100'}`}>
            <Server className={`h-5 w-5 ${isUserServer ? 'text-gray-600' : 'text-green-600'}`} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 className="font-semibold text-gray-900">{server.name}</h3>
              {isUserServer && (
                <span title="Read-only (from ~/.claude.json)">
                  <Lock size={14} style={{ color: 'var(--text-secondary)' }} />
                </span>
              )}
            </div>
            {server.description && (
              <p className="text-sm text-gray-500">{server.description}</p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Test button - always available */}
          <button
            className="icon-button"
            onClick={onTest}
            disabled={isTesting}
            title="Test connection"
            style={{ padding: '0.5rem' }}
          >
            {isTesting ? <Loader2 size={16} className="spin" /> : <TestTube2 size={16} />}
          </button>

          {/* Copy button - always available */}
          <button className="icon-button" onClick={onCopy} title="Copy server" style={{ padding: '0.5rem' }}>
            <Copy size={16} />
          </button>

          {/* Edit button - only for orchestrator servers */}
          {isOrchestratorServer && (
            <button className="icon-button" onClick={onEdit} title="Edit server" style={{ padding: '0.5rem' }}>
              <Edit size={16} />
            </button>
          )}

          {/* Delete button - only for orchestrator servers */}
          {isOrchestratorServer && (
            <button
              className="icon-button"
              onClick={onDelete}
              title="Delete server"
              style={{ padding: '0.5rem', color: 'var(--error)' }}
            >
              <Trash2 size={16} />
            </button>
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

      {/* Environment variables summary */}
      {server.env && Object.keys(server.env).length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 mb-1">Environment Variables</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.keys(server.env).map((key) => (
              <span
                key={key}
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  padding: '0.125rem 0.375rem',
                  backgroundColor: 'var(--background)',
                  borderRadius: '4px',
                }}
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${testResult.success ? 'var(--success)' : 'var(--error)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {testResult.success ? (
            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
          ) : (
            <XCircle size={16} style={{ color: 'var(--error)' }} />
          )}
          <span style={{ fontSize: '0.875rem' }}>{testResult.message}</span>
        </div>
      )}
    </div>
  );
}
