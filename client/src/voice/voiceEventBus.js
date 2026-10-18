/**
 * Voice Event Bus — SpendMesh AI
 *
 * A lightweight singleton event emitter that decouples page-level application
 * events from the voice assistant. Pages emit events; the voice assistant
 * subscribes and narrates them WITHOUT polling or re-render coupling.
 *
 * This never modifies financial state. It is read-only observation.
 */

// Event type constants — single source of truth
export const VoiceEvents = {
  // Workflow milestones
  WELCOME:            'WELCOME',
  REQUEST_PARSING:    'REQUEST_PARSING',
  PARSE_COMPLETE:     'PARSE_COMPLETE',
  OFFERS_LOADED:      'OFFERS_LOADED',
  POLICY_PASSED:      'POLICY_PASSED',
  POLICY_BLOCKED:     'POLICY_BLOCKED',
  APPROVAL_REQUIRED:  'APPROVAL_REQUIRED',
  APPROVAL_GRANTED:   'APPROVAL_GRANTED',
  APPROVAL_REJECTED:  'APPROVAL_REJECTED',
  CHECKOUT_READY:     'CHECKOUT_READY',
  CHECKOUT_INITIATED: 'CHECKOUT_INITIATED',
  CAPTURE_VERIFIED:   'CAPTURE_VERIFIED',
  CAPTURE_FAILED:     'CAPTURE_FAILED',

  // Security events
  TAMPER_BLOCKED:     'TAMPER_BLOCKED',
  DUPLICATE_BLOCKED:  'DUPLICATE_BLOCKED',
  BUDGET_EXCEEDED:    'BUDGET_EXCEEDED',

  // Navigation
  PAGE_CHANGED:       'PAGE_CHANGED',

  // Audit
  LEDGER_VERIFIED:    'LEDGER_VERIFIED',
};

// Track recently announced events to prevent duplicate narration
const _recentEvents = new Map(); // eventType -> timestamp
const DEDUP_WINDOW_MS = 5000; // 5 second dedup window

class VoiceEventBus {
  constructor() {
    this._listeners = new Map(); // eventType -> Set<handler>
  }

  /**
   * Subscribe to an event type.
   * @param {string} eventType - One of VoiceEvents.*
   * @param {Function} handler - Called with (payload) when event fires
   * @returns {Function} Unsubscribe function
   */
  on(eventType, handler) {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType).add(handler);

    // Return unsubscribe function for useEffect cleanup
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe a handler from an event type.
   */
  off(eventType, handler) {
    this._listeners.get(eventType)?.delete(handler);
  }

  /**
   * Emit an event, with automatic deduplication within DEDUP_WINDOW_MS.
   * @param {string} eventType - One of VoiceEvents.*
   * @param {Object} payload - Context data (dealId, amount, reason, etc.)
   * @param {Object} options
   * @param {boolean} options.force - Skip dedup check (for security alerts)
   */
  emit(eventType, payload = {}, options = {}) {
    const now = Date.now();
    const lastEmit = _recentEvents.get(eventType);

    // Dedup: skip if same event fired recently (unless forced)
    if (!options.force && lastEmit && (now - lastEmit) < DEDUP_WINDOW_MS) {
      return;
    }

    _recentEvents.set(eventType, now);

    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    const handlers = this._listeners.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[VoiceEventBus] Handler error for ${eventType}:`, err);
        }
      });
    }
  }

  /**
   * Clear all listeners (for cleanup in tests).
   */
  clear() {
    this._listeners.clear();
    _recentEvents.clear();
  }
}

// Singleton export
export const voiceEventBus = new VoiceEventBus();
export default voiceEventBus;

