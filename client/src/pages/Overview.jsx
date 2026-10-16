import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Clock,
  ShieldAlert,
  Bot,
  ArrowRight,
  Plus,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { dealService, policyService, auditService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DeliverableModal from '../components/DeliverableModal';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Overview() {
  const [deals, setDeals] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealForModal, setSelectedDealForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, policyRes, auditRes] = await Promise.all([
          dealService.getDeals(),
          policyService.getPolicy(),
          auditService.getLogs({ limit: 10 })
        ]);
        setDeals(dealsRes.data?.deals || []);
        setPolicy(policyRes.data?.policy);
        setAuditLogs(auditRes.data?.logs || []);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = Number(policy?.totalBudget) || 5000;
  const spent = Number(policy?.spentAmount) || 0;
  const committed = Number(policy?.committedAmount) || 0;
  const remaining = Math.max(0, total - spent - committed);

  const pendingDeals = deals.filter(d => d.status === 'pending_approval');
  const blockedDeals = deals.filter(d => d.status === 'blocked');
  const completedDeals = deals.filter(d => d.status === 'payment_completed');

  // Policy decision feed items from recent deals
  const recentDecisions = deals.slice(0, 4).map(d => {
    let outcome = 'Approved';
    let outcomeClass = 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]';
    let reason = 'Within autonomous approval threshold';

    if (d.status === 'pending_approval') {
      outcome = 'Escalated';
      outcomeClass = 'text-[#B45309] bg-[#FFFBEB] border-[#FED7AA]';
      reason = d.blockedReason || 'Exceeds auto-approval limit';
    } else if (d.status === 'blocked') {
      outcome = 'Blocked';
      outcomeClass = 'text-[#B42318] bg-[#FEF2F2] border-[#FECACA]';
      reason = d.blockedReason || 'Policy rule violation';
    }

    return {
      id: d.dealId,
      service: d.serviceType,
      agent: d.sellerAgent,
      amount: d.agreedAmount,
      outcome,
      outcomeClass,
      reason,
      createdAt: d.createdAt
    };
  });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading dashboard overview..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E6E8EC]">
        <div>
          <h2 className="text-[26px] font-bold text-[#171A21] tracking-tight">Overview</h2>
          <p className="text-[14px] text-[#667085] mt-1">
            Monitor autonomous AI agent purchasing activity, treasury allocations, and policy controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[12px] font-semibold text-[#15803D] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#15803D]" />
            <span>PayPal Sandbox Active</span>
          </div>

          <Link
            to="/requests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>New Purchase Request</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards with Clear Logical Colors & Readable Fonts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Spend - Brand Blue */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E8EC] shadow-xs hover:border-[#BFDBFE] transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-[#171A21]">
              Total Settled Spend
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold text-[#2563EB] tabular-nums tracking-tight">
              ${spent.toFixed(2)}
            </span>
            <span className="text-[12px] text-[#667085] font-medium">
              of ${total.toFixed(0)} cap
            </span>
          </div>
          <div className="w-full h-2 bg-[#F0F2F5] rounded-full overflow-hidden mt-3">
            <div
              style={{ width: `${Math.min(100, (spent / total) * 100)}%` }}
              className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
            />
          </div>
          <div className="flex justify-between items-center text-[12px] font-medium text-[#667085] mt-2.5">
            <span>Avail: ${remaining.toFixed(0)}</span>
            <span>Escrow: ${committed.toFixed(0)}</span>
          </div>
        </div>

        {/* KPI 2: Pending Approvals - Amber Warning */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E8EC] shadow-xs hover:border-[#FED7AA] transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-[#171A21]">
              Pending Approvals
            </span>
            <Link to="/approvals" className="text-[12px] text-[#2563EB] hover:underline font-semibold">
              Queue &rarr;
            </Link>
          </div>
          <span className="text-[28px] font-bold text-[#B45309] tabular-nums tracking-tight block">
            {pendingDeals.length}
          </span>
          <p className="text-[12px] text-[#667085] mt-3 leading-relaxed">
            {pendingDeals.length === 0
              ? 'All transactions within automatic limits'
              : `${pendingDeals.length} deal(s) require supervisor review`}
          </p>
        </div>

        {/* KPI 3: Blocked Transactions - Crimson Danger */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E8EC] shadow-xs hover:border-[#FECACA] transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-[#171A21]">
              Blocked Transactions
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#B42318]" />
          </div>
          <span className="text-[28px] font-bold text-[#B42318] tabular-nums tracking-tight block">
            {blockedDeals.length}
          </span>
          <p className="text-[12px] text-[#667085] mt-3 leading-relaxed">
            {blockedDeals.length === 0
              ? 'Zero policy violations detected'
              : 'Stopped by spending limits or category filters'}
          </p>
        </div>

        {/* KPI 4: Active AI Agents - Emerald Verified */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E8EC] shadow-xs hover:border-[#BBF7D0] transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-[#171A21]">
              Registered Agents
            </span>
            <Link to="/agents" className="text-[12px] text-[#2563EB] hover:underline font-semibold">
              Directory &rarr;
            </Link>
          </div>
          <span className="text-[28px] font-bold text-[#15803D] tabular-nums tracking-tight block">
            4 Active
          </span>
          <p className="text-[12px] text-[#667085] mt-3 leading-relaxed">
            1 Buyer agent, 3 specialized seller agents
          </p>
        </div>
      </div>

      {/* Two Column Layout: Spending Breakdown + Policy Decisions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Allocation / Activity */}
        <div className="lg:col-span-2 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E8EC] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
            <div>
              <h3 className="text-[14px] font-semibold text-[#171A21]">Spending Policy Allocation</h3>
              <p className="text-[12px] text-[#667085]">Real-time treasury distribution enforced by deterministic rules</p>
            </div>
            <Link to="/policy" className="text-[12px] text-[#2563EB] hover:underline font-medium">
              Configure limits &rarr;
            </Link>
          </div>

          {/* Allocation Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-[#F0F2F5] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (spent / total) * 100)}%` }}
                className="bg-[#2563EB] h-full"
                title={`Spent: $${spent.toFixed(2)}`}
              />
              <div
                style={{ width: `${Math.min(100, (committed / total) * 100)}%` }}
                className="bg-[#D97706] h-full"
                title={`Committed: $${committed.toFixed(2)}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-[12px]">
              <div className="p-2.5 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC]">
                <div className="flex items-center gap-1.5 text-[#667085] mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <span>Settled (Spent)</span>
                </div>
                <span className="font-semibold text-[#171A21] tabular-nums block">${spent.toFixed(2)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC]">
                <div className="flex items-center gap-1.5 text-[#667085] mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                  <span>Committed (Escrow)</span>
                </div>
                <span className="font-semibold text-[#171A21] tabular-nums block">${committed.toFixed(2)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC]">
                <div className="flex items-center gap-1.5 text-[#667085] mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#D0D5DD]" />
                  <span>Available Balance</span>
                </div>
                <span className="font-semibold text-[#171A21] tabular-nums block">${remaining.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[12px] text-[#667085] flex items-center justify-between border-t border-[#E6E8EC]">
            <span>Automatic Approval Threshold: <strong className="text-[#171A21]">${policy?.autoApproveLimit ?? 1000}</strong></span>
            <span>Whitelisted Categories: <strong className="text-[#171A21]">{policy?.allowedServices?.length || 5} active</strong></span>
          </div>
        </div>

        {/* Policy Decisions Activity Feed */}
        <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E8EC] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
            <h3 className="text-[14px] font-semibold text-[#171A21]">Recent Policy Decisions</h3>
            <Link to="/audit" className="text-[12px] text-[#2563EB] hover:underline font-medium">
              Audit trail
            </Link>
          </div>

          {recentDecisions.length === 0 ? (
            <p className="text-[12px] text-[#667085] py-6 text-center">No policy events recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentDecisions.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#171A21] capitalize">{item.service}</span>
                    <span className={`px-2 py-0.5 rounded-md font-medium border text-[10px] ${item.outcomeClass}`}>
                      {item.outcome}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085] line-clamp-1">{item.reason}</p>
                  <div className="flex justify-between items-center text-[10px] text-[#98A2B3] pt-1">
                    <span>${item.amount?.toFixed(2)} USD</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] shadow-card overflow-hidden">
        <div className="p-5 border-b border-[#E6E8EC] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-[#171A21]">Recent Transactions</h3>
            <p className="text-[12px] text-[#667085]">Verified transactions executed via PayPal Orders v2 Sandbox</p>
          </div>
          <Link
            to="/transactions"
            className="text-[12px] text-[#2563EB] hover:underline font-medium flex items-center gap-1"
          >
            View all transactions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#667085]">
            No transactions found. Click "New Purchase Request" to initiate your first autonomous procurement flow.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F7F8FA] border-b border-[#E6E8EC] text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
                <tr>
                  <th className="py-2.5 px-5">Deal ID</th>
                  <th className="py-2.5 px-5">Service</th>
                  <th className="py-2.5 px-5">Merchant / Seller</th>
                  <th className="py-2.5 px-5">Amount</th>
                  <th className="py-2.5 px-5">Status</th>
                  <th className="py-2.5 px-5">Timestamp</th>
                  <th className="py-2.5 px-5 text-right">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EC] text-[#171A21]">
                {deals.slice(0, 6).map((deal) => (
                  <tr key={deal.dealId} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-3 px-5 font-mono text-[12px] text-[#667085]">
                      {deal.dealId?.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-5 font-medium capitalize text-[#171A21]">
                      {deal.serviceType}
                    </td>
                    <td className="py-3 px-5 text-[#667085]">
                      {deal.sellerAgent}
                    </td>
                    <td className="py-3 px-5 font-semibold text-[#171A21] tabular-nums">
                      ${deal.agreedAmount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-5">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="py-3 px-5 text-[12px] text-[#667085] whitespace-nowrap">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {deal.status === 'payment_completed' && deal.deliverable ? (
                        <button
                          onClick={() => {
                            setSelectedDealForModal(deal);
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#2563EB] hover:bg-[#EFF4FF] border border-[#BFDBFE] rounded-md transition-colors"
                        >
                          View Artifact
                        </button>
                      ) : (
                        <span className="text-[#98A2B3] text-[12px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deliverable Modal */}
      <DeliverableModal
        deal={selectedDealForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
