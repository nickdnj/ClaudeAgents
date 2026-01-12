/**
 * SWR hooks for execution data fetching
 */
import useSWR from 'swr';
import type { Execution, ExecutionStats } from '../api/client';
import { executionsApi } from '../api/client';

export function useExecutions(params?: { agent?: string; status?: string; limit?: number }) {
  const { data, error, isLoading, mutate } = useSWR<Execution[]>(
    ['/api/executions', params],
    () => executionsApi.list(params)
  );

  return {
    executions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useExecution(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Execution>(
    id ? `/api/executions/${id}` : null,
    () => (id ? executionsApi.get(id) : Promise.reject('No ID'))
  );

  return {
    execution: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useExecutionStats(hours = 24) {
  const { data, error, isLoading } = useSWR<ExecutionStats>(
    `/api/executions/stats?hours=${hours}`,
    () => executionsApi.stats(hours),
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  return {
    stats: data || { total: 0, running: 0, recent_24h: 0, failed_24h: 0 },
    isLoading,
    isError: error,
  };
}
