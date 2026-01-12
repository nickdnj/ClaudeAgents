import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Bot, History, Server, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import { healthApi } from '../../api/client';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/executions', icon: History, label: 'Agent Tasks' },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/mcp-servers', icon: Server, label: 'MCP Servers' },
];

export function Layout() {
  const { data: health } = useSWR('/api/health', () => healthApi.check(), {
    refreshInterval: 30000,
  });

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900">
                Claude Agents Orchestrator
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isHealthy ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Healthy
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {health?.status || 'Checking...'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
