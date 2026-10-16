import React from 'react';
import { X, CheckCircle, FileText, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliverableModal({ deal, isOpen, onClose }) {
  if (!isOpen || !deal) return null;

  const deliverable = deal.deliverable || {};

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(deliverable, null, 2));
    toast.success('Deliverable JSON copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-xl shadow-popover max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#E6E8EC] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#101828]">
                Delivered AI Artifact
              </h3>
              <p className="text-[13px] text-[#475467]">
                Service: <span className="capitalize font-semibold text-[#101828]">{deal.serviceType}</span> &bull; Provider: <strong className="text-[#101828]">{deal.sellerAgent}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#101828] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-[14px]">
          {/* Payment Verification Callout */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 text-[#15803D] text-[13px] font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Gated by verified PayPal Sandbox settlement</span>
            </div>
            <span className="text-[13px] text-[#15803D] font-mono font-bold tabular-nums">
              ${deal.agreedAmount?.toFixed(2)} USD
            </span>
          </div>

          <div>
            <h4 className="text-[16px] font-bold text-[#101828] mb-1.5">
              {deliverable.title || 'Completed Service Deliverable'}
            </h4>
            {deliverable.summary && (
              <p className="text-[14px] text-[#344054] bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] leading-relaxed">
                {deliverable.summary}
              </p>
            )}
          </div>

          {/* Render structured slides */}
          {Array.isArray(deliverable.slides) && (
            <div className="space-y-2.5">
              <h5 className="text-[12px] font-bold text-[#475467] uppercase tracking-wider">
                Generated Slides ({deliverable.slides.length})
              </h5>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {deliverable.slides.map((s, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-[#2563EB] text-[13px] block mb-1">
                      Slide {idx + 1}: {s.title || s.headline}
                    </span>
                    <p className="text-[13px] text-[#475467] leading-relaxed">
                      {s.content || s.bulletPoints?.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render structured competitor intelligence */}
          {Array.isArray(deliverable.competitors) && (
            <div className="space-y-2.5">
              <h5 className="text-[12px] font-bold text-[#475467] uppercase tracking-wider">
                Competitor Intelligence ({deliverable.competitors.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {deliverable.competitors.map((c, idx) => (
                  <div key={idx} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-[#101828] text-[13px] block">
                      {c.name || `Competitor ${idx + 1}`}
                    </span>
                    <p className="text-[#475467] text-[12px] mt-1 leading-relaxed">
                      {c.strengths || c.details || JSON.stringify(c)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback code payload if raw json */}
          {!deliverable.slides && !deliverable.competitors && (
            <div className="bg-[#F8FAFC] text-[#101828] p-3.5 rounded-xl border border-[#E2E8F0] text-[12px] font-mono overflow-x-auto max-h-64 leading-relaxed">
              <pre>{JSON.stringify(deliverable, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between rounded-b-xl">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-[13px] font-semibold text-[#344054] hover:text-[#101828] bg-[#FFFFFF] border border-[#D0D5DD] rounded-lg hover:bg-[#F8FAFC] flex items-center gap-2 transition-colors shadow-2xs"
          >
            <Copy className="w-4 h-4 text-[#475467]" />
            <span>Copy Artifact Data</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
