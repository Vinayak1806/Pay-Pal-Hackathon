import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import Marketplace from './pages/Marketplace';
import Agents from './pages/Agents';
import Dashboard from './pages/Dashboard';
import PolicyCenter from './pages/PolicyCenter';
import AuditLog from './pages/AuditLog';
import Approvals from './pages/Approvals';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-[#F7F8FA] text-[#171A21] flex">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#171A21',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #E6E8EC',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }
          }}
        />

        {/* Desktop and Mobile Responsive Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-200 ${
          sidebarOpen ? 'md:pl-60' : 'pl-0'
        }`}>
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          />

          <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/requests" element={<Marketplace />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/transactions" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/policy" element={<PolicyCenter />} />
              <Route path="/audit" element={<AuditLog />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="border-t border-[#E6E8EC] bg-[#FFFFFF] py-4 px-6 text-[12px] text-[#667085] flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-[#171A21]">SpendMesh AI</span>
              <span className="mx-2 text-[#D0D5DD]">&bull;</span>
              <span>Autonomous Agent Financial Policy & PayPal Settlement Engine</span>
            </div>
            <div className="text-[11px] text-[#8A94A6]">
              PayPal Orders v2 Sandbox &bull; Google Gemini 2.5 Flash
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
}
