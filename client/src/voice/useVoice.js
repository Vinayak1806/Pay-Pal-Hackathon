/**
 * useVoice — SpendMesh AI
 *
 * Custom React hook managing:
 * - Browser Web Speech API detection and feature flags
 * - SpeechSynthesis queue with priority levels (security alerts first)
 * - SpeechRecognition: user-initiated only, single-session, graceful errors
 * - Mute/unmute toggle
 * - Stop speaking
 * - Transcript management
 * - Proper cleanup on unmount
 *
 * Privacy guarantee:
 * - Microphone starts ONLY on explicit user action
 * - No audio is sent to any custom server
 * - After answering, returns to idle (no continuous listening)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Feature detection — separate from vendor prefix detection
const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition || null);

const hasSpeechRecognition = Boolean(SpeechRecognitionAPI);

export function useVoice() {
  // ── Feature flags ──────────────────────────────────────────────
  const [canSpeak] = useState(hasSpeechSynthesis);
  const [canListen] = useState(hasSpeechRecognition);

  // ── State ──────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(''); // current recognition transcript
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastSpoken, setLastSpoken] = useState('');
  const [error, setError] = useState(null);

  // ── Refs ───────────────────────────────────────────────────────
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const speakQueueRef = useRef([]); // { text, priority } items, higher priority = spoken first
  const isProcessingQueueRef = useRef(false);
  const onResultRef = useRef(null); // callback for recognized speech
  const lastSpokenRef = useRef(''); // for repeat command

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopListening();
      if (hasSpeechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Pre-load and cache preferred voice ─────────────────────────
  const cachedVoiceRef = useRef(null);

  const getBestVoice = useCallback(() => {
    if (cachedVoiceRef.current) return cachedVoiceRef.current;
    if (!hasSpeechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    const preferred = voices.find(v =>
      (v.lang === 'en-US' || v.lang === 'en-GB') &&
      (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Enhanced') || v.name.includes('Premium'))
    ) || voices.find(v =>
      (v.lang === 'en-US' || v.lang === 'en-GB') &&
      (v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Daniel') || v.name.includes('Guy') || v.name.includes('Aria') || v.name.includes('Zira'))
    ) || voices.find(v => v.lang.startsWith('en'));
    cachedVoiceRef.current = preferred || voices[0] || null;
    return cachedVoiceRef.current;
  }, [hasSpeechSynthesis]);

  useEffect(() => {
    if (hasSpeechSynthesis) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        cachedVoiceRef.current = null;
        getBestVoice();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      };
    }
  }, [hasSpeechSynthesis, getBestVoice]);

  // ── Internal: process speak queue ──────────────────────────────
  const _processQueue = useCallback(() => {
    if (isProcessingQueueRef.current || speakQueueRef.current.length === 0 || isMuted) {
      return;
    }

    if (!hasSpeechSynthesis) return;

    // Immediately wake up audio pipeline
    try {
      window.speechSynthesis.resume();
    } catch (e) {}

    // Highest priority first
    speakQueueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const { text } = speakQueueRef.current.shift();

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);
    setLastSpoken(text);
    lastSpokenRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.12; // Crisp, responsive, natural assistant rate (15% faster)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    const preferredVoice = getBestVoice();
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      // Process next in queue instantly
      setTimeout(_processQueue, 10);
    };

    utterance.onerror = (e) => {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      setTimeout(_processQueue, 10);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Chrome Windows kickstart: calling resume immediately after speak prevents idle pause
    try {
      window.speechSynthesis.resume();
    } catch (e) {}
  }, [isMuted, hasSpeechSynthesis, getBestVoice]);

  // Re-process queue when mute changes
  useEffect(() => {
    if (!isMuted) {
      _processQueue();
    }
  }, [isMuted, _processQueue]);

  // ── Public: speak ───────────────────────────────────────────────
  /**
   * Enqueue text for speech synthesis with zero-latency response.
   * By default, interrupts lingering speech so user gets instant audio.
   * @param {string} text
   * @param {Object} options
   * @param {number} options.priority - 0=normal, 1=important, 2=security alert
   * @param {boolean} options.interruptCurrent - Cancel current speech and speak immediately
   */
  const speak = useCallback((text, options = {}) => {
    if (!text || !hasSpeechSynthesis) return;
    if (isMuted) {
      setLastSpoken(text);
      lastSpokenRef.current = text;
      return;
    }

    const { priority = 0, interruptCurrent = true } = options;

    // Immediately wake up the speech engine
    try {
      window.speechSynthesis.resume();
    } catch (e) {}

    // Interrupt lingering speech immediately so new events or clicks speak without delay
    if (interruptCurrent !== false) {
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (e) {}
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      speakQueueRef.current = [{ text, priority }];
    } else {
      speakQueueRef.current.push({ text, priority });
    }

    _processQueue();
  }, [isMuted, _processQueue]);

  // ── Public: stop speaking ───────────────────────────────────────
  const stopSpeaking = useCallback(() => {
    if (hasSpeechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speakQueueRef.current = [];
    isProcessingQueueRef.current = false;
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  // ── Public: repeat last utterance ──────────────────────────────
  const repeatLast = useCallback(() => {
    if (lastSpokenRef.current) {
      stopSpeaking();
      setTimeout(() => speak(lastSpokenRef.current, { priority: 1 }), 200);
    }
  }, [speak, stopSpeaking]);

  // ── Public: mute toggle ─────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        // Muting: stop current speech
        if (hasSpeechSynthesis) window.speechSynthesis.cancel();
        isProcessingQueueRef.current = false;
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  // ── Public: start listening ─────────────────────────────────────
  /**
   * Start speech recognition. Only call after explicit user gesture.
   * @param {Function} onResult - Called with (transcript: string)
   */
  const startListening = useCallback((onResult) => {
    if (!hasSpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) return;

    setError(null);
    setTranscript('');
    onResultRef.current = onResult;

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionDenied(false);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        setTranscript(finalTranscript || interimTranscript);
        if (finalTranscript && onResultRef.current) {
          onResultRef.current(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setPermissionDenied(true);
          setError('Microphone access was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setError(null); // No speech is not an error — just user was quiet
        } else if (event.error === 'network') {
          setError('Speech recognition requires an internet connection. Please check your network.');
        } else if (event.error === 'aborted') {
          setError(null); // User cancelled — that's fine
        } else {
          setError(`Recognition error: ${event.error}. Please try again.`);
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        // Do NOT auto-restart — user must click again
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  }, [isListening]);

  // ── Public: stop listening ──────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    // Feature flags
    canSpeak,
    canListen,

    // State
    isMuted,
    isSpeaking,
    isListening,
    transcript,
    permissionDenied,
    lastSpoken,
    error,

    // Actions
    speak,
    stopSpeaking,
    repeatLast,
    toggleMute,
    startListening,
    stopListening,
    clearError: () => setError(null),
    clearTranscript: () => setTranscript(''),
  };
}

export { hasSpeechSynthesis, hasSpeechRecognition };
export default useVoice;
