# SpendMesh AI

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org)
[![PayPal Orders v2](https://img.shields.io/badge/PayPal-Orders_v2_Sandbox-0070BA.svg)](https://developer.paypal.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75C2.svg)](https://aistudio.google.com)

---

## 2. Tagline
> **The financial trust layer that stops autonomous AI agents from overspending your budget.**

---

## 3. Problem Statement

As autonomous AI agents evolve from conversational assistants into economic actors capable of procuring services, APIs, computing resources, and contracting freelancers, we encounter a fundamental security vulnerability: **How can humans safely delegate purchasing power to autonomous agents without granting them unconstrained access to financial instruments?**

Giving an AI agent direct credit card credentials or unchecked checkout authority creates immense exposure. Hallucinations, rogue loop conditions, prompt injection exploits, or seller price gouging can rapidly deplete corporate treasury pools or personal bank balances within milliseconds.

SpendMesh AI solves this by introducing a strict, zero-trust financial perimeter between autonomous agent negotiations and payment gateways like PayPal. No agent can bypass deterministic spending policies, tamper with negotiated amounts, or exceed cumulative budget thresholds.

---

## 4. Solution & Capabilities

SpendMesh AI provides 10 core architectural capabilities:
1. **Natural Language Requirement Parsing:** Google Gemini 1.5 decomposes user goals into structured service schemas and budget ceilings.
2. **Autonomous Multi-Agent Economy:** Buyer agents solicit and rank competitive proposals from specialized seller agents.
3. **Deterministic Policy Enforcement:** Inflexible server-side rules validate allowable categories, amounts, and budgets prior to payment initiation.
4. **Server-Side Price Binding:** Never trusts browser- or agent-supplied amounts; orders are generated solely using cryptographic server deal records.
5. **Race-Free Budget Reservoirs:** Atomic MongoDB `$inc` operations with `$expr` balance validation prevent concurrent overspending exploits.
6. **Active Tamper Detection:** Intercepts and logs malicious price overrides, shielding the buyer's balance while executing the genuine agreed deal.
7. **Human-in-the-Loop Escalation:** Quarantines transactions exceeding the autonomous threshold into a dedicated Approval Center.
8. **Native PayPal Orders v2 Sandbox Integration:** Server-to-server order generation and server-side capture verification.
9. **Payment-Gated Deliverable Delivery:** Work artifacts (presentations, research dossiers, code) remain strictly locked until confirmed settlement.
10. **Enterprise Financial Observability:** AG Grid data tables paired with an immutable audit log track every agent deliberation and dollar spent.

---

## 5. Live Deployments

- **Frontend Application (Vercel):** [https://spendmesh-ai.vercel.app](https://spendmesh-ai.vercel.app)
- **Backend API (Render):** [https://spendmesh-ai-api.onrender.com](https://spendmesh-ai-api.onrender.com)
- **API Health Check:** [https://spendmesh-ai-api.onrender.com/api/health](https://spendmesh-ai-api.onrender.com/api/health)

---

## 6. PayPal Sandbox Demo Credentials

When completing the test checkout on PayPal's sandbox gateway, use your PayPal Developer Sandbox Personal Buyer account:
- **Buyer Test Email:** `sb-buyer@business.example.com` *(or any Sandbox Personal Account from developer.paypal.com)*
- **Buyer Test Password:** *(From your PayPal Developer Dashboard > Testing Tools > Sandbox Accounts)*

> *Note: These credentials belong exclusively to the PayPal Developer Sandbox environment. No real money or live payment method is ever charged.*

---

## 6.1 Interactive One-Click Test Scenarios (on `/requests`)

Judges can instantly test the 4 core financial guardrails via the top scenario buttons:
1. **Standard Purchase ($400):** Gemini extracts scope &rarr; 3 seller bids evaluated &rarr; policy auto-approved &rarr; PayPal Sandbox checkout &rarr; deliverable unlocked & certified receipt generated.
2. **Price Tampering Detection:** Injects an unauthorized $800 price payload &rarr; SpendMesh detects client tampering, blocks the escalation, and enforces the authentic $400 agreed price.
3. **Human Escalation ($2,000):** Exceeds the $1,000 auto-approval threshold &rarr; quarantined to the **Approvals** queue &rarr; checkout blocked until executive sign-off.
4. **Duplicate Replay Blocked:** Replays checkout on a settled transaction &rarr; immediately blocked with HTTP 409 Conflict.

---

## 7. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, AG Grid Community, Lucide React, Axios, React Hot Toast |
| **Backend** | Node.js (v20+), Express.js, Helmet, CORS, Express Rate Limit |
| **Database** | MongoDB Atlas, Mongoose (Atomic operators `$inc`, `$expr`) |
| **AI / LLM** | Google Gemini 1.5 Flash (`@google/generative-ai`) with deterministic fallbacks |
| **Payments** | PayPal REST API (Orders v2 Sandbox) with server-side OAuth2 token caching |
| **Testing** | Jest, Supertest |

---

## 8. Project Structure

```
spendmesh-ai/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── BudgetMeter.jsx
│   │   │   ├── DealCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── ApprovalModal.jsx
│   │   │   ├── DeliverableModal.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── Approvals.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AuditLog.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   └── PaymentCancel.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── buyerAgent.js
│   │   │   └── sellerAgents.js
│   │   ├── controllers/
│   │   │   ├── agentController.js
│   │   │   ├── dealController.js
│   │   │   ├── paymentController.js
│   │   │   ├── policyController.js
│   │   │   └── auditController.js
│   │   ├── models/
│   │   │   ├── Deal.js
│   │   │   ├── Policy.js
│   │   │   ├── Payment.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── agentRoutes.js
│   │   │   ├── dealRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── policyRoutes.js
│   │   │   └── auditRoutes.js
│   │   ├── services/
│   │   │   ├── policyEngine.js
│   │   │   ├── paypalService.js
│   │   │   └── geminiService.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── app.js
│   ├── tests/
│   │   ├── policy.test.js
│   │   ├── agents.test.js
│   │   ├── payments.test.js
│   │   └── deals.test.js
│   ├── .env.example
│   └── package.json
├── DEVPOST_SUBMISSION.md
├── README.md
├── LICENSE
├── .gitignore
└── package.json
```

---

## 9. Local Setup Instructions

### Prerequisites
- Node.js version 20.0.0 or higher
- npm version 10.0.0 or higher
- A free MongoDB Atlas cluster ([mongodb.com/atlas](https://www.mongodb.com/atlas))
- A PayPal Developer account ([developer.paypal.com](https://developer.paypal.com))
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### Step-by-Step

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vinayakpawate/spendmesh-ai.git
   cd spendmesh-ai
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   npm install
   ```

3. **Configure Server Environment:**
   Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
   Fill in your credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/spendmesh?retryWrites=true&w=majority
   PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
   PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-1.5-flash
   CLIENT_URL=http://localhost:5173
   ```

4. **Configure Client Environment:**
   Copy `client/.env.example` to `client/.env`:
   ```bash
   cp client/.env.example client/.env
   ```
   Contents:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. **Start Both Applications (Frontend & Backend):**
   ```bash
   npm run dev
   ```
   - Client will run on: `http://localhost:5173`
   - Server will run on: `http://localhost:5000`

---

## 10. API Endpoint Reference Table

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check probe (Render keep-alive) |
| `POST` | `/api/agents/request` | Parses natural language task and solicits seller bids via Gemini |
| `POST` | `/api/deals` | Validates offer on server and enforces policy checks |
| `GET` | `/api/deals` | Retrieves deals list (filterable by status) |
| `GET` | `/api/deals/:id` | Retrieves a specific deal record |
| `POST` | `/api/deals/:id/approve` | Human approval/rejection of quarantined deal |
| `POST` | `/api/deals/:id/checkout` | Creates PayPal Orders v2 checkout session with server-stored amount |
| `POST` | `/api/payments/:orderId/capture` | Verifies and captures payment, releasing AI deliverable |
| `GET` | `/api/payments/cancel-status` | Reverts order state and unlocks reserved budget on user cancel |
| `GET` | `/api/policy` | Fetches user policy and live budget balances |
| `PUT` | `/api/policy` | Updates spending parameters |
| `GET` | `/api/audit` | Retrieves paginated immutable audit event records |
| `POST` | `/api/demo/reset` | Resets all test collections and restores $5,000 budget |

---

## 11. Demo Scenario Instructions

The application includes an interactive Demo Scenarios Panel accessible directly at the top of the Marketplace:

1. **Scenario 1 — Normal Purchase:**
   - Click "1. Normal Purchase" in the panel.
   - Pre-fills a $400 presentation request.
   - Evaluates bids, runs policy checks (all green), and proceeds to PayPal Sandbox checkout.
   - Captures order and reveals the synthesized presentation deliverable.
2. **Scenario 2 — Price Tampering Blocked:**
   - Click "2. Price Tampering".
   - Submits a deal for $400, but checkout injects an unauthorized body payload: `{ amount: 800 }`.
   - SpendMesh AI detects the price deviation, logs a `tamper_detected` audit event, discards the injected payload, and executes the PayPal checkout at the verified $400 amount.
3. **Scenario 3 — Human Approval Required:**
   - Click "3. Approval Required".
   - Pre-fills a $2,000 full-stack startup website request.
   - Competing bids range from $1,700–$2,000, surpassing the $1,000 autonomous threshold.
   - The Policy Engine flags `APPROVAL_REQUIRED` and routes the transaction to `/approvals` where a human reviewer can approve or reject.
4. **Scenario 4 — Duplicate Payment Blocked:**
   - Complete Scenario 1 first.
   - Click "4. Duplicate Blocked".
   - Attempts to issue duplicate checkout or re-capture on the completed deal.
   - Backend returns `HTTP 409 Conflict`, logging `duplicate_blocked` in the audit log.

---

## 12. Automated Testing

Run the comprehensive automated test suite:
```bash
npm test
```
Or directly inside the server directory:
```bash
cd server && npx jest --forceExit --detectOpenHandles
```

Output:
```
PASS tests/payments.test.js
PASS tests/deals.test.js
PASS tests/agents.test.js
PASS tests/policy.test.js

Test Suites: 4 passed, 4 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        0.684 s
Ran all test suites.
```

---

## 13. Vercel Deployment (Frontend)

1. Connect your GitHub repository on [Vercel](https://vercel.com).
2. Configure Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed Render backend (e.g. `https://spendmesh-api.onrender.com`)
4. Deploy!

---

## 14. Render Deployment (Backend)

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure Service Settings:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/app.js`
4. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `PAYPAL_CLIENT_ID`: Your PayPal sandbox client ID
   - `PAYPAL_CLIENT_SECRET`: Your PayPal sandbox client secret
   - `PAYPAL_BASE_URL`: `https://api-m.sandbox.paypal.com`
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `GEMINI_MODEL`: `gemini-1.5-flash`
   - `CLIENT_URL`: Your Vercel frontend URL
5. **Important:** The server explicitly binds to `0.0.0.0` as required for Render routing.

---

## 15. Keep-Warm Cron Setup

Render's free tier spins down idle instances after 15 minutes of inactivity. To ensure instant responses during hackathon judge reviews:
1. Register for a free account at [cron-job.org](https://cron-job.org).
2. Create a new cron job pointing to:
   `https://your-render-url.onrender.com/api/health`
3. Set schedule interval to every **10 minutes**.
4. This keeps the service warm with 200 OK responses.

---

## 16. GitHub License Setup

After creating your GitHub repository:
1. Navigate to **Settings** → **General** (or About section on repository main page).
2. Ensure the repository license is detected as **MIT License**.
3. This displays the MIT badge on the GitHub homepage, satisfying hackathon eligibility requirements.

---

## 17. Common Errors & Solutions

| Error | Root Cause | Solution |
|---|---|---|
| `FATAL: Missing required environment variables` | `server/.env` not created or missing keys | Verify all 7 required keys in `server/.env`. |
| `Failed to connect to MongoDB` | IP Access List not configured | In MongoDB Atlas, add `0.0.0.0/0` under Network Access. |
| `PayPal authentication failed` | Invalid Client ID/Secret or live endpoint used | Ensure `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com` and credentials are from Sandbox Apps. |
| `Gemini parseTask failed, using fallback` | Invalid API key or quota issue | SpendMesh AI gracefully switches to deterministic local parsing. Update `GEMINI_API_KEY`. |
| `CORS Error on frontend` | `CLIENT_URL` mismatch | Ensure `CLIENT_URL` in `server/.env` matches your Vite port (`http://localhost:5173`). |

---

## 18. Security Limitations

> **Notice:** This project is a hackathon demonstration using a hardcoded `demo-user` profile without session authentication. It is not suitable for production deployment without implementing user authentication (JWT/OAuth), role-based access control (RBAC), and verified production PayPal business accounts.

---

## 19. Sponsor Tools Attribution

- **PayPal:** Powering authentic sandbox checkout sessions and server-side capture through PayPal Orders v2 REST API.
- **Google Gemini:** Powering intelligent natural language task parsing, seller bid ranking, and structured deliverable generation with Gemini 1.5 Flash.

---

## 20. License

Released under the [MIT License](LICENSE). Copyright &copy; 2026 Vinayak Santosh Pawate.
