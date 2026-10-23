/**
 * Voice Commands Router — SpendMesh AI
 *
 * Maps recognized speech (or typed text) to actions.
 *
 * Safety rules:
 * - Read-only queries and navigation: handled immediately
 * - Consequential actions (reset, approval, checkout): ALWAYS require
 *   the normal backend authorization flow. Voice is never authorization.
 * - Ambiguous commands: ask for clarification instead of guessing.
 */

import { answerScripts } from './voiceScripts';

// Navigation path mapping
const NAVIGATION_MAP = {
  'dashboard': '/',
  'overview': '/',
  'home': '/',
  'purchase requests': '/requests',
  'purchase': '/requests',
  'requests': '/requests',
  'marketplace': '/marketplace',
  'agent marketplace': '/agents',
  'agents': '/agents',
  'transactions': '/transactions',
  'transaction ledger': '/transactions',
  'policy': '/policy',
  'policy center': '/policy',
  'audit': '/audit',
  'audit log': '/audit',
  'audit logs': '/audit',
  'approvals': '/approvals',
  'approval center': '/approvals',
  'approval queue': '/approvals',
};

/**
 * Matches a spoken command to the best navigation target.
 * Returns null if no navigation intent is detected.
 */
function matchNavigation(normalized) {
  // "show me the audit log", "go to approvals", "take me to policy"
  const navPhrases = ['show me', 'go to', 'take me to', 'navigate to', 'open', 'show'];
  for (const phrase of navPhrases) {
    if (normalized.startsWith(phrase)) {
      const target = normalized.slice(phrase.length).trim();
      if (NAVIGATION_MAP[target]) return NAVIGATION_MAP[target];
      // Fuzzy: check if any key is contained
      for (const [key, path] of Object.entries(NAVIGATION_MAP)) {
        if (target.includes(key)) return path;
      }
    }
  }
  // Plain "audit log", "approvals", etc.
  if (NAVIGATION_MAP[normalized]) return NAVIGATION_MAP[normalized];
  return null;
}

/**
 * Process a voice command or typed query.
 *
 * @param {string} rawInput - Raw spoken or typed text
 * @param {Object} context - Current application context
 * @param {Object} context.navigate - React Router navigate function
 * @param {string} context.currentPath - Current URL path
 * @param {number} context.stage - Marketplace workflow stage (1-5)
 * @param {Object} context.policy - Current policy data
 * @param {Object} context.policyResult - Last policy check result
 * @param {Object} context.captureData - Last payment capture result
 * @param {Object} context.currentDeal - Currently selected deal
 * @param {Object} context.recommendation - AI recommendation
 * @param {number} context.pendingApprovals - Pending approvals count
 * @param {Object} context.lastEvent - Last voice event
 *
 * @returns {{ response: string, navigated: boolean }}
 */
export function processCommand(rawInput, context = {}) {
  if (!rawInput || !rawInput.trim()) {
    return { response: `I didn't catch anything. Please try speaking again or type your question.`, navigated: false };
  }

  const normalized = rawInput.trim().toLowerCase()
    .replace(/[?!.,]/g, '')
    .replace(/\s+/g, ' ');

  const { navigate, currentPath, stage, policy, policyResult, captureData, currentDeal, recommendation, pendingApprovals, approvedDeals, lastEvent } = context;

  // ── 1. Navigation commands ──────────────────────────────────────
  const navTarget = matchNavigation(normalized);
  if (navTarget && navigate) {
    navigate(navTarget);
    return {
      response: `Navigating to ${navTarget}.`,
      navigated: true,
      path: navTarget,
    };
  }

  // ── 2. Stop / mute controls (handled externally via UI, but confirm) ──
  if (normalized === 'stop' || normalized === 'stop speaking' || normalized === 'be quiet') {
    return { response: '__STOP__', navigated: false };
  }

  if (normalized === 'mute' || normalized === 'mute narration' || normalized === 'silence') {
    return { response: '__MUTE__', navigated: false };
  }

  if (normalized === 'unmute' || normalized === 'unmute narration' || normalized === 'resume narration') {
    return { response: '__UNMUTE__', navigated: false };
  }

  if (normalized === 'repeat' || normalized === 'repeat that' || normalized === 'say that again') {
    return { response: '__REPEAT__', navigated: false };
  }

  // ── 2b. Greetings & Pleasantries ───────────────────────────────
  if (
    normalized === 'hi' ||
    normalized === 'hello' ||
    normalized === 'hey' ||
    normalized === 'hey there' ||
    normalized === 'hello there' ||
    normalized === 'hi there' ||
    normalized.startsWith('hi ') ||
    normalized.startsWith('hello ') ||
    normalized.startsWith('hey ') ||
    normalized.includes('good morning') ||
    normalized.includes('good afternoon') ||
    normalized.includes('good evening') ||
    normalized === 'greetings' ||
    normalized === 'hola'
  ) {
    return { response: answerScripts.GREETING(), navigated: false };
  }

  if (
    normalized.includes('how are you') ||
    normalized.includes('how are you doing') ||
    normalized.includes('how are things') ||
    normalized.includes('hows it going') ||
    normalized.includes("how's it going")
  ) {
    return { response: answerScripts.HOW_ARE_YOU(), navigated: false };
  }

  if (
    normalized === 'thanks' ||
    normalized === 'thank you' ||
    normalized === 'thx' ||
    normalized.startsWith('thank you') ||
    normalized.startsWith('thanks')
  ) {
    return { response: answerScripts.THANK_YOU(), navigated: false };
  }

  // ── 3. What is SpendMesh / About ────────────────────────────────
  if (
    normalized.includes('what is spendmesh') ||
    normalized.includes('what does spendmesh do') ||
    normalized.includes('explain spendmesh') ||
    normalized.includes('what are you') ||
    normalized.includes('tell me about spendmesh')
  ) {
    return { response: answerScripts.WHAT_IS_SPENDMESH(), navigated: false };
  }

  // ── 4. How does PayPal work ─────────────────────────────────────
  if (
    normalized.includes('paypal') &&
    (normalized.includes('how') || normalized.includes('work') || normalized.includes('explain'))
  ) {
    return { response: answerScripts.HOW_PAYPAL_WORKS(), navigated: false };
  }

  // ── 5. What is Gemini doing ─────────────────────────────────────
  if (
    normalized.includes('gemini') ||
    (normalized.includes('ai') && normalized.includes('doing'))
  ) {
    return { response: answerScripts.WHAT_IS_GEMINI_DOING({ stage }), navigated: false };
  }

  // ── 6. Explain policy ───────────────────────────────────────────
  if (
    normalized.includes('explain') && normalized.includes('policy') ||
    normalized.includes('policy check') ||
    normalized.includes('how does policy work') ||
    normalized.includes('what are the rules')
  ) {
    return { response: answerScripts.EXPLAIN_POLICY({ policyResult, policy }), navigated: false };
  }

  // ── 7. Why approval required ────────────────────────────────────
  if (
    normalized.includes('why') && normalized.includes('approv') ||
    normalized.includes('why do i need approval') ||
    normalized.includes('manual approval')
  ) {
    return { response: answerScripts.WHY_APPROVAL_REQUIRED({ deal: currentDeal, policy }), navigated: false };
  }

  // ── 7b. How do I pay after approval / approved deal checkout ─────
  if (
    normalized.includes('how do i pay') ||
    normalized.includes('how to pay') ||
    normalized.includes('pay after approval') ||
    normalized.includes('pay approved') ||
    normalized.includes('what happens after approval') ||
    normalized.includes('what to do after approval') ||
    normalized.includes('approved deal') ||
    normalized.includes('can i pay now') ||
    normalized.includes('proceed to checkout') ||
    normalized.includes('pay now')
  ) {
    return { response: answerScripts.HOW_TO_PAY_AFTER_APPROVAL(), navigated: false };
  }

  // ── 8. Why checkout blocked ─────────────────────────────────────
  if (
    normalized.includes('why') && (normalized.includes('blocked') || normalized.includes('rejected')) ||
    normalized.includes('why was checkout') ||
    normalized.includes('why cant i checkout')
  ) {
    return { response: answerScripts.WHY_CHECKOUT_BLOCKED({ deal: currentDeal }), navigated: false };
  }

  // ── 9. Was payment captured / is payment done ───────────────────
  if (
    normalized.includes('payment') ||
    normalized.includes('paid') ||
    normalized.includes('checkout') ||
    normalized.includes('transaction')
  ) {
    if (
      normalized.includes('done') ||
      normalized.includes('complete') ||
      normalized.includes('captured') ||
      normalized.includes('verified') ||
      normalized.includes('settled') ||
      normalized.includes('status') ||
      normalized.includes('succeed') ||
      normalized.includes('success') ||
      normalized.includes('through') ||
      normalized.includes('finish') ||
      normalized.includes('paid') ||
      normalized.includes('confirm') ||
      normalized.includes('was the payment') ||
      normalized.includes('is the payment') ||
      normalized.includes('did the payment') ||
      normalized.includes('has the payment')
    ) {
      return { response: answerScripts.WAS_PAYMENT_CAPTURED({ captureData, currentPath, lastEvent }), navigated: false };
    }
  }

  // ── 10. How SpendMesh protects ──────────────────────────────────
  if (
    normalized.includes('protect') ||
    normalized.includes('security') ||
    normalized.includes('how does spendmesh') ||
    normalized.includes('guardrail')
  ) {
    return { response: answerScripts.HOW_SPENDMESH_PROTECTS(), navigated: false };
  }

  // ── 11. What should I do next ───────────────────────────────────
  if (
    normalized.includes('what should i do') ||
    normalized.includes('next step') ||
    normalized.includes('what do i do') ||
    normalized.includes('what next') ||
    normalized.includes('guide me')
  ) {
    return { response: answerScripts.WHAT_SHOULD_I_DO_NEXT({ stage, policyResult, captureData, pendingApprovals, approvedDeals }), navigated: false };
  }

  // ── 12. Explain audit ───────────────────────────────────────────
  if (
    normalized.includes('audit') ||
    normalized.includes('explain') && normalized.includes('log') ||
    normalized.includes('what is the audit')
  ) {
    return { response: answerScripts.EXPLAIN_AUDIT(), navigated: false };
  }

  // ── 13. Explain current offer ───────────────────────────────────
  if (
    normalized.includes('explain') && (normalized.includes('offer') || normalized.includes('deal')) ||
    normalized.includes('tell me about this offer') ||
    normalized.includes('what is this offer')
  ) {
    return { response: answerScripts.EXPLAIN_OFFER({ offer: currentDeal, recommendation }), navigated: false };
  }

  // ── 14. Check budget / Treasury balance ─────────────────────────
  if (
    normalized.includes('treasury') ||
    normalized.includes('balance') ||
    normalized.includes('funds') ||
    normalized.includes('money') ||
    normalized.includes('budget') ||
    normalized.includes('how much') && (normalized.includes('left') || normalized.includes('remaining') || normalized.includes('available')) ||
    normalized.includes('check my balance')
  ) {
    return { response: answerScripts.CHECK_TREASURY_BALANCE({ policy }), navigated: false };
  }

  // ── 14b. Pending Approvals & Approval Workflow ──────────────────
  if (
    normalized.includes('how many approval') ||
    normalized.includes('pending approval') ||
    normalized.includes('approval count') ||
    normalized.includes('approval queue') ||
    normalized.includes('pending count') ||
    normalized === 'pending approvals' ||
    normalized === 'approvals' ||
    normalized === 'pending'
  ) {
    return { response: answerScripts.PENDING_APPROVALS_COUNT({ pendingApprovals, approvedDeals }), navigated: false };
  }

  if (
    normalized.includes('how do approval') ||
    normalized.includes('explain approval') ||
    normalized.includes('approval process') ||
    normalized.includes('approval rule') ||
    normalized.includes('approval policy')
  ) {
    return {
      response: `Deals over your $${policy?.autoApproveLimit ?? 1000} auto-approve limit require executive sign-off in the Approvals queue before funds can be settled via PayPal.`,
      navigated: false
    };
  }

  // ── 14c. Explain Current Page / Screen Perspective ─────────────
  if (
    normalized.includes('what page') ||
    normalized.includes('where am i') ||
    normalized.includes('explain this page') ||
    normalized.includes('explain page') ||
    normalized.includes('what is this page') ||
    normalized.includes('what can i do here') ||
    normalized.includes('about this page') ||
    normalized.includes('about this screen') ||
    normalized.includes('explain screen')
  ) {
    return { response: answerScripts.EXPLAIN_PAGE({ currentPath }), navigated: false };
  }

  // ── 14d. Explain PayPal Escrow ──────────────────────────────────
  if (
    normalized.includes('escrow') ||
    normalized.includes('paypal escrow') ||
    normalized === 'explain paypal escrow'
  ) {
    return { response: answerScripts.EXPLAIN_PAYPAL_ESCROW(), navigated: false };
  }

  // ── 14d. Summarize Today's Spend ────────────────────────────────
  if (
    normalized.includes('summarize today') ||
    normalized.includes('summarize spend') ||
    normalized.includes('today\'s spend') ||
    normalized.includes('todays spend') ||
    normalized.includes('spent') ||
    normalized.includes('spending')
  ) {
    return { response: answerScripts.SUMMARIZE_TODAYS_SPEND({ policy, deals: context.deals }), navigated: false };
  }

  // ── 15. What is happening / recent events ──────────────────────
  if (
    normalized.includes('what is happening') ||
    normalized.includes('what happened') ||
    normalized.includes('recent event') ||
    normalized.includes('what is going on')
  ) {
    return { response: answerScripts.WHAT_HAPPENED({ lastEvent }), navigated: false };
  }

  // ── 16. Reset (read-only — explain they must use the UI button) ─
  if (
    normalized.includes('reset') ||
    normalized.includes('start over') ||
    normalized.includes('clear demo') ||
    normalized.includes('reset demo')
  ) {
    return { response: answerScripts.RESET_CONFIRMATION(), navigated: false };
  }

  // ── 17. Help ────────────────────────────────────────────────────
  if (
    normalized === 'help' ||
    normalized.includes('what can you do') ||
    normalized.includes('what commands') ||
    normalized.includes('how do i use')
  ) {
    return {
      response: `I can answer questions about SpendMesh, explain policy decisions, ` +
        `describe what Gemini or PayPal is doing, tell you what to do next, ` +
        `and navigate to any page. ` +
        `Try asking: "What should I do next?", "Explain this policy check", ` +
        `"How does PayPal work here?", or "Show me the audit log."`,
      navigated: false,
    };
  }

  // ── 18. Fallback (routes to Gemini generative intelligence) ───────
  return {
    response: answerScripts.UNSUPPORTED({ command: rawInput }),
    navigated: false,
    isFallback: true
  };
}

export default processCommand;
