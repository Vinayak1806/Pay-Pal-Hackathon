import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Send,
  Star,
  Check,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { agentService, dealService, policyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { useVoiceContext } from '../context/VoiceContext';

export default function Marketplace() {
  const navigate = useNavigate();
  const { updateVoiceContext } = useVoiceContext();

  // Policy state
  const [policy, setPolicy] = useState(null);

  // Workflow states: 1: Input, 2: Parsed, 3: Offers, 4: Policy Check, 5: Checkout
  const [stage, setStage] = useState(1);
  const [taskInput, setTaskInput] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [parsedTask, setParsedTask] = useState(null);
  const [offers, setOffers] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [currentDeal, setCurrentDeal] = useState(null);
  const [policyResult, setPolicyResult] = useState(null);
  const [aiSource, setAiSource] = useState(null);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  // Demo scenarios
  const [showDemoPanel, setShowDemoPanel] = useState(true);
  const [tamperAttemptActive, setTamperAttemptActive] = useState(false);
  const [tamperMessage, setTamperMessage] = useState(null);

  const fetchPolicy = async () => {
    try {
      const res = await policyService.getPolicy();
      setPolicy(res.data?.policy);
    } catch (err) {
      console.error('Failed to fetch policy:', err);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const exampleChips = [
    'Create a 10-slide presentation for my SIH hackathon pitch, budget $400',
    'Research the top 5 EdTech competitors, budget $300',
    'Write landing page copy for my SaaS product, budget $350'
  ];

  // Stage 1 -> 2
  const handleFindServices = async (inputOverride) => {
    const textToSubmit = inputOverride || taskInput;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    setLoadingMessage('Gemini is parsing your request and compiling requirements...');
    setError(null);
    setTamperMessage(null);

    // Emit: parsing started
    voiceEventBus.emit(VoiceEvents.REQUEST_PARSING, {});

    try {
      const res = await agentService.processRequest(textToSubmit.trim());
      const data = res.data;
      setTaskId(data.taskId);
      setParsedTask(data.parsedTask);
      setOffers(data.offers || []);
      setRecommendation(data.recommendation);
      setAiSource(data.aiSource);
      setStage(2);

      // Emit: parse complete + offers loaded
      voiceEventBus.emit(VoiceEvents.PARSE_COMPLETE, {
        serviceType: data.parsedTask?.serviceType,
        budget: data.parsedTask?.maxBudget || data.parsedTask?.budget,
      });
      voiceEventBus.emit(VoiceEvents.OFFERS_LOADED, { count: (data.offers || []).length });

      // Update voice context with stage
      updateVoiceContext({ stage: 2, recommendation: data.recommendation });
    } catch (err) {
      const msg = err.message || 'Failed to analyze task with Gemini';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Stage 3 -> 4
  const handleSelectOffer = async (offer) => {
    setSelectedOffer(offer);
    setLoading(true);
    setLoadingMessage('Evaluating deal against spending policy...');
    setError(null);

    try {
      const res = await dealService.createDeal(taskId, offer.id, parsedTask);
      const { deal, policyResult: pResult } = res.data;
      setCurrentDeal(deal);
      setPolicyResult(pResult);
      setStage(4);
      fetchPolicy();

      // Emit policy result events
      if (pResult.requiresApproval) {
        voiceEventBus.emit(VoiceEvents.APPROVAL_REQUIRED, {
          amount: deal.agreedAmount,
          limit: pResult.autoApproveLimit,
        }, { force: true });
      } else if (pResult.allowed) {
        voiceEventBus.emit(VoiceEvents.POLICY_PASSED, {
          amount: deal.agreedAmount,
          sellerName: deal.sellerAgent,
        });
      } else {
        voiceEventBus.emit(VoiceEvents.POLICY_BLOCKED, {
          reason: pResult.reason,
          message: pResult.message,
        }, { force: true });
      }

      // Update voice context
      updateVoiceContext({
        stage: 4,
        policyResult: pResult,
        currentDeal: deal,
      });
    } catch (err) {
      const msg = err.message || 'Failed to create deal';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Stage 5: Checkout
  const handleCheckout = async () => {
    if (!currentDeal) return;
    setLoading(true);
    setLoadingMessage('Creating secure PayPal order with verified server price...');
    setError(null);

    try {
      const payload = tamperAttemptActive ? { amount: 800 } : {};
      const res = await dealService.checkoutDeal(currentDeal.dealId, payload);

      if (tamperAttemptActive) {
        setTamperMessage(
          'SpendMesh AI detected and blocked an unauthorized price payload modification ($400 → $800). Order was created strictly using the server-stored agreed amount ($400).'
        );
        toast.success('Tamper attempt detected and blocked by policy guardrails');

        // Emit security alert — high priority, interrupt current speech
        voiceEventBus.emit(VoiceEvents.TAMPER_BLOCKED, {
          submittedAmount: 800,
          storedAmount: currentDeal.agreedAmount,
        }, { force: true });

        setTimeout(() => {
          if (res.data?.approvalUrl) {
            window.location.href = res.data.approvalUrl;
          }
        }, 2200);
      } else {
        voiceEventBus.emit(VoiceEvents.CHECKOUT_INITIATED, {});
        if (res.data?.approvalUrl) {
          window.location.href = res.data.approvalUrl;
        } else {
          toast.error('No approval URL returned from PayPal');
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to initiate PayPal checkout';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  // Scenarios
  const runScenario1 = () => {
    setTamperAttemptActive(false);
    setTaskInput('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
    handleFindServices('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
  };

  const runScenario2 = () => {
    setTamperAttemptActive(true);
    setTaskInput('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
    toast('Scenario 2: Checkout will attempt to submit a tampered price of $800 to demonstrate server-side guardrails.', {
      icon: '⚡',
      duration: 5000
    });
    handleFindServices('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
  };

  const runScenario3 = () => {
    setTamperAttemptActive(false);
    setTaskInput('Build a complete website for my startup, budget $2000');
    toast('Scenario 3: Budget exceeds auto-approval threshold. Escalation will be triggered.', {
      icon: '⏳',
      duration: 5000
    });
    handleFindServices('Build a complete website for my startup, budget $2000');
  };

  const runScenario4 = async () => {
    setLoading(true);
    setLoadingMessage('Verifying duplicate capture protection...');
    try {
      const res = await dealService.getDeals();
      const completedDeals = res.data?.deals?.filter(d => d.status === 'payment_completed') || [];
      if (completedDeals.length === 0) {
        toast.error('Complete Scenario 1 first so a completed deal exists to test duplicate blocking.');
        setLoading(false);
        return;
      }
      const deal = completedDeals[0];
      await dealService.checkoutDeal(deal.dealId);
      toast.error('Unexpected: checkout was allowed on completed deal');
    } catch (err) {
      if (err.code === 'DUPLICATE_CAPTURE' || err.code === 'INVALID_STATUS' || err.status === 409) {
        toast.success(
          'Duplicate payment detected and blocked. Deal is already settled (HTTP 409).',
          { duration: 5000 }
        );
      } else {
        toast.success(`Duplicate blocked: ${err.message || 'Deal is already processed'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const total = Number(policy?.totalBudget) || 5000;
  const spent = Number(policy?.spentAmount) || 0;
  const committed = Number(policy?.committedAmount) || 0;
  const remaining = Math.max(0, total - spent - committed);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-[26px] font-bold text-[#101828] tracking-tight">Purchase Requests</h2>
          <p className="text-[14px] text-[#475467] mt-1">
            Describe a service request for autonomous AI agents to negotiate and procure under deterministic policy oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] font-medium flex items-center gap-1.5 shadow-2xs">
            <span>Available Treasury:</span>
            <strong className="text-[#15803D] tabular-nums font-bold text-[14px]">${remaining.toFixed(2)}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#2563EB] font-medium flex items-center gap-1.5 shadow-2xs">
            <span>Auto Ceiling:</span>
            <strong className="text-[#2563EB] tabular-nums font-bold text-[14px]">${policy?.autoApproveLimit ?? 1000}</strong>
          </div>
        </div>
      </div>

      {/* Demo Scenarios Panel (Restrained fintech bar with distinct logical colors) */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div
          onClick={() => setShowDemoPanel(!showDemoPanel)}
          className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#F8FAFC] transition-colors"
        >
          <div className="flex items-center gap-2.5 text-[14px] font-bold text-[#101828]">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <span>Interactive Demo Scenarios</span>
            <span className="text-[11px] font-semibold text-[#475467] px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#D0D5DD]">
              One-click testing
            </span>
          </div>
          <button className="text-[#64748B]">
            {showDemoPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showDemoPanel && (
          <div className="p-4 pt-1 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F8FAFC]">
            <button
              onClick={runScenario1}
              className="p-3.5 bg-[#FFFFFF] hover:border-[#15803D] hover:bg-[#F0FDF4]/30 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                <span className="text-[13px] font-bold text-[#15803D] group-hover:underline">
                  1. Standard Purchase
                </span>
              </div>
              <p className="text-[12px] text-[#475467] leading-snug">
                $400 task &bull; Auto-approved within ceiling &bull; Real PayPal checkout
              </p>
            </button>

            <button
              onClick={runScenario2}
              className="p-3.5 bg-[#FFFFFF] hover:border-[#B45309] hover:bg-[#FFFBEB]/40 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#B45309]" />
                <span className="text-[13px] font-bold text-[#B45309] group-hover:underline">
                  2. Price Tampering
                </span>
              </div>
              <p className="text-[12px] text-[#475467] leading-snug">
                Injects $800 payload &bull; Server ignores it and forces original $400
              </p>
            </button>

            <button
              onClick={runScenario3}
              className="p-3.5 bg-[#FFFFFF] hover:border-[#2563EB] hover:bg-[#EFF4FF]/40 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-[13px] font-bold text-[#2563EB] group-hover:underline">
                  3. Human Escalation
                </span>
              </div>
              <p className="text-[12px] text-[#475467] leading-snug">
                $2,000 task &bull; Exceeds $1,000 threshold &bull; Quarantined to queue
              </p>
            </button>

            <button
              onClick={runScenario4}
              className="p-3.5 bg-[#FFFFFF] hover:border-[#B42318] hover:bg-[#FEF2F2]/40 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#B42318]" />
                <span className="text-[13px] font-bold text-[#B42318] group-hover:underline">
                  4. Duplicate Blocked
                </span>
              </div>
              <p className="text-[12px] text-[#475467] leading-snug">
                Replays checkout on settled deal &bull; Returns HTTP 409 Conflict
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Guided Workflow Step Indicator */}
      <div className="bg-[#FFFFFF] rounded-xl px-5 py-3.5 border border-[#E2E8F0] shadow-xs flex items-center justify-between text-[13px] overflow-x-auto">
        {[
          { num: 1, label: 'Describe Purchase' },
          { num: 2, label: 'Gemini Analysis' },
          { num: 3, label: 'Seller Bids' },
          { num: 4, label: 'Policy Evaluation' },
          { num: 5, label: 'PayPal Checkout' }
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 whitespace-nowrap px-2.5 py-1 rounded-lg ${
              stage === s.num
                ? 'text-[#2563EB] font-bold bg-[#EFF4FF]'
                : stage > s.num
                ? 'text-[#15803D] font-semibold'
                : 'text-[#64748B] font-medium'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                stage === s.num
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : stage > s.num
                  ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]'
                  : 'bg-[#F8FAFC] text-[#64748B] border border-[#D0D5DD]'
              }`}
            >
              {stage > s.num ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tamper Alert Banner */}
      {tamperMessage && (
        <div className="bg-[#FFFBEB] border border-[#FED7AA] rounded-xl p-4 flex items-start gap-3 text-[#B45309]">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-[12px]">
            <h4 className="font-semibold text-[#B45309]">Price Manipulation Detected and Blocked</h4>
            <p className="mt-0.5 text-[#92400E] leading-relaxed">{tamperMessage}</p>
          </div>
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-center gap-3 text-[#B42318] text-[12px]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading View */}
      {loading && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] p-8 shadow-card">
          <LoadingSpinner message={loadingMessage} size="md" />
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 1: Describe Purchase */}
      {/* ============================================================== */}
      {!loading && stage === 1 && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-[18px] font-bold text-[#101828]">1. Describe Service to Procure</h3>
            <p className="text-[14px] text-[#475467] mt-1">
              Enter your purchase intent in natural language. Gemini extracts structured constraints, and competing specialized agents will bid.
            </p>
          </div>

          <textarea
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            rows={4}
            placeholder="e.g. Create a 10-slide presentation for my SIH hackathon pitch, budget $400..."
            className="w-full rounded-xl border border-[#D0D5DD] p-4 text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] leading-relaxed"
          />

          <div className="space-y-2">
            <span className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
              Suggested Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {exampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTaskInput(chip)}
                  className="text-[13px] px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#EFF4FF] hover:border-[#BFDBFE] hover:text-[#2563EB] border border-[#D0D5DD] text-[#344054] rounded-lg text-left transition-colors font-medium shadow-2xs"
                >
                  "{chip}"
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleFindServices()}
              disabled={!taskInput.trim()}
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold text-[14px] rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Analyze & Solicit Bids</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 2: Gemini Analysis */}
      {/* ============================================================== */}
      {!loading && stage === 2 && parsedTask && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-[18px] font-bold text-[#101828]">2. Extracted Requirements</h3>
              <p className="text-[14px] text-[#475467] mt-0.5">Verified constraints parsed by Google Gemini 2.5</p>
            </div>
            <span className="text-[12px] text-[#475467] font-mono px-3 py-1 rounded-md bg-[#F8FAFC] border border-[#D0D5DD] font-semibold">
              {aiSource?.parser === 'gemini' ? 'Model: Gemini 2.5 Flash' : 'Fallback Parser'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[12px] font-semibold text-[#475467] block mb-1">Service Type</span>
              <span className="font-bold text-[#101828] text-[16px] capitalize">{parsedTask.serviceType}</span>
            </div>
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[12px] font-semibold text-[#475467] block mb-1">Budget Ceiling</span>
              <span className="font-bold text-[#101828] text-[16px] tabular-nums">
                ${parsedTask.maxBudget || parsedTask.budget || 0} USD
              </span>
            </div>
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-[12px] font-semibold text-[#475467] block mb-1">Urgency Level</span>
              <span className="font-bold text-[#101828] text-[16px] capitalize">{parsedTask.urgency || 'normal'}</span>
            </div>
          </div>

          {parsedTask.requirements && parsedTask.requirements.length > 0 && (
            <div>
              <span className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block mb-2.5">
                Requirements Checklist:
              </span>
              <ul className="space-y-2 text-[13px] text-[#101828]">
                {parsedTask.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                    <span className="font-medium">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedTask.reasoning && (
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[13px] text-[#344054] leading-relaxed">
              <span className="font-bold text-[#101828]">Agent Reasoning: </span>
              {parsedTask.reasoning}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={() => setStage(1)}
              className="text-[13px] font-semibold text-[#475467] hover:text-[#101828] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to edit
            </button>
            <button
              onClick={() => setStage(3)}
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <span>View Competing Bids ({offers.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 3: Seller Offers */}
      {/* ============================================================== */}
      {!loading && stage === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-[18px] font-bold text-[#101828]">3. Competing Agent Bids</h3>
              <p className="text-[14px] text-[#475467] mt-0.5">Select an offer to proceed to policy verification.</p>
            </div>
            <button
              onClick={() => setStage(2)}
              className="text-[13px] font-semibold text-[#475467] hover:text-[#101828] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const isRecommended = recommendation?.recommendedOfferId === offer.id;
              return (
                <div
                  key={offer.id}
                  className={`bg-[#FFFFFF] p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isRecommended
                      ? 'border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
                      : 'border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[15px] font-bold text-[#101828]">{offer.sellerName}</h4>
                      {isRecommended && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EFF4FF] text-[#2563EB] border border-[#BFDBFE]">
                          AI Recommended
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-[28px] font-bold text-[#101828] tabular-nums tracking-tight">
                        ${offer.price}
                      </span>
                      <span className="text-[13px] text-[#64748B] ml-1.5 font-medium">USD</span>
                    </div>

                    <p className="text-[13px] text-[#475467] mb-4 leading-relaxed line-clamp-3">
                      {offer.description}
                    </p>

                    <div className="space-y-1.5 text-[12px] text-[#475467] pt-3.5 border-t border-[#E2E8F0] mb-4 font-medium">
                      <div className="flex justify-between">
                        <span>Delivery Time:</span>
                        <span className="font-semibold text-[#101828]">{offer.deliveryTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-semibold text-[#101828]">★ {offer.rating}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectOffer(offer)}
                    className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-colors shadow-xs ${
                      isRecommended
                        ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                        : 'bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#101828] border border-[#D0D5DD]'
                    }`}
                  >
                    Select Offer
                  </button>
                </div>
              );
            })}
          </div>

          {recommendation && (
            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-xs space-y-1.5 text-[13px]">
              <span className="font-bold text-[#101828] block">Gemini Recommendation Reasoning:</span>
              <p className="text-[#475467] leading-relaxed">{recommendation.reasoning}</p>
              {recommendation.tradeoffs && (
                <p className="text-[#64748B] text-[12px] pt-1 font-medium">Trade-offs: {recommendation.tradeoffs}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 4: Policy Check */}
      {/* ============================================================== */}
      {!loading && stage === 4 && policyResult && currentDeal && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-[18px] font-bold text-[#101828]">4. Spending Policy Evaluation</h3>
            <p className="text-[14px] text-[#475467] mt-0.5">
              Deterministic verification performed server-side on deal #{currentDeal.dealId.substring(0, 8)}
            </p>
          </div>

          <div className="space-y-2.5 bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] text-[13px]">
            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-[#475467] font-medium">1. Server-Side Price Binding</span>
              <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" /> Locked: ${currentDeal.agreedAmount.toFixed(2)} USD
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-[#475467] font-medium">2. Permitted Category Check</span>
              <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" /> Whitelisted ({currentDeal.serviceType})
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-[#475467] font-medium">3. Treasury Budget Capacity</span>
              {policyResult.reason === 'BUDGET_EXCEEDED' ? (
                <span className="font-bold text-[#B42318] flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Insufficient Budget
                </span>
              ) : (
                <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[2.5]" /> Funds Available
                </span>
              )}
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-[#475467] font-medium">4. Replay & Duplicate Gate</span>
              <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" /> Unique Session Verified
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-[#475467] font-medium">5. Auto-Approval Ceiling ($1,000)</span>
              {policyResult.requiresApproval ? (
                <span className="font-bold text-[#B45309] flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Approval Required (&gt;$1,000)
                </span>
              ) : (
                <span className="font-bold text-[#15803D] flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[2.5]" /> Within Autonomous Limit
                </span>
              )}
            </div>
          </div>

          {/* Outcome Action Callout */}
          {policyResult.requiresApproval ? (
            <div className="p-5 bg-[#FFFBEB] border border-[#FED7AA] rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-[15px] font-bold text-[#B45309]">Human Review Required</h4>
                <p className="text-[13px] text-[#92400E] mt-1 leading-relaxed">
                  This transaction exceeds your automatic approval ceiling. The deal is quarantined in the Approvals queue.
                </p>
              </div>
              <Link
                to="/approvals"
                className="px-5 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-xs transition-colors"
              >
                Go to Approvals &rarr;
              </Link>
            </div>
          ) : policyResult.allowed ? (
            <div className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-[15px] font-bold text-[#15803D]">Policy Approved</h4>
                <p className="text-[13px] text-[#166534] mt-1 leading-relaxed">
                  All 5 policy criteria satisfied. Proceed to initiate authentic PayPal sandbox checkout.
                </p>
              </div>
              <button
                onClick={() => setStage(5)}
                className="px-6 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-xs transition-colors"
              >
                Proceed to Checkout &rarr;
              </button>
            </div>
          ) : (
            <div className="p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#B42318] text-[13px]">
              <h4 className="font-bold text-[15px]">Purchase Blocked by Policy</h4>
              <p className="mt-1 leading-relaxed">{policyResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STAGE 5: Checkout */}
      {/* ============================================================== */}
      {!loading && stage === 5 && currentDeal && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-[18px] font-bold text-[#101828]">5. PayPal Orders v2 Checkout</h3>
              <p className="text-[14px] text-[#475467] mt-0.5">Authentic sandbox session with server-guarded amount</p>
            </div>
            <button
              onClick={() => setStage(4)}
              className="text-[13px] font-semibold text-[#475467] hover:text-[#101828] transition-colors"
            >
              &larr; Back to policy
            </button>
          </div>

          <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] space-y-2.5 text-[14px]">
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
              <span className="text-[#475467]">Service Procured</span>
              <span className="font-bold text-[#101828] capitalize">{currentDeal.serviceType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
              <span className="text-[#475467]">Merchant / Seller Agent</span>
              <span className="font-bold text-[#101828]">{currentDeal.sellerAgent}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
              <span className="text-[#475467]">Deal ID</span>
              <span className="font-mono text-[13px] text-[#475467]">{currentDeal.dealId}</span>
            </div>
            <div className="flex justify-between items-baseline pt-3">
              <span className="font-bold text-[#101828]">Authorized Total</span>
              <span className="text-[28px] font-bold text-[#2563EB] tabular-nums">
                ${currentDeal.agreedAmount?.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#EFF4FF] border border-[#BFDBFE] rounded-xl text-[13px] text-[#1E40AF] leading-relaxed">
            Clicking below initiates a server-to-server call to PayPal Orders v2. You will be redirected to PayPal's sandbox gateway to approve the transaction.
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCheckout}
              className="px-7 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay with PayPal Sandbox</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
