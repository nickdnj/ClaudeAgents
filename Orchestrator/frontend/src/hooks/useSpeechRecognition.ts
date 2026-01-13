import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

// Web Speech API types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { continuous = true, interimResults = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onResultRef = useRef(options.onResult);
  const onErrorRef = useRef(options.onError);
  const shouldRestartRef = useRef(false);

  // Keep refs updated
  useEffect(() => {
    onResultRef.current = options.onResult;
    onErrorRef.current = options.onError;
  }, [options.onResult, options.onError]);

  const isSupported = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    // Create a new instance each time to avoid state issues
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result:', event);
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      if (finalTranscript && onResultRef.current) {
        onResultRef.current(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event);
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsListening(false);
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, shouldRestart:', shouldRestartRef.current);
      // If we should still be listening (user didn't stop), restart
      if (shouldRestartRef.current && continuous) {
        console.log('Restarting speech recognition...');
        try {
          recognition.start();
        } catch (err) {
          console.error('Failed to restart speech recognition:', err);
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    shouldRestartRef.current = true;
    setError(null);
    setTranscript('');

    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, continuous, interimResults]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error,
  };
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Microphone access denied. Please allow microphone access in your browser settings.';
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'No microphone found. Please connect a microphone.';
    case 'network':
      return 'Network error occurred. Please check your connection.';
    case 'aborted':
      return 'Speech recognition was aborted.';
    case 'service-not-allowed':
      return 'Speech recognition service not allowed. Try using Chrome or Edge.';
    default:
      return `Speech recognition error: ${error}`;
  }
}
