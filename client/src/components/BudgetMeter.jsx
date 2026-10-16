import React from 'react';
import { DollarSign, AlertTriangle, AlertOctagon } from 'lucide-react';
import PolicyModal from './PolicyModal';

export default function BudgetMeter({ policy }) {
  if (!policy) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded"></div>
      </div>
    );
  }

  const total = Number(policy.totalBudget) || 5000;
  const spent = Number(policy.spentAmount) || 0;
  const committed = Number(policy.committedAmount) || 0;
  const remaining = Math.max(0, total - spent - committed);

  const spentPercent = Math.min(100, Math.max(0, (spent / total) * 100));
  const committedPercent = Math.min(100 - spentPercent, Math.max(0, (committed / total) * 100));
  const remainingPercent = Math.max(0, 100 - spentPercent - committedPercent);

  const isLowBudget = remaining < total * 0.2 && remaining >= 0;
  const isCritical = total - spent - committed < 0;

  const [isPolicyModalOpen, setIsPolicyModalOpen] = React.useState(false);

  return (
    <>
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Autonomous Spending Policy Budget</h3>
              <p className="text-xs text-slate-500">Live guardrail enforced across all AI purchasing agents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCritical && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertOctagon className="w-3.5 h-3.5" /> Budget Exceeded
              </span>
            )}
            {isLowBudget && !isCritical && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" /> Budget Low (&lt;20%)
              </span>
            )}
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-full border border-slate-200 transition-colors flex items-center gap-1"
              title="Click to tune spending limits and category whitelists"
            >
              <span>Limit: ${policy.autoApproveLimit ?? 1000}</span>
              <span className="text-[10px] text-blue-600 font-bold ml-0.5">⚙️ Tune</span>
            </button>
          </div>
        </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
        <div
          style={{ width: `${spentPercent}%` }}
          className="bg-emerald-500 h-full transition-all duration-500"
          title={`Spent: $${spent.toFixed(2)} (${spentPercent.toFixed(1)}%)`}
        />
        <div
          style={{ width: `${committedPercent}%` }}
          className="bg-amber-400 h-full transition-all duration-500"
          title={`Committed: $${committed.toFixed(2)} (${committedPercent.toFixed(1)}%)`}
        />
        <div
          style={{ width: `${remainingPercent}%` }}
          className="bg-slate-200 h-full transition-all duration-500"
          title={`Remaining: $${remaining.toFixed(2)} (${remainingPercent.toFixed(1)}%)`}
        />
      </div>

      {/* Figures Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Spent</span>
          </div>
          <span className="font-bold text-sm text-slate-900">${spent.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 block">({spentPercent.toFixed(0)}%)</span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            <span>Committed</span>
          </div>
          <span className="font-bold text-sm text-amber-700">${committed.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 block">({committedPercent.toFixed(0)}%)</span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
            <span>Remaining</span>
          </div>
          <span className="font-bold text-sm text-emerald-700">${remaining.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 block">of ${total.toFixed(0)} Total</span>
        </div>
      </div>
    </div>

    <PolicyModal
      isOpen={isPolicyModalOpen}
      onClose={() => setIsPolicyModalOpen(false)}
      policy={policy}
      onPolicyUpdated={() => {
        window.location.reload();
      }}
    />
  </>
  );
}
