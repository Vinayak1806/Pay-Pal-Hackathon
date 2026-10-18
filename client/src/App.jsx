import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Voice Assistant System
import { VoiceProvider } from './context/VoiceContext';
import VoiceAssistant from './voice/VoiceAssistant';
import VoiceButton from './voice/VoiceButton';
import { voiceEventBus, VoiceEvents } from './voice/voiceEventBus';

function RouteWatcher() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      voiceEventBus.emit(VoiceEvents.PAGE_CHANGED, location.pathname);
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <VoiceProvider>
        <RouteWatcher />
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
          <div className="print:hidden">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main Content Viewport */}
          <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-200 ${
            sidebarOpen ? 'md:pl-60' : 'pl-0'
          } print:pl-0 print:m-0 print:block print:bg-white`}>
            <div className="print:hidden">
              <Header
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
              />
            </div>

            <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
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

            <footer className="border-t border-[#E6E8EC] bg-[#FFFFFF] py-4 px-6 text-[12px] text-[#667085] flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
              <div>
                <span className="font-semibold text-[#171A21]">SpendMesh AI</span>
                <span className="mx-2 text-[#D0D5DD]">&bull;</span>
                <span>Autonomous Agent Financial Policy &amp; PayPal Settlement Engine</span>
              </div>
              <div className="text-[11px] text-[#8A94A6]">
                PayPal Orders v2 Sandbox &bull; Google Gemini 2.5 Flash
              </div>
            </footer>
          </div>

          {/* Voice Assistant — globally mounted, outside main layout flow */}
          <div className="print:hidden">
            <VoiceAssistant />
            <VoiceButton />
          </div>
        </div>
      </VoiceProvider>
    </Router>
  );
}
