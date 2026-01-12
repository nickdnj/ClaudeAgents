import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Loader2, CheckCircle, XCircle, ExternalLink, Mic, MicOff } from 'lucide-react';
import type { Agent, Execution } from '../../api/client';
import { agentsApi } from '../../api/client';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface RunAgentModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'submitting' | 'started' | 'error';

export function RunAgentModal({ agent, isOpen, onClose }: RunAgentModalProps) {
  const navigate = useNavigate();
  const [task, setTask] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [execution, setExecution] = useState<Execution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setTask((prev) => prev ? `${prev} ${transcript}` : transcript);
    },
  });

  // Stop listening when modal closes
  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  const handleRun = async () => {
    if (!task.trim()) return;

    setStatus('submitting');
    setError(null);

    try {
      const result = await agentsApi.execute(agent.folder, task);
      setExecution(result);
      // Execution now runs in background - API returns immediately with 'running' status
      setStatus('started');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleClose = () => {
    setTask('');
    setStatus('idle');
    setExecution(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={status === 'submitting' ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Run Agent</h3>
          <button
            onClick={handleClose}
            disabled={status === 'submitting'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Agent</p>
                <p className="font-medium text-gray-900">{agent.name}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Task Description
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
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Describe what you want the agent to do..."
                    rows={5}
                    className={`input resize-none ${isListening ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                    autoFocus
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
                  Enter a natural language description of the task you want this agent to perform.
                  {isSpeechSupported && ' Click the Voice button to dictate your task.'}
                </p>
              </div>
            </>
          )}

          {status === 'submitting' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Starting agent...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          )}

          {status === 'started' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Agent Started!</p>
              <p className="text-sm text-gray-500 mt-2">
                The agent is now running in the background.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Execution ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{execution?.id}</code>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Execution Failed</p>
              <p className="text-sm text-red-600 mt-2">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          {status === 'idle' && (
            <>
              <button onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleRun}
                disabled={!task.trim()}
                className="btn btn-success flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Execute
              </button>
            </>
          )}

          {status === 'started' && (
            <>
              <button onClick={handleClose} className="btn btn-secondary">
                Close
              </button>
              <button
                onClick={() => navigate('/executions')}
                className="btn btn-primary flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Tasks
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <button onClick={handleClose} className="btn btn-secondary">
                Close
              </button>
              <button
                onClick={() => setStatus('idle')}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
