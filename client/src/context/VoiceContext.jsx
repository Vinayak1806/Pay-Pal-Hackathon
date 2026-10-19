/**
 * VoiceContext — SpendMesh AI
 *
 * Provides app-level voice assistant state to all components.
 * Pages use the useVoiceContext hook to:
 *   1. Read current voice state (isMuted, isSpeaking, etc.)
 *   2. Emit voice events (emitVoiceEvent)
 *   3. Pass current context (stage, policy, deal, etc.) to the command router
 *
 * This keeps voice concern separate from page logic.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { policyService, dealService } from '../services/api';

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  // Shared app context that the voice assistant uses for answers
  const [voiceAppContext, setVoiceAppContext] = useState({
    stage: 1,
    currentPath: '/',
    policy: null,
    policyResult: null,
    currentDeal: null,
    deals: [],
    captureData: null,
    recommendation: null,
    pendingApprovals: 0,
    approvedDeals: 0,
    lastEvent: null,
  });

  // Is the assistant panel open?
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Initial load of policy and deals to ensure assistant knows live balances
  useEffect(() => {
    Promise.all([
      policyService.getPolicy().catch(() => null),
      dealService.getDeals().catch(() => null)
    ]).then(([policyRes, dealsRes]) => {
      const policy = policyRes?.data?.policy;
      const deals = dealsRes?.data?.deals || [];
      const pendingApprovals = deals.filter(d => d.status === 'pending_approval').length;
      const approvedDeals = deals.filter(d => d.status === 'approved').length;
      setVoiceAppContext(prev => ({
        ...prev,
        policy: policy || prev.policy,
        deals,
        pendingApprovals,
        approvedDeals
      }));
    });
  }, []);

  // Track the last security event text for repeat command
  const lastSecurityEventRef = useRef(null);

  /**
   * Update one or more fields in the shared voice context.
   * Pages call this after meaningful state changes.
   */
  const updateVoiceContext = useCallback((updates) => {
    setVoiceAppContext(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Emit a voice event via the event bus.
   * The VoiceAssistant component subscribes to these and narrates them.
   */
  const emitVoiceEvent = useCallback((eventType, payload = {}, options = {}) => {
    voiceEventBus.emit(eventType, payload, options);
    // Also update lastEvent in context
    if (payload) {
      setVoiceAppContext(prev => ({
        ...prev,
        lastEvent: { type: eventType, ...payload },
      }));
    }
  }, []);

  const openAssistant = useCallback(() => setAssistantOpen(true), []);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);
  const toggleAssistant = useCallback(() => setAssistantOpen(prev => !prev), []);

  return (
    <VoiceContext.Provider value={{
      voiceAppContext,
      updateVoiceContext,
      emitVoiceEvent,
      assistantOpen,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      isSpeaking,
      setIsSpeaking,
      isListening,
      setIsListening,
      VoiceEvents,
      lastSecurityEventRef,
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

/**
 * Hook to access voice context from any component.
 * Returns null-safe defaults so pages work even if not wrapped in VoiceProvider.
 */
export function useVoiceContext() {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    // Graceful fallback — voice features disabled if context missing
    return {
      voiceAppContext: {},
      updateVoiceContext: () => {},
      emitVoiceEvent: () => {},
      assistantOpen: false,
      openAssistant: () => {},
      closeAssistant: () => {},
      toggleAssistant: () => {},
      VoiceEvents,
      lastSecurityEventRef: { current: null },
    };
  }
  return ctx;
}

export default VoiceContext;
