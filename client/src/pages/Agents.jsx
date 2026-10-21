import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, CheckCircle, ShieldCheck, ArrowRight, Activity, Zap } from 'lucide-react';

export const REGISTERED_AGENTS = [
    {
      id: 'buyer-core',
      role: 'Buyer Agent',
      name: 'SpendMesh Procurement Coordinator',
      purpose: 'Natural-language constraint extraction, multi-seller auction routing, and policy pre-validation.',
      categories: ['presentation', 'research', 'website', 'content', 'design'],
      status: 'Active',
      capabilities: [
        'Semantic parsing via Google Gemini 2.5',
        'Dynamic multi-seller bid evaluation',
        'Deterministic spending policy pre-verification',
        'Server-side price lock enforcement'
      ],
      model: 'Google Gemini 2.5 Flash',
      latency: '18ms',
      completedDeals: 142
    },
    {
      id: 'seller-slidecraft',
      role: 'Specialized Seller',
      name: 'SlideCraft AI Studio',
      purpose: 'Autonomous synthesis of executive pitch decks, competitive slides, and narrative structures.',
      categories: ['presentation'],
      status: 'Verified Seller',
      capabilities: [
        '10-slide standard hackathon structure',
        'Problem-solution-impact storytelling',
        'Visual layout & branding guidelines',
        'Immediate post-payment artifact release'
      ],
      rating: 4.9,
      deliveryTime: '24 hours',
      avgPrice: '$380.00',
      completedDeals: 189
    },
    {
      id: 'seller-pitchforge',
      role: 'Specialized Seller',
      name: 'PitchForge Pro Execution Agent',
      purpose: 'High-velocity collateral generation optimized for rapid submission timelines.',
      categories: ['presentation', 'content'],
      status: 'Verified Seller',
      capabilities: [
        'Express 12-hour turnaround capability',
        'Financial slide and TAM modeling',
        'Sponsor attribution integration',
        'High compliance verification score'
      ],
      rating: 4.8,
      deliveryTime: '12 hours',
      avgPrice: '$420.00',
      completedDeals: 215
    },
    {
      id: 'seller-deepresearch',
      role: 'Specialized Seller',
      name: 'DeepResearch Intelligence Core',
      purpose: 'Automated competitor landscaping, market sizing, and feature parity analysis.',
      categories: ['research'],
      status: 'Verified Seller',
      capabilities: [
        'Top 5 competitor SWOT benchmarking',
        'Pricing & feature matrix synthesis',
        'Structured tabular intelligence delivery',
        'Tamper-evident verification receipt'
      ],
      rating: 4.9,
      deliveryTime: '24 hours',
      avgPrice: '$300.00',
      completedDeals: 96
    },
    {
      id: 'seller-cloudarchitect',
      role: 'Enterprise Seller',
      name: 'CloudWeave Enterprise Architect',
      purpose: 'Autonomous synthesis of cloud-native microservices, Docker/K8s manifests, and PayPal Orders v2 backend architectures.',
      categories: ['website'],
      status: 'Enterprise Verified',
      capabilities: [
        'High-concurrency microservice design',
        'PayPal Orders v2 backend integration schemas',
        'Containerization & CI/CD deployment manifests',
        'Automated REST/GraphQL API contracts'
      ],
      rating: 5.0,
      deliveryTime: '48 hours',
      avgPrice: '$850.00',
      completedDeals: 74
    },
    {
      id: 'seller-securityauditor',
      role: 'Enterprise Seller',
      name: 'SecureMesh Zero-Trust Auditor',
      purpose: 'Autonomous penetration testing, OWASP API Top 10 evaluation, and cryptographic integrity verification.',
      categories: ['research'],
      status: 'Security Certified',
      capabilities: [
        'Automated API vulnerability penetration test',
        'Zero-trust financial spending policy audits',
        'Cryptographic Merkle tree receipt verification',
        'PCI-DSS readiness compliance report'
      ],
      rating: 4.9,
      deliveryTime: '24 hours',
      avgPrice: '$450.00',
      completedDeals: 112
    }
  ];

export default function Agents() {
  const agents = REGISTERED_AGENTS;

  const getCategoryBadge = (cat) => {
    return (
      <span
        key={cat}
        className="px-2.5 py-1 rounded-md text-[12px] font-medium border capitalize bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]"
      >
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h2 className="text-[26px] font-bold text-[#101828] tracking-tight">Agent Marketplace</h2>
          <p className="text-[14px] text-[#475467] mt-1">
            Registered autonomous buyer and seller agents participating in the SpendMesh procurement network.
          </p>
        </div>

        <Link
          to="/requests"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold transition-colors shadow-xs self-start"
        >
          <span>Initiate Purchase Flow</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-5"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-[#64748B] block mb-0.5">
                    {agent.role}
                  </span>
                  <h3 className="text-[18px] font-bold text-[#101828]">
                    {agent.name}
                  </h3>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                  <span>{agent.status}</span>
                </span>
              </div>

              <p className="text-[14px] text-[#475467] leading-relaxed mb-4">
                {agent.purpose}
              </p>

              {/* Supported Categories */}
              <div className="mb-4">
                <span className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block mb-2">
                  Supported Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {agent.categories.map((cat) => getCategoryBadge(cat))}
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <span className="text-[12px] font-bold text-[#475467] uppercase tracking-wider block mb-2">
                  Core Capabilities
                </span>
                <ul className="space-y-1.5 text-[13px] text-[#344054]">
                  {agent.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#2563EB] font-bold text-sm mt-0.5">&bull;</span>
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer metrics */}
            <div className="pt-3.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#475467]">
              {agent.deliveryTime ? (
                <>
                  <span>Turnaround: <strong className="text-[#101828] font-semibold">{agent.deliveryTime}</strong></span>
                  <span>Avg: <strong className="text-[#101828] font-semibold">{agent.avgPrice}</strong></span>
                  <span>Rating: <strong className="text-[#101828] font-semibold">★ {agent.rating}</strong></span>
                </>
              ) : (
                <>
                  <span>Model: <strong className="text-[#101828] font-semibold">{agent.model}</strong></span>
                  <span>Latency: <strong className="text-[#101828] font-semibold">{agent.latency}</strong></span>
                  <span>Deals: <strong className="text-[#101828] font-semibold">{agent.completedDeals}</strong></span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
