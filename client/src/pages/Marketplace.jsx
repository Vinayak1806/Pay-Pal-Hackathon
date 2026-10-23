import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  History,
  Edit3,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Mic,
  X
} from 'lucide-react';
import { agentService, dealService, policyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { useVoiceContext } from '../context/VoiceContext';

const SERVICE_CATEGORIES = [
  { value: 'presentation', label: 'Presentation & Pitch Decks' },
  { value: 'research', label: 'Research & Competitor Analysis' },
  { value: 'website', label: 'Web & Landing Page Development' },
  { value: 'content', label: 'Content Strategy & Copywriting' },
  { value: 'design', label: 'Visual Design & Brand Identity' }
];

export default function Marketplace() {
  const { updateVoiceContext } = useVoiceContext();

  // Active top tab: 'workflow' | 'history'
  const [activeTab, setActiveTab] = useState('workflow');

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

  // Requirements & Scope Editing State (for Stage 2)
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [editServiceType, setEditServiceType] = useState('presentation');
  const [editBudget, setEditBudget] = useState(400);
  const [editUrgency, setEditUrgency] = useState('normal');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirements, setEditRequirements] = useState([]);
  const [newReqInput, setNewReqInput] = useState('');

  // Persistent User Request History
  const [requestHistory, setRequestHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('spendmesh_request_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all');

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast('Listening... Speak your procurement request now', { icon: '🎙️', duration: 3000 });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setTaskInput(prev => (prev ? `${prev.trim()} ${transcript}` : transcript));
          toast.success('Voice captured!');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
    }
  };

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  // Demo scenarios
  const [showDemoPanel, setShowDemoPanel] = useState(true);
  const [tamperAttemptActive, setTamperAttemptActive] = useState(false);
  const [tamperMessage, setTamperMessage] = useState(null);

  // Helper to persist and update history items
  const updateHistoryItem = (item) => {
    setRequestHistory(prev => {
      const existingIdx = prev.findIndex(h => (item.taskId && h.taskId === item.taskId) || (item.id && h.id === item.id));
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...item,
          updatedAt: new Date().toISOString()
        };
      } else {
        const newItem = {
          id: item.id || `req_${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...item
        };
        updated = [newItem, ...prev];
      }
      try {
        localStorage.setItem('spendmesh_request_history', JSON.stringify(updated.slice(0, 50)));
      } catch (e) {
        console.error('Failed to save request history to localStorage:', e);
      }
      return updated;
    });
  };

  const deleteHistoryItem = (idToDelete) => {
    setRequestHistory(prev => {
      const filtered = prev.filter(item => item.id !== idToDelete && item.taskId !== idToDelete);
      try {
        localStorage.setItem('spendmesh_request_history', JSON.stringify(filtered));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
      return filtered;
    });
    toast.success('Request removed from history');
  };

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear your local purchase request history?')) {
      setRequestHistory([]);
      try {
        localStorage.removeItem('spendmesh_request_history');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      toast.success('Request history cleared');
    }
  };

  const fetchPolicy = async () => {
    try {
      const [polRes, dealsRes] = await Promise.all([
        policyService.getPolicy(),
        dealService.getDeals().catch(() => ({ data: { deals: [] } }))
      ]);
      setPolicy(polRes.data?.policy);

      // Merge backend deals into request history if they are missing
      const backendDeals = dealsRes.data?.deals || [];
      if (backendDeals.length > 0) {
        setRequestHistory(prev => {
          let updated = [...prev];
          let changed = false;
          backendDeals.forEach(deal => {
            const exists = updated.some(h => h.taskId === deal.taskId || h.dealId === deal.dealId);
            if (!exists) {
              changed = true;
              updated.push({
                id: `deal_${deal.dealId}`,
                taskId: deal.taskId,
                dealId: deal.dealId,
                prompt: deal.description || `${deal.serviceType} procurement`,
                serviceType: deal.serviceType,
                budget: deal.agreedAmount,
                urgency: 'normal',
                requirements: [],
                description: deal.geminiReasoning || deal.description,
                status: deal.status,
                createdAt: deal.createdAt || new Date().toISOString()
              });
            } else {
              // Update status if changed in backend
              const idx = updated.findIndex(h => h.taskId === deal.taskId || h.dealId === deal.dealId);
              if (idx >= 0 && updated[idx].status !== deal.status) {
                changed = true;
                updated[idx] = { ...updated[idx], status: deal.status, dealId: deal.dealId };
              }
            }
          });
          if (changed) {
            try {
              localStorage.setItem('spendmesh_request_history', JSON.stringify(updated.slice(0, 50)));
            } catch (e) {
              // ignore
            }
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to fetch policy/deals:', err);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const exampleChips = [
    { label: 'Pitch Deck ($400)', category: 'Presentation', prompt: 'Create an institutional Series A investor pitch deck with TAM modeling and unit economics, budget $400' },
    { label: 'FinTech Microservice ($850)', category: 'Engineering', prompt: 'Architect a high-concurrency FinTech payment microservice with PayPal Orders v2 escrow and SHA-256 audit ledger, budget $850' },
    { label: 'Security Audit ($450)', category: 'Security', prompt: 'Conduct an automated zero-trust security audit and penetration test on our agent procurement API, budget $450' },
    { label: 'RAG Pipeline ($650)', category: 'AI Architecture', prompt: 'Engineer an enterprise RAG knowledge pipeline with semantic vector search, caching, and SLA benchmarking, budget $650' },
    { label: 'Competitor Analysis ($300)', category: 'Research', prompt: 'Research the top 5 EdTech competitors with SWOT framework, market sizing, and pricing models, budget $300' },
    { label: 'SaaS Landing Page ($500)', category: 'Web Design', prompt: 'Develop a responsive SaaS landing page with dark-mode analytics dashboard and PayPal checkout, budget $500' }
  ];

  // Stage 1 -> 2: Find & Parse Services
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

      // Initialize edit fields with parsed data
      setEditServiceType(data.parsedTask?.serviceType || 'presentation');
      setEditBudget(data.parsedTask?.maxBudget || data.parsedTask?.budget || 0);
      setEditUrgency(data.parsedTask?.urgency || 'normal');
      setEditDescription(data.parsedTask?.reasoning || textToSubmit.trim());
      setEditRequirements(
        Array.isArray(data.parsedTask?.requirements) ? [...data.parsedTask.requirements] : []
      );
      setIsEditingRequirements(false);

      // Record in persistent history
      updateHistoryItem({
        taskId: data.taskId,
        prompt: textToSubmit.trim(),
        serviceType: data.parsedTask?.serviceType || 'presentation',
        budget: data.parsedTask?.maxBudget || data.parsedTask?.budget || 0,
        urgency: data.parsedTask?.urgency || 'normal',
        requirements: data.parsedTask?.requirements || [],
        description: data.parsedTask?.reasoning || textToSubmit.trim(),
        status: 'analyzed',
        offerCount: (data.offers || []).length
      });

      setStage(2);

      // Emit: parse complete with offers count (single fast narration)
      voiceEventBus.emit(VoiceEvents.PARSE_COMPLETE, {
        serviceType: data.parsedTask?.serviceType,
        budget: data.parsedTask?.maxBudget || data.parsedTask?.budget,
        count: (data.offers || []).length,
      });

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

  // Stage 2: Save custom requirements or re-solicit bids
  const handleSaveRequirements = async (shouldResolicit = false) => {
    const cleanRequirements = editRequirements.filter(r => r && r.trim().length > 0);
    const updatedParsedTask = {
      ...parsedTask,
      taskId,
      serviceType: editServiceType,
      maxBudget: Number(editBudget) || 100,
      urgency: editUrgency,
      reasoning: editDescription || parsedTask?.reasoning || 'Customized requirements',
      requirements: cleanRequirements
    };

    setParsedTask(updatedParsedTask);

    if (shouldResolicit) {
      setLoading(true);
      setLoadingMessage('Re-soliciting seller agent bids for your updated scope...');
      try {
        const res = await agentService.processRequest(null, updatedParsedTask, taskId);
        const data = res.data;
        setOffers(data.offers || []);
        setRecommendation(data.recommendation);
        setAiSource(data.aiSource);
        setIsEditingRequirements(false);

        // Update persistent history
        updateHistoryItem({
          taskId,
          serviceType: updatedParsedTask.serviceType,
          budget: updatedParsedTask.maxBudget,
          urgency: updatedParsedTask.urgency,
          requirements: updatedParsedTask.requirements,
          description: updatedParsedTask.reasoning,
          status: 'bids_updated',
          offerCount: (data.offers || []).length
        });

        toast.success('Requirements updated! New bids generated.');
        setStage(3); // Advance to bids view
      } catch (err) {
        toast.error(err.message || 'Failed to re-solicit bids');
      } finally {
        setLoading(false);
      }
    } else {
      setIsEditingRequirements(false);
      updateHistoryItem({
        taskId,
        serviceType: updatedParsedTask.serviceType,
        budget: updatedParsedTask.maxBudget,
        urgency: updatedParsedTask.urgency,
        requirements: updatedParsedTask.requirements,
        description: updatedParsedTask.reasoning
      });
      toast.success('Scope and requirements saved.');
    }
  };

  // Add a new requirement to checklist
  const handleAddRequirement = (e) => {
    e?.preventDefault();
    if (!newReqInput.trim()) return;
    setEditRequirements(prev => [...prev, newReqInput.trim()]);
    setNewReqInput('');
  };

  // Remove a requirement from checklist
  const handleRemoveRequirement = (index) => {
    setEditRequirements(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update a single requirement text
  const handleEditRequirementChange = (index, value) => {
    setEditRequirements(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  // Stage 3 -> 4: Select an offer
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

      // Update history with deal
      updateHistoryItem({
        taskId,
        dealId: deal.dealId,
        agreedAmount: deal.agreedAmount,
        sellerAgent: deal.sellerAgent,
        status: pResult.requiresApproval ? 'pending_approval' : pResult.allowed ? 'approved' : 'blocked'
      });

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

      updateHistoryItem({
        taskId,
        dealId: currentDeal.dealId,
        status: 'checkout_created'
      });

      if (tamperAttemptActive) {
        setTamperMessage(
          'SpendMesh AI detected and blocked an unauthorized price payload modification ($400 → $800). Order was created strictly using the server-stored agreed amount ($400).'
        );
        toast.success('Tamper attempt detected and blocked by policy guardrails');

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

  // Re-run or clone request from history
  const handleRerunFromHistory = (item, autoAnalyze = false) => {
    setActiveTab('workflow');
    const promptText = item.prompt || item.description || '';
    setTaskInput(promptText);
    if (autoAnalyze && promptText) {
      handleFindServices(promptText);
    } else {
      setStage(1);
      toast('Prompt loaded into workflow. You can edit before submitting.', { icon: '📝' });
    }
  };

  // Load directly into Stage 2 for direct requirement tweaking
  const handleLoadAndCustomize = (item) => {
    setActiveTab('workflow');
    setTaskId(item.taskId || `task_${Date.now()}`);
    const taskObj = {
      taskId: item.taskId || `task_${Date.now()}`,
      serviceType: item.serviceType || 'presentation',
      maxBudget: item.budget || 400,
      urgency: item.urgency || 'normal',
      requirements: item.requirements || [],
      reasoning: item.description || item.prompt || ''
    };
    setParsedTask(taskObj);
    setEditServiceType(taskObj.serviceType);
    setEditBudget(taskObj.maxBudget);
    setEditUrgency(taskObj.urgency);
    setEditDescription(taskObj.reasoning);
    setEditRequirements([...taskObj.requirements]);
    setIsEditingRequirements(true);
    setStage(2);
    toast.success('Loaded requirements into Editor. Adjust parameters and solicit bids.');
  };

  // Scenarios
  const runScenario1 = () => {
    setActiveTab('workflow');
    setTamperAttemptActive(false);
    setTaskInput('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
    handleFindServices('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
  };

  const runScenario2 = () => {
    setActiveTab('workflow');
    setTamperAttemptActive(true);
    setTaskInput('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
    toast('Scenario 2: Checkout will attempt to submit a tampered price of $800 to demonstrate server-side guardrails.', {
      icon: '⚡',
      duration: 5000
    });
    handleFindServices('Create a 10-slide presentation for my SIH hackathon pitch, budget $400');
  };

  const runScenario3 = () => {
    setActiveTab('workflow');
    setTamperAttemptActive(false);
    setTaskInput('Build a complete website for my startup, budget $2000');
    toast('Scenario 3: Budget exceeds auto-approval threshold. Escalation will be triggered.', {
      icon: '⏳',
      duration: 5000
    });
    handleFindServices('Build a complete website for my startup, budget $2000');
  };

  const runScenario4 = async () => {
    setActiveTab('workflow');
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

  // Filtered Request History
  const filteredHistory = requestHistory.filter(item => {
    const query = historySearch.toLowerCase();
    const matchesSearch = !query ||
      (item.prompt && item.prompt.toLowerCase().includes(query)) ||
      (item.serviceType && item.serviceType.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.dealId && item.dealId.toLowerCase().includes(query));

    const matchesCategory = historyCategoryFilter === 'all' || item.serviceType === historyCategoryFilter;
    return matchesSearch && matchesCategory;
  });

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

      {/* Primary Navigation Tabs: Workflow vs Request History */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0]">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-all ${
              activeTab === 'workflow'
                ? 'border-[#2563EB] text-[#2563EB] bg-[#EFF4FF]/40 rounded-t-lg'
                : 'border-transparent text-[#64748B] hover:text-[#101828] hover:border-[#CBD5E1]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Procurement Workflow</span>
            {stage > 1 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white">
                Stage {stage}/5
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-[#2563EB] text-[#2563EB] bg-[#EFF4FF]/40 rounded-t-lg'
                : 'border-transparent text-[#64748B] hover:text-[#101828] hover:border-[#CBD5E1]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Request History</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475467] border border-[#E2E8F0]">
              {requestHistory.length}
            </span>
          </button>
        </div>

        {activeTab === 'workflow' && stage > 1 && (
          <button
            onClick={() => {
              setStage(1);
              setIsEditingRequirements(false);
            }}
            className="text-[12px] font-semibold text-[#64748B] hover:text-[#2563EB] flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start New Request
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* REQUEST HISTORY VIEW */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Header & Search Toolbar */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-bold text-[#101828] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#2563EB]" />
                  <span>Logged Purchase Requests</span>
                </h3>
                <p className="text-[13px] text-[#475467] mt-0.5">
                  Browse, review, and re-run all previous AI procurement inquiries and negotiated scopes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {requestHistory.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-[12px] font-semibold text-[#B42318] hover:bg-[#FEF2F2] border border-[#FECACA] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear History
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab('workflow');
                    setStage(1);
                  }}
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> New Request
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#F1F5F9]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search past requests by prompt, category, or deal ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-[13px] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>

              <select
                value={historyCategoryFilter}
                onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="px-3 py-2 text-[13px] border border-[#D0D5DD] rounded-lg bg-white text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">All Service Categories</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* History Cards / Empty State */}
          {filteredHistory.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
              <History className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
              <h4 className="text-[16px] font-bold text-[#101828]">No Purchase Requests Found</h4>
              <p className="text-[14px] text-[#475467] max-w-md mx-auto mt-1 mb-5">
                {requestHistory.length === 0
                  ? 'Your procurement requests will be automatically recorded here so you can review requirements or re-run them anytime.'
                  : 'No past requests match your current search criteria.'}
              </p>
              <button
                onClick={() => {
                  setActiveTab('workflow');
                  setStage(1);
                }}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Start a Procurement Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item, index) => {
                const categoryLabel = SERVICE_CATEGORIES.find(c => c.value === item.serviceType)?.label || item.serviceType;
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Recent';

                return (
                  <div
                    key={item.id || item.taskId || index}
                    className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="font-semibold text-[#64748B] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {dateStr}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#2563EB] font-bold border border-[#BFDBFE] capitalize">
                          {item.serviceType || 'Service'}
                        </span>
                        {item.budget && (
                          <span className="px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#15803D] font-bold border border-[#BBF7D0]">
                            ${Number(item.budget).toFixed(2)} USD
                          </span>
                        )}
                        {item.status && (
                          <StatusBadge status={item.status} size="sm" />
                        )}
                        {item.dealId && (
                          <span className="font-mono text-[11px] text-[#64748B]">
                            Deal #{item.dealId.substring(0, 8)}
                          </span>
                        )}
                      </div>

                      <p className="text-[14px] font-semibold text-[#101828] leading-snug">
                        {item.prompt || item.description}
                      </p>

                      {item.requirements && item.requirements.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[#64748B] uppercase">Scope:</span>
                          {item.requirements.slice(0, 3).map((req, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-[11px] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#344054] truncate max-w-[200px]"
                            >
                              &bull; {req}
                            </span>
                          ))}
                          {item.requirements.length > 3 && (
                            <span className="text-[11px] text-[#64748B] font-medium">
                              +{item.requirements.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <button
                        onClick={() => handleLoadAndCustomize(item)}
                        className="px-3.5 py-2 text-[12px] font-semibold text-[#2563EB] bg-[#EFF4FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-colors flex items-center gap-1.5"
                        title="Edit extracted constraints and budget before soliciting bids"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Scope</span>
                      </button>

                      <button
                        onClick={() => handleRerunFromHistory(item, false)}
                        className="px-3.5 py-2 text-[12px] font-semibold text-[#101828] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D0D5DD] rounded-lg transition-colors flex items-center gap-1.5"
                        title="Load prompt into stage 1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clone</span>
                      </button>

                      <button
                        onClick={() => handleRerunFromHistory(item, true)}
                        className="px-4 py-2 text-[12px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        title="Re-run Gemini analysis immediately"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-run</span>
                      </button>

                      <button
                        onClick={() => deleteHistoryItem(item.id || item.taskId)}
                        className="p-2 text-[#94A3B8] hover:text-[#B42318] hover:bg-[#FEF2F2] rounded-lg border border-transparent hover:border-[#FECACA] transition-colors"
                        title="Remove from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* WORKFLOW TAB CONTENT */}
      {/* ============================================================== */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {/* Demo Scenarios Panel */}
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
                      1. Standard Purchase ($400)
                    </span>
                  </div>
                  <p className="text-[12px] text-[#475467] leading-snug">
                    Auto-cleared by policy &bull; Real PayPal Sandbox checkout &bull; Instant deliverable
                  </p>
                </button>

                <button
                  onClick={runScenario2}
                  className="p-3.5 bg-[#FFFFFF] hover:border-[#B45309] hover:bg-[#FFFBEB]/40 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#B45309]" />
                    <span className="text-[13px] font-bold text-[#B45309] group-hover:underline">
                      2. Price Tampering Attack
                    </span>
                  </div>
                  <p className="text-[12px] text-[#475467] leading-snug">
                    Simulates $800 payload override &bull; Server detects & forces locked $400
                  </p>
                </button>

                <button
                  onClick={runScenario3}
                  className="p-3.5 bg-[#FFFFFF] hover:border-[#2563EB] hover:bg-[#EFF4FF]/40 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span className="text-[13px] font-bold text-[#2563EB] group-hover:underline">
                      3. Human Approval Gate ($2,000)
                    </span>
                  </div>
                  <p className="text-[12px] text-[#475467] leading-snug">
                    Exceeds $1,000 auto-ceiling &bull; Quarantined to Approvals queue for review
                  </p>
                </button>

                <button
                  onClick={runScenario4}
                  className="p-3.5 bg-[#FFFFFF] hover:border-[#B42318] hover:bg-[#FEF2F2]/40 border border-[#E2E8F0] rounded-lg text-left transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#B42318]" />
                    <span className="text-[13px] font-bold text-[#B42318] group-hover:underline">
                      4. Duplicate Replay Attack
                    </span>
                  </div>
                  <p className="text-[12px] text-[#475467] leading-snug">
                    Replays payment on settled deal &bull; Blocked with HTTP 409 Conflict
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
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-8 shadow-xs">
              <LoadingSpinner message={loadingMessage} size="md" />
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 1: Describe Purchase */}
          {/* ============================================================== */}
          {!loading && stage === 1 && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-[19px] font-bold text-[#0F172A] tracking-tight">1. Describe Service to Procure</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] font-semibold text-[#2563EB]">
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> AI Multi-Agent Reverse Auction
                    </span>
                  </div>
                  <p className="text-[13.5px] text-[#475467] mt-1">
                    Enter your procurement intent in natural language. Google Gemini extracts structured constraints and negotiates with verified seller agents under strict policy boundaries.
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] font-medium text-[#64748B] shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                  <span>Deterministic Policy Active</span>
                </div>
              </div>

              {/* Enhanced Prompt Input Container with In-box Toolbar */}
              <div className="relative rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] shadow-2xs focus-within:border-[#2563EB] focus-within:ring-3 focus-within:ring-[#2563EB]/15 transition-all">
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (taskInput.trim() && !loading) {
                        handleFindServices();
                      }
                    }
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="e.g. Architect a high-concurrency FinTech payment microservice with PayPal Orders v2 escrow, budget $850... (Press Enter to submit)"
                  className="w-full bg-transparent p-4 pb-12 text-[14.5px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none leading-relaxed resize-y"
                />

                {/* In-box Actions Toolbar */}
                <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between pointer-events-none">
                  {/* Left: Quick mic & clear buttons */}
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        isListening
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B42318] animate-pulse'
                          : 'bg-[#F8FAFC] hover:bg-[#EFF6FF] border-[#E2E8F0] hover:border-[#BFDBFE] text-[#475467] hover:text-[#2563EB]'
                      }`}
                      title={isListening ? 'Click to stop listening' : 'Dictate with microphone'}
                    >
                      {isListening ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#B42318] animate-ping" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Voice Prompt</span>
                        </>
                      )}
                    </button>

                    {taskInput.trim() && (
                      <button
                        type="button"
                        onClick={() => setTaskInput('')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-md transition-colors cursor-pointer"
                        title="Clear input"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Character Counter */}
                  <div className="text-[11px] font-mono text-[#94A3B8] pointer-events-auto select-none">
                    <span className={taskInput.length > 450 ? 'text-[#B45309] font-bold' : ''}>
                      {taskInput.length}
                    </span>
                    <span> / 500</span>
                  </div>
                </div>
              </div>

              {/* Categorized Example Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#475467] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Quick-Start Templates:</span>
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Click to load instant benchmark scenario</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {exampleChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTaskInput(chip.prompt)}
                      className="group inline-flex items-center gap-2 text-[12px] px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#EFF6FF] hover:border-[#93C5FD] border border-[#E2E8F0] text-[#334155] hover:text-[#1D4ED8] rounded-lg transition-all font-medium shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                    >
                      <span>{chip.label}</span>
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] group-hover:text-[#3B82F6] opacity-80">
                        {chip.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer with Submit Button */}
              <div className="flex justify-end pt-3 border-t border-[#F1F5F9]">
                <button
                  onClick={() => handleFindServices()}
                  disabled={!taskInput.trim() || loading}
                  className="px-7 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-semibold text-[14px] rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Submit Request &amp; Solicit Agent Bids</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: Gemini Analysis / Interactive Scope Editor */}
          {/* ============================================================== */}
          {!loading && stage === 2 && parsedTask && (
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-3">
                <div>
                  <h3 className="text-[18px] font-bold text-[#101828] flex items-center gap-2">
                    <span>2. Extracted Requirements & Scope</span>
                    {isEditingRequirements && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FED7AA]">
                        Interactive Edit Mode
                      </span>
                    )}
                  </h3>
                  <p className="text-[14px] text-[#475467] mt-0.5">
                    {isEditingRequirements
                      ? 'Adjust budget ceiling, category, description, and requirements before soliciting bids.'
                      : 'Verified constraints parsed by Google Gemini 2.5. You can customize them at any time.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#475467] font-mono px-3 py-1 rounded-md bg-[#F8FAFC] border border-[#D0D5DD] font-semibold">
                    {aiSource?.parser === 'user-customized'
                      ? 'Source: User Customized'
                      : aiSource?.parser === 'gemini'
                      ? 'Model: Gemini 2.5 Flash'
                      : 'Fallback Parser'}
                  </span>

                  {!isEditingRequirements ? (
                    <button
                      onClick={() => setIsEditingRequirements(true)}
                      className="px-3 py-1.5 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF4FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Scope</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Reset edit fields to current parsedTask
                        setEditServiceType(parsedTask.serviceType || 'presentation');
                        setEditBudget(parsedTask.maxBudget || parsedTask.budget || 0);
                        setEditUrgency(parsedTask.urgency || 'normal');
                        setEditDescription(parsedTask.reasoning || '');
                        setEditRequirements(parsedTask.requirements ? [...parsedTask.requirements] : []);
                        setIsEditingRequirements(false);
                      }}
                      className="px-3 py-1.5 text-[13px] font-semibold text-[#475467] hover:text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-[#F8FAFC] transition-colors"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              {/* VIEW MODE */}
              {!isEditingRequirements && (
                <div className="space-y-6">
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
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
                          Requirements Checklist:
                        </span>
                        <button
                          onClick={() => setIsEditingRequirements(true)}
                          className="text-[12px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Requirements
                        </button>
                      </div>
                      <ul className="space-y-2 text-[13px] text-[#101828]">
                        {parsedTask.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
                            <Check className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                            <span className="font-medium">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedTask.reasoning && (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[13px] text-[#344054] leading-relaxed">
                      <span className="font-bold text-[#101828]">Task Scope / Description: </span>
                      {parsedTask.reasoning}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => setStage(1)}
                      className="text-[13px] font-semibold text-[#475467] hover:text-[#101828] flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to input prompt
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingRequirements(true)}
                        className="px-4 py-2 text-[13px] font-semibold text-[#344054] hover:bg-[#F8FAFC] border border-[#D0D5DD] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Scope Checklist</span>
                      </button>
                      <button
                        onClick={() => setStage(3)}
                        className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>Compare Competing Agent Bids ({offers.length})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT MODE: User can change requirements and description directly */}
              {isEditingRequirements && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#FFFBEB] border border-[#FED7AA] rounded-xl flex items-start gap-3 text-[13px] text-[#92400E]">
                    <Edit3 className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-[#B45309] block">Scope Customization Active</strong>
                      Adjust parameters, modify individual requirements, or add new deliverables. Click "Update & Re-solicit Bids" to generate matching seller agent proposals.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Service Type */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
                        Service Category:
                      </label>
                      <select
                        value={editServiceType}
                        onChange={(e) => setEditServiceType(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-[14px] font-semibold text-[#101828] border border-[#D0D5DD] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        {SERVICE_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Budget Ceiling */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
                        Budget Ceiling (USD):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] font-bold">$</span>
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={editBudget}
                          onChange={(e) => setEditBudget(e.target.value)}
                          className="w-full pl-7 pr-4 py-2.5 text-[14px] font-bold text-[#101828] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>

                    {/* Urgency */}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
                        Urgency Level:
                      </label>
                      <select
                        value={editUrgency}
                        onChange={(e) => setEditUrgency(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-[14px] font-semibold text-[#101828] border border-[#D0D5DD] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        <option value="low">Low (Standard SLA)</option>
                        <option value="normal">Normal (3-5 days)</option>
                        <option value="high">High (48 hours)</option>
                        <option value="express">Express (24 hours)</option>
                      </select>
                    </div>
                  </div>

                  {/* Description / Scope text */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
                      Scope & Description:
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Specify deliverables, milestones, or specific guidelines..."
                      className="w-full p-3 text-[14px] text-[#101828] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  {/* Requirements Checklist Editor */}
                  <div className="space-y-3">
                    <label className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block">
                      Individual Requirements Checklist ({editRequirements.length}):
                    </label>

                    <div className="space-y-2">
                      {editRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-[#EFF4FF] text-[#2563EB] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => handleEditRequirementChange(idx, e.target.value)}
                            className="flex-1 px-3 py-2 text-[13px] border border-[#D0D5DD] rounded-lg text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(idx)}
                            className="p-2 text-[#94A3B8] hover:text-[#B42318] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                            title="Remove requirement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new requirement row */}
                    <form onSubmit={handleAddRequirement} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add another requirement constraint (e.g. Include Figma editable files)..."
                        value={newReqInput}
                        onChange={(e) => setNewReqInput(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-[13px] border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <button
                        type="submit"
                        disabled={!newReqInput.trim()}
                        className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#EFF4FF] hover:border-[#BFDBFE] hover:text-[#2563EB] border border-[#D0D5DD] text-[#344054] text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </form>
                  </div>

                  {/* Action Buttons for Edit Mode */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#E2E8F0] gap-3">
                    <button
                      onClick={() => setIsEditingRequirements(false)}
                      className="text-[13px] font-semibold text-[#64748B] hover:text-[#101828] transition-colors"
                    >
                      Cancel changes
                    </button>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleSaveRequirements(false)}
                        className="px-5 py-2.5 text-[13px] font-semibold text-[#344054] hover:bg-[#F8FAFC] border border-[#D0D5DD] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Scope</span>
                      </button>

                      <button
                        onClick={() => handleSaveRequirements(true)}
                        className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
                      >
                        <span>Update & Re-solicit Bids</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditingRequirements(true);
                      setStage(2);
                    }}
                    className="px-3 py-1.5 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF4FF] border border-[#BFDBFE] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Requirements & Budget</span>
                  </button>
                  <button
                    onClick={() => setStage(2)}
                    className="px-3 py-1.5 text-[13px] font-semibold text-[#475467] hover:text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                </div>
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
                        className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 ${
                          isRecommended
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                            : 'bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#101828] border border-[#D0D5DD]'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Select Offer & Check Policy</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-3">
                <div>
                  <h3 className="text-[18px] font-bold text-[#101828]">4. Spending Policy Evaluation</h3>
                  <p className="text-[14px] text-[#475467] mt-0.5">
                    Deterministic verification performed server-side on deal #{currentDeal.dealId.substring(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStage(3)}
                    className="px-3 py-1.5 text-[13px] font-semibold text-[#475467] hover:text-[#101828] border border-[#D0D5DD] rounded-lg hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Bids
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingRequirements(true);
                      setStage(2);
                    }}
                    className="px-3 py-1.5 text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF4FF] border border-[#BFDBFE] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Requirements
                  </button>
                </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditingRequirements(true);
                        setStage(2);
                      }}
                      className="px-4 py-2.5 bg-white border border-[#FED7AA] text-[#B45309] hover:bg-[#FFFBEB] text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-2xs transition-colors"
                    >
                      Reduce Budget
                    </button>
                    <Link
                      to="/approvals"
                      className="px-5 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-xs transition-colors"
                    >
                      Go to Approvals &rarr;
                    </Link>
                  </div>
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
                    className="px-6 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white text-[13px] font-semibold rounded-lg whitespace-nowrap shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Authorize PayPal Sandbox Checkout &rarr;</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#B42318] text-[13px] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[15px]">Purchase Blocked by Policy</h4>
                    <p className="mt-1 leading-relaxed">{policyResult.message}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingRequirements(true);
                      setStage(2);
                    }}
                    className="px-4 py-2 bg-white border border-[#FECACA] text-[#B42318] hover:bg-[#FEF2F2] rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors"
                  >
                    Adjust Requirements
                  </button>
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
                  &larr; Back to Policy Evaluation
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

              {/* PayPal Sandbox Environment & Credentials Card */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-[#1E293B]">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    <span>PayPal Sandbox Test Gateway</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#475467] bg-[#EDF2F7] px-2.5 py-0.5 rounded-full font-medium">
                    Orders v2 REST
                  </span>
                </div>

                <p className="text-[#64748B] text-[12.5px] leading-relaxed">
                  Initiates an encrypted server-to-server call to PayPal Orders v2. You will be redirected to PayPal's sandbox gateway to authenticate and approve the transaction.
                </p>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCheckout}
                  className="px-7 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with PayPal Sandbox (${currentDeal.agreedAmount?.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
