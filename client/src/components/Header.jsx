import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus, PanelLeft } from 'lucide-react';

export default function Header({ sidebarOpen, onToggleSidebar }) {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Overview';
      case '/requests':
      case '/marketplace':
        return 'Purchase Requests';
      case '/agents':
        return 'Agent Marketplace';
      case '/transactions':
      case '/dashboard':
        return 'Transactions';
      case '/policy':
        return 'Policy Center';
      case '/audit':
        return 'Audit Logs';
      case '/approvals':
        return 'Approvals Queue';
      case '/payment/success':
        return 'Payment Confirmation';
      case '/payment/cancel':
        return 'Payment Cancelled';
      default:
        return 'SpendMesh AI';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E6E8EC] sticky top-0 z-30 flex items-center justify-between px-5 md:px-8">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 px-2.5 text-[#344054] hover:text-[#101828] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D0D5DD] hover:border-[#98A2B3] rounded-lg transition-all shadow-2xs hover:shadow-xs hidden md:inline-flex items-center gap-1.5 text-[12px] font-semibold active:scale-95"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeft className="w-4 h-4 stroke-[2.2] text-[#2563EB]" />
            <span>Open Menu</span>
          </button>
        )}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-[#667085] hover:text-[#171A21] rounded-lg md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] font-bold text-[#171A21]">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/requests"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span>New Purchase Request</span>
        </Link>
      </div>
    </header>
  );
}
