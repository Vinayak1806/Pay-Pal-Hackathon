import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { dealService, demoService } from '../services/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [pendingCount, setPendingCount] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchPendingDeals = async () => {
    try {
      const res = await dealService.getDeals();
      const deals = res.data?.deals || [];
      const pending = deals.filter(d => d.status === 'pending_approval');
      setPendingCount(pending.length);
    } catch (err) {
      // Quiet fail on polling error
    }
  };

  useEffect(() => {
    fetchPendingDeals();
    const interval = setInterval(fetchPendingDeals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    setShowConfirm(false);
    setResetting(true);
    try {
      await demoService.reset();
      toast.success('Demo environment and budget reset successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      toast.error(err.message || 'Failed to reset demo data');
      setResetting(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                SpendMesh <span className="text-blue-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono tracking-wider">
                PAYPAL FINANCIAL GUARDRAIL
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/marketplace" className={navLinkClass}>
              Marketplace
            </NavLink>
            <NavLink to="/approvals" className={navLinkClass}>
              <span className="flex items-center gap-1.5">
                Approvals
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-600 rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </span>
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/audit" className={navLinkClass}>
              Audit Log
            </NavLink>
          </nav>

          {/* Demo Reset Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
              title="Reset MongoDB database, policy budget, and in-memory offers"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Demo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs">
          <NavLink to="/" className="text-slate-600 py-1 px-2">Home</NavLink>
          <NavLink to="/marketplace" className="text-slate-600 py-1 px-2">Market</NavLink>
          <NavLink to="/approvals" className="text-slate-600 py-1 px-2 relative">
            Approvals
            {pendingCount > 0 && (
              <span className="ml-1 px-1 py-0.2 bg-rose-600 text-white text-[10px] rounded-full">
                {pendingCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/dashboard" className="text-slate-600 py-1 px-2">Dashboard</NavLink>
          <NavLink to="/audit" className="text-slate-600 py-1 px-2">Audit</NavLink>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 text-center mb-1">
              Reset All Demo Data?
            </h4>
            <p className="text-xs text-slate-500 text-center mb-6">
              This will wipe deals, payments, and audit logs, restoring the policy budget to $5,000 for a fresh judge demonstration.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="w-1/2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="w-1/2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
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
