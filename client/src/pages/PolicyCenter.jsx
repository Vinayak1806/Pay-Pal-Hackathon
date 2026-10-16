import React, { useState, useEffect } from 'react';
import { policyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ShieldCheck,
  Check,
  Save,
  RotateCcw,
  AlertTriangle,
  Lock,
  DollarSign,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Search,
  Globe,
  FileEdit,
  Palette
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PolicyCenter() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [totalBudget, setTotalBudget] = useState(5000);
  const [autoApproveLimit, setAutoApproveLimit] = useState(1000);
  const [allowedServices, setAllowedServices] = useState([
    'presentation',
    'research',
    'website',
    'content',
    'design'
  ]);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await policyService.getPolicy();
      const p = res.data?.policy;
      if (p) {
        setPolicy(p);
        setTotalBudget(p.totalBudget);
        setAutoApproveLimit(p.autoApproveLimit);
        setAllowedServices(p.allowedServices || []);
      }
    } catch (err) {
      toast.error('Failed to load current spending policy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const allAvailableServices = [
    {
      id: 'presentation',
      name: 'Presentation & Pitch Decks',
      desc: 'AI-generated investor slide decks, visual outlines, and speaking notes.',
      icon: BarChart3,
      tagBg: 'bg-[#EFF4FF]',
      tagText: 'text-[#2563EB]',
      borderActive: 'border-[#BFDBFE]'
    },
    {
      id: 'research',
      name: 'Competitor & Market Research',
      desc: 'Automated competitive intelligence, sector market maps, and SWOT briefs.',
      icon: Search,
      tagBg: 'bg-[#ECFEFF]',
      tagText: 'text-[#0891B2]',
      borderActive: 'border-[#A5F3FC]'
    },
    {
      id: 'website',
      name: 'Web & Landing Page Development',
      desc: 'Responsive web copy, landing pages, and frontend component specs.',
      icon: Globe,
      tagBg: 'bg-[#F5F3FF]',
      tagText: 'text-[#7C3AED]',
      borderActive: 'border-[#DDD6FE]'
    },
    {
      id: 'content',
      name: 'Copywriting & Content Strategy',
      desc: 'High-conversion blog posts, marketing email copy, and SEO articles.',
      icon: FileEdit,
      tagBg: 'bg-[#F0FDF4]',
      tagText: 'text-[#15803D]',
      borderActive: 'border-[#BBF7D0]'
    },
    {
      id: 'design',
      name: 'UI/UX & Brand Design',
      desc: 'Brand visual identity systems, color palettes, typography, and iconography.',
      icon: Palette,
      tagBg: 'bg-[#FFFBEB]',
      tagText: 'text-[#B45309]',
      borderActive: 'border-[#FED7AA]'
    }
  ];

  const handleToggleService = (id) => {
    setHasChanges(true);
    if (allowedServices.includes(id)) {
      if (allowedServices.length === 1) {
        toast.error('At least one service category must remain enabled.');
        return;
      }
      setAllowedServices(allowedServices.filter((s) => s !== id));
    } else {
      setAllowedServices([...allowedServices, id]);
    }
  };

  const handleLimitChange = (val) => {
    setAutoApproveLimit(Number(val));
    setHasChanges(true);
  };

  const handleBudgetChange = (val) => {
    setTotalBudget(Number(val));
    setHasChanges(true);
  };

  const handleResetDefaults = () => {
    setAutoApproveLimit(1000);
    setTotalBudget(5000);
    setAllowedServices(['presentation', 'research', 'website', 'content', 'design']);
    setHasChanges(true);
    toast.success('Reset to standard policy thresholds ($1,000 / $5,000)');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await policyService.updatePolicy({
        totalBudget,
        autoApproveLimit,
        allowedServices
      });
      setPolicy(res.data?.policy);
      setHasChanges(false);
      toast.success('Spending policy rules saved and active');
    } catch (err) {
      toast.error(err.message || 'Failed to save policy updates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading policy controls..." />
      </div>
    );
  }

  const total = Number(policy?.totalBudget) || 5000;
  const spent = Number(policy?.spentAmount) || 0;
  const committed = Number(policy?.committedAmount) || 0;
  const remaining = Math.max(0, total - spent - committed);

  return (
    <div className="space-y-6 w-full">
      {/* Page Header with Readable Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E6E8EC]">
        <div>
          <h2 className="text-[26px] font-bold text-[#171A21] tracking-tight">Policy Center</h2>
          <p className="text-[14px] text-[#667085] mt-1">
            Configure deterministic spending parameters, approval ceilings, and category controls for all AI agents.
          </p>
        </div>

        {hasChanges && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFBEB] text-[#B45309] border border-[#FED7AA] text-[13px] font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#B45309]" />
            Unsaved Changes
          </span>
        )}
      </div>

      {/* Live Treasury Reservoir Status with Clear Logical Colors */}
      <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-[13px] font-bold text-[#171A21] uppercase tracking-wider">
              Live Treasury Reservoir Status
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[12px] text-[#15803D] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
            Rules Deterministically Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Settled Spend - Logical Emerald/Green */}
          <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] transition-all">
            <div className="flex items-center justify-between text-[#15803D] mb-1">
              <span className="text-[13px] font-semibold">Settled Spend</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[26px] font-bold text-[#15803D] tabular-nums block">
              ${spent.toFixed(2)}
            </span>
            <span className="text-[12px] text-[#166534] font-medium block mt-1">
              PayPal Orders v2 Settled
            </span>
          </div>

          {/* Committed in Escrow - Logical Amber */}
          <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FED7AA] transition-all">
            <div className="flex items-center justify-between text-[#B45309] mb-1">
              <span className="text-[13px] font-semibold">Committed in Escrow</span>
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[26px] font-bold text-[#B45309] tabular-nums block">
              ${committed.toFixed(2)}
            </span>
            <span className="text-[12px] text-[#92400E] font-medium block mt-1">
              Reserved for Active Checkouts
            </span>
          </div>

          {/* Remaining Available - Logical Brand Blue */}
          <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] transition-all">
            <div className="flex items-center justify-between text-[#2563EB] mb-1">
              <span className="text-[13px] font-semibold">Remaining Available</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[26px] font-bold text-[#2563EB] tabular-nums block">
              ${remaining.toFixed(2)}
            </span>
            <span className="text-[12px] text-[#1D4ED8] font-medium block mt-1">
              of ${total.toFixed(0)} Allocated Treasury
            </span>
          </div>
        </div>
      </div>

      {/* Policy Form with Multi-Column Responsive Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Spending Thresholds & Budget */}
          <div className="space-y-6">
            {/* Control 1: Auto Approval Threshold */}
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-[16px] font-bold text-[#171A21]">
                      Automatic Approval Threshold
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#667085] leading-relaxed">
                    Purchases at or below this value execute autonomously. Purchases exceeding this limit are quarantined into the Approvals Queue for human sign-off.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[20px] font-bold text-[#2563EB] tabular-nums">
                    ${autoApproveLimit} USD
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={autoApproveLimit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="w-full h-2.5 bg-[#E6E8EC] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
                <div className="flex justify-between text-[12px] font-medium text-[#667085] mt-2">
                  <span>$100 (Strict)</span>
                  <span>$1,000 (Default)</span>
                  <span>$3,000 (Permissive)</span>
                </div>
              </div>
            </div>

            {/* Control 2: Total Budget Pool */}
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-[#15803D]" />
                  <h3 className="text-[16px] font-bold text-[#171A21]">
                    Total Treasury Budget Allocation
                  </h3>
                </div>
                <p className="text-[13px] text-[#667085] leading-relaxed">
                  Cumulative financial ceiling available across all autonomous agent procurement activities. Enforced atomically via database transactions.
                </p>
              </div>

              <div className="max-w-xs">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-[#667085] text-[15px] font-semibold">$</span>
                  <input
                    type="number"
                    min="500"
                    max="50000"
                    step="100"
                    value={totalBudget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-[#E6E8EC] text-[15px] font-semibold text-[#171A21] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] bg-[#FFFFFF] tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Control 3: Strict Security Invariants */}
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#B45309]" />
                <h3 className="text-[15px] font-bold text-[#171A21]">Active Zero-Trust Invariants</h3>
              </div>
              <p className="text-[13px] text-[#667085]">
                Hardcoded server guardrails actively protecting your treasury:
              </p>

              <div className="grid grid-cols-1 gap-3 pt-1">
                <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC]">
                  <span className="text-[13px] font-bold text-[#171A21] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    Server Price Lock Protection
                  </span>
                  <p className="text-[#667085] text-[12px] mt-1 leading-relaxed">
                    Browser-submitted price overrides are rejected. PayPal orders strictly bind to immutable backend deal records.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC]">
                  <span className="text-[13px] font-bold text-[#171A21] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                    Atomic Replay & Double-Capture Defense
                  </span>
                  <p className="text-[#667085] text-[12px] mt-1 leading-relaxed">
                    Replaying captured tokens halts atomically without duplicate treasury balance deductions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Permitted Service Categories Whitelist */}
          <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E6E8EC] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="text-[16px] font-bold text-[#171A21]">
                  Permitted Service Categories (Whitelist)
                </h3>
                <p className="text-[13px] text-[#667085] mt-1 leading-relaxed">
                  Autonomous agents can only solicit and settle services in enabled categories. Any purchase request in an unchecked category is immediately blocked by the policy engine.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {allAvailableServices.map((svc) => {
                  const isChecked = allowedServices.includes(svc.id);
                  const Icon = svc.icon;
                  return (
                    <div
                      key={svc.id}
                      onClick={() => handleToggleService(svc.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isChecked
                          ? `bg-[#FFFFFF] ${svc.borderActive} shadow-xs`
                          : 'bg-[#FAFAFC] border-[#E6E8EC] opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isChecked ? `${svc.tagBg} ${svc.tagText}` : 'bg-[#E6E8EC] text-[#667085]'
                          }`}
                        >
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[14px] font-bold text-[#171A21] block truncate">
                            {svc.name}
                          </span>
                          <span className="text-[12px] text-[#667085] block truncate mt-0.5">
                            {svc.desc}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-[#2563EB] border-[#2563EB] text-white'
                            : 'border-[#D0D5DD] bg-[#FFFFFF]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E8EC] text-[12px] text-[#667085]">
              Active Categories: <strong className="text-[#171A21]">{allowedServices.length} of 5 whitelisted</strong>
            </div>
          </div>
        </div>

        {/* Form Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] shadow-xs">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto px-4 py-2.5 text-[13px] font-semibold text-[#667085] hover:text-[#171A21] bg-[#FFFFFF] hover:bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Standard Defaults ($1,000 / $5,000)</span>
          </button>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-[14px] font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Policy Rules'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
