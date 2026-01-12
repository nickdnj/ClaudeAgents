import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Activity, Loader2, StopCircle, MessageSquare, X, Play, Trash2, Mic, MicOff, Link as LinkIcon, FileText, Image } from 'lucide-react';
import { executionsApi, agentsApi, type Execution, type ExecutionStatus } from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function ExecutionDetail() {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isKilling, setIsKilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpTask, setFollowUpTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setFollowUpTask((prev) => prev ? `${prev} ${transcript}` : transcript);
    },
  });

  // Stop listening when modal closes
  useEffect(() => {
    if (!showFollowUp && isListening) {
      stopListening();
    }
  }, [showFollowUp, isListening, stopListening]);

  // Fetch execution details
  useEffect(() => {
    if (!executionId) return;

    async function fetchExecution() {
      try {
        const data = await executionsApi.get(executionId!);
        setExecution(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load execution');
        setIsLoading(false);
      }
    }

    fetchExecution();
  }, [executionId]);

  // Poll status for running executions
  useEffect(() => {
    if (!executionId || !execution || execution.status !== 'running') return;

    async function fetchStatus() {
      try {
        const data = await executionsApi.status(executionId!);
        setStatus(data);

        // If execution completed, refresh the full execution data
        if (data.status !== 'running') {
          const fullData = await executionsApi.get(executionId!);
          setExecution(fullData);
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    }

    // Fetch immediately
    fetchStatus();

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [executionId, execution?.status]);

  const handleKill = async () => {
    if (!executionId || isKilling) return;

    if (!confirm('Are you sure you want to stop this execution?')) return;

    setIsKilling(true);
    try {
      const result = await executionsApi.kill(executionId);
      setExecution(result.execution);
      setStatus(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to stop execution');
    } finally {
      setIsKilling(false);
    }
  };

  const handleFollowUp = async () => {
    if (!execution || !followUpTask.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Build a follow-up task that includes context from the previous execution
      const contextualTask = `Follow-up to previous task.

Previous task: ${execution.task}

Previous output:
${execution.output}

Follow-up question: ${followUpTask}`;

      const result = await agentsApi.execute(execution.agent_folder, contextualTask);
      setShowFollowUp(false);
      setFollowUpTask('');
      // Navigate to the new execution
      navigate(`/executions/${result.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!executionId || isDeleting) return;

    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await executionsApi.delete(executionId);
      navigate('/executions');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Execution not found'}</p>
        <Link to="/executions" className="text-primary hover:underline mt-4 inline-block">
          Back to Agent Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/executions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
          <p className="text-sm text-gray-500 font-mono">{execution.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={execution.status} />
          {execution.status !== 'running' && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center gap-2 disabled:opacity-50"
              title="Delete task"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Process Alive Indicator for running executions */}
      {execution.status === 'running' && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status?.process_alive ? (
                <>
                  <Activity className="h-5 w-5 text-green-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-green-800">Process is running</p>
                    <p className="text-sm text-green-600">
                      PID: {status.pid} • Started {formatDuration(execution.started_at)} ago
                    </p>
                  </div>
                </>
              ) : status ? (
                <>
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Waiting for process</p>
                    <p className="text-sm text-yellow-600">
                      Process not yet detected or initializing...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-800">Checking process status...</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleKill}
              disabled={isKilling}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-50"
            >
              {isKilling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StopCircle className="h-4 w-4" />
              )}
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Agent</p>
              <Link
                to={`/agents/${encodeURIComponent(execution.agent_folder)}`}
                className="font-medium text-primary hover:underline"
              >
                {execution.agent_folder}
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500">Triggered By</p>
              <p className="font-medium text-gray-900">{execution.triggered_by}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Started</p>
              <p className="font-medium text-gray-900">
                {new Date(execution.started_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium text-gray-900">
                {execution.duration_seconds
                  ? `${execution.duration_seconds.toFixed(1)}s`
                  : execution.status === 'running'
                  ? formatDuration(execution.started_at)
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Task</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-wrap">{execution.task}</p>
        </div>
      </div>

      {/* Context */}
      {execution.context && (() => {
        try {
          const ctx = JSON.parse(execution.context);
          const hasContent = ctx.urls?.length || ctx.file_paths?.length || ctx.images?.length;
          if (!hasContent) return null;

          return (
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Context Provided</h3>
              </div>
              <div className="p-6 space-y-4">
                {ctx.urls?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <LinkIcon className="h-4 w-4" />
                      URLs ({ctx.urls.length})
                    </p>
                    <div className="space-y-1">
                      {ctx.urls.map((url: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <LinkIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary hover:underline">
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ctx.file_paths?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      Local Documents ({ctx.file_paths.length})
                    </p>
                    <div className="space-y-1">
                      {ctx.file_paths.map((path: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="flex-1 truncate font-mono text-gray-700">{path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ctx.images?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                      <Image className="h-4 w-4" />
                      Images ({ctx.images.length})
                    </p>
                    <div className="space-y-1">
                      {ctx.images.map((path: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                          <Image className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="flex-1 truncate font-mono text-gray-700">{path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      {/* Output */}
      {execution.output && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Output</h3>
          </div>
          <div className="p-6">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {execution.output}
            </pre>
          </div>
        </div>
      )}

      {/* Follow Up Action for successful executions */}
      {execution.status === 'success' && execution.output && (
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Task completed successfully</p>
                <p className="text-sm text-green-600">
                  You can ask a follow-up question based on this result
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFollowUp(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Follow Up
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {execution.error && (
        <div className="card border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900">Error</h3>
          </div>
          <div className="p-6 bg-red-50">
            <pre className="text-red-700 whitespace-pre-wrap text-sm">
              {execution.error}
            </pre>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {showFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSubmitting && setShowFollowUp(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Follow Up</h3>
              <button
                onClick={() => setShowFollowUp(false)}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Previous task:</p>
                <p className="text-sm text-gray-700 line-clamp-2">{execution.task}</p>
              </div>

              {/* Show context from previous task */}
              {execution.context && (() => {
                try {
                  const ctx = JSON.parse(execution.context);
                  const hasContent = ctx.urls?.length || ctx.file_paths?.length || ctx.images?.length;
                  if (!hasContent) return null;

                  return (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium mb-2">Context included:</p>
                      <div className="space-y-1 text-sm text-blue-600">
                        {ctx.urls?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span>{ctx.urls.length} URL{ctx.urls.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {ctx.file_paths?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{ctx.file_paths.length} document{ctx.file_paths.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {ctx.images?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Image className="h-3.5 w-3.5" />
                            <span>{ctx.images.length} image{ctx.images.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Follow-up Question
                </label>
                {isSpeechSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isSubmitting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      isListening
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
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
                  value={followUpTask}
                  onChange={(e) => setFollowUpTask(e.target.value)}
                  placeholder="Ask a follow-up question or request additional work..."
                  rows={4}
                  className={`input resize-none ${isListening ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                  autoFocus
                  disabled={isSubmitting}
                />
                {isListening && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Listening...
                  </div>
                )}
              </div>
              {speechError && (
                <p className="mt-2 text-xs text-red-600">{speechError}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                The agent will receive the previous task and output as context.
                {isSpeechSupported && ' Click the Voice button to dictate your question.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFollowUp(false)}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleFollowUp}
                disabled={!followUpTask.trim() || isSubmitting}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return (
        <span className="badge badge-success flex items-center gap-1 text-base px-4 py-2">
          <CheckCircle className="h-4 w-4" />
          Success
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-error flex items-center gap-1 text-base px-4 py-2">
          <XCircle className="h-4 w-4" />
          Failed
        </span>
      );
    case 'timeout':
      return (
        <span className="badge badge-warning flex items-center gap-1 text-base px-4 py-2">
          <Clock className="h-4 w-4" />
          Timeout
        </span>
      );
    case 'running':
      return (
        <span className="badge badge-info flex items-center gap-1 text-base px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Running
        </span>
      );
    default:
      return <span className="badge badge-gray text-base px-4 py-2">{status}</span>;
  }
}

function formatDuration(startedAt: string): string {
  // Handle ISO date strings - append Z if no timezone to treat as UTC
  const isoString = startedAt.includes('Z') || startedAt.includes('+') ? startedAt : startedAt + 'Z';
  const start = new Date(isoString);
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
