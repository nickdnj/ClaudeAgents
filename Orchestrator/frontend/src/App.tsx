import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { AgentsList } from './pages/AgentsList';
import { AgentDetail } from './pages/AgentDetail';
import { ExecutionsList } from './pages/ExecutionsList';
import { Schedules } from './pages/Schedules';
import { MCPServers } from './pages/MCPServers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<AgentsList />} />
          <Route path="agents/:folder" element={<AgentDetail />} />
          <Route path="executions" element={<ExecutionsList />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="mcp-servers" element={<MCPServers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
