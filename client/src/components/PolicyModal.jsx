import React, { useState, useEffect } from 'react';
import { X, Sliders, ShieldCheck, Check, Save, RotateCcw, BarChart3, Search, Globe, FileEdit, Palette } from 'lucide-react';
import { policyService } from '../services/api';
import toast from 'react-hot-toast';

export default function PolicyModal({ isOpen, onClose, policy, onPolicyUpdated }) {
  if (!isOpen) return null;

  const [totalBudget, setTotalBudget] = useState(policy?.totalBudget || 5000);
  const [autoApproveLimit, setAutoApproveLimit] = useState(policy?.autoApproveLimit || 1000);
  const [allowedServices, setAllowedServices] = useState(
    policy?.allowedServices || ['presentation', 'research', 'website', 'content', 'design']
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (policy) {
      setTotalBudget(policy.totalBudget);
      setAutoApproveLimit(policy.autoApproveLimit);
      setAllowedServices(policy.allowedServices || []);
    }
  }, [policy]);

  const allAvailableServices = [
    { id: 'presentation', name: 'Presentation & Pitch Decks', icon: BarChart3 },
    { id: 'research', name: 'Competitor & Market Research', icon: Search },
    { id: 'website', name: 'Web & Landing Page Development', icon: Globe },
    { id: 'content', name: 'Copywriting & Content Strategy', icon: FileEdit },
    { id: 'design', name: 'UI/UX & Brand Design', icon: Palette }
  ];

  const toggleService = (id) => {
    if (allowedServices.includes(id)) {
      if (allowedServices.length === 1) {
        toast.error('At least one service must remain whitelisted.');
        return;
      }
      setAllowedServices(allowedServices.filter(s => s !== id));
    } else {
      setAllowedServices([...allowedServices, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await policyService.updatePolicy({
        totalBudget: Number(totalBudget),
        autoApproveLimit: Number(autoApproveLimit),
        allowedServices
      });
      toast.success('Spending policy updated successfully');
      if (onPolicyUpdated) {
        onPolicyUpdated(res.data?.policy);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setTotalBudget(5000);
    setAutoApproveLimit(1000);
    setAllowedServices(['presentation', 'research', 'website', 'content', 'design']);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#FFFFFF] rounded-xl shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col border border-[#E6E8EC] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8EC] shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
              <Sliders className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#171A21]">
                Spending Policy Configurator
              </h3>
              <p className="text-[12px] text-[#667085]">
                Tune deterministic spending rules enforced on all AI agents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#171A21] hover:bg-[#F7F8FA] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-[13px] text-[#171A21] overflow-y-auto flex-1">
          {/* Rule 1: Auto-Approve Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[#171A21]">
                Auto-Approval Ceiling Threshold
              </label>
              <span className="font-semibold text-[13px] text-[#2563EB] bg-[#EFF4FF] px-2 py-0.5 rounded border border-[#BFDBFE] tabular-nums">
                ${autoApproveLimit} USD
              </span>
            </div>
            <p className="text-[12px] text-[#667085] leading-relaxed">
              Purchases exceeding this amount are automatically frozen and escalated for manual approval.
            </p>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={autoApproveLimit}
              onChange={(e) => setAutoApproveLimit(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E6E8EC] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between text-[11px] text-[#667085]">
              <span>$100 (Strict)</span>
              <span>$1,000 (Default)</span>
              <span>$3,000 (Permissive)</span>
            </div>
          </div>

          {/* Rule 2: Total Budget Pool */}
          <div className="space-y-1.5 pt-3 border-t border-[#E6E8EC]">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[#171A21]">
                Total Allocated Treasury Budget
              </label>
              <span className="font-semibold text-[#171A21] tabular-nums text-[13px]">
                ${totalBudget} USD
              </span>
            </div>
            <input
              type="number"
              min="500"
              max="50000"
              step="100"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full rounded-lg border border-[#E6E8EC] px-3 py-2 text-[13px] text-[#171A21] bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Rule 3: Allowed Categories Whitelist */}
          <div className="space-y-2 pt-3 border-t border-[#E6E8EC]">
            <label className="font-medium text-[#171A21] block">
              Permitted Service Categories (Whitelist)
            </label>
            <p className="text-[12px] text-[#667085]">
              Unchecked categories will be instantly blocked by the policy engine.
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {allAvailableServices.map((svc) => {
                const isSelected = allowedServices.includes(svc.id);
                const Icon = svc.icon;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors text-[13px] ${
                      isSelected
                        ? 'bg-[#EFF4FF] border-[#BFDBFE] text-[#2563EB] font-medium'
                        : 'bg-[#FFFFFF] border-[#E6E8EC] text-[#667085] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                      <span>{svc.name}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-[#D0D5DD] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAFC] border-t border-[#E6E8EC] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 text-[#667085] hover:text-[#171A21] text-[12px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[#667085] hover:text-[#171A21] text-[12px] font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
