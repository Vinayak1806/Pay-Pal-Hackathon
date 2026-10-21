import React from 'react';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ApprovalModal({ deal, isOpen, onClose, onAction, loading }) {
  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#FFFFFF] rounded-xl shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#B45309] flex items-center justify-center border border-[#FED7AA]">
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#0F172A]">
              Review Escalated Request
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-[13px] text-[#0F172A] overflow-y-auto flex-1">
          <div className="bg-[#FFFBEB] border border-[#FED7AA] rounded-lg p-3.5">
            <p className="text-[#B45309] text-[11px] font-semibold uppercase tracking-wider mb-1">
              Escalation Reason
            </p>
            <p className="text-[#92400E] text-[12px] font-medium leading-relaxed">
              {deal.blockedReason || 'Proposed amount exceeds autonomous approval threshold.'}
            </p>
          </div>

          <div className="space-y-2 border border-[#E2E8F0] rounded-lg p-3.5 bg-[#F8FAFC] text-[12px]">
            <div className="flex justify-between">
              <span className="text-[#475467]">Category / Service:</span>
              <span className="font-semibold text-[#0F172A] capitalize">{deal.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#475467]">Seller Agent:</span>
              <span className="font-semibold text-[#0F172A]">{deal.sellerAgent}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
              <span className="text-[#475467]">Agreed Amount:</span>
              <span className="font-semibold text-[#2563EB] text-[15px] tabular-nums">
                ${deal.agreedAmount?.toFixed(2)} USD
              </span>
            </div>
          </div>

          {deal.geminiReasoning && (
            <div className="text-[12px] text-[#475467] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
              <span className="font-semibold text-[#0F172A] block mb-0.5">Gemini Policy Evaluation:</span>
              "{deal.geminiReasoning}"
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-[#FAFAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={() => onAction('rejected')}
            disabled={loading}
            className="px-3.5 py-1.5 text-[12px] font-medium text-[#B42318] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors bg-[#FFFFFF]"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Deal</span>
          </button>
          <button
            onClick={() => onAction('approved')}
            disabled={loading}
            className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded-lg flex items-center gap-1.5 disabled:opacity-50 shadow-xs transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve Deal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
