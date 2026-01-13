import { useState, useEffect } from 'react';
import { X, Plus, Trash2, TestTube2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { MCPServer, MCPTestResult } from '../../api/client';
import { mcpApi } from '../../api/client';

interface MCPServerModalProps {
  server?: MCPServer;  // undefined = create mode
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function MCPServerModal({ server, isOpen, onClose, onSave }: MCPServerModalProps) {
  const isEditMode = !!server;

  // Form state
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState<string[]>([]);
  const [argInput, setArgInput] = useState('');
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [envKeyInput, setEnvKeyInput] = useState('');
  const [envValueInput, setEnvValueInput] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<MCPTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when server prop changes
  useEffect(() => {
    if (server) {
      setName(server.name);
      setCommand(server.command);
      setArgs(server.args || []);
      setEnvVars(
        Object.entries(server.env || {}).map(([key, value]) => ({ key, value }))
      );
    } else {
      // Reset for create mode
      setName('');
      setCommand('');
      setArgs([]);
      setEnvVars([]);
    }
    setError(null);
    setTestResult(null);
  }, [server, isOpen]);

  const addArg = () => {
    const trimmed = argInput.trim();
    if (trimmed) {
      setArgs([...args, trimmed]);
      setArgInput('');
    }
  };

  const removeArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const addEnvVar = () => {
    const key = envKeyInput.trim();
    const value = envValueInput.trim();
    if (key) {
      setEnvVars([...envVars, { key, value }]);
      setEnvKeyInput('');
      setEnvValueInput('');
    }
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleTest = async () => {
    // Need to save first if creating new
    if (!isEditMode && !name.trim()) {
      setError('Please enter a server name first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      // If creating, save first then test
      if (!isEditMode) {
        await handleSave(false);
      }
      const result = await mcpApi.test(name.trim());
      setTestResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (closeOnSave = true) => {
    if (!name.trim()) {
      setError('Server name is required');
      return;
    }
    if (!command.trim()) {
      setError('Command is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const env = envVars.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (isEditMode) {
        await mcpApi.update(name, { command, args, env });
      } else {
        await mcpApi.create({ name: name.trim(), command, args, env });
      }

      if (closeOnSave) {
        onSave();
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditMode ? `Edit ${server.name}` : 'Add MCP Server'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., gmail-personal"
              disabled={isEditMode}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: isEditMode ? 'var(--background-secondary)' : 'var(--background)',
                color: 'var(--text)',
              }}
            />
            {isEditMode && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Name cannot be changed after creation
              </p>
            )}
          </div>

          {/* Command */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Command
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g., npx"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text)',
              }}
            />
          </div>

          {/* Arguments */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Arguments
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={argInput}
                onChange={(e) => setArgInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArg())}
                placeholder="e.g., -y @anthropic/mcp-gmail"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
              <button
                className="button button-secondary"
                onClick={addArg}
                style={{ padding: '0.75rem' }}
              >
                <Plus size={16} />
              </button>
            </div>
            {args.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {args.map((arg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--background-secondary)',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <span>{arg}</span>
                    <button
                      onClick={() => removeArg(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '2px',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environment Variables */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Environment Variables
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={envKeyInput}
                onChange={(e) => setEnvKeyInput(e.target.value)}
                placeholder="KEY"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text)',
                  fontFamily: 'monospace',
                }}
              />
              <input
                type="text"
                value={envValueInput}
                onChange={(e) => setEnvValueInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEnvVar())}
                placeholder="value"
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
              <button
                className="button button-secondary"
                onClick={addEnvVar}
                style={{ padding: '0.75rem' }}
              >
                <Plus size={16} />
              </button>
            </div>
            {envVars.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {envVars.map((env, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: 'var(--background-secondary)',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{env.key}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>=</span>
                    <span style={{ flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {env.value || '(empty)'}
                    </span>
                    <button
                      onClick={() => removeEnvVar(i)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${testResult.success ? 'var(--success)' : 'var(--error)'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              {testResult.success ? (
                <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
              ) : (
                <XCircle size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: '0.875rem' }}>{testResult.message}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <button
            className="btn btn-secondary flex items-center gap-2"
            onClick={handleTest}
            disabled={isTesting || isSaving}
          >
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <TestTube2 size={16} />}
            Test Connection
          </button>
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => handleSave(true)}
              disabled={isSaving || !name.trim() || !command.trim()}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEditMode ? 'Save Changes' : 'Create Server'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
