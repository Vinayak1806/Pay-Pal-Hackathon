import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [eventType, setEventType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [dealId, setDealId] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const fetchLogs = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = { page: targetPage };
      if (eventType) params.eventType = eventType;
      if (outcome) params.outcome = outcome;
      if (dealId.trim()) params.dealId = dealId.trim();

      const res = await auditService.getLogs(params);
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [eventType, outcome]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setEventType('');
    setOutcome('');
    setDealId('');
    fetchLogs(1);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyJson = (id, data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    toast.success('Audit record metadata copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatEventType = (type) => {
    if (!type) return 'Unknown';
    return type
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const outcomeBadge = (val) => {
    const configs = {
      success: { bg: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]', dot: 'bg-[#15803D]' },
      blocked: { bg: 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]', dot: 'bg-[#B42318]' },
      failed: { bg: 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]', dot: 'bg-[#B42318]' },
      pending: { bg: 'bg-[#FFFBEB] text-[#B45309] border-[#FED7AA]', dot: 'bg-[#B45309]' }
    };
    const c = configs[val] || { bg: 'bg-[#F8FAFC] text-[#475467] border-[#E2E8F0]', dot: 'bg-[#64748B]' };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold border capitalize ${c.bg}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
        <span>{val || '—'}</span>
      </span>
    );
  };

  const getEventBadge = (type) => {
    if (!type) return null;
    const formatted = formatEventType(type);
    if (type.includes('blocked') || type.includes('tamper') || type.includes('failed')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold bg-[#FEF2F2] text-[#B42318] border border-[#FECACA]">
          {formatted}
        </span>
      );
    }
    if (type.includes('approval')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FED7AA]">
          {formatted}
        </span>
      );
    }
    if (type.includes('payment') || type.includes('captured')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
          {formatted}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold bg-[#EFF4FF] text-[#2563EB] border border-[#BFDBFE]">
        {formatted}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-[#101828] tracking-tight">Audit Logs</h2>
          <p className="text-[14px] text-[#475467] mt-1">
            Immutable, cryptographically verifiable trace of agent transactions, policy evaluations, and PayPal settlements.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold text-[#344054] hover:text-[#101828] bg-[#FFFFFF] border border-[#D0D5DD] rounded-lg hover:bg-[#F8FAFC] transition-colors self-start shadow-xs"
          title="Refresh logs"
        >
          <RotateCcw className="w-4 h-4 text-[#475467]" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#E2E8F0] shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-[13px]">
          <div>
            <label className="block text-[#344054] font-semibold mb-1.5">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-[14px] text-[#101828] bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="">All Event Types</option>
              <option value="task_parsed">Task Parsed</option>
              <option value="deal_proposed">Deal Proposed</option>
              <option value="deal_accepted">Deal Accepted</option>
              <option value="approval_requested">Approval Requested</option>
              <option value="approval_granted">Approval Granted</option>
              <option value="approval_rejected">Approval Rejected</option>
              <option value="tamper_detected">Tamper Detected</option>
              <option value="checkout_created">Checkout Created</option>
              <option value="payment_captured">Payment Captured</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="policy_blocked">Policy Blocked</option>
              <option value="duplicate_blocked">Duplicate Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-[#344054] font-semibold mb-1.5">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-[14px] text-[#101828] bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="">All Outcomes</option>
              <option value="success">Success</option>
              <option value="blocked">Blocked</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-[#344054] font-semibold mb-1.5">Deal ID</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search deal ID..."
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full rounded-lg border border-[#D0D5DD] pl-9 pr-3.5 py-2.5 text-[14px] text-[#101828] bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
              <Search className="w-4 h-4 text-[#667085] absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="flex items-end gap-2.5">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-[14px] shadow-xs transition-colors"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#344054] hover:text-[#101828] border border-[#D0D5DD] rounded-lg text-[14px] font-semibold transition-colors shadow-xs"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 shadow-xs">
          <LoadingSpinner message="Querying audit records..." />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <FileText className="w-10 h-10 text-[#667085] mx-auto mb-2" />
          <h4 className="text-[16px] font-bold text-[#101828]">No matching audit events</h4>
          <p className="text-[14px] text-[#475467] mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or generate a purchase request from the marketplace.
          </p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475467] text-[12px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4">Deal ID</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#101828]">
                {logs.map((log) => {
                  const isExpanded = expandedRows[log._id];
                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#475467] font-mono text-[12px] tabular-nums">
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getEventBadge(log.eventType)}
                        </td>
                        <td className="py-3.5 px-4 text-[#344054] font-medium whitespace-nowrap">
                          {log.actor}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {outcomeBadge(log.outcome)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#475467] text-[12px] whitespace-nowrap">
                          {log.dealId ? `${log.dealId.substring(0, 8)}...` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleRow(log._id)}
                            className="inline-flex items-center gap-1.5 text-[#2563EB] hover:text-[#1D4ED8] font-semibold text-[13px]"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#F8FAFC]">
                          <td colSpan={6} className="p-4 border-t border-[#E2E8F0]">
                            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-4 space-y-2.5">
                              <div className="flex items-center justify-between text-[12px] pb-2 border-b border-[#E2E8F0]">
                                <span className="text-[#475467] font-semibold font-mono">
                                  Record ID: {log._id}
                                </span>
                                <button
                                  onClick={() => copyJson(log._id, log.details)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#D0D5DD] text-[#344054] hover:text-[#101828] bg-[#FFFFFF] hover:bg-[#F8FAFC] font-medium transition-colors text-[12px] shadow-xs"
                                >
                                  {copiedId === log._id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-[#15803D]" />
                                      <span className="text-[#15803D] font-semibold">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Payload</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="text-[12px] font-mono text-[#101828] overflow-x-auto p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] max-h-72 leading-relaxed">
                                {JSON.stringify(log.details || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[13px] text-[#475467] font-medium">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-md border border-[#D0D5DD] bg-[#FFFFFF] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors shadow-xs"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-md border border-[#D0D5DD] bg-[#FFFFFF] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors shadow-xs"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
