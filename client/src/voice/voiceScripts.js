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

// ─── Narration Scripts ───────────────────────────────────────────

export const narrationScripts = {

  WELCOME: () =>
    `Welcome to SpendMesh AI, securing autonomous agent spending via PayPal.`,

  REQUEST_PARSING: () =>
    `Analyzing request and locking budget ceiling with Gemini.`,

  PARSE_COMPLETE: ({ serviceType, budget, count } = {}) =>
    `Scope locked under $${budget || 0} ceiling. ${count ? `${count} agent bids ready.` : 'Evaluating competing bids.'}`,

  OFFERS_LOADED: ({ count } = {}) =>
    `Received ${count || 3} competitive agent bids.`,

  POLICY_PASSED: ({ amount } = {}) =>
    `Policy audit passed. Ready for PayPal checkout.`,

  POLICY_BLOCKED: ({ reason, message } = {}) =>
    `Transaction blocked: ${message || reason || 'Exceeds spending limit'}.`,

  APPROVAL_REQUIRED: ({ amount, limit } = {}) =>
    `Approval required. Deal exceeds your $${limit || ''} threshold.`,

  APPROVAL_GRANTED: ({ amount } = {}) =>
    `Deal approved for $${amount || ''}. Ready for PayPal payment.`,

  APPROVAL_REJECTED: () =>
    `Deal rejected. Reserved funds restored to treasury.`,

  CHECKOUT_READY: ({ amount } = {}) =>
    `Deal sealed. Ready for PayPal Sandbox checkout.`,

  CHECKOUT_INITIATED: () =>
    `Redirecting to PayPal Sandbox checkout.`,

  CAPTURE_VERIFIED: ({ amount } = {}) =>
    amount
      ? `PayPal payment of $${parseFloat(amount).toFixed(2)} captured and verified successfully. Your deliverable is ready.`
      : `PayPal payment captured and verified successfully. Your deliverable is ready.`,

  CAPTURE_FAILED: ({ reason } = {}) =>
    reason
      ? `Payment was not completed: ${reason}`
      : `Payment capture was not completed. No funds were deducted.`,

  TAMPER_BLOCKED: ({ storedAmount } = {}) =>
    `Tamper blocked! Enforcing original price of $${storedAmount || ''}.`,

  DUPLICATE_BLOCKED: () =>
    `Replay attack prevented. Duplicate payment rejected.`,

  BUDGET_EXCEEDED: ({ available } = {}) =>
    `Budget exceeded. Available balance is $${available || 0}.`,

  LEDGER_VERIFIED: () =>
    `Audit ledger verified tamper-free.`,

  PAGE_CHANGED: ({ page } = {}) => {
    const descriptions = {
      '/': 'Overview dashboard.',
      '/requests': 'Purchase requests console.',
      '/marketplace': 'Purchase requests console.',
      '/agents': 'Autonomous agent directory.',
      '/transactions': 'Settled PayPal transaction ledger.',
      '/dashboard': 'Settled PayPal transaction ledger.',
      '/policy': 'Spending policy rules and thresholds.',
      '/audit': 'Cryptographic audit log.',
      '/approvals': 'Executive approvals queue.',
      '/payment/success': 'PayPal payment verified successfully.',
      '/payment/cancel': 'PayPal payment was cancelled.'
    };
    return descriptions[page] || `Navigated to ${page}.`;
  },
};

// ─── Answer Scripts (for spoken/typed questions) ────────────────────

export const answerScripts = {

  GREETING: () =>
    `Hello! I am SpendMesh AI Security Guide. I monitor autonomous agent spending, enforce policy guardrails, and secure PayPal transactions. How can I help you today?`,

  HOW_ARE_YOU: () =>
    `I am running smoothly and actively monitoring agent spending guardrails. How can I assist your workflow today?`,

  THANK_YOU: () =>
    `You are very welcome! Let me know if you need any assistance with budget, approvals, or payments.`,

  WHAT_IS_SPENDMESH: () =>
    `SpendMesh AI is the financial trust layer enforcing spending guardrails on autonomous AI agents.`,

  HOW_PAYPAL_WORKS: () =>
    `SpendMesh cryptographically binds agent deals server-side and settles payment via PayPal Orders v2.`,

  WHAT_IS_GEMINI_DOING: ({ stage } = {}) => {
    if (stage === 1) return `Gemini is structuring your scope and financial guardrails.`;
    if (stage === 2) return `Gemini verified your milestone deliverables and budget ceiling.`;
    if (stage === 3) return `Gemini evaluated competing bids on price, SLA, and trust score.`;
    return `Gemini analyzes requests and synthesizes deliverables within policy limits.`;
  },

  EXPLAIN_POLICY: ({ policyResult, policy } = {}) => {
    if (!policyResult) {
      return `SpendMesh checks price integrity, approved vendors, budget capacity, replay prevention, and approval limits.`;
    }
    if (policyResult.requiresApproval) {
      return `Deal exceeds your $${policy?.autoApproveLimit ?? 1000} auto-approval limit. Awaiting review in Approvals.`;
    }
    if (policyResult.allowed) {
      return `All 5 policy checks passed. Ready for PayPal checkout.`;
    }
    return `Deal blocked: ${policyResult.message || 'Violated spending policy'}.`;
  },

  WHY_APPROVAL_REQUIRED: ({ deal, policy } = {}) =>
    `Requires approval because the $${deal?.agreedAmount || ''} deal exceeds your $${policy?.autoApproveLimit ?? 1000} limit.`,

  WHY_CHECKOUT_BLOCKED: ({ deal } = {}) =>
    `Blocked by policy: ${deal?.blockedReason || 'Violated spending policy'}. Check audit log for details.`,

  WAS_PAYMENT_CAPTURED: ({ captureData, currentPath, lastEvent } = {}) => {
    // 1. If currently on payment confirmation page
    if (currentPath?.includes('/payment/success')) {
      const amt = captureData?.amount ?? lastEvent?.amount;
      return amt
        ? `Yes, your PayPal payment of $${parseFloat(amt).toFixed(2)} USD is confirmed and settled. Your deliverable is ready.`
        : `Yes, your PayPal payment has been captured and verified successfully. Your deliverable is ready.`;
    }
    // 2. If currently on payment cancel page
    if (currentPath?.includes('/payment/cancel')) {
      return `No, PayPal checkout was cancelled by user. No funds were debited from your account.`;
    }
    // 3. From verified capture data or event
    if (captureData?.captureStatus === 'COMPLETED' || lastEvent?.type === 'CAPTURE_VERIFIED') {
      const amt = captureData?.amount ?? lastEvent?.amount;
      return amt
        ? `Yes, your PayPal payment of $${parseFloat(amt).toFixed(2)} USD was settled and verified in PayPal Sandbox.`
        : `Yes, your PayPal payment was captured and verified successfully.`;
    }
    if (captureData?.captureStatus === 'FAILED' || lastEvent?.type === 'CAPTURE_FAILED') {
      return `No, payment capture was not completed: ${lastEvent?.reason || captureData?.reason || 'cancelled or failed'}.`;
    }
    if (captureData?.captureStatus) {
      return `Payment capture status is currently ${captureData.captureStatus}.`;
    }
    return `No payment has been initiated yet. You can submit a purchase request to begin.`;
  },

  HOW_SPENDMESH_PROTECTS: () =>
    `SpendMesh blocks price tampering, enforces budget caps, and logs actions to an immutable ledger.`,

  HOW_TO_PAY_AFTER_APPROVAL: () =>
    `Go to Approvals and click Authorize PayPal Checkout to complete payment.`,

  WHAT_SHOULD_I_DO_NEXT: ({ stage, policyResult, captureData, pendingApprovals, approvedDeals } = {}) => {
    if (captureData?.captureStatus === 'COMPLETED') {
      return `Payment is complete. You can download your deliverable or view compliance receipt.`;
    }
    if (approvedDeals > 0) {
      return `You have ${approvedDeals} approved deal ready for PayPal checkout in Approvals.`;
    }
    if (pendingApprovals > 0) {
      return `You have ${pendingApprovals} transaction awaiting review in the Approvals queue.`;
    }
    if (!stage || stage === 1) return `Submit a purchase request with your requirements and budget limit.`;
    if (stage === 2) return `Review the scope checklist, then click Compare Competing Agent Bids.`;
    if (stage === 3) return `Choose an offer and click Select Offer & Check Policy.`;
    if (stage === 4 && policyResult?.requiresApproval) {
      return `This deal exceeds policy limit. Visit Approvals to authorize.`;
    }
    if (stage === 4 && policyResult?.allowed) {
      return `Policy passed. Click Authorize PayPal Checkout to proceed.`;
    }
    if (stage === 5) {
      return `Click Pay with PayPal Sandbox to authorize settlement.`;
    }
    return `SpendMesh AI is standing by for your procurement instruction.`;
  },

  EXPLAIN_AUDIT: () =>
    `The audit log records an immutable SHA-256 chain of all bids, policy checks, and PayPal captures.`,

  EXPLAIN_OFFER: ({ offer, recommendation } = {}) => {
    if (!offer) return `Select an offer to review pricing, delivery SLA, and vendor trust score.`;
    return `${offer.sellerName} bid $${offer.price} with ${offer.deliveryTime} delivery. ` +
      (recommendation?.recommendedOfferId === offer.id ? `Recommended as the best value.` : ``);
  },

  CHECK_BUDGET: ({ policy } = {}) => {
    if (!policy) return `Budget information is not available.`;
    const spent = policy.spentAmount || 0;
    const total = policy.totalBudget || 5000;
    const committed = policy.committedAmount || 0;
    const remaining = Math.max(0, total - spent - committed);
    return `Treasury balance is $${remaining.toFixed(2)} available out of $${total.toFixed(2)}.`;
  },

  CHECK_TREASURY_BALANCE: ({ policy } = {}) => {
    const total = policy?.totalBudget || 5000;
    const spent = policy?.spentAmount || 0;
    const committed = policy?.committedAmount || 0;
    const remaining = Math.max(0, total - spent - committed);
    return `Treasury balance is $${remaining.toFixed(2)} available out of $${total.toFixed(2)}.`;
  },

  PENDING_APPROVALS_COUNT: ({ pendingApprovals = 0, approvedDeals = 0 } = {}) => {
    const total = (Number(pendingApprovals) || 0) + (Number(approvedDeals) || 0);
    if (total === 0) {
      return `Zero pending approvals. All transactions are up to date.`;
    }
    return `You have ${total} item${total > 1 ? 's' : ''} awaiting review or checkout in Approvals.`;
  },

  EXPLAIN_PAYPAL_ESCROW: () =>
    `SpendMesh reserves treasury funds and settles through PayPal Orders v2 upon verified delivery.`,

  SUMMARIZE_TODAYS_SPEND: ({ policy, deals } = {}) => {
    const spent = policy?.spentAmount || 0;
    const count = Array.isArray(deals) ? deals.filter(d => d.status === 'payment_completed').length : 0;
    return `You have settled $${Number(spent).toFixed(2)} across ${count} verified transaction${count !== 1 ? 's' : ''}.`;
  },

  WHAT_HAPPENED: ({ lastEvent } = {}) => {
    if (!lastEvent) return `No recent security or payment events recorded.`;
    return `Recent event: ${lastEvent.type?.replace(/_/g, ' ').toLowerCase()}.`;
  },

  EXPLAIN_PAGE: ({ currentPath } = {}) => {
    const path = currentPath || '/';
    if (path === '/' || path === '/overview') {
      return `You are on the Overview Dashboard. Here you can monitor treasury funds, agent procurement activity, and recent security events.`;
    }
    if (path.includes('/requests') || path.includes('/marketplace')) {
      return `You are on the Purchase Requests console. Enter your business requirements and budget ceiling to compare bids from competing AI agents.`;
    }
    if (path.includes('/agents')) {
      return `You are in the Agent Marketplace directory. Browse certified autonomous seller agents, specialties, and trust reputations.`;
    }
    if (path.includes('/approvals')) {
      return `You are in the Executive Approvals Queue. Review, approve, or reject agent transactions that exceed your automated spending limit.`;
    }
    if (path.includes('/transactions')) {
      return `You are on the Settled Transactions Ledger. Inspect captured PayPal orders, cryptographic deliverable hashes, and escrow receipts.`;
    }
    if (path.includes('/policy')) {
      return `You are in the Policy Center. Configure spending limits, approved vendor categories, and replay guardrails.`;
    }
    if (path.includes('/audit')) {
      return `You are in the Cryptographic Audit Log. Verify the immutable SHA-256 chain of agent requests, policy checks, and PayPal captures.`;
    }
    if (path.includes('/payment/success')) {
      return `You are on the Payment Confirmation page. Your PayPal order is settled, budget deducted, and the completed AI deliverable is ready.`;
    }
    if (path.includes('/payment/cancel')) {
      return `You are on the Payment Cancelled page. No PayPal funds were captured, and reserved funds are restored to treasury.`;
    }
    return `SpendMesh AI is standing by to guide your autonomous procurement workflow.`;
  },

  UNSUPPORTED: ({ command } = {}) =>
    command
      ? `I didn't recognize "${command}". Try asking about balance, policy rules, or next steps.`
      : `Please try speaking again or type your question below.`,

  RESET_CONFIRMATION: () =>
    `Click Reset Demo at the bottom of the sidebar to reset balance to $5,000.`,
};

// ─── Quick Action Sets Per Page ──────────────────────────────────

export const quickActionsForPage = {
  '/': [
    { label: '💳 Treasury Balance', command: 'check treasury balance' },
    { label: '💡 What should I do next?', command: 'what should i do next' },
    { label: '🛡️ How SpendMesh Protects', command: 'how does spendmesh protect me' },
    { label: '⏳ Pending Approvals', command: 'pending approvals count' },
  ],
  '/requests': [
    { label: '💡 What should I do next?', command: 'what should i do next' },
    { label: '🤖 What is Gemini doing?', command: 'what is gemini doing' },
    { label: '💳 Check my budget', command: 'check budget' },
    { label: '🛡️ Explain PayPal Escrow', command: 'explain paypal escrow' },
  ],
  '/marketplace': [
    { label: '💡 What should I do next?', command: 'what should i do next' },
    { label: '🤖 What is Gemini doing?', command: 'what is gemini doing' },
    { label: '💳 Check my budget', command: 'check budget' },
    { label: '🛡️ Explain PayPal Escrow', command: 'explain paypal escrow' },
  ],
  '/approvals': [
    { label: '💳 How to pay approved deal?', command: 'how do i pay after approval' },
    { label: '⚠️ Why approval required?', command: 'why approval required' },
    { label: '⏳ Pending Approvals Count', command: 'pending approvals count' },
    { label: '💡 What should I do next?', command: 'what should i do next' },
  ],
  '/audit': [
    { label: '📜 Explain the audit log', command: 'explain audit' },
    { label: '🛡️ How SpendMesh protects', command: 'how does spendmesh protect me' },
    { label: '📊 What happened recently?', command: 'what happened' },
  ],
  '/policy': [
    { label: '📋 Explain this policy check', command: 'explain policy' },
    { label: '💳 Check my budget', command: 'check budget' },
    { label: '🛡️ How SpendMesh protects', command: 'how does spendmesh protect me' },
  ],
  '/transactions': [
    { label: '✅ Was payment captured?', command: 'was payment captured' },
    { label: '📜 Explain the audit ledger', command: 'explain audit' },
    { label: '📊 Summarize today\'s spend', command: "summarize today's spend" },
  ],
  '/agents': [
    { label: '🤖 What is SpendMesh AI?', command: 'what is spendmesh' },
    { label: '⚡ How does Gemini work here?', command: 'what is gemini doing' },
    { label: '🛡️ How SpendMesh protects', command: 'how does spendmesh protect me' },
  ],
  '/payment/success': [
    { label: '✅ Was payment captured?', command: 'was payment captured' },
    { label: '📜 Explain audit certificate', command: 'explain audit' },
    { label: '💡 What should I do next?', command: 'what should i do next' },
  ],
  '/payment/cancel': [
    { label: '⚠️ Was payment cancelled?', command: 'was payment captured' },
    { label: '💳 Check treasury balance', command: 'check treasury balance' },
    { label: '💡 What should I do next?', command: 'what should i do next' },
  ],
  DEFAULT: [
    { label: '🤖 What is SpendMesh AI?', command: 'what is spendmesh' },
    { label: '💳 Treasury Balance', command: 'check treasury balance' },
    { label: '💡 What should I do next?', command: 'what should i do next' },
    { label: '🛡️ PayPal Escrow', command: 'explain paypal escrow' },
  ],
};
