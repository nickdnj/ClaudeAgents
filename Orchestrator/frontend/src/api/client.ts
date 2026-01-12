/**
 * API Client for Orchestrator Backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5111';

export interface Schedule {
  cron: string;
  description?: string;
  timezone?: string;
}

export interface Agent {
  folder: string;
  name: string;
  description: string;
  trigger: string | { type: string; description?: string };
  mcp_servers: string[];
  schedule: Schedule | string | null;
  skill_content?: string;
  config_content?: string;
}

export interface Execution {
  id: string;
  agent_folder: string;
  task: string;
  status: 'running' | 'success' | 'failed' | 'timeout';
  output: string | null;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  triggered_by: string;
  pid?: number | null;
}

export interface ExecutionStatus {
  id: string;
  status: 'running' | 'success' | 'failed' | 'timeout';
  pid: number | null;
  process_alive: boolean;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface ExecutionStats {
  total: number;
  running: number;
  recent_24h: number;
  failed_24h: number;
}

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  status: string;
  description: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  checks: Record<string, string>;
  timestamp: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Agent API
export const agentsApi = {
  list: () => request<Agent[]>('/api/agents'),

  get: (folder: string) => request<Agent>(`/api/agents/${encodeURIComponent(folder)}`),

  create: (data: {
    folder: string;
    name: string;
    description?: string;
    skill_content?: string;
    trigger?: string;
    mcp_servers?: string[];
  }) => request<Agent>('/api/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (folder: string, data: {
    skill_content?: string;
    config_content?: string;
  }) => request<Agent>(`/api/agents/${encodeURIComponent(folder)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (folder: string, confirm: string) => request<{ success: boolean }>(`/api/admin/agents/${encodeURIComponent(folder)}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirm }),
  }),

  execute: (folder: string, task: string) => request<Execution>(`/api/agents/${encodeURIComponent(folder)}/execute`, {
    method: 'POST',
    body: JSON.stringify({ task }),
  }),

  history: (folder: string, limit?: number) =>
    request<Array<{ hash: string; author_name: string; date: string; message: string }>>(
      `/api/agents/${encodeURIComponent(folder)}/history${limit ? `?limit=${limit}` : ''}`
    ),
};

// Executions API
export const executionsApi = {
  list: (params?: { agent?: string; status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.agent) query.set('agent', params.agent);
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const queryString = query.toString();
    return request<Execution[]>(`/api/executions${queryString ? `?${queryString}` : ''}`);
  },

  get: (id: string) => request<Execution>(`/api/executions/${encodeURIComponent(id)}`),

  status: (id: string) => request<ExecutionStatus>(`/api/executions/${encodeURIComponent(id)}/status`),

  stats: (hours?: number) => request<ExecutionStats>(`/api/executions/stats${hours ? `?hours=${hours}` : ''}`),
};

// MCP Servers API
export const mcpApi = {
  list: () => request<MCPServer[]>('/api/mcp-servers'),
  get: (name: string) => request<MCPServer>(`/api/mcp-servers/${encodeURIComponent(name)}`),
};

// Health API
export const healthApi = {
  check: () => request<HealthStatus>('/api/health'),
};
