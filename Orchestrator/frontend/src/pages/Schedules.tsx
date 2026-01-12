import { Calendar, Clock } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';

export function Schedules() {
  const { agents, isLoading } = useAgents();

  const scheduledAgents = agents.filter((agent) => agent.schedule);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Schedules</h2>
        <span className="badge badge-info">Phase 2</span>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-4 text-gray-500">
          <Calendar className="h-6 w-6 flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium text-gray-900 mb-2">Schedule Management Coming Soon</p>
            <p className="text-sm">
              In Phase 2, this page will allow you to view and manage launchd schedules for all agents.
              For now, schedules are configured in each agent's config.json file.
            </p>
          </div>
        </div>
      </div>

      {/* Preview of scheduled agents */}
      <h3 className="text-lg font-semibold text-gray-900 mt-8">Currently Scheduled Agents</h3>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : scheduledAgents.length === 0 ? (
        <p className="text-gray-500">No agents have schedules configured</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduledAgents.map((agent) => (
            <div key={agent.folder} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{agent.name}</h4>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {typeof agent.schedule === 'string'
                  ? agent.schedule
                  : JSON.stringify(agent.schedule)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
