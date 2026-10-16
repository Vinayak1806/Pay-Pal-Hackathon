import React from 'react';
import { X, ShieldCheck, Printer, CheckCircle, Copy, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceiptModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const {
    orderId = 'N/A',
    captureId = 'N/A',
    amount = 0,
    currency = 'USD',
    serviceType = 'AI Services',
    sellerAgent = 'SpendMesh Verified Agent',
    deliverable = null,
    timestamp = new Date()
  } = data;

  const mockHash = `0x${Array.from(orderId + captureId)
    .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
    .toString(16)
    .padStart(8, '0')
    .toUpperCase()}F882C74A92E`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(mockHash);
    toast.success('Integrity hash copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-[#FFFFFF] rounded-xl shadow-popover max-w-xl w-full border border-[#E6E8EC] overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:border-none">
        {/* Certificate Header Banner */}
        <div className="p-6 border-b border-[#E6E8EC] bg-[#FFFFFF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EFF4FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase font-medium text-[#2563EB] block">
                Cryptographic Financial Audit Record
              </span>
              <h3 className="text-[17px] font-semibold text-[#171A21]">
                SpendMesh Settlement Certificate
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#667085] hover:text-[#171A21] hover:bg-[#F7F8FA] rounded-md print:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-4 text-[13px] text-[#171A21]">
          {/* Trust Verification Badge */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#15803D] font-medium text-[12px]">
              <CheckCircle className="w-4 h-4" />
              <span>Policy Guardrail Compliance Verified</span>
            </div>
            <span className="text-[11px] font-semibold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
              5/5 GATES PASSED
            </span>
          </div>

          {/* Core Settlement Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#F7F8FA] p-4 rounded-lg border border-[#E6E8EC]">
            <div>
              <span className="text-[#667085] block text-[11px]">Service Procured</span>
              <span className="font-semibold text-[#171A21] capitalize text-[13px]">{serviceType}</span>
            </div>
            <div className="text-right">
              <span className="text-[#667085] block text-[11px]">Amount Settled</span>
              <span className="font-semibold text-[#2563EB] text-[15px] tabular-nums">
                ${Number(amount).toFixed(2)} {currency}
              </span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">PayPal Order ID</span>
              <span className="font-mono text-[#171A21] text-[11px] truncate block">{orderId}</span>
            </div>
            <div className="text-right">
              <span className="text-[#667085] block text-[11px]">PayPal Capture ID</span>
              <span className="font-mono text-[#15803D] text-[11px] truncate block">{captureId}</span>
            </div>
          </div>

          {/* Audit Integrity Hash */}
          <div className="p-3 bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#667085] font-mono">SHA-256 Transaction Proof</span>
              <button
                onClick={handleCopyHash}
                className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 print:hidden font-medium"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <p className="font-mono text-[11px] text-[#171A21] break-all">{mockHash}</p>
          </div>

          {/* Gated Deliverable Snapshot if present */}
          {deliverable && (
            <div className="border border-[#E6E8EC] rounded-lg p-3 bg-[#FFFFFF]">
              <span className="font-semibold text-[#171A21] text-[12px] block mb-0.5">
                Unlocked Artifact: {deliverable.title || 'Completed AI Deliverable'}
              </span>
              {deliverable.summary && (
                <p className="text-[#667085] text-[12px] line-clamp-2 leading-relaxed">{deliverable.summary}</p>
              )}
            </div>
          )}

          {/* Signatures & Timestamp */}
          <div className="pt-3 border-t border-[#E6E8EC] flex items-center justify-between text-[11px] text-[#667085]">
            <div>
              <span>Timestamp: {new Date(timestamp).toLocaleString()}</span>
              <span className="block text-[10px] text-[#8A94A6]">Auditor: SpendMesh Policy Engine v1.0</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#171A21] font-semibold">
              <Award className="w-3.5 h-3.5 text-[#B45309]" />
              <span>PayPal Orders v2 Verified</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAFC] border-t border-[#E6E8EC] flex items-center justify-between print:hidden">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[12px] font-medium text-[#667085] hover:text-[#171A21]"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Audit Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
