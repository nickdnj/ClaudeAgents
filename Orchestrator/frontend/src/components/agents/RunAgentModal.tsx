import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Loader2, CheckCircle, XCircle, ExternalLink, Mic, MicOff, Plus, Trash2, Link, FileText, Image, ChevronDown, ChevronUp, Upload } from 'lucide-react';
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

  // Context state
  const [showContext, setShowContext] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [filePathInput, setFilePathInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContext = urls.length > 0 || filePaths.length > 0 || images.length > 0;

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

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Context handlers
  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !urls.includes(trimmed)) {
      setUrls([...urls, trimmed]);
      setUrlInput('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const addFilePath = () => {
    const trimmed = filePathInput.trim();
    if (trimmed && !filePaths.includes(trimmed)) {
      setFilePaths([...filePaths, trimmed]);
      setFilePathInput('');
    }
  };

  const removeFilePath = (index: number) => {
    setFilePaths(filePaths.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for documents
  const handleDocDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocs(true);
  };

  const handleDocDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocs(false);
  };

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocs(false);

    // Get file paths from dropped files
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Filter out images - those go to the image section
      const docFiles = files.filter(f => !f.type.startsWith('image/'));
      const newPaths = docFiles
        .map(f => (f as File & { path?: string }).path || f.name)
        .filter(p => p && !filePaths.includes(p));

      if (newPaths.length > 0) {
        setFilePaths([...filePaths, ...newPaths]);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      const newPreviews = imageFiles.map(f => URL.createObjectURL(f));
      setImages([...images, ...imageFiles]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (!task.trim()) return;

    setStatus('submitting');
    setError(null);

    try {
      // Build context object if any context is provided
      const context = hasContext ? {
        urls: urls.length > 0 ? urls : undefined,
        file_paths: filePaths.length > 0 ? filePaths : undefined,
        images: images.length > 0 ? images : undefined,
      } : undefined;

      const result = await agentsApi.execute(agent.folder, task, context);
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
    // Reset context
    setShowContext(false);
    setUrls([]);
    setUrlInput('');
    setFilePaths([]);
    setFilePathInput('');
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImages([]);
    setImagePreviews([]);
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
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">Run Agent</h3>
          <button
            onClick={handleClose}
            disabled={status === 'submitting'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
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

              {/* Context Section */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Add Context</span>
                    {hasContext && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {urls.length + filePaths.length + images.length} items
                      </span>
                    )}
                  </div>
                  {showContext ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {showContext && (
                  <div className="p-4 pt-0 space-y-4 border-t border-gray-200">
                    {/* URLs */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                        <Link className="h-4 w-4" />
                        URLs
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                          placeholder="https://example.com"
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={addUrl}
                          disabled={!urlInput.trim()}
                          className="btn btn-secondary px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {urls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {urls.map((url, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                              <Link className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="flex-1 truncate text-gray-700">{url}</span>
                              <button
                                type="button"
                                onClick={() => removeUrl(i)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Content will be fetched and included</p>
                    </div>

                    {/* File Paths */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                        <FileText className="h-4 w-4" />
                        Local Documents
                      </label>
                      {/* Drag and drop zone */}
                      <div
                        onDragOver={handleDocDragOver}
                        onDragLeave={handleDocDragLeave}
                        onDrop={handleDocDrop}
                        className={`p-3 mb-2 border-2 border-dashed rounded-lg transition-colors ${
                          isDraggingDocs
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1 text-gray-500">
                          <Upload className="h-5 w-5" />
                          <span className="text-xs">Drop files here or enter path below</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={filePathInput}
                          onChange={(e) => setFilePathInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFilePath())}
                          placeholder="/path/to/document.pdf"
                          className="input flex-1 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={addFilePath}
                          disabled={!filePathInput.trim()}
                          className="btn btn-secondary px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {filePaths.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {filePaths.map((path, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                              <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="flex-1 truncate font-mono text-gray-700">{path}</span>
                              <button
                                type="button"
                                onClick={() => removeFilePath(i)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">Drag files or enter paths - content will be read and included</p>
                    </div>

                    {/* Images */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                        <Image className="h-4 w-4" />
                        Images
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                      >
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <Upload className="h-6 w-6" />
                          <span className="text-sm">Click to upload images</span>
                        </div>
                      </button>
                      {imagePreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {imagePreviews.map((preview, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${i + 1}`}
                                className="w-full h-16 object-cover rounded border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

        {/* Footer - fixed at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
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
