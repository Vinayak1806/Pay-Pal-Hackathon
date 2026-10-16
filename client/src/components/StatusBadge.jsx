import React from 'react';

export default function StatusBadge({ status }) {
  const configs = {
    proposed: {
      label: 'Proposed',
      bg: 'bg-[#F8FAFC] text-[#475467] border-[#D0D5DD]',
      dot: 'bg-[#64748B]'
    },
    accepted: {
      label: 'Accepted',
      bg: 'bg-[#EFF4FF] text-[#2563EB] border-[#BFDBFE]',
      dot: 'bg-[#2563EB]'
    },
    pending_approval: {
      label: 'Pending Approval',
      bg: 'bg-[#FFFBEB] text-[#B45309] border-[#FED7AA]',
      dot: 'bg-[#B45309]'
    },
    approved: {
      label: 'Approved',
      bg: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      dot: 'bg-[#15803D]'
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]',
      dot: 'bg-[#B42318]'
    },
    checkout_created: {
      label: 'Checkout Active',
      bg: 'bg-[#EFF4FF] text-[#2563EB] border-[#BFDBFE]',
      dot: 'bg-[#2563EB]'
    },
    payment_completed: {
      label: 'Settled & Verified',
      bg: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      dot: 'bg-[#15803D]'
    },
    payment_failed: {
      label: 'Payment Failed',
      bg: 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]',
      dot: 'bg-[#B42318]'
    },
    blocked: {
      label: 'Policy Blocked',
      bg: 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA]',
      dot: 'bg-[#B42318]'
    }
  };

  const config = configs[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-[#F8FAFC] text-[#475467] border-[#D0D5DD]',
    dot: 'bg-[#64748B]'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold border ${config.bg} shadow-2xs`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
      <span className="capitalize">{config.label}</span>
    </span>
  );
}
