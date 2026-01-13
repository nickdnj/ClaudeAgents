import { Mic, Square } from 'lucide-react';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    button: 'w-8 h-8',
    icon: 14,
    ring: 'w-10 h-10',
    ringLarge: 'w-12 h-12',
  },
  md: {
    button: 'w-10 h-10',
    icon: 18,
    ring: 'w-12 h-12',
    ringLarge: 'w-14 h-14',
  },
  lg: {
    button: 'w-12 h-12',
    icon: 22,
    ring: 'w-14 h-14',
    ringLarge: 'w-16 h-16',
  },
};

export function VoiceInputButton({
  isListening,
  isSupported,
  onStart,
  onStop,
  disabled = false,
  size = 'md',
}: VoiceInputButtonProps) {
  if (!isSupported) {
    return null;
  }

  const sizes = sizeClasses[size];

  if (isListening) {
    // Recording state - show animated mic with stop button
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          {/* Outer pulsing ring */}
          <div
            className={`absolute ${sizes.ringLarge} rounded-full bg-red-400 opacity-30 animate-voice-pulse-outer`}
          />
          {/* Inner pulsing ring */}
          <div
            className={`absolute ${sizes.ring} rounded-full bg-red-400 opacity-50 animate-voice-pulse-inner`}
          />
          {/* Mic button - recording state */}
          <button
            type="button"
            onClick={onStop}
            className={`relative ${sizes.button} rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105`}
          >
            <Mic size={sizes.icon} />
          </button>
        </div>
        {/* Stop button */}
        <button
          type="button"
          onClick={onStop}
          className={`${sizes.button} rounded-full bg-gray-800 text-white flex items-center justify-center shadow-md hover:bg-gray-700 transition-colors`}
          title="Stop recording"
        >
          <Square size={sizes.icon - 4} fill="currentColor" />
        </button>
        {/* Recording indicator */}
        <span className="text-sm font-medium text-red-600 animate-pulse">
          Recording...
        </span>
      </div>
    );
  }

  // Idle state - show mic button
  return (
    <button
      type="button"
      onClick={onStart}
      disabled={disabled}
      className={`${sizes.button} rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border-2 border-gray-200 hover:bg-gray-200 hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Start voice input"
    >
      <Mic size={sizes.icon} />
    </button>
  );
}
