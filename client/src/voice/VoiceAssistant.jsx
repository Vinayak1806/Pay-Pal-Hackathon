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
  X, RotateCcw, Send, Shield, WifiOff
} from 'lucide-react';
import { useVoice } from './useVoice';
import { processCommand } from './voiceCommands';
import { narrationScripts, quickActionsForPage } from './voiceScripts';
import voiceEventBus, { VoiceEvents } from './voiceEventBus';
import { useVoiceContext } from '../context/VoiceContext';
import { agentService } from '../services/api';
import {
  playSuccessChime,
  playAlertChime,
  playShieldBlockedChime,
  playAssistantOpenChime
} from '../utils/audioChimes';

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

  if (msg.isThinking) {
    return (
      <div className="flex gap-2 items-start">
        <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
          <Shield className="w-3 h-3 text-white" />
        </div>
        <div className="rounded-xl px-3 py-2 text-[12px] bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] flex items-center gap-1.5 italic">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
          <span>Thinking...</span>
        </div>
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
        className={`max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${isUser
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
  const { voiceAppContext, assistantOpen, closeAssistant, openAssistant, toggleAssistant, setIsSpeaking: setContextSpeaking, setIsListening: setContextListening } = useVoiceContext();

  const {
    canSpeak, canListen,
    isMuted, isSpeaking, isListening,
    transcript, permissionDenied, lastSpoken, error,
    speak, stopSpeaking, repeatLast, toggleMute,
    startListening, stopListening,
    clearError, clearTranscript,
  } = useVoice();

  // Sync speaking & listening state to global context for VoiceButton
  useEffect(() => {
    if (setContextSpeaking) setContextSpeaking(isSpeaking);
  }, [isSpeaking, setContextSpeaking]);

  useEffect(() => {
    if (setContextListening) setContextListening(isListening);
  }, [isListening, setContextListening]);

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
  const lastEventRef = useRef(null);

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

  // Sync live recognition transcript into textInput for visibility and user editing
  useEffect(() => {
    if (isListening && transcript) {
      setTextInput(transcript);
    }
  }, [isListening, transcript]);

  const lastProcessedInputRef = useRef({ text: '', timestamp: 0 });

  // ── Process user input (voice or text) ──────────────────────────
  const handleUserInput = useCallback((input) => {
    if (!input?.trim()) return;
    const trimmed = input.trim();
    const now = Date.now();

    // Deduplication: prevent identical command from firing twice within 1.2s
    if (
      lastProcessedInputRef.current.text.toLowerCase() === trimmed.toLowerCase() &&
      (now - lastProcessedInputRef.current.timestamp) < 1200
    ) {
      return;
    }
    lastProcessedInputRef.current = { text: trimmed, timestamp: now };

    addMessage(MSG.USER, trimmed);
    clearTranscript();
    setTextInput('');

    const result = processCommand(trimmed, {
      ...voiceAppContext,
      navigate,
      currentPath: location.pathname,
      lastEvent: lastEventRef.current,
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

    // Generative AI Fallback via Gemini 2.5 Flash
    if (result.isFallback) {
      const thinkingId = `msg-ai-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        { id: thinkingId, role: MSG.ASSISTANT, text: 'Thinking...', isThinking: true }
      ]);

      agentService.chat(input, {
        ...voiceAppContext,
        currentPath: location.pathname,
      }).then((res) => {
        const text = res?.response || result.response;
        setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, text, isThinking: false } : m));
        playAssistantOpenChime();
        speak(text, { priority: 1, interruptCurrent: true });
      }).catch(() => {
        setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, text: result.response, isThinking: false } : m));
        speak(result.response, { priority: 1, interruptCurrent: true });
      });
      return;
    }

    // Normal answer
    addMessage(MSG.ASSISTANT, result.response);
    speak(result.response, { priority: 1, interruptCurrent: true });
  }, [
    addMessage, clearTranscript, navigate, location.pathname, voiceAppContext,
    stopSpeaking, isMuted, toggleMute, speak, repeatLast, lastSpoken
  ]);

  // ── Handle mic click ────────────────────────────────────────────
  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      startListening((recognized) => {
        handleUserInput(recognized);
      });
    }
  }, [isListening, startListening, stopListening, stopSpeaking, handleUserInput]);

  // ── Handle text submit ──────────────────────────────────────────
  const handleTextSubmit = (e) => {
    e.preventDefault();
    const input = textInput.trim();
    if (!input) return;
    setTextInput('');
    handleUserInput(input);
  };

  // ── First-time visitor welcome narration (does NOT trigger on refresh) ──
  useEffect(() => {
    // Clear legacy permanent localStorage flag from prior builds so it doesn't block repeat visits
    try {
      localStorage.removeItem('spendmesh_welcomed_first_time');
    } catch (e) { }

    // Check if current browser session was already welcomed
    const sessionWelcomed = sessionStorage.getItem('spendmesh_session_welcomed');

    // Check if current page load is a browser reload (F5 / reload button)
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    const isPageReload = navEntry ? navEntry.type === 'reload' : (window.performance?.navigation?.type === 1);

    if (sessionWelcomed === 'true' || isPageReload) {
      try {
        sessionStorage.setItem('spendmesh_session_welcomed', 'true');
      } catch (e) { }
      return; // Do NOT trigger on refresh or within the same active tab session
    }

    // Mark current visit session as welcomed
    try {
      sessionStorage.setItem('spendmesh_session_welcomed', 'true');
    } catch (e) { }

    const welcomeText = narrationScripts.WELCOME();
    addMessage(MSG.ASSISTANT, welcomeText);

    let spoken = false;

    const playWelcomeSpeech = (fromUserInteraction = false) => {
      if (spoken) return;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch (e) { }
      }
      if (!isMuted) {
        speak(welcomeText, { priority: 0 });
      }
      if (fromUserInteraction) {
        spoken = true;
        removeListeners();
      }
    };

    const handleUserInteraction = () => {
      if (spoken) {
        removeListeners();
        return;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch (e) { }
      }
      if (!window.speechSynthesis?.speaking) {
        playWelcomeSpeech(true);
      } else {
        spoken = true;
        removeListeners();
      }
    };

    const removeListeners = () => {
      window.removeEventListener('click', handleUserInteraction, true);
      window.removeEventListener('pointerdown', handleUserInteraction, true);
      window.removeEventListener('keydown', handleUserInteraction, true);
    };

    // 1. Attempt automatic speech after 600ms
    const timer = setTimeout(() => {
      if (!spoken) {
        playWelcomeSpeech(false);
      }
    }, 600);

    // 2. Fallback for browsers (Chrome/Brave) that block audio autoplay until user gesture
    window.addEventListener('click', handleUserInteraction, { capture: true, once: true });
    window.addEventListener('pointerdown', handleUserInteraction, { capture: true, once: true });
    window.addEventListener('keydown', handleUserInteraction, { capture: true, once: true });

    return () => {
      clearTimeout(timer);
      removeListeners();
    };
  }, [isMuted, speak, addMessage]);

  const announcedEventsRef = useRef(new Set());

  // ── Subscribe to voiceEventBus events ───────────────────────────
  useEffect(() => {
    const handlers = [];

    const subscribe = (eventType, scriptFn, priority = 0) => {
      const handler = (event) => {
        lastEventRef.current = event;
        const eventKey = `${eventType}-${event.timestamp || ''}-${event.amount || ''}-${event.dealId || ''}-${event.captureId || ''}`;
        
        // Synchronous dedup: skip if this event was already announced within 4 seconds
        if (announcedEventsRef.current.has(eventKey)) return;
        announcedEventsRef.current.add(eventKey);
        setTimeout(() => announcedEventsRef.current.delete(eventKey), 4000);

        const text = scriptFn(event);
        if (!text) return;

        // Acoustic sound FX for key platform events
        if (eventType === VoiceEvents.CAPTURE_VERIFIED || eventType === VoiceEvents.APPROVAL_GRANTED) {
          playSuccessChime();
        } else if (eventType === VoiceEvents.APPROVAL_REQUIRED) {
          playAlertChime();
        } else if (
          eventType === VoiceEvents.POLICY_BLOCKED ||
          eventType === VoiceEvents.TAMPER_BLOCKED ||
          eventType === VoiceEvents.DUPLICATE_BLOCKED ||
          eventType === VoiceEvents.CAPTURE_FAILED
        ) {
          playShieldBlockedChime();
        }

        addMessage(MSG.ASSISTANT, text);
        speak(text, { priority, interruptCurrent: true });
        // Never auto-open chat box: strictly user-initiated via floating button
      };
      const unsub = voiceEventBus.on(eventType, handler);
      handlers.push(unsub);
    };

    // Workflow events (normal priority)
    subscribe(VoiceEvents.REQUEST_PARSING, narrationScripts.REQUEST_PARSING, 0);
    subscribe(VoiceEvents.PARSE_COMPLETE, narrationScripts.PARSE_COMPLETE, 0);
    subscribe(VoiceEvents.OFFERS_LOADED, narrationScripts.OFFERS_LOADED, 0);
    subscribe(VoiceEvents.POLICY_PASSED, narrationScripts.POLICY_PASSED, 1);
    subscribe(VoiceEvents.POLICY_BLOCKED, narrationScripts.POLICY_BLOCKED, 1);
    subscribe(VoiceEvents.APPROVAL_REQUIRED, narrationScripts.APPROVAL_REQUIRED, 1);
    subscribe(VoiceEvents.APPROVAL_GRANTED, narrationScripts.APPROVAL_GRANTED, 1);
    subscribe(VoiceEvents.APPROVAL_REJECTED, narrationScripts.APPROVAL_REJECTED, 1);
    subscribe(VoiceEvents.CHECKOUT_READY, narrationScripts.CHECKOUT_READY, 0);
    subscribe(VoiceEvents.CHECKOUT_INITIATED, narrationScripts.CHECKOUT_INITIATED, 1);
    subscribe(VoiceEvents.CAPTURE_VERIFIED, narrationScripts.CAPTURE_VERIFIED, 1);
    subscribe(VoiceEvents.CAPTURE_FAILED, narrationScripts.CAPTURE_FAILED, 1);
    subscribe(VoiceEvents.LEDGER_VERIFIED, narrationScripts.LEDGER_VERIFIED, 0);

    // Security events (highest priority — interrupt current speech)
    subscribe(VoiceEvents.TAMPER_BLOCKED, narrationScripts.TAMPER_BLOCKED, 2);
    subscribe(VoiceEvents.DUPLICATE_BLOCKED, narrationScripts.DUPLICATE_BLOCKED, 2);
    subscribe(VoiceEvents.BUDGET_EXCEEDED, narrationScripts.BUDGET_EXCEEDED, 1);

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
          {isSpeaking ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-[2px] h-4 px-0.5">
                <span className="w-[2.5px] h-3 rounded-full bg-green-200 animate-waveform-1" />
                <span className="w-[2.5px] h-3.5 rounded-full bg-white animate-waveform-2" />
                <span className="w-[2.5px] h-4 rounded-full bg-green-100 animate-waveform-3" />
                <span className="w-[2.5px] h-3 rounded-full bg-white animate-waveform-4" />
                <span className="w-[2.5px] h-2.5 rounded-full bg-green-300 animate-waveform-5" />
              </div>
              <span className="font-semibold text-[13px]">Security Guide</span>
              <span className="text-[10px] text-green-200 font-medium tracking-wide">Speaking...</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-[2px] h-4 px-0.5">
                <span className="w-[2.5px] h-3 rounded-full bg-amber-200 animate-waveform-1" />
                <span className="w-[2.5px] h-3.5 rounded-full bg-white animate-waveform-2" />
                <span className="w-[2.5px] h-4 rounded-full bg-yellow-200 animate-waveform-3" />
                <span className="w-[2.5px] h-3 rounded-full bg-white animate-waveform-4" />
                <span className="w-[2.5px] h-2.5 rounded-full bg-amber-300 animate-waveform-5" />
              </div>
              <span className="font-semibold text-[13px]">Security Guide</span>
              <span className="text-[10px] text-yellow-200 font-medium animate-pulse tracking-wide">Listening...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/70" />
              <span className="font-semibold text-[13px]">Security Guide</span>
            </div>
          )}
          {/* Active Page Perspective Badge */}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium border border-white/20 truncate max-w-[110px]" title={location.pathname}>
            {location.pathname === '/' ? 'Dashboard' :
             location.pathname.includes('/requests') ? 'Requests' :
             location.pathname.includes('/approvals') ? 'Approvals' :
             location.pathname.includes('/transactions') ? 'Transactions' :
             location.pathname.includes('/policy') ? 'Policy' :
             location.pathname.includes('/audit') ? 'Audit Log' :
             location.pathname.includes('/agents') ? 'Agents' :
             location.pathname.includes('/payment/success') ? 'Payment Settled' :
             location.pathname.includes('/payment/cancel') ? 'Cancelled' : 'Overview'}
          </span>
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
        <div className={`px-4 py-2 text-[11px] border-b flex items-start gap-2 shrink-0 ${permissionDenied || !canSpeak
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
        {isListening && (
          <div className="flex gap-2 items-start flex-row-reverse animate-in fade-in duration-150">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed bg-[#EFF4FF] text-[#1E40AF] rounded-tr-none border border-blue-200 shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="italic font-medium">
                {transcript ? `"${transcript}"...` : 'Listening... speak now'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Contextual Horizontal Prompt Pills (Dynamic Per Page) ─── */}
      <div className="px-3 py-1.5 border-t border-[#F1F5F9] bg-[#FAFAFD] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {currentQuickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleUserInput(action.command)}
              className="text-[11.5px] px-3 py-1 rounded-full border border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F8FAFC] hover:text-[#101828] hover:border-[#98A2B3] transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 shadow-2xs active:scale-95"
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
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
              className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${isListening
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
            placeholder={
              isListening
                ? (transcript ? `Heard: "${transcript}"` : '🎙️ Listening... speak now')
                : (canListen ? 'Type or speak...' : 'Type a question...')
            }
            aria-label="Ask the voice assistant a question"
            className={`flex-1 rounded-full px-3.5 py-2 text-[12.5px] text-[#101828] placeholder:text-[#94A3B8] focus:outline-none transition-all ${isListening
              ? 'bg-blue-50/80 border-2 border-blue-400 ring-2 ring-blue-100 placeholder:text-blue-700'
              : 'bg-[#F8FAFC] border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent'
              }`}
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
