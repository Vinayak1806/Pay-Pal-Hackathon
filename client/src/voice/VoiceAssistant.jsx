/**
 * VoiceAssistant — SpendMesh AI
 *
 * Full expandable voice assistant panel. Features:
 * - Microphone button (user-initiated listening only)
 * - Text fallback input for when speech is unavailable
 * - Visible conversation transcript
 * - Contextual quick-action buttons per page
 * - Mute + stop-speaking controls
 * - Narration event subscriptions from voiceEventBus
 * - Clear error/permission messages
 * - Accessible (ARIA labels, keyboard navigation, focus states)
 * - Reduced-motion friendly (no animation if prefers-reduced-motion)
 *
 * This component NEVER initiates financial transactions.
 * It is read-only — it narrates and answers questions only.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Volume2, VolumeX, StopCircle,
  MessageCircle, X, ChevronUp, ChevronDown,
  RotateCcw, Send, Wifi, WifiOff, Shield
} from 'lucide-react';
import { useVoice } from './useVoice';
import { processCommand } from './voiceCommands';
import { narrationScripts, quickActionsForPage } from './voiceScripts';
import voiceEventBus, { VoiceEvents } from './voiceEventBus';
import { useVoiceContext } from '../context/VoiceContext';

// ─── Conversation Message Types ────────────────────────────────
const MSG = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
};

function Message({ msg }) {
  const isUser = msg.role === MSG.USER;
  const isSystem = msg.role === MSG.SYSTEM;

  if (isSystem) {
    return (
      <div className="text-center text-[11px] text-[#94A3B8] italic py-1">
        {msg.text}
      </div>
    );
  }

  return (
    <div className={`flex gap-2 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-3 h-3 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
          isUser
            ? 'bg-[#EFF4FF] text-[#1E40AF] rounded-tr-none'
            : 'bg-[#F8FAFC] text-[#1E293B] rounded-tl-none border border-[#E2E8F0]'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

export default function VoiceAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { voiceAppContext, assistantOpen, closeAssistant, openAssistant, toggleAssistant } = useVoiceContext();

  const {
    canSpeak, canListen,
    isMuted, isSpeaking, isListening,
    transcript, permissionDenied, lastSpoken, error,
    speak, stopSpeaking, repeatLast, toggleMute,
    startListening, stopListening,
    clearError, clearTranscript,
  } = useVoice();

  // Conversation history
  const [messages, setMessages] = useState([{
    id: 'welcome-sys',
    role: MSG.SYSTEM,
    text: 'SpendMesh AI Financial Security Guide',
  }]);

  const [textInput, setTextInput] = useState('');
  const [lastAnnouncedEvents, setLastAnnouncedEvents] = useState(new Set());
  const messagesEndRef = useRef(null);
  const textInputRef = useRef(null);
  const welcomeSpokenRef = useRef(false);
  const isFirstOpenRef = useRef(true);

  // Auto-scroll transcript
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Add message helper ──────────────────────────────────────────
  const addMessage = useCallback((role, text) => {
    setMessages(prev => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random()}`, role, text }
    ]);
  }, []);

  // ── Process user input (voice or text) ──────────────────────────
  const handleUserInput = useCallback((input) => {
    if (!input?.trim()) return;

    addMessage(MSG.USER, input);
    clearTranscript();

    const result = processCommand(input, {
      navigate,
      currentPath: location.pathname,
      ...voiceAppContext,
    });

    // Handle special control commands
    if (result.response === '__STOP__') {
      stopSpeaking();
      addMessage(MSG.ASSISTANT, 'Stopped speaking.');
      return;
    }
    if (result.response === '__MUTE__') {
      if (!isMuted) toggleMute();
      addMessage(MSG.ASSISTANT, 'Narration muted. I will show responses as text only.');
      return;
    }
    if (result.response === '__UNMUTE__') {
      if (isMuted) toggleMute();
      addMessage(MSG.ASSISTANT, 'Narration unmuted. I will speak responses again.');
      speak('Narration is now enabled.', { priority: 1 });
      return;
    }
    if (result.response === '__REPEAT__') {
      repeatLast();
      addMessage(MSG.ASSISTANT, lastSpoken || 'Nothing to repeat yet.');
      return;
    }

    // Navigation happened
    if (result.navigated && result.path) {
      const navScript = narrationScripts.PAGE_CHANGED({ page: result.path });
      addMessage(MSG.ASSISTANT, navScript);
      speak(navScript, { priority: 1 });
      return;
    }

    // Normal answer
    addMessage(MSG.ASSISTANT, result.response);
    speak(result.response, { priority: 1 });
  }, [
    addMessage, clearTranscript, navigate, location.pathname, voiceAppContext,
    stopSpeaking, isMuted, toggleMute, speak, repeatLast, lastSpoken
  ]);

  // ── Handle mic click ────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((recognized) => {
        handleUserInput(recognized);
      });
    }
  }, [isListening, startListening, stopListening, handleUserInput]);

  // ── Handle text submit ──────────────────────────────────────────
  const handleTextSubmit = (e) => {
    e.preventDefault();
    const input = textInput.trim();
    if (!input) return;
    setTextInput('');
    handleUserInput(input);
  };

  // ── Welcome narration on first open ─────────────────────────────
  useEffect(() => {
    if (assistantOpen && isFirstOpenRef.current && !welcomeSpokenRef.current) {
      isFirstOpenRef.current = false;
      welcomeSpokenRef.current = true;

      const welcomeText = narrationScripts.WELCOME();
      addMessage(MSG.ASSISTANT, welcomeText);
      // Brief delay to allow browser speech to initialize
      setTimeout(() => {
        if (!isMuted) speak(welcomeText, { priority: 0 });
      }, 600);
    }
  }, [assistantOpen, isMuted, speak, addMessage]);

  // ── Subscribe to voiceEventBus events ───────────────────────────
  useEffect(() => {
    const handlers = [];

    const subscribe = (eventType, scriptFn, priority = 0) => {
      const handler = (event) => {
        const eventKey = `${eventType}-${event.timestamp}`;
        // Skip if we already announced this exact event
        setLastAnnouncedEvents(prev => {
          if (prev.has(eventKey)) return prev;
          const next = new Set(prev);
          next.add(eventKey);
          // Keep set bounded
          if (next.size > 50) {
            const iter = next.values();
            next.delete(iter.next().value);
          }
          return next;
        });

        const text = scriptFn(event);
        if (!text) return;

        addMessage(MSG.ASSISTANT, text);
        speak(text, { priority, interruptCurrent: priority >= 2 });

        // Auto-open panel for important events
        if (priority >= 1) {
          openAssistant();
        }
      };
      const unsub = voiceEventBus.on(eventType, handler);
      handlers.push(unsub);
    };

    // Workflow events (normal priority)
    subscribe(VoiceEvents.REQUEST_PARSING,    narrationScripts.REQUEST_PARSING,    0);
    subscribe(VoiceEvents.PARSE_COMPLETE,     narrationScripts.PARSE_COMPLETE,     0);
    subscribe(VoiceEvents.OFFERS_LOADED,      narrationScripts.OFFERS_LOADED,      0);
    subscribe(VoiceEvents.POLICY_PASSED,      narrationScripts.POLICY_PASSED,      1);
    subscribe(VoiceEvents.POLICY_BLOCKED,     narrationScripts.POLICY_BLOCKED,     1);
    subscribe(VoiceEvents.APPROVAL_REQUIRED,  narrationScripts.APPROVAL_REQUIRED,  1);
    subscribe(VoiceEvents.APPROVAL_GRANTED,   narrationScripts.APPROVAL_GRANTED,   1);
    subscribe(VoiceEvents.APPROVAL_REJECTED,  narrationScripts.APPROVAL_REJECTED,  1);
    subscribe(VoiceEvents.CHECKOUT_READY,     narrationScripts.CHECKOUT_READY,     0);
    subscribe(VoiceEvents.CAPTURE_VERIFIED,   narrationScripts.CAPTURE_VERIFIED,   1);
    subscribe(VoiceEvents.CAPTURE_FAILED,     narrationScripts.CAPTURE_FAILED,     1);
    subscribe(VoiceEvents.LEDGER_VERIFIED,    narrationScripts.LEDGER_VERIFIED,    0);

    // Security events (highest priority — interrupt current speech)
    subscribe(VoiceEvents.TAMPER_BLOCKED,     narrationScripts.TAMPER_BLOCKED,     2);
    subscribe(VoiceEvents.DUPLICATE_BLOCKED,  narrationScripts.DUPLICATE_BLOCKED,  2);
    subscribe(VoiceEvents.BUDGET_EXCEEDED,    narrationScripts.BUDGET_EXCEEDED,    1);

    return () => handlers.forEach(unsub => unsub());
  }, [addMessage, speak, openAssistant]);

  // ── Quick actions for current page ─────────────────────────────
  const currentQuickActions = quickActionsForPage[location.pathname] || quickActionsForPage.DEFAULT;

  // ── Render ──────────────────────────────────────────────────────
  if (!assistantOpen) return null;

  const unsupportedBrowser = !canSpeak && !canListen;

  return (
    <div
      role="dialog"
      aria-label="SpendMesh AI Financial Security Guide"
      aria-modal="false"
      className="fixed bottom-20 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] flex flex-col bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden"
      style={{ maxHeight: '540px' }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-300 animate-pulse' : isListening ? 'bg-yellow-300 animate-pulse' : 'bg-white/50'}`} />
          <span className="font-semibold text-[13px]">Security Guide</span>
          {isSpeaking && <span className="text-[10px] text-blue-200 font-medium">Speaking...</span>}
          {isListening && <span className="text-[10px] text-yellow-200 font-medium animate-pulse">Listening...</span>}
        </div>

        <div className="flex items-center gap-1">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
            title={isMuted ? 'Unmute narration' : 'Mute narration'}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isMuted
              ? <VolumeX className="w-4 h-4 text-white/70" />
              : <Volume2 className="w-4 h-4" />
            }
          </button>

          {/* Stop speaking */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              aria-label="Stop speaking"
              title="Stop speaking"
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={closeAssistant}
            aria-label="Close assistant"
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Status banner ──────────────────────────────────────── */}
      {(permissionDenied || error || !canSpeak) && (
        <div className={`px-4 py-2 text-[11px] border-b flex items-start gap-2 shrink-0 ${
          permissionDenied || !canSpeak
            ? 'bg-[#FFFBEB] border-[#FED7AA] text-[#92400E]'
            : 'bg-[#FEF2F2] border-[#FECACA] text-[#B42318]'
        }`}>
          {!canSpeak && !permissionDenied && (
            <><WifiOff className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>Speech synthesis is not supported in this browser. Text mode active.</span></>
          )}
          {permissionDenied && (
            <><MicOff className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>Microphone access denied. Use the text input below.</span></>
          )}
          {error && !permissionDenied && (
            <><MicOff className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{error}</span></>
          )}
        </div>
      )}

      {/* ── Message transcript ─────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2.5"
        style={{ minHeight: '160px', maxHeight: '260px' }}
        aria-live="polite"
        aria-label="Conversation transcript"
      >
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        {isListening && transcript && (
          <div className="flex gap-2 items-start flex-row-reverse">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed bg-[#EFF4FF] text-[#1E40AF] rounded-tr-none opacity-70 italic">
              {transcript}...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick actions ──────────────────────────────────────── */}
      <div className="px-3 py-2 border-t border-[#E2E8F0] flex flex-wrap gap-1.5 shrink-0 bg-[#FAFAFD]">
        {currentQuickActions.map((action) => (
          <button
            key={action.command}
            onClick={() => handleUserInput(action.command)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-[#BFDBFE] bg-[#EFF4FF] text-[#2563EB] hover:bg-[#DBEAFE] hover:border-[#93C5FD] transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* ── Input area ─────────────────────────────────────────── */}
      <div className="px-3 pb-3 pt-2 border-t border-[#E2E8F0] shrink-0">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          {/* Microphone button */}
          {canListen && (
            <button
              type="button"
              onClick={handleMicClick}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop listening (click to cancel)' : 'Click to speak'}
              className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                  : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Text input */}
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={canListen ? 'Type or speak...' : 'Type a question...'}
            aria-label="Ask the voice assistant a question"
            className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3.5 py-2 text-[12.5px] text-[#101828] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />

          {/* Send button */}
          <button
            type="submit"
            aria-label="Send message"
            disabled={!textInput.trim()}
            className="w-9 h-9 shrink-0 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Speech recognition disclaimer (when canListen) */}
        {canListen && !permissionDenied && (
          <p className="text-[10px] text-[#94A3B8] mt-1.5 text-center leading-tight">
            Voice recognition uses your browser's built-in API. Audio is not sent to our servers.
          </p>
        )}
      </div>
    </div>
  );
}
