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
  context?: string | null;
}

export interface ExecutionContext {
  urls?: string[];
  file_paths?: string[];
  images?: File[];
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
  env: Record<string, string>;
  source?: 'user' | 'orchestrator';
  description?: string;
}

export interface MCPTestResult {
  success: boolean;
  message: string;
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

async function requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - browser will set it with boundary for multipart
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

  execute: (folder: string, task: string, context?: ExecutionContext) => {
    const endpoint = `/api/agents/${encodeURIComponent(folder)}/execute`;

    // Use FormData if images are present
    if (context?.images && context.images.length > 0) {
      const formData = new FormData();
      formData.append('task', task);
      if (context.urls) {
        formData.append('urls', JSON.stringify(context.urls));
      }
      if (context.file_paths) {
        formData.append('file_paths', JSON.stringify(context.file_paths));
      }
      context.images.forEach((img, i) => {
        formData.append(`image_${i}`, img);
      });
      return requestFormData<Execution>(endpoint, formData);
    }

    // Use JSON for requests without images
    return request<Execution>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        task,
        urls: context?.urls,
        file_paths: context?.file_paths,
      }),
    });
  },

  history: (folder: string, limit?: number) =>
    request<Array<{ hash: string; author_name: string; date: string; message: string }>>(
      `/api/agents/${encodeURIComponent(folder)}/history${limit ? `?limit=${limit}` : ''}`
    ),

  generate: (prompt: string, mcp_servers?: string[]) =>
    request<{ name: string; description: string; skill_content: string }>('/api/agents/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, mcp_servers }),
    }),
};

export interface KillResponse {
  success: boolean;
  message: string;
  execution: Execution;
}

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

  kill: (id: string) => request<KillResponse>(`/api/executions/${encodeURIComponent(id)}/kill`, {
    method: 'POST',
  }),

  stats: (hours?: number) => request<ExecutionStats>(`/api/executions/stats${hours ? `?hours=${hours}` : ''}`),

  delete: (id: string) => request<{ success: boolean; message: string }>(`/api/executions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),
};

// MCP Servers API
export const mcpApi = {
  list: () => request<{ servers: MCPServer[] }>('/api/mcp/servers'),

  get: (name: string) => request<MCPServer>(`/api/mcp/servers/${encodeURIComponent(name)}`),

  create: (server: Omit<MCPServer, 'source' | 'description'>) =>
    request<MCPServer>('/api/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(server),
    }),

  update: (name: string, server: Omit<MCPServer, 'name' | 'source' | 'description'>) =>
    request<MCPServer>(`/api/mcp/servers/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(server),
    }),

  delete: (name: string) =>
    request<{ success: boolean }>(`/api/mcp/servers/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  copy: (name: string, newName: string) =>
    request<MCPServer>(`/api/mcp/servers/${encodeURIComponent(name)}/copy`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    }),

  test: (name: string) =>
    request<MCPTestResult>(`/api/mcp/servers/${encodeURIComponent(name)}/test`, {
      method: 'POST',
    }),
};

// Health API
export const healthApi = {
  check: () => request<HealthStatus>('/api/health'),
};
