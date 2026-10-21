import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentService, dealService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Printer,
  Download,
  Loader2,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Eye,
  Code2,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/ReceiptModal';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { printReceiptDocument, downloadReceiptPdf } from '../utils/printReceipt';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duplicate, setDuplicate] = useState(false);
  const [captureData, setCaptureData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'raw'

  useEffect(() => {
    if (!token) {
      setError('No payment token found in return URL. Return to purchase requests.');
      setLoading(false);
      return;
    }

    const captureOrder = async () => {
      try {
        const res = await paymentService.capturePayment(token);
        if (res.data?.captureStatus === 'COMPLETED' || res.data?.dealStatus === 'payment_completed') {
          setCaptureData(res.data);
          // Emit verified capture — drives voice narration based on real backend result
          voiceEventBus.emit(VoiceEvents.CAPTURE_VERIFIED, {
            amount: res.data.amount,
            captureId: res.data.captureId,
          }, { force: true });
        } else {
          setError(`Payment capture incomplete: status ${res.data?.captureStatus}`);
          voiceEventBus.emit(VoiceEvents.CAPTURE_FAILED, {
            reason: `Capture status: ${res.data?.captureStatus}`,
          }, { force: true });
        }
      } catch (err) {
        try {
          const dealsRes = await dealService.getDeals();
          const matchingDeal = (dealsRes.data?.deals || []).find(d => d.paypalOrderId === token);
          if (matchingDeal) {
            setCaptureData({
              captureStatus: 'COMPLETED',
              captureId: matchingDeal.paypalCaptureId || matchingDeal.paypalOrderId,
              amount: matchingDeal.agreedAmount,
              currency: 'USD',
              deliverable: matchingDeal.deliverable,
              serviceType: matchingDeal.serviceType,
              sellerAgent: matchingDeal.sellerAgent
            });
            return;
          }
        } catch (fetchErr) {
          // ignore
        }

        if (err.code === 'DUPLICATE_CAPTURE' || err.status === 409) {
          setDuplicate(true);
          setCaptureData(err.data || {});
        } else {
          setError(err.message || 'Failed to capture PayPal payment');
        }
      } finally {
        setLoading(false);
      }
    };

    captureOrder();
  }, [token]);

  const copyDeliverable = () => {
    if (captureData?.deliverable) {
      navigator.clipboard.writeText(JSON.stringify(captureData.deliverable, null, 2));
      setCopied(true);
      toast.success('Deliverable payload copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-16 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-8 text-center shadow-xs">
        <LoadingSpinner message="Capturing settlement on PayPal Sandbox..." />
        <p className="text-[11px] text-[#64748B] mt-4 font-mono">Order Token: {token}</p>
      </div>
    );
  }

  if (duplicate) {
    return (
      <div className="max-w-md mx-auto my-16 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-8 text-center shadow-xs">
        <div className="w-12 h-12 bg-[#FFFBEB] text-[#B45309] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#FED7AA]">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>
        <h2 className="text-[17px] font-bold text-[#0F172A] mb-2">
          Payment Already Processed
        </h2>
        <p className="text-[13px] text-[#475467] leading-relaxed mb-6">
          This payment token has already been captured and settled. The SpendMesh guardrail prevented replay and duplicate balance deduction.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/transactions"
            className="px-4 py-2 bg-[#2563EB] text-white font-medium text-[13px] rounded-lg shadow-xs hover:bg-[#1D4ED8] transition-colors"
          >
            View Transactions
          </Link>
          <Link
            to="/requests"
            className="px-4 py-2 bg-[#FFFFFF] text-[#475467] hover:text-[#0F172A] border border-[#E2E8F0] font-medium text-[13px] rounded-lg hover:bg-[#F8FAFC] transition-colors"
          >
            New Request
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 bg-[#FFFFFF] rounded-xl border border-[#FECACA] p-8 text-center shadow-xs">
        <div className="w-12 h-12 bg-[#FEF2F2] text-[#B42318] rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>
        <h2 className="text-[17px] font-semibold text-[#171A21] mb-2">
          Payment Capture Failed
        </h2>
        <p className="text-[13px] text-[#B42318] leading-relaxed mb-6">{error}</p>
        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171A21] text-white font-medium text-[13px] rounded-lg hover:bg-black transition-colors"
        >
          Return to Purchase Requests
        </Link>
      </div>
    );
  }

  const deliverable = captureData?.deliverable;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Success Summary Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[#F0FDF4] text-[#15803D] rounded-xl flex items-center justify-center shrink-0 border border-[#DCFCE7] shadow-2xs">
              <CheckCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
                  Payment Confirmed &amp; Settled
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  Verified
                </span>
              </div>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">
                Settlement captured via PayPal Sandbox Orders v2 &bull; Policy budget deducted atomically
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => {
                printReceiptDocument({
                  orderId: token,
                  captureId: captureData?.captureId,
                  amount: captureData?.amount,
                  currency: captureData?.currency || 'USD',
                  serviceType: captureData?.serviceType || 'Presentation & Pitch Deck',
                  sellerAgent: captureData?.sellerAgent || 'SlideForge AI (SpendMesh Verified Agent)',
                  deliverable: deliverable,
                  timestamp: new Date()
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[12px] rounded-lg shadow-2xs transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={async () => {
                try {
                  setIsDownloadingPdf(true);
                  toast.loading('Generating certified PDF receipt...', { id: 'pdf-dl' });
                  await downloadReceiptPdf({
                    orderId: token,
                    captureId: captureData?.captureId,
                    amount: captureData?.amount,
                    currency: captureData?.currency || 'USD',
                    serviceType: captureData?.serviceType || 'Presentation & Pitch Deck',
                    sellerAgent: captureData?.sellerAgent || 'SlideForge AI (SpendMesh Verified Agent)',
                    deliverable: deliverable,
                    timestamp: new Date()
                  });
                  toast.success('PDF Receipt downloaded successfully!', { id: 'pdf-dl' });
                } catch (err) {
                  toast.error('Failed to export PDF. Use Print to Save as PDF.', { id: 'pdf-dl' });
                } finally {
                  setIsDownloadingPdf(false);
                }
              }}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] font-semibold text-[12px] rounded-lg border border-[#D0D5DD] shadow-2xs transition-all active:scale-95 disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#2563EB]" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Order ID */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider mb-1">
              PayPal Order ID
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[12.5px] font-semibold text-[#0F172A] truncate" title={token}>
                {token}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(token);
                  toast.success('Order ID copied');
                }}
                className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] transition-colors shrink-0"
                title="Copy Order ID"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Capture ID */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider mb-1">
              PayPal Capture ID
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono text-[12.5px] font-semibold text-[#15803D] truncate" title={captureData?.captureId}>
                {captureData?.captureId || '—'}
              </span>
              {captureData?.captureId && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(captureData.captureId);
                    toast.success('Capture ID copied');
                  }}
                  className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] transition-colors shrink-0"
                  title="Copy Capture ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Amount Settled */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider mb-1">
              Amount Settled
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-bold text-[#0F172A] tabular-nums">
                ${Number(captureData?.amount || 0).toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-[#64748B]">
                {captureData?.currency || 'USD'}
              </span>
            </div>
          </div>

          {/* Settlement Status */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider mb-1">
              Settlement Status
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[11.5px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                COMPLETED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Deliverable */}
      {deliverable && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475467] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-[#0F172A]">
                    Unlocked AI Deliverable
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475467] border border-[#E2E8F0] text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    Escrow Released
                  </span>
                </div>
                <p className="text-[11.5px] text-[#64748B]">
                  Verified work product released by SpendMesh Escrow upon PayPal settlement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {/* Toggle Formatted / Raw View */}
              <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
                <button
                  type="button"
                  onClick={() => setViewMode('formatted')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1 transition-all ${
                    viewMode === 'formatted'
                      ? 'bg-white text-[#0F172A] font-semibold shadow-2xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Formatted</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1 transition-all ${
                    viewMode === 'raw'
                      ? 'bg-white text-[#0F172A] font-semibold shadow-2xs border border-[#E2E8F0]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Raw JSON</span>
                </button>
              </div>

              {/* Copy Payload Button */}
              <button
                onClick={copyDeliverable}
                className="px-2.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#475467] hover:text-[#0F172A] border border-[#D0D5DD] text-[11.5px] font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Copy entire deliverable JSON payload"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#15803D]" />
                    <span className="text-[#15803D]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Deliverable Title & Executive Summary Banner */}
          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1]">
                {captureData?.serviceType || 'Deliverable'}
              </span>
              <h4 className="text-[14.5px] font-bold text-[#0F172A]">
                {deliverable.title || deliverable.siteName || 'Completed Service Deliverable'}
              </h4>
            </div>
            {(deliverable.summary || deliverable.description || deliverable.heroSubtext) && (
              <p className="text-[12.5px] text-[#475467] leading-relaxed">
                {deliverable.summary || deliverable.description || deliverable.heroSubtext}
              </p>
            )}
          </div>

          {/* Formatted Content View */}
          {viewMode === 'formatted' ? (
            <div className="space-y-4">
              {/* Research Format: Key Findings */}
              {Array.isArray(deliverable.keyFindings) && deliverable.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F172A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Key Strategic Findings ({deliverable.keyFindings.length})</span>
                  </div>
                  <div className="space-y-2">
                    {deliverable.keyFindings.map((finding, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white hover:bg-[#F8FAFC] transition-colors rounded-xl border border-[#E2E8F0] flex items-start gap-3 shadow-2xs"
                      >
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475467] font-mono font-semibold text-[10.5px] shrink-0 mt-0.5 border border-[#E2E8F0]">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="text-[12.5px] text-[#334155] leading-relaxed font-normal">
                          {finding}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Format: Recommendations */}
              {Array.isArray(deliverable.recommendations) && deliverable.recommendations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F172A]">
                    <Lightbulb className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Actionable Recommendations ({deliverable.recommendations.length})</span>
                  </div>
                  <div className="space-y-2">
                    {deliverable.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white hover:bg-[#F8FAFC] transition-colors rounded-xl border border-[#E2E8F0] flex items-start gap-3 shadow-2xs"
                      >
                        <span className="px-2 py-0.5 rounded bg-[#0F172A] text-white font-semibold text-[10px] shrink-0 mt-0.5 shadow-2xs">
                          Action {idx + 1}
                        </span>
                        <p className="text-[12.5px] text-[#0F172A] leading-relaxed font-medium">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Presentation Slides Format */}
              {Array.isArray(deliverable.slides) && deliverable.slides.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F172A]">
                    <Layers className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Generated Presentation Slides ({deliverable.slides.length})</span>
                  </div>
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {deliverable.slides.map((s, idx) => (
                      <div key={idx} className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] text-[12px] space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F172A] text-[12.5px]">
                            Slide {s.slideNumber || idx + 1}: {s.title || s.headline}
                          </span>
                        </div>
                        {Array.isArray(s.bulletPoints) ? (
                          <ul className="list-disc list-inside space-y-1 text-[#475467] text-[12px] pl-1">
                            {s.bulletPoints.map((b, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[#475467] leading-relaxed">{s.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Website Copy Format */}
              {Array.isArray(deliverable.sections) && deliverable.sections.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F172A]">
                    <Layers className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Website Sections ({deliverable.sections.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {deliverable.sections.map((sec, idx) => (
                      <div key={idx} className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] space-y-1 shadow-2xs">
                        <span className="font-semibold text-[#0F172A] text-[12px] block">
                          {sec.sectionName}
                        </span>
                        <p className="text-[12px] text-[#475467] leading-relaxed">{sec.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content / Design Elements Format */}
              {Array.isArray(deliverable.keyElements) && deliverable.keyElements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0F172A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Key Strategic Pillars ({deliverable.keyElements.length})</span>
                  </div>
                  <div className="space-y-2">
                    {deliverable.keyElements.map((el, idx) => (
                      <div key={idx} className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] text-[12px] flex items-start gap-3 shadow-2xs">
                        <span className="font-semibold text-[#0F172A] shrink-0 min-w-[120px]">{el.element}:</span>
                        <span className="text-[#475467] leading-relaxed">{el.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback for unrecognized custom JSON schema in formatted view */}
              {!deliverable.keyFindings && !deliverable.slides && !deliverable.sections && !deliverable.keyElements && (
                <pre className="bg-[#F8FAFC] text-[#0F172A] p-4 rounded-xl text-[12px] font-mono overflow-x-auto max-h-80 border border-[#E2E8F0]">
                  {JSON.stringify(deliverable, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            /* Raw JSON View */
            <div className="space-y-2">
              <pre className="bg-[#0F172A] text-[#E2E8F0] p-4 rounded-xl text-[11.5px] font-mono overflow-x-auto max-h-96 border border-[#334155] leading-relaxed">
                {JSON.stringify(deliverable, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Navigation & Receipt Actions Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 sm:p-4 rounded-xl shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 mt-4">
        {/* Document Artifacts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              printReceiptDocument({
                orderId: token,
                captureId: captureData?.captureId,
                amount: captureData?.amount,
                currency: captureData?.currency || 'USD',
                serviceType: captureData?.serviceType || 'Presentation & Pitch Deck',
                sellerAgent: captureData?.sellerAgent || 'SlideForge AI (SpendMesh Verified Agent)',
                deliverable: deliverable,
                timestamp: new Date()
              });
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] rounded-lg shadow-xs transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 stroke-[2.2]" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={async () => {
              try {
                setIsDownloadingPdf(true);
                toast.loading('Generating certified PDF receipt...', { id: 'pdf-dl' });
                await downloadReceiptPdf({
                  orderId: token,
                  captureId: captureData?.captureId,
                  amount: captureData?.amount,
                  currency: captureData?.currency || 'USD',
                  serviceType: captureData?.serviceType || 'Presentation & Pitch Deck',
                  sellerAgent: captureData?.sellerAgent || 'SlideForge AI (SpendMesh Verified Agent)',
                  deliverable: deliverable,
                  timestamp: new Date()
                });
                toast.success('PDF Receipt downloaded successfully!', { id: 'pdf-dl' });
              } catch (err) {
                toast.error('Failed to export PDF. Use Print to Save as PDF.', { id: 'pdf-dl' });
              } finally {
                setIsDownloadingPdf(false);
              }
            }}
            disabled={isDownloadingPdf}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#1E293B] font-semibold text-[13px] rounded-lg border border-[#D0D5DD] hover:border-[#98A2B3] shadow-2xs transition-all active:scale-95 disabled:opacity-60"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#2563EB] stroke-[2.2]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowReceipt(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#1E293B] font-semibold text-[13px] rounded-lg border border-[#D0D5DD] hover:border-[#98A2B3] shadow-2xs transition-all active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-[#16A34A] stroke-[2.2]" />
            <span>Audit Certificate</span>
          </button>
        </div>

        {/* Workflow Navigation */}
        <div className="flex items-center gap-2.5 justify-end pt-3 xl:pt-0 border-t xl:border-t-0 border-[#E2E8F0]">
          <Link
            to="/transactions"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#475467] hover:text-[#0F172A] font-semibold text-[13px] rounded-lg border border-[#D0D5DD] hover:border-[#98A2B3] shadow-2xs transition-all"
          >
            <span>Transactions Ledger</span>
          </Link>
          <Link
            to="/requests"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#101828] hover:bg-black text-white font-semibold text-[13px] rounded-lg shadow-xs transition-all active:scale-95"
          >
            <span>New Request</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </Link>
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={{
          orderId: token,
          captureId: captureData?.captureId,
          amount: captureData?.amount,
          currency: captureData?.currency || 'USD',
          serviceType: captureData?.serviceType || 'Presentation & Pitch Deck',
          sellerAgent: captureData?.sellerAgent || 'SlideForge AI (SpendMesh Verified Agent)',
          deliverable: deliverable,
          timestamp: new Date()
        }}
      />
    </div>
  );
}
