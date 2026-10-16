import React from 'react';
import StatusBadge from './StatusBadge';
import { Bot, ExternalLink, Calendar, FileCode, CheckCircle } from 'lucide-react';

export default function DealCard({ deal, onViewDeliverable, onCheckout }) {
  if (!deal) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono font-medium text-slate-400 block mb-1">
            #{deal.dealId?.substring(0, 8)}
          </span>
          <h4 className="text-base font-bold text-slate-900 capitalize flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Bot className="w-4 h-4" />
            </span>
            {deal.serviceType}
          </h4>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {deal.description || deal.terms}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div>
          <span className="block text-[11px] text-slate-400">Seller Agent</span>
          <span className="font-medium text-slate-800">{deal.sellerAgent}</span>
        </div>
        <div className="text-right">
          <span className="block text-[11px] text-slate-400">Agreed Amount</span>
          <span className="text-base font-extrabold text-blue-600">
            ${deal.agreedAmount?.toFixed(2)} {deal.currency}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2">
          {deal.status === 'payment_completed' && deal.deliverable && (
            <button
              onClick={() => onViewDeliverable && onViewDeliverable(deal)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              Deliverable
            </button>
          )}

          {['accepted', 'approved'].includes(deal.status) && onCheckout && (
            <button
              onClick={() => onCheckout(deal)}
              className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              Checkout <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
