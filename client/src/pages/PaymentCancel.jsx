import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentService } from '../services/api';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      paymentService.handleCancelStatus(token).catch((err) => {
        console.error('Failed to notify cancel status:', err);
      });
    }
  }, [token]);

  return (
    <div className="max-w-md mx-auto my-12 bg-[#FFFFFF] rounded-xl border border-[#E6E8EC] p-8 text-center shadow-xs">
      <div className="w-12 h-12 bg-[#FEF2F2] text-[#B42318] rounded-xl flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-6 h-6 stroke-[2]" />
      </div>

      <h2 className="text-[18px] font-semibold text-[#171A21] mb-2">
        Payment Cancelled
      </h2>
      <p className="text-[13px] text-[#667085] leading-relaxed mb-4">
        No funds were debited from your PayPal Sandbox account. Any reserved budget limit has been released back into your policy pool.
      </p>

      {token && (
        <p className="text-[11px] text-[#8A94A6] font-mono mb-6 bg-[#F7F8FA] py-1 px-2 rounded border border-[#E6E8EC] inline-block">
          Token: {token}
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
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
