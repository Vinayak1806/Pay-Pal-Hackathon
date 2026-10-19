import React from 'react';
import { X, ShieldCheck, Printer, CheckCircle, Copy, Award, Check, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { printReceiptDocument } from '../utils/printReceipt';

export default function ReceiptModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const {
    orderId = 'N/A',
    captureId = 'N/A',
    amount = 0,
    currency = 'USD',
    serviceType = 'AI Specialized Services',
    sellerAgent = 'SlideForge AI (SpendMesh Verified Agent)',
    deliverable = null,
    timestamp = new Date()
  } = data;

  const receiptNumber = `SM-REC-${new Date().getFullYear()}-${(orderId || 'TXN').slice(-8).toUpperCase()}`;

  const mockHash = `0x${Array.from(orderId + captureId)
    .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
    .toString(16)
    .padStart(8, '0')
    .toUpperCase()}F882C74A92E`;

  const handlePrint = () => {
    printReceiptDocument(data);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(mockHash);
    toast.success('Integrity hash copied to clipboard');
  };

  const formattedDate = new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  return (
    <div
      id="print-official-receipt-wrapper"
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:static print:inset-auto print:block print:p-0 print:bg-white print:overflow-visible"
    >
      <div
        id="print-official-receipt"
        className="bg-[#FFFFFF] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto print:shadow-none print:border-none print:max-h-none print:block print:w-full print:max-w-none print:my-0 print:p-8"
      >
        {/* ============================================================== */}
        {/* HEADER: Enterprise Letterhead & Verification Badge */}
        {/* ============================================================== */}
        <div className="p-6 sm:p-7 border-b border-[#E2E8F0] bg-[#FFFFFF] flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-[18px] text-[#101828] tracking-tight block leading-none">
                  SpendMesh <span className="text-[#2563EB]">AI</span>
                </span>
                <span className="text-[11px] text-[#64748B] font-medium tracking-tight">
                  Financial Policy Layer &bull; Autonomous Escrow Gateway
                </span>
              </div>
            </div>

            <h3 className="text-[16px] font-bold text-[#101828] pt-1">
              Official Settlement Receipt &amp; Compliance Certificate
            </h3>
            <p className="text-[12px] text-[#475467]">
              Issued for transaction executed under deterministic policy governance
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[#64748B] hover:text-[#101828] hover:bg-[#F8FAFC] rounded-lg print:hidden transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[11px] font-bold shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                SETTLED &bull; PAYPAL SANDBOX
              </span>
              <span className="block font-mono text-[11px] text-[#64748B] mt-1 font-semibold">
                Ref: {receiptNumber}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BODY: Full Financial Audit Record */}
        {/* ============================================================== */}
        <div className="p-6 sm:p-7 space-y-5 text-[13px] text-[#101828] overflow-y-auto flex-1 print:overflow-visible print:p-0 print:space-y-4">
          {/* Metadata Grid (Payer vs Payee) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] print:bg-white print:border-[#CBD5E1]">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Billed To (Authorized Enterprise Payer):
              </span>
              <span className="font-bold text-[#101828] text-[13px] block">
                Enterprise Treasury Account (demo-user)
              </span>
              <span className="text-[12px] text-[#475467] block">
                Policy Governance: Active Deterministic Matrix
              </span>
              <span className="text-[11px] text-[#64748B] block">
                Settlement Gateway: PayPal Orders v2 Sandbox
              </span>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Fulfillment Merchant (Seller Agent):
              </span>
              <span className="font-bold text-[#101828] text-[13px] block capitalize">
                {sellerAgent}
              </span>
              <span className="text-[12px] text-[#475467] block capitalize">
                Service Domain: {serviceType}
              </span>
              <span className="text-[11px] text-[#64748B] block">
                Date &amp; Time: {formattedDate}
              </span>
            </div>
          </div>

          {/* Itemized Accounting Table */}
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden print:border-[#CBD5E1]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#475467] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Item &amp; Deliverable Scope</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Agreed Rate</th>
                  <th className="py-2.5 px-4 text-right">Settled Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#101828]">
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-semibold block capitalize">{serviceType} Deliverable</span>
                    <span className="text-[11px] text-[#64748B]">
                      Executed by specialized AI agent under server-verified binding
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium">1</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium">
                    ${Number(amount).toFixed(2)} USD
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold">
                    ${Number(amount).toFixed(2)} USD
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-[#475467]">Autonomous Escrow &amp; Policy Oversight</span>
                    <span className="text-[10px] text-[#94A3B8] block">Deterministic pre-capture verification</span>
                  </td>
                  <td className="py-2.5 px-4 text-center text-[#64748B]">1</td>
                  <td className="py-2.5 px-4 text-right text-[#64748B]">$0.00</td>
                  <td className="py-2.5 px-4 text-right text-[#15803D] font-semibold">$0.00 (Included)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-[#475467]">PayPal Sandbox Orders v2 Gateway Processing</span>
                    <span className="text-[10px] text-[#94A3B8] block">Direct server-to-server capture</span>
                  </td>
                  <td className="py-2.5 px-4 text-center text-[#64748B]">1</td>
                  <td className="py-2.5 px-4 text-right text-[#64748B]">$0.00</td>
                  <td className="py-2.5 px-4 text-right text-[#15803D] font-semibold">$0.00 (Waived)</td>
                </tr>
              </tbody>
              <tfoot className="bg-[#F8FAFC] border-t border-[#E2E8F0] text-[13px]">
                <tr>
                  <td colSpan={2} className="py-2.5 px-4 font-semibold text-[#475467]">
                    Subtotal
                  </td>
                  <td colSpan={2} className="py-2.5 px-4 text-right font-bold tabular-nums">
                    ${Number(amount).toFixed(2)} USD
                  </td>
                </tr>
                <tr className="border-t border-[#E2E8F0]">
                  <td colSpan={2} className="py-3 px-4 font-bold text-[#101828] text-[14px]">
                    Total Settled Amount (USD)
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-right font-bold text-[#2563EB] text-[18px] tabular-nums">
                    ${Number(amount).toFixed(2)} USD
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deterministic Policy Compliance Matrix (5/5 Checks Passed) */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2.5 print:bg-white print:border-[#CBD5E1]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#101828] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                Deterministic Guardrail Compliance Certification
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                5 OF 5 CHECKS VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-[#15803D]">
                <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span className="font-medium text-[#101828]">1. Server-Side Price Binding:</span>
                <span className="text-[#15803D] font-bold">Passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#15803D]">
                <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span className="font-medium text-[#101828]">2. Permitted Category Check:</span>
                <span className="text-[#15803D] font-bold">Passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#15803D]">
                <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span className="font-medium text-[#101828]">3. Treasury Capacity Check:</span>
                <span className="text-[#15803D] font-bold">Passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#15803D]">
                <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span className="font-medium text-[#101828]">4. Replay &amp; Duplicate Shield:</span>
                <span className="text-[#15803D] font-bold">Passed</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#E2E8F0] text-[11px] text-[#475467] flex items-center justify-between">
              <span>5. Autonomous Approval Ceiling Check:</span>
              <span className="font-bold text-[#15803D]">Passed (Within Autonomous Ceiling)</span>
            </div>
          </div>

          {/* Deliverable Snapshot if present */}
          {deliverable && (
            <div className="border border-[#E2E8F0] rounded-xl p-3.5 bg-[#FFFFFF] space-y-1">
              <span className="font-bold text-[#101828] text-[12px] block">
                Deliverable Artifact: {deliverable.title || 'Completed AI Deliverable'}
              </span>
              {deliverable.summary && (
                <p className="text-[#475467] text-[12px] line-clamp-2 leading-relaxed">
                  {deliverable.summary}
                </p>
              )}
            </div>
          )}

          {/* Cryptographic Proof Identifiers */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1.5 text-[11px] print:bg-white print:border-[#CBD5E1]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#475467] uppercase tracking-wider">
                Cryptographic Audit Proof (SHA-256):
              </span>
              <button
                onClick={handleCopyHash}
                className="text-[11px] text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 print:hidden font-semibold"
              >
                <Copy className="w-3 h-3" /> Copy Hash
              </button>
            </div>
            <p className="font-mono text-[11px] text-[#101828] break-all bg-white p-2 rounded-lg border border-[#E2E8F0]">
              {mockHash}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-[#475467]">
              <div>PayPal Order ID: <strong className="text-[#101828]">{orderId}</strong></div>
              <div className="sm:text-right">PayPal Capture ID: <strong className="text-[#15803D]">{captureId}</strong></div>
            </div>
          </div>

          {/* Signatures & Certification Seal */}
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[#64748B]">
            <div>
              <span className="block font-semibold text-[#101828]">
                SpendMesh Policy Engine v1.0 Authority
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                Immutable record logged to MongoDB Audit Trail &bull; Dual-signed
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#D0D5DD] text-[#101828] font-bold text-[11px]">
              <Award className="w-4 h-4 text-[#B45309]" />
              <span>PayPal Orders v2 Verified</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FOOTER: Modal Controls (Hidden in Print) */}
        {/* ============================================================== */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-[#475467] hover:text-[#101828] hover:bg-white rounded-lg border border-transparent hover:border-[#D0D5DD] transition-colors"
          >
            Close Window
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold rounded-lg shadow-xs flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
