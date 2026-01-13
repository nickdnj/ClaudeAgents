import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Save, Server, Clock, History, Loader2, Code, Settings } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useAgent, useAgentHistory } from '../hooks/useAgents';
import { agentsApi, mcpApi } from '../api/client';
import { RunAgentModal } from '../components/agents/RunAgentModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import useSWR from 'swr';

type Tab = 'edit' | 'advanced' | 'history';

interface ParsedConfig {
  name: string;
  description: string;
  trigger: string;
  mcp_servers: string[];
  schedule?: { cron: string; description?: string } | string | null;
}

export function AgentDetail() {
  const { folder } = useParams<{ folder: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { agent, isLoading, isError, mutate } = useAgent(folder);
  const { history } = useAgentHistory(folder);

  const [activeTab, setActiveTab] = useState<Tab>('edit');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<'on-demand' | 'scheduled'>('on-demand');
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [skillContent, setSkillContent] = useState('');

  // Raw editor state
  const [rawSkillContent, setRawSkillContent] = useState('');
  const [rawConfigContent, setRawConfigContent] = useState('');

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRunModal, setShowRunModal] = useState(searchParams.get('run') === 'true');

  // Fetch available MCP servers
  const { data: mcpData } = useSWR('/api/mcp/servers', () => mcpApi.list());
  const mcpServers = mcpData?.servers;

  // Speech recognition for description
  const {
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setDescription((prev) => prev ? `${prev} ${transcript}` : transcript);
      setHasChanges(true);
    },
  });

  // Parse config content to extract fields
  const parseConfig = (configStr: string): ParsedConfig | null => {
    try {
      const config = JSON.parse(configStr);
      return {
        name: config.name || '',
        description: config.description || '',
        trigger: config.trigger?.type || config.trigger || 'on-demand',
        mcp_servers: config.mcp_servers || [],
        schedule: config.schedule || null,
      };
    } catch {
      return null;
    }
  };

  // Build config JSON from form state
  const buildConfigJson = (): string => {
    const config: Record<string, unknown> = {
      name,
      description,
      trigger: { type: trigger },
      mcp_servers: selectedServers,
    };

    // Preserve schedule if it exists
    if (agent?.schedule) {
      config.schedule = agent.schedule;
    }

    return JSON.stringify(config, null, 2);
  };

  // Load content when agent changes
  useEffect(() => {
    if (agent) {
      // Set raw content
      setRawSkillContent(agent.skill_content || '');
      setRawConfigContent(agent.config_content || '');
      setSkillContent(agent.skill_content || '');

      // Parse config and populate form
      const parsed = parseConfig(agent.config_content || '{}');
      if (parsed) {
        setName(parsed.name || agent.name);
        setDescription(parsed.description);
        setTrigger(parsed.trigger === 'scheduled' ? 'scheduled' : 'on-demand');
        setSelectedServers(parsed.mcp_servers);
      } else {
        setName(agent.name);
        setDescription(agent.description);
        setSelectedServers(agent.mcp_servers);
      }

      setHasChanges(false);
    }
  }, [agent]);

  const toggleServer = (serverName: string) => {
    setSelectedServers((prev) =>
      prev.includes(serverName)
        ? prev.filter((s) => s !== serverName)
        : [...prev, serverName]
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!folder || !hasChanges) return;

    setIsSaving(true);
    try {
      let skillToSave = skillContent;
      let configToSave = buildConfigJson();

      // If on advanced tab, use raw content
      if (activeTab === 'advanced') {
        skillToSave = rawSkillContent;
        configToSave = rawConfigContent;
      }

      await agentsApi.update(folder, {
        skill_content: skillToSave,
        config_content: configToSave,
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'edit'}
            onClick={() => setActiveTab('edit')}
          >
            <Settings className="h-4 w-4" />
            Edit Agent
          </TabButton>
          <TabButton
            active={activeTab === 'advanced'}
            onClick={() => setActiveTab('advanced')}
          >
            <Code className="h-4 w-4" />
            Advanced
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
      {activeTab === 'edit' && (
        <div className="space-y-6">
          {/* Basic Info Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setHasChanges(true); }}
                  className="input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <VoiceInputButton
                    isListening={isListening}
                    isSupported={isSpeechSupported}
                    onStart={startListening}
                    onStop={stopListening}
                    size="sm"
                  />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
                  placeholder="Describe what this agent does..."
                  rows={3}
                  className={`input resize-none ${isListening ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                />
                {speechError && (
                  <p className="mt-1 text-xs text-red-600">{speechError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Type
                </label>
                <select
                  value={trigger}
                  onChange={(e) => { setTrigger(e.target.value as 'on-demand' | 'scheduled'); setHasChanges(true); }}
                  className="input"
                >
                  <option value="on-demand">On-demand (manual execution)</option>
                  <option value="scheduled">Scheduled (cron-based)</option>
                </select>
              </div>

              {agent.schedule && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Schedule: {typeof agent.schedule === 'object'
                      ? agent.schedule.description || agent.schedule.cron
                      : agent.schedule}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* MCP Servers Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">MCP Servers</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select the MCP servers this agent needs access to
              </p>
            </div>
            <div className="p-6">
              {mcpServers && mcpServers.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mcpServers.map((server) => (
                    <button
                      key={server.name}
                      type="button"
                      onClick={() => toggleServer(server.name)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-left ${
                        selectedServers.includes(server.name)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Server className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{server.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No MCP servers available</p>
              )}
            </div>
          </div>

          {/* SKILL.md Content Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">SKILL.md Content</h3>
              <p className="text-sm text-gray-500 mt-1">
                Define the agent's instructions and workflow
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={skillContent}
                onChange={(e) => { setSkillContent(e.target.value); setHasChanges(true); }}
                rows={15}
                className="input font-mono text-sm resize-y"
                placeholder="# Agent instructions..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">SKILL.md</h3>
            </div>
            <Editor
              height="400px"
              language="markdown"
              value={rawSkillContent}
              onChange={(value) => { setRawSkillContent(value || ''); setHasChanges(true); }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
              }}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">config.json</h3>
            </div>
            <Editor
              height="300px"
              language="json"
              value={rawConfigContent}
              onChange={(value) => { setRawConfigContent(value || ''); setHasChanges(true); }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
          </div>
          <div className="p-6">
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
        </div>
      )}

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
