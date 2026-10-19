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
import { playAssistantOpenChime } from '../utils/audioChimes';

export default function VoiceButton(props) {
  const context = useVoiceContext();
  const assistantOpen = context.assistantOpen;
  const toggleAssistant = context.toggleAssistant;
  const isSpeaking = props.isSpeaking ?? context.isSpeaking ?? false;
  const isListening = props.isListening ?? context.isListening ?? false;

  const handleClick = () => {
    if (!assistantOpen) {
      playAssistantOpenChime();
    }
    toggleAssistant();
  };

  return (
    <button
      onClick={handleClick}
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
        ${isSpeaking
          ? 'bg-gradient-to-tr from-[#15803D] to-[#22C55E] ring-4 ring-green-400/40 shadow-green-200/50'
          : isListening
          ? 'bg-gradient-to-tr from-[#B45309] to-[#F59E0B] ring-4 ring-amber-400/50 shadow-amber-200/50'
          : assistantOpen
          ? 'bg-[#1E3A8A] shadow-blue-200'
          : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-blue-200/50 hover:shadow-blue-200'
        }
      `}
    >
      {/* Outer animated radar ring for audio activity */}
      {isSpeaking && (
        <span className="absolute -inset-1 rounded-full bg-green-400/30 animate-ping" />
      )}
      {isListening && !isSpeaking && (
        <span className="absolute -inset-1 rounded-full bg-amber-400/30 animate-ping" />
      )}

      {/* Dynamic Waveform or Default Icon */}
      {isSpeaking ? (
        <div className="flex items-center gap-[2.5px] h-5 px-1 relative z-10" title="Speaking...">
          <span className="w-[3px] h-4 rounded-full bg-green-100 animate-waveform-1" />
          <span className="w-[3px] h-4 rounded-full bg-white animate-waveform-2" />
          <span className="w-[3px] h-4 rounded-full bg-green-200 animate-waveform-3" />
          <span className="w-[3px] h-4 rounded-full bg-white animate-waveform-4" />
        </div>
      ) : isListening ? (
        <div className="flex items-center gap-[2.5px] h-5 px-1 relative z-10" title="Listening to voice...">
          <span className="w-[3px] h-4 rounded-full bg-amber-100 animate-waveform-1" />
          <span className="w-[3px] h-4 rounded-full bg-white animate-waveform-2" />
          <span className="w-[3px] h-4 rounded-full bg-amber-200 animate-waveform-3" />
          <span className="w-[3px] h-4 rounded-full bg-white animate-waveform-4" />
        </div>
      ) : (
        <MessageCircle className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
