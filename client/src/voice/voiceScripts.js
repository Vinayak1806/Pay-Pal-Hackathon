/**
 * Voice Scripts — SpendMesh AI
 *
 * Pre-written, context-aware narration scripts for every meaningful
 * application state and security event. Using predefined scripts
 * avoids live AI API calls for explanations and ensures accuracy.
 *
 * Each script is a function that receives context and returns a string.
 * All scripts are honest about the demo environment.
 */

// ─── Narration Scripts ───────────────────────────────────────────

export const narrationScripts = {

  WELCOME: () =>
    `Welcome to SpendMesh AI. I'll guide your spending policy and PayPal transactions.`,

  REQUEST_PARSING: () =>
    `Analyzing request and compiling requirements.`,

  PARSE_COMPLETE: ({ serviceType, budget } = {}) =>
    `Parsed: ${serviceType || 'Service'} under $${budget || 0}. Ready for bids.`,

  OFFERS_LOADED: ({ count } = {}) =>
    `${count || 'Several'} agent bids ready for review.`,

  POLICY_PASSED: ({ amount } = {}) =>
    `Policy approved for $${amount || ''}. Ready for PayPal checkout.`,

  POLICY_BLOCKED: ({ reason, message } = {}) =>
    `Blocked by policy: ${message || reason || 'Exceeds spending limit'}.`,

  APPROVAL_REQUIRED: ({ amount, limit } = {}) =>
    `Approval required: $${amount || ''} exceeds your $${limit || ''} auto-limit.`,

  APPROVAL_GRANTED: ({ amount } = {}) =>
    `Deal authorized for $${amount || ''}. Ready for checkout.`,

  APPROVAL_REJECTED: () =>
    `Deal rejected. Budget reservation released.`,

  CHECKOUT_READY: ({ amount } = {}) =>
    `Authorized for PayPal checkout: $${amount || ''}.`,

  CHECKOUT_INITIATED: () =>
    `Redirecting to PayPal Sandbox.`,

  CAPTURE_VERIFIED: ({ amount } = {}) =>
    `Payment of $${amount || ''} settled. Deliverable unlocked.`,

  CAPTURE_FAILED: () =>
    `PayPal capture incomplete. No funds settled.`,

  TAMPER_BLOCKED: ({ storedAmount } = {}) =>
    `Security alert: Price tampering blocked. Enforcing verified price of $${storedAmount || ''}.`,

  DUPLICATE_BLOCKED: () =>
    `Security alert: Duplicate payment blocked.`,

  BUDGET_EXCEEDED: ({ available } = {}) =>
    `Budget exceeded. Available treasury: $${available || 0}.`,

  LEDGER_VERIFIED: () =>
    `Audit ledger verified tamper-free.`,

  PAGE_CHANGED: ({ page } = {}) => {
    const descriptions = {
      '/':            'Overview dashboard.',
      '/requests':    'Purchase Requests.',
      '/marketplace': 'Purchase Requests.',
      '/agents':      'Agent Marketplace.',
      '/transactions': 'Transactions ledger.',
      '/dashboard':   'Transactions ledger.',
      '/policy':      'Spending Policy Center.',
      '/audit':       'Audit Log.',
      '/approvals':   'Approvals queue.',
    };
    return descriptions[page] || `Navigated to ${page}.`;
  },
};

// ─── Answer Scripts (for spoken/typed questions) ────────────────────

export const answerScripts = {

  WHAT_IS_SPENDMESH: () =>
    `SpendMesh AI enforces your spending policy on AI agents and processes verified payments through PayPal Sandbox.`,

  HOW_PAYPAL_WORKS: () =>
    `SpendMesh binds orders server-side to prevent price tampering, then captures payment through PayPal Orders v2 Sandbox.`,

  WHAT_IS_GEMINI_DOING: ({ stage } = {}) => {
    if (stage === 1) return `Gemini is ready to extract your requirements and budget ceiling.`;
    if (stage === 2) return `Gemini extracted your service category, budget limit, and scope.`;
    if (stage === 3) return `Gemini evaluated competing bids and recommended the best offer.`;
    return `Gemini 2.5 Flash analyzes procurement requests and compares offers server-side.`;
  },

  EXPLAIN_POLICY: ({ policyResult, policy } = {}) => {
    if (!policyResult) {
      return `SpendMesh validates price binding, whitelisted categories, budget capacity, anti-replay, and approval limits.`;
    }
    if (policyResult.requiresApproval) {
      return `Exceeds the $${policy?.autoApproveLimit ?? 1000} auto-approval ceiling. Quarantined for review.`;
    }
    if (policyResult.allowed) {
      return `Passed all 5 policy criteria. Approved for PayPal checkout.`;
    }
    return `Deal blocked: ${policyResult.message || 'Violated policy rules'}.`;
  },

  WHY_APPROVAL_REQUIRED: ({ deal, policy } = {}) =>
    `Requires approval because $${deal?.agreedAmount || ''} exceeds your $${policy?.autoApproveLimit ?? 1000} auto-approval limit.`,

  WHY_CHECKOUT_BLOCKED: ({ deal } = {}) =>
    deal?.blockedReason
      ? `Blocked: ${deal.blockedReason}.`
      : `Blocked by policy engine. Check the audit log for details.`,

  WAS_PAYMENT_CAPTURED: ({ captureData } = {}) => {
    if (!captureData) return `Payment status unknown or not yet initiated.`;
    if (captureData.captureStatus === 'COMPLETED') {
      return `Yes. $${captureData.amount || ''} was settled successfully in PayPal Sandbox.`;
    }
    return `Capture status: ${captureData.captureStatus || 'pending'}. Not settled.`;
  },

  HOW_SPENDMESH_PROTECTS: () =>
    `SpendMesh enforces server price binding, budget limits, approval gates, duplicate replay protection, and cryptographic audit hashing.`,

  HOW_TO_PAY_AFTER_APPROVAL: () =>
    `Open the Approvals page and click Proceed to PayPal Checkout on the authorized deal.`,

  WHAT_SHOULD_I_DO_NEXT: ({ stage, policyResult, captureData, pendingApprovals, approvedDeals } = {}) => {
    if (captureData?.captureStatus === 'COMPLETED') {
      return `Payment is verified. You can view the deliverable or start a new request.`;
    }
    if (approvedDeals > 0) {
      return `You have ${approvedDeals} authorized deal ready to pay in Approvals.`;
    }
    if (pendingApprovals > 0) {
      return `You have ${pendingApprovals} deal waiting for review in Approvals.`;
    }
    if (!stage || stage === 1) return `Enter a purchase request with a budget limit to begin.`;
    if (stage === 2) return `Review the extracted requirements, then click View Competing Bids.`;
    if (stage === 3) return `Select an offer to run the server policy check.`;
    if (stage === 4 && policyResult?.requiresApproval) {
      return `Deal requires manual authorization. Go to Approvals.`;
    }
    if (stage === 4 && policyResult?.allowed) {
      return `Policy passed. Click Proceed to Checkout for PayPal Sandbox.`;
    }
    if (stage === 5) {
      return `Click Pay with PayPal Sandbox to approve in test environment.`;
    }
    return `Ready for your next action.`;
  },

  EXPLAIN_AUDIT: () =>
    `The audit log stores an immutable SHA-256 Merkle chain of all financial events, policy decisions, and security blocks.`,

  EXPLAIN_OFFER: ({ offer, recommendation } = {}) => {
    if (!offer) return `Select an offer from the list to see details about pricing, delivery time, and why it was or wasn't recommended.`;
    return `${offer.sellerName || 'This seller'} is offering the service at $${offer.price} USD ` +
      `with delivery in ${offer.deliveryTime || 'the stated time'}. ` +
      (recommendation?.recommendedOfferId === offer.id
        ? `Gemini recommends this offer. ` + (recommendation.reasoning || '')
        : `This offer was not the top recommendation. ` + (recommendation?.reasoning || ''));
  },

  CHECK_BUDGET: ({ policy } = {}) => {
    if (!policy) return `Budget information is not available right now.`;
    const spent = policy.spentAmount || 0;
    const total = policy.totalBudget || 5000;
    const committed = policy.committedAmount || 0;
    const remaining = Math.max(0, total - spent - committed);
    return `Your total policy budget is $${total}. ` +
      `You have spent $${spent.toFixed(2)} and committed $${committed.toFixed(2)} to pending deals. ` +
      `Available balance: $${remaining.toFixed(2)}. ` +
      `Your automatic approval ceiling is $${policy.autoApproveLimit || 1000}.`;
  },

  WHAT_HAPPENED: ({ lastEvent } = {}) => {
    if (!lastEvent) return `No recent security or payment events have been recorded in this session.`;
    return `The most recent event was: ${lastEvent.type?.replace(/_/g, ' ').toLowerCase()}. ` +
      (lastEvent.explanation || '');
  },

  UNSUPPORTED: ({ command } = {}) =>
    command
      ? `I didn't understand "${command}". Try asking about the current status, explaining a policy check, or navigating to a page.`
      : `I didn't catch that. Please try again or type your question below.`,

  RESET_CONFIRMATION: () =>
    `To reset the demo environment, click the "Reset Demo Environment" button at the bottom of the sidebar. ` +
    `This will clear all test deals, payments, and audit logs, and restore the budget to $5,000. ` +
    `I cannot initiate a reset by voice — it requires your explicit click for safety.`,
};

// ─── Quick Action Sets Per Page ──────────────────────────────────

export const quickActionsForPage = {
  '/': [
    { label: 'What is SpendMesh AI?', command: 'what is spendmesh' },
    { label: 'Check my budget', command: 'check budget' },
    { label: 'What should I do next?', command: 'what should i do next' },
  ],
  '/requests': [
    { label: 'What should I do next?', command: 'what should i do next' },
    { label: 'How does Gemini work here?', command: 'what is gemini doing' },
    { label: 'Check my budget', command: 'check budget' },
  ],
  '/marketplace': [
    { label: 'What should I do next?', command: 'what should i do next' },
    { label: 'How does Gemini work here?', command: 'what is gemini doing' },
    { label: 'Check my budget', command: 'check budget' },
  ],
  '/approvals': [
    { label: 'How do I pay after approval?', command: 'how do i pay after approval' },
    { label: 'What should I do next?', command: 'what should i do next' },
    { label: 'Why is approval required?', command: 'why approval required' },
  ],
  '/audit': [
    { label: 'Explain the audit log', command: 'explain audit' },
    { label: 'How does SpendMesh protect me?', command: 'how does spendmesh protect me' },
    { label: 'What is happening now?', command: 'what happened' },
  ],
  '/policy': [
    { label: 'Check my budget', command: 'check budget' },
    { label: 'Explain this policy check', command: 'explain policy' },
    { label: 'How does SpendMesh protect me?', command: 'how does spendmesh protect me' },
  ],
  '/transactions': [
    { label: 'Was the payment captured?', command: 'was payment captured' },
    { label: 'Explain the audit log', command: 'explain audit' },
    { label: 'What should I do next?', command: 'what should i do next' },
  ],
  '/agents': [
    { label: 'What is SpendMesh AI?', command: 'what is spendmesh' },
    { label: 'How does Gemini work here?', command: 'what is gemini doing' },
    { label: 'How does SpendMesh protect me?', command: 'how does spendmesh protect me' },
  ],
  DEFAULT: [
    { label: 'What is SpendMesh AI?', command: 'what is spendmesh' },
    { label: 'What should I do next?', command: 'what should i do next' },
    { label: 'How does PayPal work here?', command: 'how does paypal work' },
  ],
};
