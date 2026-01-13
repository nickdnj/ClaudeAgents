import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Server, Mic, MicOff, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { agentsApi, mcpApi } from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import useSWR from 'swr';

export function CreateAgent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Generation state
  const [showGenerator, setShowGenerator] = useState(true);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [folder, setFolder] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<'on-demand' | 'scheduled'>('on-demand');
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [skillContent, setSkillContent] = useState(`# Agent Name

## Purpose
Describe what this agent does.

## Workflow
1. Step one
2. Step two
3. Step three

## Output
Describe what the agent produces.
`);

  // Fetch available MCP servers
  const { data: mcpData } = useSWR('/api/mcp/servers', () => mcpApi.list());
  const mcpServers = mcpData?.servers;

  // Speech recognition for generate prompt
  const {
    isListening: isListeningPrompt,
    isSupported: isSpeechSupported,
    startListening: startListeningPrompt,
    stopListening: stopListeningPrompt,
    error: speechErrorPrompt,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setGeneratePrompt((prev) => prev ? `${prev} ${transcript}` : transcript);
    },
  });

  // Speech recognition for description
  const {
    isListening,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setDescription((prev) => prev ? `${prev} ${transcript}` : transcript);
    },
  });

  // Handle AI generation
  const handleGenerate = async () => {
    if (!generatePrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const serverNames = mcpServers?.map(s => s.name) || [];
      const result = await agentsApi.generate(generatePrompt.trim(), serverNames);

      // Fill in the form with generated content
      setName(result.name);
      // Auto-generate folder name
      const autoFolder = result.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFolder(autoFolder);
      setDescription(result.description);
      setSkillContent(result.skill_content);

      // Collapse the generator after success
      setShowGenerator(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate agent');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate folder name from display name
  const handleNameChange = (newName: string) => {
    setName(newName);
    // Generate folder name: lowercase, replace spaces with hyphens, remove special chars
    const autoFolder = newName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFolder(autoFolder);
  };

  const toggleServer = (serverName: string) => {
    setSelectedServers((prev) =>
      prev.includes(serverName)
        ? prev.filter((s) => s !== serverName)
        : [...prev, serverName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folder.trim() || !name.trim()) {
      setError('Folder and name are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const agent = await agentsApi.create({
        folder: folder.trim(),
        name: name.trim(),
        description: description.trim(),
        trigger,
        mcp_servers: selectedServers,
        skill_content: skillContent,
      });

      navigate(`/agents/${encodeURIComponent(agent.folder)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/agents"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create New Agent</h2>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Generator Card */}
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <button
            type="button"
            onClick={() => setShowGenerator(!showGenerator)}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Generate with AI</h3>
                <p className="text-sm text-gray-600">Describe what you want and let AI create the agent for you</p>
              </div>
            </div>
            {showGenerator ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {showGenerator && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    What should this agent do?
                  </label>
                  {isSpeechSupported && (
                    <button
                      type="button"
                      onClick={isListeningPrompt ? stopListeningPrompt : startListeningPrompt}
                      disabled={isGenerating}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isListeningPrompt
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isListeningPrompt ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Voice
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    placeholder="Example: Create an agent that searches my Gmail for community updates from the past month, extracts key highlights, and compiles them into a progress report..."
                    rows={4}
                    className={`input resize-none bg-white ${isListeningPrompt ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                    disabled={isGenerating}
                  />
                  {isListeningPrompt && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Listening...
                    </div>
                  )}
                </div>
                {speechErrorPrompt && (
                  <p className="mt-1 text-xs text-red-600">{speechErrorPrompt}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!generatePrompt.trim() || isGenerating}
                className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Agent
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Basic Info Card */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Agent"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name *
              </label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-agent"
                className="input font-mono"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isListening
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Voice
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this agent does..."
                  rows={3}
                  className={`input resize-none ${isListening ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                />
                {isListening && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Listening...
                  </div>
                )}
              </div>
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
                onChange={(e) => setTrigger(e.target.value as 'on-demand' | 'scheduled')}
                className="input"
              >
                <option value="on-demand">On-demand (manual execution)</option>
                <option value="scheduled">Scheduled (cron-based)</option>
              </select>
            </div>
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
            {selectedServers.length > 0 && (
              <p className="mt-3 text-sm text-gray-600">
                Selected: {selectedServers.join(', ')}
              </p>
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
              onChange={(e) => setSkillContent(e.target.value)}
              rows={15}
              className="input font-mono text-sm resize-y"
              placeholder="# Agent instructions..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link to="/agents" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !folder.trim() || !name.trim()}
            className="btn btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create Agent
          </button>
        </div>
      </form>
    </div>
  );
}
