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
    `Welcome to SpendMesh AI. I am your autonomous financial guardian, enforcing spending policy guardrails and securing verified PayPal transactions.`,

  REQUEST_PARSING: () =>
    `Analyzing your procurement request with Gemini. Formulating project scope, extracting deliverables, and locking your price ceiling.`,

  PARSE_COMPLETE: ({ serviceType, budget } = {}) =>
    `Procurement parameters verified. We have bound the scope for ${serviceType || 'services'} under a strict $${budget || 0} ceiling. Competing agent bids are now being evaluated.`,

  OFFERS_LOADED: ({ count } = {}) =>
    `Received ${count || 'competing'} autonomous agent bids. Gemini has cross-evaluated pricing, delivery milestones, and vendor trust scores.`,

  POLICY_PASSED: ({ amount } = {}) =>
    `Deterministic policy audit passed. All 5 enterprise guardrails satisfied and budget capacity secured. Ready for PayPal escrow authorization.`,

  POLICY_BLOCKED: ({ reason, message } = {}) =>
    `Security guardrail triggered. Transaction blocked: ${message || reason || 'Exceeds authorized spending policy'}. Treasury funds remain protected.`,

  APPROVAL_REQUIRED: ({ amount, limit } = {}) =>
    `Human oversight required. At $${amount || ''}, this exceeds your $${limit || ''} auto-approval limit. Quarantined in the Approvals queue for executive review.`,

  APPROVAL_GRANTED: ({ amount } = {}) =>
    `Deal authorized by administrator for $${amount || ''}. Escrow reservation confirmed. Ready for PayPal settlement.`,

  APPROVAL_REJECTED: () =>
    `Deal rejected. Quarantined budget allocation has been safely released back to your treasury.`,

  CHECKOUT_READY: ({ amount } = {}) =>
    `Deal cryptographically bound and cleared for payment. Ready to initiate secure PayPal Sandbox checkout.`,

  CHECKOUT_INITIATED: () =>
    `Redirecting to PayPal Sandbox checkout. Price parameters are cryptographically sealed server-side.`,

  CAPTURE_VERIFIED: ({ amount } = {}) =>
    `PayPal payment of $${amount || ''} captured and verified. Digital deliverables unlocked and immutable audit receipt generated.`,

  CAPTURE_FAILED: () =>
    `PayPal capture was not completed. No treasury funds were deducted.`,

  TAMPER_BLOCKED: ({ storedAmount } = {}) =>
    `Critical security alert: Client-side price tampering blocked! SpendMesh ignored the manipulated payload and strictly enforced the original agreement of $${storedAmount || ''}.`,

  DUPLICATE_BLOCKED: () =>
    `Replay attack prevented. Duplicate payment attempt rejected on an already settled transaction.`,

  BUDGET_EXCEEDED: ({ available } = {}) =>
    `Treasury threshold exceeded. The requested deal exceeds your current remaining balance of $${available || 0}.`,

  LEDGER_VERIFIED: () =>
    `Audit ledger verified. Cryptographic SHA-256 Merkle chain integrity confirmed tamper-free.`,

  PAGE_CHANGED: ({ page } = {}) => {
    const descriptions = {
      '/':            'Executive Overview. Monitoring real-time treasury burn, active agent procurements, and system security guardrails.',
      '/requests':    'Procurement Console. Express your purchase intent in natural language, and autonomous agents will negotiate competitive bids under strict policy ceilings.',
      '/marketplace': 'Procurement Console. Express your purchase intent in natural language, and autonomous agents will negotiate competitive bids under strict policy ceilings.',
      '/agents':      'Agent Directory. Review registered autonomous vendor agents, reputation scores, and verified fulfillment capabilities.',
      '/transactions': 'Transactions Ledger. Reviewing settled PayPal orders, cryptographic verification hashes, and compliance receipts.',
      '/dashboard':   'Transactions Ledger. Inspecting certified transaction records and compliance certificates.',
      '/policy':      'Spending Policy Center. Calibrate spending ceilings, auto-approval thresholds, and autonomous agent procurement guardrails.',
      '/audit':       'Cryptographic Audit Trail. Immutable SHA-256 log recording all agent interactions, policy evaluations, and security blocks.',
      '/approvals':   'Executive Approvals Queue. Human-in-the-loop governance for transactions exceeding automated policy thresholds.',
      '/payment/success': 'Payment Confirmation. Certified PayPal capture receipt and cryptographic compliance verification.',
      '/payment/cancel':  'Payment Cancelled. The transaction was aborted in PayPal Sandbox. No funds were captured.'
    };
    return descriptions[page] || `Navigated to ${page}.`;
  },
};

// ─── Answer Scripts (for spoken/typed questions) ────────────────────

export const answerScripts = {

  WHAT_IS_SPENDMESH: () =>
    `SpendMesh AI serves as an autonomous financial trust layer. We bridge non-deterministic AI agent negotiations with deterministic enterprise spending policies, settling verified transactions through PayPal Orders v2.`,

  HOW_PAYPAL_WORKS: () =>
    `SpendMesh operates on top of PayPal Orders v2 Sandbox. Instead of letting agents directly access payment credentials, SpendMesh establishes a server-side cryptographic binding. Funds are authorized and captured only when policy criteria and deliverable validations are fully satisfied.`,

  WHAT_IS_GEMINI_DOING: ({ stage } = {}) => {
    if (stage === 1) return `Gemini is ready to deconstruct your prompt, structure deliverables, and establish your financial guardrails.`;
    if (stage === 2) return `Gemini parsed your service category, milestone deliverables, and calibrated your maximum budget ceiling.`;
    if (stage === 3) return `Gemini cross-evaluated competing seller bids based on price, delivery SLA, and vendor reputation.`;
    return `Gemini 2.5 Flash analyzes procurement requests and synthesizes deliverables within strict policy boundaries.`;
  },

  EXPLAIN_POLICY: ({ policyResult, policy } = {}) => {
    if (!policyResult) {
      return `SpendMesh evaluates 5 strict security criteria: cryptographic price binding, vendor whitelisting, treasury capacity, replay protection, and auto-approval limits.`;
    }
    if (policyResult.requiresApproval) {
      return `This transaction exceeds your $${policy?.autoApproveLimit ?? 1000} auto-approval ceiling. Quarantined in Approvals for executive sign-off.`;
    }
    if (policyResult.allowed) {
      return `Passed all 5 policy criteria. Budget capacity has been reserved and the deal is cleared for PayPal checkout.`;
    }
    return `Deal blocked: ${policyResult.message || 'Violated enterprise policy rules'}. Treasury funds remain preserved.`;
  },

  WHY_APPROVAL_REQUIRED: ({ deal, policy } = {}) =>
    `Requires authorization because $${deal?.agreedAmount || ''} exceeds your $${policy?.autoApproveLimit ?? 1000} auto-approval threshold. High-value transactions require human-in-the-loop governance.`,

  WHY_CHECKOUT_BLOCKED: ({ deal } = {}) =>
    deal?.blockedReason
      ? `Blocked by policy engine: ${deal.blockedReason}. Check the audit log for complete cryptographic traces.`
      : `Blocked by policy engine. Check the audit log for details.`,

  WAS_PAYMENT_CAPTURED: ({ captureData } = {}) => {
    if (!captureData) return `Payment status unknown or not yet initiated.`;
    if (captureData.captureStatus === 'COMPLETED') {
      return `Yes. $${captureData.amount || ''} was settled successfully in PayPal Sandbox with cryptographic capture verification.`;
    }
    return `Capture status: ${captureData.captureStatus || 'pending'}. Funds have not been settled.`;
  },

  HOW_SPENDMESH_PROTECTS: () =>
    `SpendMesh provides five deterministic security layers: server-side price binding that renders client manipulation obsolete, budget reservation, human-in-the-loop approval escalation, cryptographic replay protection, and an immutable SHA-256 audit ledger.`,

  HOW_TO_PAY_AFTER_APPROVAL: () =>
    `Navigate to the Approvals page and select Proceed to PayPal Checkout on your authorized deal to complete settlement.`,

  WHAT_SHOULD_I_DO_NEXT: ({ stage, policyResult, captureData, pendingApprovals, approvedDeals } = {}) => {
    if (captureData?.captureStatus === 'COMPLETED') {
      return `Payment is verified and captured. You can inspect your digital deliverable or print your certified compliance receipt.`;
    }
    if (approvedDeals > 0) {
      return `You have ${approvedDeals} authorized deal ready for settlement. Visit Approvals to initiate PayPal checkout.`;
    }
    if (pendingApprovals > 0) {
      return `You have ${pendingApprovals} transaction awaiting executive review in the Approvals queue.`;
    }
    if (!stage || stage === 1) return `Enter a purchase request with your requirements and budget limit to initiate autonomous agent bidding.`;
    if (stage === 2) return `Review the extracted requirements and click View Competing Bids to evaluate seller offers.`;
    if (stage === 3) return `Select an offer to run the server-side deterministic policy check.`;
    if (stage === 4 && policyResult?.requiresApproval) {
      return `This deal exceeds automated thresholds. Go to Approvals for manual authorization.`;
    }
    if (stage === 4 && policyResult?.allowed) {
      return `Policy verified. Click Proceed to Checkout to finalize through PayPal Sandbox.`;
    }
    if (stage === 5) {
      return `Click Pay with PayPal Sandbox to authorize settlement in the sandbox environment.`;
    }
    return `SpendMesh AI is standing by for your next procurement instruction.`;
  },

  EXPLAIN_AUDIT: () =>
    `The audit log maintains an immutable SHA-256 Merkle chain. Every agent bid, policy decision, security block, and PayPal capture is cryptographically sealed for non-repudiation.`,

  EXPLAIN_OFFER: ({ offer, recommendation } = {}) => {
    if (!offer) return `Select an offer from the list to review pricing, delivery time, and the underlying Gemini evaluation rationale.`;
    return `${offer.sellerName || 'This seller'} has bid $${offer.price} USD ` +
      `with guaranteed delivery in ${offer.deliveryTime || 'the stated timeframe'}. ` +
      (recommendation?.recommendedOfferId === offer.id
        ? `Gemini recommends this offer as the optimal trade-off of quality and budget efficiency. ` + (recommendation.reasoning || '')
        : `This offer was considered but not chosen as the top recommendation. ` + (recommendation?.reasoning || ''));
  },

  CHECK_BUDGET: ({ policy } = {}) => {
    if (!policy) return `Budget information is not available right now.`;
    const spent = policy.spentAmount || 0;
    const total = policy.totalBudget || 5000;
    const committed = policy.committedAmount || 0;
    const remaining = Math.max(0, total - spent - committed);
    return `Your enterprise treasury budget is $${total.toFixed(2)}. ` +
      `You have settled $${spent.toFixed(2)} and committed $${committed.toFixed(2)} to in-flight contracts. ` +
      `Available capacity is $${remaining.toFixed(2)}. ` +
      `Your automated approval limit is set to $${policy.autoApproveLimit || 1000}.`;
  },

  CHECK_TREASURY_BALANCE: ({ policy } = {}) => {
    const total = policy?.totalBudget || 5000;
    const spent = policy?.spentAmount || 0;
    const committed = policy?.committedAmount || 0;
    const remaining = Math.max(0, total - spent - committed);
    return `Treasury balance report: $${remaining.toFixed(2)} USD available out of $${total.toFixed(2)}. Settled: $${spent.toFixed(2)}, Committed in escrow: $${committed.toFixed(2)}.`;
  },

  PENDING_APPROVALS_COUNT: ({ pendingApprovals = 0, approvedDeals = 0 } = {}) => {
    const total = (Number(pendingApprovals) || 0) + (Number(approvedDeals) || 0);
    if (total === 0) {
      return `You have zero pending approvals. All autonomous agent transactions and purchase requests are fully reconciled.`;
    }
    return `You have ${total} actionable item${total > 1 ? 's' : ''}: ${pendingApprovals} awaiting policy review, and ${approvedDeals} authorized for PayPal settlement.`;
  },

  EXPLAIN_PAYPAL_ESCROW: () =>
    `SpendMesh acts as an autonomous policy escrow on top of PayPal Orders v2. Deals are bound to strict price ceilings, reserved against treasury capacity, and captured on PayPal Sandbox only after guardrail compliance and deliverable generation.`,

  SUMMARIZE_TODAYS_SPEND: ({ policy, deals } = {}) => {
    const spent = policy?.spentAmount || 0;
    const count = Array.isArray(deals) ? deals.filter(d => d.status === 'payment_completed').length : 0;
    return `Reconciliation summary: Total settled expenditure is $${Number(spent).toFixed(2)} USD across ${count} verified transaction${count !== 1 ? 's' : ''}.`;
  },

  WHAT_HAPPENED: ({ lastEvent } = {}) => {
    if (!lastEvent) return `No recent security or payment events have been recorded in this session.`;
    return `The most recent security event was: ${lastEvent.type?.replace(/_/g, ' ').toLowerCase()}. ` +
      (lastEvent.explanation || '');
  },

  UNSUPPORTED: ({ command } = {}) =>
    command
      ? `I didn't recognize "${command}". You can ask about treasury balance, policy rules, or request an explanation of the current stage.`
      : `I didn't catch that clearly. Please try speaking again or type your question below.`,

  RESET_CONFIRMATION: () =>
    `To reset the demo environment, click the Reset Demo Environment button at the bottom of the sidebar. ` +
    `This will clear all test deals, payments, and audit logs, and restore the budget to $5,000. ` +
    `For safety, destructive resets require an explicit button click and cannot be executed via voice.`,
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
