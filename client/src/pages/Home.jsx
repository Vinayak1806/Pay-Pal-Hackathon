import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Bot,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Lock,
  Zap,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="text-center pt-8 sm:pt-16 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          PayPal AI Hackathon 2026 Submission
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          SpendMesh <span className="text-blue-600">AI</span>
        </h1>
        <p className="mt-4 text-xl sm:text-2xl font-medium text-slate-600">
          The financial trust layer that stops autonomous AI agents from overspending your budget.
        </p>

        {/* 2. Problem Statement */}
        <p className="mt-6 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          As autonomous AI agents negotiate, hire services, and conduct business on our behalf, handing them raw credit cards or direct payment credentials invites financial catastrophes—from prompt injections and rogue price manipulations to concurrent budget depletion. SpendMesh AI acts as an unbypassable, policy-enforcing perimeter between autonomous agents and your PayPal account.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/marketplace"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            Start Interactive Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-sm transition-all"
          >
            View Live Dashboard
          </Link>
        </div>
      </section>

      {/* 3. Three Feature Cards */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Policy-Enforced Payments
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every negotiated deal is intercepted before money moves. Our deterministic engine validates spending limits, allowed services, cumulative budgets, and duplicate captures with zero client trust.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Gemini-Powered Agents
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Google Gemini 1.5 powers natural-language requirement parsing, multi-seller offer evaluation, and final deliverable generation gated safely behind completed transactions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Real PayPal Sandbox Integration
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Server-side PayPal Orders v2 integration creates secure checkout sessions using verified database amounts and captures test payments with full webhook/return-URL security.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Stats Row */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Live Architecture Benchmark (Illustrative Hackathon Metrics)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            <div className="pt-4 sm:pt-0">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-400 block mb-1">
                3 Demo Sellers
              </span>
              <span className="text-xs text-slate-400">
                Specialized AI Agents in Presentation, Research & SaaS
              </span>
            </div>
            <div className="pt-4 sm:pt-0">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 block mb-1">
                4 Security Checks
              </span>
              <span className="text-xs text-slate-400">
                Amount, Budget, Service & Duplicate Tamper Gates
              </span>
            </div>
            <div className="pt-4 sm:pt-0">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 block mb-1">
                Real PayPal Sandbox
              </span>
              <span className="text-xs text-slate-400">
                Direct Orders v2 Server-to-Server Capture
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Five-Step Workflow */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How SpendMesh AI Guards Transactions
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            End-to-end autonomous procurement flow with human-in-the-loop escalation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '1',
              title: 'Request Parsing',
              desc: 'Buyer agent parses user goals & constraints via Gemini',
              icon: Bot
            },
            {
              step: '2',
              title: 'Agent Marketplace',
              desc: 'Competing seller agents bid on the structured task',
              icon: Layers
            },
            {
              step: '3',
              title: 'Policy Validation',
              desc: 'Server verifies budget, price tampering & rules',
              icon: Shield
            },
            {
              step: '4',
              title: 'PayPal Checkout',
              desc: 'Server creates PayPal order with strictly verified price',
              icon: CreditCard
            },
            {
              step: '5',
              title: 'Deliverable Gating',
              desc: 'Gemini artifact unlocks only upon verified PayPal capture',
              icon: CheckCircle
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-slate-200 text-center flex flex-col items-center relative shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-3 shadow">
                  {item.step}
                </div>
                <Icon className="w-5 h-5 text-blue-600 mb-2" />
                <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CTA Button */}
      <section className="text-center max-w-xl mx-auto px-4 pt-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
          <h3 className="text-xl font-bold mb-2">Ready to test the guardrails?</h3>
          <p className="text-xs text-blue-100 mb-6">
            Try our 4 live scenarios including Price Tampering Detection and Over-Budget Escalation.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors shadow"
          >
            Launch Marketplace Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
