import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Bot,
  CreditCard,
  ShieldCheck,
  FileText,
  Clock,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
  PanelLeftClose
} from 'lucide-react';
import { dealService, demoService, policyService } from '../services/api';
import toast from 'react-hot-toast';
import Logo from './Logo';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [approvalsCount, setApprovalsCount] = useState({ pending: 0, approvedUnpaid: 0 });
  const [policy, setPolicy] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchStatus = async () => {
    try {
      const [dealsRes, policyRes] = await Promise.all([
        dealService.getDeals(),
        policyService.getPolicy()
      ]);
      const deals = dealsRes.data?.deals || [];
      const pending = deals.filter(d => d.status === 'pending_approval').length;
      const approvedUnpaid = deals.filter(d => d.status === 'approved').length;
      setApprovalsCount({ pending, approvedUnpaid });
      setPolicy(policyRes.data?.policy);
    } catch (err) {
      // quiet fail on background poll
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    setShowConfirm(false);
    setResetting(true);
    try {
      await demoService.reset();
      localStorage.removeItem('spendmesh_welcomed_first_time');
      toast.success('Demo environment reset successfully');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      toast.error(err.message || 'Failed to reset demo data');
      setResetting(false);
    }
  };

  const totalApprovals = approvalsCount.pending + approvalsCount.approvedUnpaid;
  const approvalsBadgeVariant = approvalsCount.pending > 0 ? 'amber' : 'green';

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Purchase Requests', to: '/requests', icon: ShoppingBag },
    { label: 'Agent Marketplace', to: '/agents', icon: Bot },
    { label: 'Transactions', to: '/transactions', icon: CreditCard },
    { label: 'Policy Center', to: '/policy', icon: ShieldCheck },
    { label: 'Audit Logs', to: '/audit', icon: FileText },
    {
      label: 'Approvals',
      to: '/approvals',
      icon: Clock,
      badge: totalApprovals,
      badgeVariant: approvalsBadgeVariant
    }
  ];

  const total = Number(policy?.totalBudget) || 5000;
  const spent = Number(policy?.spentAmount) || 0;
  const committed = Number(policy?.committedAmount) || 0;
  const remaining = Math.max(0, total - spent - committed);
  const spentPercent = Math.min(100, (spent / total) * 100);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-60 bg-[#FFFFFF] border-r border-[#E2E8F0] z-50 flex flex-col justify-between transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between">
            <Logo size={32} subtitle="Financial Policy Layer" />

            <button
              onClick={onClose}
              className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-lg transition-all flex items-center justify-center group"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-[18px] h-[18px] stroke-[2] transition-transform group-hover:-translate-x-0.5" />
            </button>
          </div>

          {/* Understated Environment Badge */}
          <div className="px-4 py-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] font-medium text-[#475467] w-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="font-semibold text-[#0F172A] truncate">PayPal Sandbox v2</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => {
                    // Only auto-close on mobile screens (< 768px), keep open on desktop
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      onClose && onClose();
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#EFF4FF] text-[#2563EB] font-bold shadow-xs'
                        : 'text-[#475569] hover:text-[#171A21] hover:bg-[#F7F8FA]'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 stroke-[2]" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-[11px] font-bold leading-none text-white rounded-full ${
                      item.badgeVariant === 'green' ? 'bg-[#047857]' : 'bg-[#B45309]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Budget Summary & Demo Reset */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-[#FAFAFC]">
          {/* Compact Budget Micro-Widget */}
          <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#475467] font-semibold">Policy Budget</span>
              <span className="font-bold text-[#0F172A] tabular-nums">
                ${spent.toFixed(0)} / ${total.toFixed(0)}
              </span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                style={{ width: `${spentPercent}%` }}
                className="bg-[#2563EB] h-full transition-all duration-300 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-[#64748B]">
              <span>Avail: ${remaining.toFixed(0)}</span>
              <span>Limit: ${policy?.autoApproveLimit ?? 1000}</span>
            </div>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={resetting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-[#475467] hover:text-[#0F172A] bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-colors disabled:opacity-50 shadow-2xs"
          >
            {resetting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Environment</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-xl shadow-popover max-w-sm w-full p-6 border border-[#E2E8F0] animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] text-[#B42318] flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-[15px] font-semibold text-[#0F172A] mb-1">
              Reset Demo Environment?
            </h4>
            <p className="text-[13px] text-[#475467] mb-5 leading-relaxed">
              This will clear recent test deals, captured payments, and reset the policy budget back to $5,000 for a fresh judge demonstration.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 text-[13px] font-medium text-[#475467] hover:text-[#0F172A] bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 text-[13px] font-medium text-white bg-[#B42318] hover:bg-[#991B1B] rounded-lg shadow-xs transition-colors"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
