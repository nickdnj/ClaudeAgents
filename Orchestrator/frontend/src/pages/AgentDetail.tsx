import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Server, Clock, History, Loader2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useAgent, useAgentHistory } from '../hooks/useAgents';
import { agentsApi } from '../api/client';
import { RunAgentModal } from '../components/agents/RunAgentModal';

type Tab = 'skill' | 'config' | 'mcp' | 'history';

export function AgentDetail() {
  const { folder } = useParams<{ folder: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { agent, isLoading, isError, mutate } = useAgent(folder);
  const { history } = useAgentHistory(folder);

  const [activeTab, setActiveTab] = useState<Tab>('skill');
  const [skillContent, setSkillContent] = useState('');
  const [configContent, setConfigContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRunModal, setShowRunModal] = useState(searchParams.get('run') === 'true');

  // Load content when agent changes
  useEffect(() => {
    if (agent) {
      setSkillContent(agent.skill_content || '');
      setConfigContent(agent.config_content || '');
      setHasChanges(false);
    }
  }, [agent]);

  const handleSkillChange = (value: string | undefined) => {
    setSkillContent(value || '');
    setHasChanges(true);
  };

  const handleConfigChange = (value: string | undefined) => {
    setConfigContent(value || '');
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!folder || !hasChanges) return;

    setIsSaving(true);
    try {
      await agentsApi.update(folder, {
        skill_content: skillContent,
        config_content: configContent,
      });
      setHasChanges(false);
      mutate();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Agent not found</p>
        <Link to="/agents" className="text-primary hover:underline">
          Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/agents"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{agent.name}</h2>
            <p className="text-sm text-gray-500">{agent.folder}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-yellow-600 flex items-center gap-1">
              <span className="h-2 w-2 bg-yellow-500 rounded-full" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="btn btn-secondary flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
          <button
            onClick={() => setShowRunModal(true)}
            className="btn btn-success flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Run Now
          </button>
        </div>
      </div>

      {/* Agent Info Bar */}
      <div className="card p-4 flex flex-wrap items-center gap-4 text-sm">
        {agent.mcp_servers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">MCP:</span>
            {agent.mcp_servers.map((server) => (
              <span key={server} className="badge badge-info">
                {server}
              </span>
            ))}
          </div>
        )}
        {agent.schedule && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {typeof agent.schedule === 'object'
                ? agent.schedule.description || agent.schedule.cron
                : agent.schedule}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'skill'}
            onClick={() => setActiveTab('skill')}
          >
            SKILL.md
          </TabButton>
          <TabButton
            active={activeTab === 'config'}
            onClick={() => setActiveTab('config')}
          >
            config.json
          </TabButton>
          <TabButton
            active={activeTab === 'mcp'}
            onClick={() => setActiveTab('mcp')}
          >
            <Server className="h-4 w-4" />
            MCP Servers
          </TabButton>
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            <History className="h-4 w-4" />
            History
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card overflow-hidden">
        {activeTab === 'skill' && (
          <Editor
            height="500px"
            language="markdown"
            value={skillContent}
            onChange={handleSkillChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
            }}
          />
        )}

        {activeTab === 'config' && (
          <Editor
            height="500px"
            language="json"
            value={configContent}
            onChange={handleConfigChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
            }}
          />
        )}

        {activeTab === 'mcp' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Required MCP Servers</h3>
            {agent.mcp_servers.length === 0 ? (
              <p className="text-gray-500">No MCP servers configured</p>
            ) : (
              <div className="space-y-3">
                {agent.mcp_servers.map((server) => (
                  <div
                    key={server}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-primary" />
                      <span className="font-medium">{server}</span>
                    </div>
                    <span className="badge badge-success">Configured</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Version History</h3>
            {history.length === 0 ? (
              <p className="text-gray-500">No history available</p>
            ) : (
              <div className="space-y-3">
                {history.map((commit) => (
                  <div
                    key={commit.hash}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{commit.message}</p>
                      <p className="text-sm text-gray-500">
                        {commit.author_name} • {new Date(commit.date).toLocaleString()}
                      </p>
                    </div>
                    <code className="text-xs text-gray-400 font-mono">
                      {commit.hash.slice(0, 7)}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Run Modal */}
      <RunAgentModal
        agent={agent}
        isOpen={showRunModal}
        onClose={() => {
          setShowRunModal(false);
          navigate(`/agents/${folder}`, { replace: true });
        }}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
