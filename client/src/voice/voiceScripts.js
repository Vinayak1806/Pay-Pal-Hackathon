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
    `Welcome to SpendMesh AI. I'm your financial security guide. ` +
    `SpendMesh enforces your spending policy for AI agent purchases and processes ` +
    `verified payments through PayPal Sandbox. ` +
    `You can ask me anything about what's happening, or click the microphone to give a voice command.`,

  REQUEST_PARSING: () =>
    `I'm interpreting your request now. Gemini is extracting the task description, ` +
    `budget ceiling, service type, and constraints from your natural-language input.`,

  PARSE_COMPLETE: ({ serviceType, budget } = {}) =>
    `Gemini parsed your request. ` +
    (serviceType ? `Service type: ${serviceType}. ` : '') +
    (budget ? `Budget ceiling: $${budget}. ` : '') +
    `Review the extracted requirements, then proceed to see competing offers.`,

  OFFERS_LOADED: ({ count } = {}) =>
    `${count || 'Several'} agent offers are ready for your review. ` +
    `Compare the prices, delivery times, and ratings. ` +
    `Selecting an offer will trigger a server-side policy check before any payment can be initiated.`,

  POLICY_PASSED: ({ amount, sellerName } = {}) =>
    `The server-side policy check passed. ` +
    (amount ? `The agreed amount of $${amount} ` : 'This deal ') +
    (sellerName ? `with ${sellerName} ` : '') +
    `is within your budget, within the auto-approval limit, and meets all spending criteria. ` +
    `You may proceed to PayPal Sandbox checkout.`,

  POLICY_BLOCKED: ({ reason, message } = {}) =>
    `The server-side policy check blocked this deal. ` +
    (message || reason
      ? `Reason: ${message || reason}. `
      : `The offer does not meet your current spending policy. `) +
    `Review the policy center to understand your limits.`,

  APPROVAL_REQUIRED: ({ amount, limit } = {}) =>
    `This offer requires human approval before checkout can proceed. ` +
    (amount ? `The requested amount of $${amount} ` : 'The amount ') +
    (limit ? `exceeds your automatic approval ceiling of $${limit}. ` : 'exceeds your automatic ceiling. ') +
    `The deal is now in the Approvals queue. Please review and authorize or reject it.`,

  APPROVAL_GRANTED: ({ amount } = {}) =>
    `The deal has been authorized by the reviewer. ` +
    (amount ? `$${amount} ` : 'The purchase ') +
    `is now approved. Click "Proceed to PayPal Checkout" on your screen to complete payment in PayPal Sandbox.`,

  APPROVAL_REJECTED: () =>
    `The deal was rejected by the reviewer. The transaction has been cancelled ` +
    `and the budget reservation released. No payment will be initiated.`,

  CHECKOUT_READY: ({ amount } = {}) =>
    `Policy checks are complete. ` +
    (amount ? `$${amount} ` : 'The amount ') +
    `is authorized for checkout. Clicking "Pay with PayPal Sandbox" will redirect you to ` +
    `PayPal's test environment to approve the transaction with test funds.`,

  CHECKOUT_INITIATED: () =>
    `PayPal Sandbox checkout has been initiated. You'll be redirected to PayPal's ` +
    `test gateway. Complete the approval there to capture the payment.`,

  CAPTURE_VERIFIED: ({ amount, captureId } = {}) =>
    `PayPal Sandbox confirms the capture is complete. ` +
    (amount ? `$${amount} has been settled ` : 'The payment has been settled ') +
    `and the transaction is now recorded as completed in the audit ledger. ` +
    (captureId ? `Capture ID: ${captureId.substring(0, 12)}. ` : '') +
    `The AI-generated deliverable has been unlocked.`,

  CAPTURE_FAILED: ({ reason } = {}) =>
    `The PayPal Sandbox capture did not complete. ` +
    (reason ? `Reason: ${reason}. ` : '') +
    `The transaction has not been marked as completed. ` +
    `No funds were settled. You may attempt the checkout again.`,

  TAMPER_BLOCKED: ({ submittedAmount, storedAmount } = {}) =>
    `Security alert. SpendMesh detected a price manipulation attempt. ` +
    (submittedAmount && storedAmount
      ? `The checkout request submitted $${submittedAmount}, but the server-stored agreed price is $${storedAmount}. `
      : 'The submitted price did not match the server-stored agreed amount. ') +
    `SpendMesh ignored the tampered value and enforced the original server-verified price. ` +
    `This event has been recorded in the audit trail.`,

  DUPLICATE_BLOCKED: () =>
    `SpendMesh blocked a duplicate payment attempt. ` +
    `This deal has already been settled. The guardrail prevented a second deduction. ` +
    `Check the audit trail for the original capture record.`,

  BUDGET_EXCEEDED: ({ requested, available } = {}) =>
    `The requested amount exceeds your available budget. ` +
    (requested ? `Requested: $${requested}. ` : '') +
    (available ? `Available: $${available}. ` : '') +
    `Adjust your budget in the Policy Center or choose a lower-priced offer.`,

  LEDGER_VERIFIED: ({ verifiedBlocks, isTamperFree } = {}) =>
    isTamperFree
      ? `The audit ledger is cryptographically intact. ` +
        (verifiedBlocks ? `All ${verifiedBlocks} blocks ` : 'All blocks ') +
        `were verified using SHA-256 Merkle chain hashing. No tampering detected.`
      : `Warning: The audit ledger integrity check found a discontinuity. ` +
        `Some blocks could not be cryptographically verified. Check the verification report.`,

  PAGE_CHANGED: ({ page } = {}) => {
    const descriptions = {
      '/':            'You are now on the Overview dashboard.',
      '/requests':    'You are now on Purchase Requests. Describe a service task to start the AI agent workflow.',
      '/marketplace': 'You are now on Purchase Requests. Describe a service task to start the AI agent workflow.',
      '/agents':      'You are now on the Agent Marketplace, showing active AI agents and their specializations.',
      '/transactions': 'You are now viewing the Transactions ledger with all deals and payment records.',
      '/dashboard':   'You are now viewing the Transactions ledger.',
      '/policy':      'You are now in the Policy Center. You can adjust your budget, approval limits, and allowed service categories.',
      '/audit':       'You are now viewing the Audit Log — an immutable record of all financial events, policy decisions, and security blocks.',
      '/approvals':   'You are now in the Approvals queue — deals that exceeded the auto-approval ceiling and require human review.',
    };
    return descriptions[page] || `Navigated to ${page}.`;
  },
};

// ─── Answer Scripts (for spoken/typed questions) ────────────────────

export const answerScripts = {

  WHAT_IS_SPENDMESH: () =>
    `SpendMesh AI is a financial authorization and policy enforcement layer for AI agent commerce. ` +
    `When an AI agent wants to purchase a service, SpendMesh validates the request against ` +
    `your spending policy, negotiates offers, enforces budget limits, requires approval when ` +
    `necessary, and processes verified payments through PayPal Sandbox. ` +
    `It ensures AI agents can never override your financial guardrails.`,

  HOW_PAYPAL_WORKS: () =>
    `SpendMesh uses PayPal Orders version 2 in the Sandbox environment. ` +
    `When you proceed to checkout, the server creates a PayPal order using only the ` +
    `server-stored agreed price — the browser cannot change this amount. ` +
    `You approve the order on PayPal's test gateway, then the server captures the payment ` +
    `and verifies the capture result before marking the transaction as complete.`,

  WHAT_IS_GEMINI_DOING: ({ stage } = {}) => {
    if (stage === 1) return `Gemini is waiting for your task description. Enter what service you need.`;
    if (stage === 2) return `Gemini has parsed your request and extracted the service type, budget ceiling, urgency level, and requirements.`;
    if (stage === 3) return `Gemini has analyzed the competing seller offers and selected a recommendation based on price, quality, and delivery time.`;
    return `Gemini 2.5 Flash is used for natural language parsing and offer analysis. It runs on the server and its API key is never exposed to the browser.`;
  },

  EXPLAIN_POLICY: ({ policyResult, policy } = {}) => {
    if (!policyResult) {
      return `The policy engine validates every deal against five criteria: ` +
        `server-side price binding, allowed service categories, available budget, ` +
        `duplicate and replay prevention, and the automatic approval ceiling. ` +
        (policy ? `Your current ceiling is $${policy.autoApproveLimit}.` : '');
    }
    if (policyResult.requiresApproval) {
      return `This deal exceeded the auto-approval ceiling of $${policy?.autoApproveLimit ?? 1000}. ` +
        `It's quarantined in the Approvals queue until a human reviewer authorizes or rejects it.`;
    }
    if (policyResult.allowed) {
      return `This deal passed all five policy criteria. ` +
        `The price is server-locked, the service category is whitelisted, ` +
        `the budget is sufficient, no duplicate exists, and it's within the auto-approval ceiling.`;
    }
    return `The deal was blocked. Reason: ${policyResult.message || 'See the policy check details.'}`;
  },

  WHY_APPROVAL_REQUIRED: ({ deal, policy } = {}) =>
    `Manual approval is required because the deal amount ` +
    (deal?.agreedAmount ? `of $${deal.agreedAmount} ` : '') +
    `exceeds your automatic approval ceiling ` +
    (policy?.autoApproveLimit ? `of $${policy.autoApproveLimit}. ` : '. ') +
    `This is a safety guardrail: high-value purchases always require explicit human authorization. ` +
    `Go to the Approvals page to review the deal and make your decision.`,

  WHY_CHECKOUT_BLOCKED: ({ deal } = {}) =>
    deal?.blockedReason
      ? `Checkout was blocked because: ${deal.blockedReason}. The server refused to create a PayPal order.`
      : `Checkout was blocked by the server-side policy engine. The deal may have been tampered, ` +
        `exceeded the budget, or is in an invalid state. Check the audit trail for the specific event.`,

  WAS_PAYMENT_CAPTURED: ({ captureData } = {}) => {
    if (!captureData) return `The payment status is not yet known. The capture is either pending or has not been initiated.`;
    if (captureData.captureStatus === 'COMPLETED') {
      return `Yes. The PayPal Sandbox capture was completed successfully. ` +
        (captureData.amount ? `Amount: $${captureData.amount}. ` : '') +
        (captureData.captureId ? `Capture ID: ${captureData.captureId.substring(0, 12)}.` : '');
    }
    return `The capture status is: ${captureData.captureStatus || 'unknown'}. The transaction has not been fully settled.`;
  },

  HOW_SPENDMESH_PROTECTS: () =>
    `SpendMesh provides five layers of protection. ` +
    `First: server-side price binding — amounts are stored server-side at offer acceptance and cannot be modified by the browser. ` +
    `Second: budget enforcement — atomic budget reservations prevent overspending. ` +
    `Third: approval gating — purchases above your ceiling require explicit human authorization. ` +
    `Fourth: duplicate prevention — settled deals cannot be re-processed. ` +
    `Fifth: cryptographic audit chaining — every event is SHA-256 hashed into an immutable Merkle ledger.`,

  HOW_TO_PAY_AFTER_APPROVAL: () =>
    `Once you authorize an escalated deal, it moves to the "Authorized & Ready to Pay" section on the Approvals page. ` +
    `Click the green "Proceed to PayPal Checkout" button on that deal. SpendMesh will create a secure PayPal order with the exact authorized amount and redirect you to PayPal Sandbox to complete payment.`,

  WHAT_SHOULD_I_DO_NEXT: ({ stage, policyResult, captureData, pendingApprovals, approvedDeals } = {}) => {
    if (captureData?.captureStatus === 'COMPLETED') {
      return `The payment is verified. You can view the deliverable, check the audit trail, or start a new purchase request.`;
    }
    if (approvedDeals > 0) {
      return `You have ${approvedDeals} authorized deal${approvedDeals > 1 ? 's' : ''} ready for payment. ` +
        `Click "Proceed to PayPal Checkout" in the Approvals queue to complete the transaction in PayPal Sandbox.`;
    }
    if (pendingApprovals > 0) {
      return `You have ${pendingApprovals} deal${pendingApprovals > 1 ? 's' : ''} waiting for your approval. ` +
        `Go to the Approvals page to review and authorize or reject ${pendingApprovals > 1 ? 'them' : 'it'}.`;
    }
    if (!stage || stage === 1) return `Enter a task description in natural language to start the AI agent workflow. Include a budget limit.`;
    if (stage === 2) return `Review the extracted requirements from your task. If they look correct, proceed to see competing bids.`;
    if (stage === 3) return `Select an offer from the competing bids. This will trigger the server-side policy check.`;
    if (stage === 4 && policyResult?.requiresApproval) {
      return `This deal requires manual approval. Navigate to the Approvals page to authorize it.`;
    }
    if (stage === 4 && policyResult?.allowed) {
      return `The policy check passed. Proceed to checkout to initiate the PayPal Sandbox payment.`;
    }
    if (stage === 5) {
      return `Click "Pay with PayPal Sandbox" to initiate the payment. You'll be redirected to PayPal's test gateway.`;
    }
    return `Review the current state on screen. I'm ready to answer your questions.`;
  },

  EXPLAIN_AUDIT: () =>
    `The audit log is an immutable record of every financial event in SpendMesh. ` +
    `Every policy decision, approval, checkout creation, payment capture, tamper attempt, ` +
    `and duplicate block is recorded with a timestamp, deal ID, actor, and outcome. ` +
    `Each record is cryptographically linked to the previous one using SHA-256 Merkle chaining, ` +
    `making it impossible to silently alter a past event without breaking the chain.`,

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
