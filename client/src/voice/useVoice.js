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
  const pendingSpeechRef = useRef(null); // { text, options } for autoplay recovery on user gesture
  const hasStartedSpeakingRef = useRef(false);
  const lastRecognizedTranscriptRef = useRef('');
  const hasDispatchedResultRef = useRef(false);

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
    } catch (e) { }

    // Highest priority first
    speakQueueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const { text } = speakQueueRef.current.shift();

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);
    setLastSpoken(text);
    lastSpokenRef.current = text;
    hasStartedSpeakingRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.12; // Crisp, responsive, natural assistant rate (15% faster)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    const preferredVoice = getBestVoice();
    if (preferredVoice) utterance.voice = preferredVoice;

    let watchdogTimer = null;

    utterance.onstart = () => {
      hasStartedSpeakingRef.current = true;
      pendingSpeechRef.current = null;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      // Process next in queue instantly
      setTimeout(_processQueue, 10);
    };

    utterance.onerror = (e) => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
      // If blocked by browser autoplay policy, keep in pendingSpeechRef for user gesture
      if (e?.error === 'not-allowed') {
        hasStartedSpeakingRef.current = false;
      } else {
        pendingSpeechRef.current = null;
      }
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      setTimeout(_processQueue, 10);
    };

    // Watchdog: If browser pauses or drops speech without firing callbacks (e.g. autoplay restriction), unstick queue
    watchdogTimer = setTimeout(() => {
      if (!hasStartedSpeakingRef.current && isProcessingQueueRef.current) {
        try {
          window.speechSynthesis.resume();
        } catch (e) { }
        isProcessingQueueRef.current = false;
        setIsSpeaking(false);
      }
    }, 1200);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Chrome Windows kickstart: calling resume immediately after speak prevents idle pause
    try {
      window.speechSynthesis.resume();
    } catch (e) { }
  }, [isMuted, hasSpeechSynthesis, getBestVoice]);

  // Re-process queue when mute changes
  useEffect(() => {
    if (!isMuted) {
      _processQueue();
    }
  }, [isMuted, _processQueue]);

  // ── Public: speak ───────────────────────────────────────────────
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

    // Deduplication: prevent identical speech from repeating immediately
    if (lastSpokenRef.current === text && (isSpeaking || isProcessingQueueRef.current)) {
      return;
    }

    const { priority = 0, interruptCurrent = true } = options;
    hasStartedSpeakingRef.current = false;

    // Immediately wake up the speech engine
    try {
      window.speechSynthesis.resume();
    } catch (e) { }

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
      } catch (e) { }
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      speakQueueRef.current = [{ text, priority }];
    } else {
      speakQueueRef.current.push({ text, priority });
    }

    _processQueue();
  }, [isMuted, _processQueue, isSpeaking]);

  // ── Global User Interaction Listener (Autoplay Recovery) ───────
  // Modern browsers block speech/audio autoplay upon cross-origin redirects (e.g. from PayPal).
  // This listener resumes speech synthesis on user interaction (click/touch/key)
  // and only plays if speech was explicitly delayed by browser autoplay policy.
  useEffect(() => {
    if (!hasSpeechSynthesis) return;

    const handleUserInteraction = () => {
      try {
        window.speechSynthesis.resume();
      } catch (e) { }

      if (pendingSpeechRef.current) {
        const pending = pendingSpeechRef.current;
        pendingSpeechRef.current = null;
        speak(pending.text, { ...pending.options, interruptCurrent: true });
      }
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [hasSpeechSynthesis, speak]);

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
  const silenceTimerRef = useRef(null);
  const maxListenTimerRef = useRef(null);
  const isListeningActiveRef = useRef(false);

  const _cleanupTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxListenTimerRef.current) {
      clearTimeout(maxListenTimerRef.current);
      maxListenTimerRef.current = null;
    }
  }, []);

  // ── Public: stop listening ──────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningActiveRef.current = false;
    _cleanupTimers();

    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      const fallbackText = lastRecognizedTranscriptRef.current;
      if (!hasDispatchedResultRef.current && fallbackText && onResultRef.current) {
        hasDispatchedResultRef.current = true;
        onResultRef.current(fallbackText);
      }
      try {
        rec.onstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch (e) { }
    }
    setIsListening(false);
  }, [_cleanupTimers]);

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

    // Proactively verify / request microphone hardware permissions
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          // Immediately stop audio tracks to release microphone to SpeechRecognition API
          stream.getTracks().forEach(t => t.stop());
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionDenied(true);
            setError('Microphone access was denied. Please allow microphone permission in your browser address bar.');
          }
        });
    }

    // Immediately stop speech synthesis to avoid audio feedback into microphone
    if (hasSpeechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) { }
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
    }

    _cleanupTimers();

    // Cancel any previous recognition instance safely
    if (recognitionRef.current) {
      try {
        const oldRec = recognitionRef.current;
        recognitionRef.current = null;
        oldRec.onstart = null;
        oldRec.onresult = null;
        oldRec.onerror = null;
        oldRec.onend = null;
        oldRec.abort();
      } catch (e) { }
    }

    setError(null);
    setTranscript('');
    lastRecognizedTranscriptRef.current = '';
    hasDispatchedResultRef.current = false;
    onResultRef.current = onResult;
    isListeningActiveRef.current = true;

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const triggerDispatch = (recognizedText) => {
        isListeningActiveRef.current = false;
        _cleanupTimers();
        const textToDispatch = (recognizedText || lastRecognizedTranscriptRef.current).trim();
        if (textToDispatch && !hasDispatchedResultRef.current) {
          hasDispatchedResultRef.current = true;
          if (recognitionRef.current) {
            try {
              recognitionRef.current.onstart = null;
              recognitionRef.current.onresult = null;
              recognitionRef.current.onerror = null;
              recognitionRef.current.onend = null;
              recognitionRef.current.stop();
            } catch (e) { }
            recognitionRef.current = null;
          }
          setIsListening(false);
          if (onResultRef.current) {
            onResultRef.current(textToDispatch);
          }
        }
      };

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionDenied(false);

        // Maximum 14 seconds per voice interaction if user remains completely silent
        maxListenTimerRef.current = setTimeout(() => {
          if (!hasDispatchedResultRef.current) {
            const text = lastRecognizedTranscriptRef.current;
            if (text) {
              triggerDispatch(text);
            } else {
              stopListening();
            }
          }
        }, 14000);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combined = (finalTranscript + interimTranscript).trim().replace(/\s+/g, ' ');
        if (combined) {
          lastRecognizedTranscriptRef.current = combined;
          setTranscript(combined);

          // Reset silence debounce timer: 1400ms after user pauses speaking, auto-submit
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            triggerDispatch(combined);
          }, 1400);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setPermissionDenied(true);
          setError('Microphone access was denied. Please allow microphone permission in your browser address bar.');
          isListeningActiveRef.current = false;
          setIsListening(false);
          recognitionRef.current = null;
        } else if (event.error === 'no-speech') {
          // If no speech captured yet, keep listening session alive
        } else if (event.error === 'network') {
          setError('Speech recognition requires an internet connection. Please check your network.');
          isListeningActiveRef.current = false;
          setIsListening(false);
          recognitionRef.current = null;
        } else if (event.error === 'aborted') {
          // Intentionally aborted
        } else {
          setError(`Recognition error: ${event.error}. Please try again.`);
          isListeningActiveRef.current = false;
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onend = () => {
        // If Chrome stopped on 'no-speech' but user is still actively listening (hasn't spoken yet and hasn't cancelled)
        if (isListeningActiveRef.current && !hasDispatchedResultRef.current && !lastRecognizedTranscriptRef.current) {
          try {
            recognition.start();
            return;
          } catch (e) { }
        }

        const fallbackText = lastRecognizedTranscriptRef.current;
        if (!hasDispatchedResultRef.current && fallbackText) {
          triggerDispatch(fallbackText);
        } else {
          setIsListening(false);
          isListeningActiveRef.current = false;
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Failed to start speech recognition. Please try again.');
      isListeningActiveRef.current = false;
      setIsListening(false);
    }
  }, [hasSpeechSynthesis, _cleanupTimers, stopListening]);

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
