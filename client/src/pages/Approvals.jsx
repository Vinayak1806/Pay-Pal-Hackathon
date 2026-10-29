import React, { useState, useEffect } from 'react';
import { dealService, policyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { useVoiceContext } from '../context/VoiceContext';

export default function Approvals() {
  const [pendingDeals, setPendingDeals] = useState([]);
  const [approvedDeals, setApprovedDeals] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
  const [authorizedModalDeal, setAuthorizedModalDeal] = useState(null);

  const { updateVoiceContext } = useVoiceContext();

  const fetchDealsAndPolicy = async () => {
    try {
      const [dealsRes, policyRes] = await Promise.all([
        dealService.getDeals(),
        policyService.getPolicy()
      ]);
      const allDeals = dealsRes.data?.deals || [];
      const pending = allDeals.filter(d => d.status === 'pending_approval');
      const approved = allDeals.filter(d => d.status === 'approved');

      setPendingDeals(pending);
      setApprovedDeals(approved);
      setPolicy(policyRes.data?.policy);

      // Update voice context with both counts
      updateVoiceContext({
        pendingApprovals: pending.length,
        approvedDeals: approved.length,
        policy: policyRes.data?.policy,
      });

      // Narrate if there are pending approvals (dedup prevents spam)
      if (pending.length > 0) {
        voiceEventBus.emit(VoiceEvents.APPROVAL_REQUIRED, {
          amount: pending[0]?.agreedAmount,
          limit: policyRes.data?.policy?.autoApproveLimit,
        });
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealsAndPolicy();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchDealsAndPolicy();
    }, 30000);
    const handleVisibility = () => {
      if (!document.hidden) fetchDealsAndPolicy();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Handle Supervisor Decision (Approve or Reject)
  const handleDecision = async (dealId, decision) => {
    setActionLoadingId(dealId);
    const targetDeal = pendingDeals.find(d => d.dealId === dealId) || { dealId };

    try {
      await dealService.approveDeal(dealId, decision);

      if (decision === 'approved') {
        toast.success('Deal authorized! Ready for PayPal checkout.');

        // Update local lists immediately
        const updatedDeal = { ...targetDeal, status: 'approved' };
        setPendingDeals(prev => prev.filter(d => d.dealId !== dealId));
        setApprovedDeals(prev => [updatedDeal, ...prev.filter(d => d.dealId !== dealId)]);

        // Emit voice event — drives voice narration
        voiceEventBus.emit(VoiceEvents.APPROVAL_GRANTED, {
          amount: targetDeal.agreedAmount,
          dealId: targetDeal.dealId,
        }, { force: true });

        // Update voice context
        updateVoiceContext({
          pendingApprovals: Math.max(0, pendingDeals.length - 1),
          approvedDeals: approvedDeals.length + 1,
        });

        // Open instant celebration & checkout modal
        setAuthorizedModalDeal(updatedDeal);
      } else {
        toast.success('Deal rejected by supervisor.');
        setPendingDeals(prev => prev.filter(d => d.dealId !== dealId));

        voiceEventBus.emit(VoiceEvents.APPROVAL_REJECTED, {
          dealId: targetDeal.dealId,
        }, { force: true });

        updateVoiceContext({
          pendingApprovals: Math.max(0, pendingDeals.length - 1),
        });
      }

      // Re-fetch to ensure sync with server
      fetchDealsAndPolicy();
    } catch (err) {
      toast.error(err.message || 'Failed to update deal status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Checkout for an Approved Deal
  const handleCheckout = async (dealId) => {
    setCheckoutLoadingId(dealId);
    try {
      voiceEventBus.emit(VoiceEvents.CHECKOUT_INITIATED, { dealId });
      toast.loading('Creating secure PayPal order with verified server price...', { id: 'checkout-toast' });

      const res = await dealService.checkoutDeal(dealId);
      toast.dismiss('checkout-toast');

      if (res.data?.approvalUrl) {
        toast.success('Redirecting to PayPal Sandbox checkout...');
        setTimeout(() => {
          window.location.href = res.data.approvalUrl;
        }, 800);
      } else {
        toast.error('No approval URL returned from PayPal.');
        setCheckoutLoadingId(null);
      }
    } catch (err) {
      toast.dismiss('checkout-toast');
      toast.error(err.message || 'Failed to initiate PayPal checkout');
      setCheckoutLoadingId(null);
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
          <h2 className="text-[26px] font-bold text-[#101828] tracking-tight">Approvals &amp; Settlement</h2>
          <p className="text-[14px] text-[#475467] mt-1">
            Transactions exceeding the ${policy?.autoApproveLimit ?? 1000} autonomous ceiling quarantined for supervisor authorization and settlement.
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-2 text-[14px] font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
              : 'text-[#64748B] hover:text-[#101828]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Review</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            pendingDeals.length > 0
              ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
              : 'bg-[#F1F5F9] text-[#64748B]'
          }`}>
            {pendingDeals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 px-2 text-[14px] font-semibold transition-all relative flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
              : 'text-[#64748B] hover:text-[#101828]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Authorized &amp; Ready to Pay</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            approvedDeals.length > 0
              ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
              : 'bg-[#F1F5F9] text-[#64748B]'
          }`}>
            {approvedDeals.length}
          </span>
        </button>
      </div>

      {/* Notification banner if approved deals exist while looking at pending tab */}
      {activeTab === 'pending' && approvedDeals.length > 0 && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#166534]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#15803D] shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <p className="text-[13px] font-bold">
                {approvedDeals.length} Authorized Deal{approvedDeals.length > 1 ? 's' : ''} Awaiting Payment
              </p>
              <p className="text-[12px] text-[#166534]/80">
                You have approved transactions ready for PayPal Sandbox checkout.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('approved')}
            className="px-3.5 py-1.5 bg-[#15803D] text-white hover:bg-[#166534] rounded-lg text-[12px] font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-2xs"
          >
            <span>View &amp; Pay Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── TAB 1: PENDING REVIEW ───────────────────────────────── */}
      {activeTab === 'pending' && (
        <>
          {pendingDeals.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mx-auto mb-3.5 border border-[#BBF7D0]">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#101828]">No Pending Approvals</h3>
              <p className="text-[14px] text-[#475467] mt-1.5 max-w-md mx-auto leading-relaxed">
                All agent negotiations are currently compliant within the autonomous spending ceiling (${policy?.autoApproveLimit ?? 1000} limit).
              </p>
              {approvedDeals.length > 0 && (
                <button
                  onClick={() => setActiveTab('approved')}
                  className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1D4ED8] transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <span>Go to Authorized Deals ({approvedDeals.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDeals.map((deal) => {
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
                          className="px-5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-[13px] font-semibold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>{isProcessing ? 'Authorizing...' : 'Authorize & Approve'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: AUTHORIZED & READY TO PAY ────────────────────── */}
      {activeTab === 'approved' && (
        <>
          {approvedDeals.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F8FAFC] text-[#64748B] flex items-center justify-center mx-auto mb-3.5 border border-[#E2E8F0]">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-bold text-[#101828]">No Authorized Deals Waiting for Payment</h3>
              <p className="text-[14px] text-[#475467] mt-1.5 max-w-md mx-auto leading-relaxed">
                When you authorize escalated purchases in the Pending tab, they appear here ready for PayPal Sandbox checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedDeals.map((deal) => {
                const isCheckingOut = checkoutLoadingId === deal.dealId;
                return (
                  <div
                    key={deal.dealId}
                    className="bg-[#FFFFFF] rounded-xl border-2 border-[#BBF7D0] p-6 shadow-xs space-y-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-[#86EFAC] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>AUTHORIZED &bull; READY TO PAY</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                            Authorized
                          </span>
                          <span className="text-[12px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                            #{deal.dealId.substring(0, 8)}
                          </span>
                        </div>
                        <h3 className="text-[18px] font-bold text-[#101828] capitalize">
                          {deal.serviceType}
                        </h3>
                        <p className="text-[13px] text-[#475467] mt-1">
                          Seller Agent: <strong className="text-[#101828]">{deal.sellerAgent}</strong>
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[12px] font-bold text-[#475467] block uppercase tracking-wider">
                          Authorized Price
                        </span>
                        <span className="text-[26px] font-bold text-[#15803D] tabular-nums block">
                          ${deal.agreedAmount?.toFixed(2)} USD
                        </span>
                        <span className="text-[12px] font-medium text-[#64748B] block mt-0.5">
                          PayPal Orders v2 Sandbox
                        </span>
                      </div>
                    </div>

                    {/* Authorization Note */}
                    <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[13px] text-[#166534] flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">Supervisor Authorization Granted:</span> This deal has been approved to exceed the autonomous ceiling. The price is server-locked and ready for cryptographic settlement.
                      </div>
                    </div>

                    {/* Checkout Action Button */}
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#475467] border-t border-[#E2E8F0]">
                      <span>Authorized on: <strong>{new Date(deal.updatedAt || deal.createdAt).toLocaleString()}</strong></span>

                      <button
                        onClick={() => handleCheckout(deal.dealId)}
                        disabled={isCheckingOut}
                        className="px-6 py-2.5 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-lg text-[13px] font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{isCheckingOut ? 'Opening PayPal Sandbox...' : `Proceed to PayPal Checkout ($${deal.agreedAmount?.toFixed(2)})`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CELEBRATION / INSTANT CHECKOUT MODAL ────────────────── */}
      {authorizedModalDeal && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#FFFFFF] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-[#E2E8F0] space-y-5 animate-in fade-in zoom-in duration-200 my-auto">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto border-2 border-[#86EFAC] shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#101828]">Deal Authorized Successfully!</h3>
              <p className="text-[13px] text-[#475467] leading-relaxed">
                The transaction policy override has been granted and recorded in the SHA-256 Merkle audit trail.
              </p>
            </div>

            {/* Deal Snapshot */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Service:</span>
                <span className="font-bold text-[#101828] capitalize">{authorizedModalDeal.serviceType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Seller:</span>
                <span className="font-semibold text-[#101828]">{authorizedModalDeal.sellerAgent}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B] font-medium">Authorized Amount:</span>
                <span className="text-[18px] font-bold text-[#15803D]">
                  ${authorizedModalDeal.agreedAmount?.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Next Step Guidance */}
            <p className="text-[12px] text-[#475467] text-center">
              You can proceed directly to PayPal Sandbox checkout now, or pay later from the Authorized tab.
            </p>

            {/* Modal Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => {
                  handleCheckout(authorizedModalDeal.dealId);
                }}
                disabled={checkoutLoadingId === authorizedModalDeal.dealId}
                className="w-full py-3 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-xl text-[14px] font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {checkoutLoadingId === authorizedModalDeal.dealId
                    ? 'Creating PayPal Order...'
                    : `Proceed to PayPal Checkout ($${authorizedModalDeal.agreedAmount?.toFixed(2)})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setAuthorizedModalDeal(null);
                  setActiveTab('approved');
                }}
                className="w-full py-2.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#344054] border border-[#D0D5DD] rounded-xl text-[13px] font-semibold transition-colors"
              >
                Keep in Queue &amp; Pay Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
