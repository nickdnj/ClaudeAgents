/**
 * SWR hooks for agent data fetching
 */
import useSWR from 'swr';
import type { Agent } from '../api/client';
import { agentsApi } from '../api/client';

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR<Agent[]>(
    '/api/agents',
    () => agentsApi.list()
  );

  return {
    agents: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAgent(folder: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Agent>(
    folder ? `/api/agents/${folder}` : null,
    () => (folder ? agentsApi.get(folder) : Promise.reject('No folder'))
  );

  return {
    agent: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAgentHistory(folder: string | undefined, limit = 10) {
  const { data, error, isLoading } = useSWR(
    folder ? `/api/agents/${folder}/history` : null,
    () => (folder ? agentsApi.history(folder, limit) : Promise.reject('No folder'))
  );

  return {
    history: data || [],
    isLoading,
    isError: error,
  };
}
