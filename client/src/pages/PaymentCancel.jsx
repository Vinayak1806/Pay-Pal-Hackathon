import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/api';
import { XCircle, ArrowLeft, Volume2 } from 'lucide-react';
import voiceEventBus, { VoiceEvents } from '../voice/voiceEventBus';
import { useVoiceContext } from '../context/VoiceContext';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { updateVoiceContext } = useVoiceContext();

  useEffect(() => {
    updateVoiceContext({
      lastEvent: {
        type: VoiceEvents.CAPTURE_FAILED,
        reason: 'PayPal checkout was cancelled by user. No funds were debited.'
      }
    });

    voiceEventBus.emit(VoiceEvents.CAPTURE_FAILED, {
      reason: 'PayPal checkout was cancelled by user. No funds were debited.',
    }, { force: true });

    if (token) {
      paymentService.handleCancelStatus(token).catch((err) => {
        console.error('Failed to notify cancel status:', err);
      });
    }
  }, [token]);

  return (
    <div className="max-w-md mx-auto my-12 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-8 text-center shadow-xs">
      <div className="w-12 h-12 bg-[#FEF2F2] text-[#B42318] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#FECACA]">
        <XCircle className="w-6 h-6 stroke-[2]" />
      </div>

      <h2 className="text-[18px] font-bold text-[#0F172A] mb-2">
        Payment Cancelled
      </h2>
      <p className="text-[14px] text-[#475467] leading-relaxed mb-4">
        No funds were debited from your PayPal Sandbox account. Any reserved budget limit has been released back into your policy pool.
      </p>

      {token && (
        <p className="text-[11px] text-[#64748B] font-mono mb-6 bg-[#F8FAFC] py-1 px-2.5 rounded border border-[#E2E8F0] inline-block">
          Token: {token}
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => {
            voiceEventBus.emit(VoiceEvents.CAPTURE_FAILED, {
              reason: 'PayPal checkout was cancelled by user. No funds were debited.',
            }, { force: true });
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] font-medium text-[13px] rounded-lg border border-[#CBD5E1] shadow-2xs transition-all active:scale-95"
          title="Play voice cancellation notice"
        >
          <Volume2 className="w-4 h-4 text-[#B42318]" />
          <span>Hear Voice Notice</span>
        </button>

        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[13px] rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Purchase Requests</span>
        </Link>
      </div>
    </div>
  );
}
