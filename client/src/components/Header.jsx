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
      <div className="flex items-center gap-2.5">
        {!sidebarOpen && (
          <>
            <button
              onClick={onToggleSidebar}
              className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-lg transition-all hidden md:inline-flex items-center justify-center group"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeft className="w-[18px] h-[18px] stroke-[2] transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="h-4 w-px bg-[#E6E8EC] hidden md:block" />
          </>
        )}
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#64748B] hover:text-[#171A21] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] rounded-lg transition-all md:hidden flex items-center justify-center"
          aria-label="Toggle sidebar"
          title="Toggle menu"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] font-bold text-[#171A21]">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* PayPal Sandbox Status Indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[12px] font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>PayPal Sandbox v2</span>
        </div>

        {location.pathname !== '/requests' && location.pathname !== '/marketplace' && (
          <Link
            to="/requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold shadow-xs transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>New Request</span>
          </Link>
        )}
      </div>
    </header>
  );
}
