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
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/ReceiptModal';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { printReceiptDocument } from '../utils/printReceipt';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duplicate, setDuplicate] = useState(false);
  const [captureData, setCaptureData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);

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
      <div className="max-w-md mx-auto my-16 bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] p-8 text-center shadow-xs">
        <LoadingSpinner message="Capturing settlement on PayPal Sandbox..." />
        <p className="text-[11px] text-[#667085] mt-4 font-mono">Order Token: {token}</p>
      </div>
    );
  }

  if (duplicate) {
    return (
      <div className="max-w-md mx-auto my-16 bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] p-8 text-center shadow-xs">
        <div className="w-12 h-12 bg-[#FFFBEB] text-[#B45309] rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>
        <h2 className="text-[17px] font-semibold text-[#171A21] mb-2">
          Payment Already Processed
        </h2>
        <p className="text-[13px] text-[#667085] leading-relaxed mb-6">
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
            className="px-4 py-2 bg-[#FFFFFF] text-[#667085] hover:text-[#171A21] border border-[#E6E8EC] font-medium text-[13px] rounded-lg hover:bg-[#F7F8FA] transition-colors"
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Summary Card */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#F0FDF4] text-[#15803D] rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-[#171A21]">
              Payment Confirmed & Settled
            </h2>
            <p className="text-[12px] text-[#667085]">
              Settlement captured via PayPal Sandbox Orders v2 &bull; Policy budget updated atomically
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F8FA] p-4 rounded-lg border border-[#E6E8EC] text-[12px]">
          <div>
            <span className="text-[#667085] block text-[11px] mb-0.5">PayPal Order ID</span>
            <span className="font-mono font-medium text-[#171A21] truncate block text-[11px]">
              {token}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px] mb-0.5">Capture ID</span>
            <span className="font-mono font-medium text-[#15803D] truncate block text-[11px]">
              {captureData?.captureId || '—'}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px] mb-0.5">Amount Settled</span>
            <span className="font-semibold text-[#171A21] text-[13px] tabular-nums">
              ${captureData?.amount} {captureData?.currency || 'USD'}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[11px] mb-0.5">Settlement Status</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
              COMPLETED
            </span>
          </div>
        </div>
      </div>

      {/* Unlocked Deliverable */}
      {deliverable && (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-[14px] font-semibold text-[#171A21]">
                Unlocked AI Deliverable
              </h3>
            </div>
            <button
              onClick={copyDeliverable}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F7F8FA] text-[#667085] hover:text-[#171A21] border border-[#E6E8EC] text-[12px] font-medium rounded-lg flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#F7F8FA] p-3.5 rounded-lg border border-[#E6E8EC] space-y-1">
            <h4 className="text-[13px] font-semibold text-[#171A21]">
              {deliverable.title || 'Completed Service Deliverable'}
            </h4>
            {deliverable.summary && (
              <p className="text-[12px] text-[#667085] leading-relaxed">{deliverable.summary}</p>
            )}
          </div>

          {Array.isArray(deliverable.slides) && (
            <div className="space-y-2">
              <h5 className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                Generated Slides ({deliverable.slides.length})
              </h5>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {deliverable.slides.map((s, idx) => (
                  <div key={idx} className="p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E8EC] text-[12px]">
                    <span className="font-semibold text-[#2563EB] block mb-0.5">
                      Slide {idx + 1}: {s.title || s.headline}
                    </span>
                    <p className="text-[#667085] leading-relaxed">{s.content || s.bulletPoints?.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!deliverable.slides && (
            <pre className="bg-[#F7F8FA] text-[#171A21] p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-60 border border-[#E6E8EC]">
              {JSON.stringify(deliverable, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Navigation & Receipt Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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
            className="w-full sm:w-auto px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Receipt</span>
          </button>

          <button
            onClick={() => setShowReceipt(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#101828] font-semibold text-[13px] rounded-lg border border-[#D0D5DD] shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>View Audit Certificate</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            to="/transactions"
            className="w-1/2 sm:w-auto px-4 py-2.5 bg-[#FFFFFF] border border-[#D0D5DD] text-[#475467] hover:text-[#101828] font-semibold text-[13px] rounded-lg hover:bg-[#F8FAFC] shadow-xs text-center transition-colors"
          >
            Transactions Ledger
          </Link>
          <Link
            to="/requests"
            className="w-1/2 sm:w-auto px-4 py-2.5 bg-[#101828] hover:bg-black text-white font-semibold text-[13px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>New Request</span>
            <ArrowRight className="w-4 h-4" />
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
