# Devpost Submission — SpendMesh AI

### PayPal AI Hackathon 2026

---

## Tagline
The financial trust layer that stops AI agents from overspending your budget.

---

## Description

As autonomous AI agents evolve from simple chat assistants into capable economic actors—negotiating service agreements, contracting freelancers, and procuring APIs on our behalf—a catastrophic security gap has emerged: **How do we let agents spend money without giving them the keys to our bank accounts?**

Giving an AI agent direct credit card credentials or unchecked payment permissions is a recipe for financial disaster. A subtle prompt injection, a hallucinated zero in an invoice, or an unconstrained loop can drain a corporate or personal treasury in seconds. 

**SpendMesh AI** solves this critical economic safety problem by creating an unbypassable, policy-enforcing perimeter between autonomous AI agents and payment networks. When a user delegates a task to SpendMesh AI, our Buyer Agent uses Google Gemini 1.5 to extract precise requirements, budgetary constraints, and urgency metrics. Competing specialized Seller Agents submit binding proposals in an open agent marketplace.

Before any transaction can initiate, SpendMesh AI's deterministic Policy Engine intercepts the proposed deal. It enforces hard organizational constraints:
1. **Server-Side Price Verification:** Ignores any client-submitted or manipulated prices and binds directly to the server's cryptographic deal records.
2. **Cumulative Budget Reservoirs:** Uses atomic MongoDB operations to lock funds into escrow, preventing race conditions and concurrent budget depletion.
3. **Strict Whitelisting:** Enforces categories of permitted services.
4. **Human-in-the-Loop Escalation:** Any deal exceeding the autonomous threshold (e.g., $1,000) is quarantined into an Approval Center requiring human executive sign-off.
5. **Idempotent Capture & Replay Protection:** Blocks duplicate payments and unauthorized captures before reaching PayPal.

Once cleared, SpendMesh AI establishes an authentic PayPal Orders v2 sandbox checkout session. Crucially, the final deliverable—synthesized by Gemini—is securely gated on the server until PayPal's capture endpoint confirms COMPLETED settlement.

With SpendMesh AI, individuals and enterprises can unleash the full power of autonomous multi-agent commerce with ironclad financial safety.

---

## What It Does

- **Natural Language Procurement:** Interprets messy human requirements into structured service specifications using Google Gemini 1.5.
- **Autonomous Multi-Agent Bidding:** Simulates an active agent economy where specialized sellers compete on price, turnaround, and quality.
- **Zero-Trust Policy Guardrails:** Deterministically verifies budget caps, whitelist allowances, and transaction integrity with zero client trust.
- **Active Price Tampering Detection:** Catches and logs manipulated client payloads (e.g., attempting to change $400 to $800), automatically enforcing server-stored amounts.
- **Human-in-the-Loop Escalation:** Quarantines high-value deals into an interactive review queue with real-time approval/rejection workflows.
- **Direct PayPal Orders v2 Sandbox Checkout:** Server-to-server integration that initiates, authorizes, and captures authentic PayPal sandbox transactions.
- **Payment-Gated Deliverable Synthesis:** Guarantees that valuable work artifacts (presentations, research dossiers, code) are unlocked only upon verified payment settlement.
- **Enterprise AG Grid & Immutable Audit Logs:** Real-time visibility into all transactions, budget commitments, and security events.

---

## How We Built It

SpendMesh AI is engineered with the MERN stack:
- **Backend:** Node.js and Express server with Helmet security headers, CORS origin enforcement, rate limiting, and 0.0.0.0 host binding for cloud deployments.
- **Database:** MongoDB Atlas with Mongoose ODM, leveraging atomic conditional operations (`$inc` and `$expr`) for race-free budget reservations.
- **AI Engine:** Google Gemini 1.5 Flash via `@google/generative-ai` for task parsing, seller bid comparisons, and deliverable generation, backed by robust deterministic fallbacks.
- **Payment Processing:** Native PayPal Orders v2 REST API integration using Axios, featuring server-side OAuth2 token caching with expiration management.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide icons, AG Grid Community for high-performance financial data grids, and React Hot Toast for micro-interactions.

---

## Challenges We Overcame

1. **Race-Free Budget Concurrency:** In autonomous agent environments, multiple agents could simultaneously issue transactions that individually fit within a budget but collectively deplete it. We solved this by implementing atomic conditional MongoDB reservations (`$expr: { $lte: [...] }`) with committed amount states.
2. **Pure Server-Side PayPal Orders v2 Flow:** Rather than relying on client-side PayPal JavaScript SDK buttons that can be tampered with or intercepted in the browser, we engineered the entire order creation, return-URL verification, and capture flow server-to-server.
3. **Resilient AI Pipeline with Safe Fallbacks:** Public LLM endpoints occasionally face rate limits or format deviations. We designed robust prompt sanitizers and deterministic fallback parsers that keep the application fully operational even in offline/mock conditions.

---

## Accomplishments We're Proud Of

- **100% Real End-to-End PayPal Sandbox Settlement:** Flawless transaction handoff from agent negotiation to PayPal's hosted checkout and server-side capture verification.
- **Bulletproof Tamper Resistance:** Live demonstration of malicious price override payloads being thwarted and audited in real time.
- **Complete Test Coverage:** 26 automated Jest unit and integration tests passing across policies, agent negotiation, payment captures, and deal lifecycles.

---

## What We Learned

- Financial guardrails for autonomous agents must be completely decoupled from client runtime and LLM prompt context; deterministic code on the server is essential for true economic trust.
- PayPal's Orders v2 REST API offers immense flexibility for agentic workflows when token caching and idempotency keys are handled properly.
- Segmented budget visualization dramatically enhances user confidence when delegating authority to autonomous systems.

---

## What's Next for SpendMesh AI

- Multi-tenant enterprise accounts with customizable policy rules per agent role.
- Integration with PayPal Subscriptions and recurring agent micro-allowances.
- Cryptographic proof-of-work receipts anchored on distributed ledgers.

---

## Built With

`react`, `node.js`, `express`, `mongodb`, `tailwind-css`, `paypal-api`, `google-gemini`, `ag-grid`, `vercel`, `render`, `javascript`, `axios`, `mongoose`

---

## Try It Out

- **Vercel Production URL:** https://spendmesh-ai.vercel.app *(Update with deployed link)*
- **Render Backend API:** https://spendmesh-api.onrender.com *(Update with deployed link)*
- **GitHub Repository:** https://github.com/vinayakpawate/spendmesh-ai *(Update with repo link)*
