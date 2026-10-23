import React, { useState, useEffect, useMemo } from 'react';
import { dealService, policyService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DeliverableModal from '../components/DeliverableModal';
import ReceiptModal from '../components/ReceiptModal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  RotateCcw,
  Search,
  ShieldCheck,
  CheckCircle,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [deals, setDeals] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected deal for Deliverable / Lifecycle / Receipt modal
  const [selectedDealForModal, setSelectedDealForModal] = useState(null);
  const [isDeliverableOpen, setIsDeliverableOpen] = useState(false);
  const [selectedLifecycleDeal, setSelectedLifecycleDeal] = useState(null);
  const [selectedDealForReceipt, setSelectedDealForReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsRes, policyRes] = await Promise.all([
        dealService.getDeals(),
        policyService.getPolicy()
      ]);
      setDeals(dealsRes.data?.deals || []);
      setPolicy(policyRes.data?.policy);
    } catch (err) {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      const matchesSearch =
        searchText.trim() === '' ||
        d.dealId?.toLowerCase().includes(searchText.toLowerCase()) ||
        d.sellerAgent?.toLowerCase().includes(searchText.toLowerCase()) ||
        d.serviceType?.toLowerCase().includes(searchText.toLowerCase()) ||
        d.paypalOrderId?.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deals, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / pageSize));
  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeals.slice(start, start + pageSize);
  }, [filteredDeals, currentPage, pageSize]);

  const exportCSV = () => {
    if (!filteredDeals.length) {
      toast.error('No transactions available to export');
      return;
    }
    const headers = ['Deal ID', 'Service', 'Seller Agent', 'Amount (USD)', 'Status', 'PayPal Order ID', 'Date'];
    const rows = filteredDeals.map(d => [
      d.dealId,
      d.serviceType,
      d.sellerAgent,
      d.agreedAmount?.toFixed(2) || '0.00',
      d.status,
      d.paypalOrderId || '—',
      new Date(d.createdAt).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendmesh_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to CSV');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-[26px] font-bold text-[#101828] tracking-tight">Transactions</h2>
          <p className="text-[14px] text-[#475467] mt-1">
            Complete transaction ledger with lifecycle traceability and PayPal settlement records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 text-[13px] font-semibold text-[#344054] hover:text-[#101828] bg-[#FFFFFF] border border-[#D0D5DD] rounded-lg transition-colors flex items-center gap-2 shadow-xs hover:bg-[#F8FAFC]"
          >
            <Download className="w-4 h-4 text-[#475467]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            className="px-3.5 py-2 text-[13px] font-semibold text-[#344054] hover:text-[#101828] bg-[#FFFFFF] border border-[#D0D5DD] rounded-lg transition-colors flex items-center gap-2 shadow-xs hover:bg-[#F8FAFC]"
          >
            <RotateCcw className="w-4 h-4 text-[#475467]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-[14px]">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search deals, orders, agents..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-[#D0D5DD] pl-9 pr-3.5 py-2.5 text-[14px] text-[#101828] bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
          />
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-3.5" />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <span className="text-[#475467] text-[13px] font-semibold whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-[#D0D5DD] px-3.5 py-2.5 text-[14px] font-medium text-[#101828] bg-[#FFFFFF] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">All Statuses</option>
            <option value="payment_completed">Completed</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
            <option value="checkout_created">Checkout Created</option>
          </select>
        </div>
      </div>

      {/* Transactions Table Container */}
      {loading ? (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 shadow-xs">
          <LoadingSpinner message="Querying transaction records..." />
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-12 text-center shadow-xs">
          <FileText className="w-10 h-10 text-[#667085] mx-auto mb-2" />
          <h4 className="text-[16px] font-bold text-[#101828]">No transactions found</h4>
          <p className="text-[14px] text-[#475467] mt-1 max-w-sm mx-auto">
            Transactions initiated through purchase requests and PayPal settlements will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475467] text-[12px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Deal ID</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Seller Agent</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">PayPal Order</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-center">Lifecycle</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                  <th className="py-3.5 px-4 text-right">Artifact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#101828]">
                {paginatedDeals.map((deal) => (
                  <tr key={deal.dealId} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#475467] whitespace-nowrap">
                      {deal.dealId ? `${deal.dealId.substring(0, 8)}...` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold capitalize text-[#101828] whitespace-nowrap">
                      {deal.serviceType}
                    </td>
                    <td className="py-3.5 px-4 text-[#344054] font-medium whitespace-nowrap">
                      {deal.sellerAgent}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#101828] tabular-nums whitespace-nowrap">
                      ${deal.agreedAmount !== undefined ? Number(deal.agreedAmount).toFixed(2) : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#475467] whitespace-nowrap">
                      {deal.paypalOrderId ? `${deal.paypalOrderId.substring(0, 11)}...` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#475467] text-[13px] whitespace-nowrap tabular-nums">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLifecycleDeal(deal)}
                        className="px-3 py-1 text-[12px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF4FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-md transition-colors shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {deal.status === 'payment_completed' ? (
                        <button
                          onClick={() => {
                            setSelectedDealForReceipt({
                              orderId: deal.paypalOrderId || deal.dealId,
                              captureId: deal.paypalCaptureId || deal.dealId,
                              amount: deal.agreedAmount,
                              currency: 'USD',
                              serviceType: deal.serviceType,
                              sellerAgent: deal.sellerAgent,
                              deliverable: deal.deliverable,
                              timestamp: deal.updatedAt || deal.createdAt
                            });
                            setIsReceiptOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold text-[#1E40AF] hover:text-[#1E3A8A] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-md transition-colors shadow-2xs"
                          title="View and print official certified receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Receipt</span>
                        </button>
                      ) : (
                        <span className="text-[#98A2B3] text-[13px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {deal.status === 'payment_completed' && deal.deliverable ? (
                        <button
                          onClick={() => {
                            setSelectedDealForModal(deal);
                            setIsDeliverableOpen(true);
                          }}
                          className="px-3 py-1 text-[12px] font-semibold text-[#15803D] hover:text-[#166534] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] rounded-md transition-colors shadow-2xs"
                        >
                          Deliverable
                        </button>
                      ) : (
                        <span className="text-[#98A2B3] text-[13px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls hugging bottom */}
          <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[13px] text-[#475467] font-medium">
            <span>
              Showing {filteredDeals.length ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(currentPage * pageSize, filteredDeals.length)} of {filteredDeals.length} transactions
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-md border border-[#D0D5DD] bg-[#FFFFFF] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors shadow-xs"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-[#101828]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md border border-[#D0D5DD] bg-[#FFFFFF] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors shadow-xs"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Lifecycle Inspector Modal */}
      {selectedLifecycleDeal && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#FFFFFF] rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-[17px] font-bold text-[#101828]">Transaction Traceability Lifecycle</h3>
                <p className="text-[13px] text-[#64748B] font-mono mt-0.5">Deal #{selectedLifecycleDeal.dealId.substring(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelectedLifecycleDeal(null)}
                className="p-1.5 text-[#64748B] hover:text-[#101828] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px] overflow-y-auto flex-1">
              {/* Lifecycle progression timeline */}
              <div className="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2E8F0]">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className="w-7 h-7 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 text-[11px] font-bold shadow-2xs">
                    1
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] flex-1">
                    <span className="font-bold text-[#101828] block text-[14px]">Purchase Request & Gemini Analysis</span>
                    <p className="text-[#475467] mt-1 leading-relaxed">Task interpreted and service requirements classified by Google Gemini 2.5.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className="w-7 h-7 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 text-[11px] font-bold shadow-2xs">
                    2
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] flex-1">
                    <span className="font-bold text-[#101828] block text-[14px]">Offer Selection</span>
                    <p className="text-[#475467] mt-1 leading-relaxed">Selected provider: <strong className="text-[#101828]">{selectedLifecycleDeal.sellerAgent}</strong> at <strong className="text-[#101828]">${selectedLifecycleDeal.agreedAmount?.toFixed(2)} USD</strong>.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className="w-7 h-7 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 text-[11px] font-bold shadow-2xs">
                    3
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] flex-1">
                    <span className="font-bold text-[#101828] block text-[14px]">Policy Guardrail Evaluation</span>
                    <p className="text-[#475467] mt-1 leading-relaxed">Deterministic treasury check: category whitelisted & under spending ceiling.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className="w-7 h-7 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 text-[11px] font-bold shadow-2xs">
                    4
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] flex-1">
                    <span className="font-bold text-[#101828] block text-[14px]">PayPal Settlement</span>
                    <p className="text-[#475467] mt-1 leading-relaxed">
                      Order: <span className="font-mono text-[#101828] font-semibold">{selectedLifecycleDeal.paypalOrderId || 'Pending capture'}</span>
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3.5 relative">
                  <div className="w-7 h-7 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] flex items-center justify-center shrink-0 text-[11px] font-bold shadow-2xs">
                    ✓
                  </div>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0] flex-1">
                    <span className="font-bold text-[#101828] block text-[14px]">Current Status</span>
                    <div className="mt-1.5">
                      <StatusBadge status={selectedLifecycleDeal.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLifecycleDeal(null)}
                className="px-5 py-2 text-[13px] font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliverable Modal */}
      <DeliverableModal
        deal={selectedDealForModal}
        isOpen={isDeliverableOpen}
        onClose={() => setIsDeliverableOpen(false)}
      />

      {/* Official Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedDealForReceipt(null);
        }}
        data={selectedDealForReceipt}
      />
    </div>
  );
}
