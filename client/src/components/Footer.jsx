import React from 'react';
import { Shield, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#EAECEF] bg-[#FFFFFF] py-2.5 px-6 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 pr-14 md:pr-18">
        {/* Left: Clean Brand & Mission */}
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <div className="w-5 h-5 rounded bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Shield className="w-3 h-3" />
          </div>
          <span className="font-semibold text-[12.5px] text-[#0F172A] tracking-tight">
            SpendMesh AI
          </span>
          <span className="hidden sm:inline text-[#CBD5E1] text-[12px]">•</span>
          <span className="text-[12px] text-[#64748B]">
            Autonomous Agent Spending Governance &amp; PayPal Settlement Engine
          </span>
        </div>

        {/* Right: Sleek Fintech Status Badges */}
        <div className="flex items-center gap-2 text-[11px] shrink-0 text-[#475467]">
          {/* PayPal Orders v2 Sandbox Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-medium shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-[#0F172A] font-semibold">PayPal Orders v2</span>
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#64748B] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">
              Sandbox
            </span>
          </div>

          {/* Gemini 2.5 Flash Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-medium shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#64748B]" />
            <span className="text-[#0F172A] font-medium">Gemini 2.5 Flash</span>
          </div>

          {/* SHA-256 Security Proof */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-medium shadow-2xs">
            <Lock className="w-3 h-3 text-[#64748B]" />
            <span>SHA-256 Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
