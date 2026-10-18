/**
 * VoiceButton — SpendMesh AI
 *
 * Compact floating trigger button for the voice assistant.
 * Always visible in the bottom-right corner.
 * Shows speaking/listening status indicators.
 * Keyboard accessible and accessible to screen readers.
 */

import React from 'react';
import { MessageCircle, Mic, Volume2 } from 'lucide-react';
import { useVoiceContext } from '../context/VoiceContext';

export default function VoiceButton({ isSpeaking = false, isListening = false }) {
  const { assistantOpen, toggleAssistant } = useVoiceContext();

  return (
    <button
      onClick={toggleAssistant}
      aria-label={assistantOpen ? 'Close AI Security Guide' : 'Open AI Security Guide'}
      aria-expanded={assistantOpen}
      title="SpendMesh AI Security Guide"
      className={`
        fixed bottom-5 right-5 z-50 
        w-12 h-12 rounded-full 
        flex items-center justify-center
        shadow-lg transition-all duration-200
        focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/40
        active:scale-95
        ${assistantOpen
          ? 'bg-[#1E3A8A] shadow-blue-200'
          : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-200/50 hover:shadow-blue-200'
        }
      `}
    >
      {/* Status ring for speaking */}
      {isSpeaking && (
        <span className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
      )}
      {/* Status ring for listening */}
      {isListening && !isSpeaking && (
        <span className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping" />
      )}

      {isListening ? (
        <Mic className="w-5 h-5 text-yellow-200" />
      ) : isSpeaking ? (
        <Volume2 className="w-5 h-5 text-green-200" />
      ) : (
        <MessageCircle className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
