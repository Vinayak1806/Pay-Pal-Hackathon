import React, { useState, useEffect } from 'react';
import { dealService, policyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Approvals() {
  const [deals, setDeals] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDealsAndPolicy = async () => {
    try {
      const [dealsRes, policyRes] = await Promise.all([
        dealService.getDeals(),
        policyService.getPolicy()
      ]);
      const allDeals = dealsRes.data?.deals || [];
      setDeals(allDeals.filter(d => d.status === 'pending_approval'));
      setPolicy(policyRes.data?.policy);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealsAndPolicy();
    const timer = setInterval(fetchDealsAndPolicy, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleDecision = async (dealId, decision) => {
    setActionLoadingId(dealId);
    try {
      await dealService.approveDeal(dealId, decision);
      toast.success(
        decision === 'approved'
          ? 'Deal authorized. Ready for PayPal checkout.'
          : 'Deal rejected by supervisor.'
      );
      setDeals(prev => prev.filter(d => d.dealId !== dealId));
      fetchDealsAndPolicy();
    } catch (err) {
      toast.error(err.message || 'Failed to update deal status');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Checking approval queue..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-[26px] font-bold text-[#101828] tracking-tight">Approvals Queue</h2>
          <p className="text-[14px] text-[#475467] mt-1">
            Transactions exceeding the ${policy?.autoApproveLimit ?? 1000} autonomous ceiling quarantined for supervisor review.
          </p>
        </div>

        <button
          onClick={fetchDealsAndPolicy}
          className="px-4 py-2 text-[13px] font-semibold text-[#344054] hover:text-[#101828] bg-[#FFFFFF] border border-[#D0D5DD] rounded-lg transition-colors flex items-center gap-2 self-start shadow-xs hover:bg-[#F8FAFC]"
        >
          <RefreshCw className="w-4 h-4 text-[#475467]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {deals.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mx-auto mb-3.5 border border-[#BBF7D0]">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#101828]">No Pending Approvals</h3>
          <p className="text-[14px] text-[#475467] mt-1.5 max-w-md mx-auto leading-relaxed">
            All agent negotiations are currently compliant within the autonomous spending ceiling (${policy?.autoApproveLimit ?? 1000} limit).
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const isProcessing = actionLoadingId === deal.dealId;
            return (
              <div
                key={deal.dealId}
                className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <StatusBadge status={deal.status} />
                      <span className="text-[12px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        #{deal.dealId.substring(0, 8)}
                      </span>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#101828] capitalize">
                      {deal.serviceType}
                    </h3>
                    <p className="text-[13px] text-[#475467] mt-1">
                      Initiated with seller: <strong className="text-[#101828]">{deal.sellerAgent}</strong>
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[12px] font-bold text-[#475467] block uppercase tracking-wider">
                      Requested Price
                    </span>
                    <span className="text-[26px] font-bold text-[#2563EB] tabular-nums block">
                      ${deal.agreedAmount?.toFixed(2)} USD
                    </span>
                    <span className="text-[12px] font-semibold text-[#B45309] block mt-0.5">
                      Auto Limit: ${policy?.autoApproveLimit ?? 1000} USD
                    </span>
                  </div>
                </div>

                {/* Escalation Context Box */}
                <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FED7AA] text-[13px] text-[#92400E] space-y-1.5">
                  <span className="font-bold text-[#B45309] block text-[13px]">
                    Escalation Reason:
                  </span>
                  <p className="leading-relaxed">{deal.blockedReason || 'Proposed deal exceeds automatic spending ceiling.'}</p>

                  {deal.geminiReasoning && (
                    <p className="text-[12px] text-[#78350F] italic pt-1.5 border-t border-[#FED7AA]/60">
                      Gemini Agent Justification: "{deal.geminiReasoning}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#475467] border-t border-[#E2E8F0]">
                  <span>Initiated: <strong>{new Date(deal.createdAt).toLocaleDateString()}</strong></span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecision(deal.dealId, 'rejected')}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#FEF2F2] text-[#B42318] border border-[#FECACA] rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 shadow-2xs"
                    >
                      Reject Deal
                    </button>
                    <button
                      onClick={() => handleDecision(deal.dealId, 'approved')}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-[13px] font-semibold transition-colors shadow-xs disabled:opacity-50"
                    >
                      Authorize & Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
