import React from 'react';
import { Bot, Cpu, Sparkles, Activity, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export default function AgentMeshDiagram({ task, selectedOffer, offers }) {
  const sellerNodes = offers && offers.length > 0 ? offers : [
    { id: '1', sellerName: 'SlideCraft AI', price: 380, deliveryTime: '24h', rating: 4.9 },
    { id: '2', sellerName: 'PitchForge Pro', price: 420, deliveryTime: '12h', rating: 4.8 },
    { id: '3', sellerName: 'ExecDeck Agent', price: 350, deliveryTime: '48h', rating: 4.7 }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-xl overflow-hidden relative">
      {/* Background grid accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wider uppercase text-blue-300">
              SpendMesh Agentic Mesh Network
            </h4>
            <p className="text-[10px] text-slate-400">
              Autonomous Buyer-Seller P2P Negotiation Channel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Policy Guard Active
          </span>
        </div>
      </div>

      {/* Mesh Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center relative z-10 py-2">
        {/* Buyer Agent Node (Left) */}
        <div className="md:col-span-3 bg-white/5 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm relative shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-blue-300 font-mono block">AGENT ROLE: BUYER</span>
              <h5 className="text-sm font-bold text-white">SpendMesh Buyer Agent</h5>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300 bg-black/30 p-2.5 rounded-lg border border-white/5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Goal:</span>
              <span className="font-semibold text-blue-300 capitalize truncate max-w-[140px]">
                {task?.serviceType || 'Presentation'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Budget:</span>
              <span className="font-mono text-emerald-400 font-bold">${task?.maxBudget || 400} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Latency:</span>
              <span className="font-mono text-slate-400">18ms (Atlas P2P)</span>
            </div>
          </div>
        </div>

        {/* Center Transmission Pulse */}
        <div className="md:col-span-1 hidden md:flex flex-col items-center justify-center gap-1 text-blue-400">
          <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 relative">
            <div className="w-2 h-2 rounded-full bg-blue-300 absolute -top-[3px] left-1/2 -translate-x-1/2 animate-pulse"></div>
          </div>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">
            Bids / Quotes
          </span>
          <ArrowRight className="w-4 h-4 text-blue-400" />
        </div>

        {/* Competing Seller Nodes (Right) */}
        <div className="md:col-span-3 space-y-2">
          {sellerNodes.slice(0, 3).map((seller) => {
            const isSelected = selectedOffer?.id === seller.id;
            return (
              <div
                key={seller.id}
                className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
                    }`}
                  ></div>
                  <div>
                    <span className="font-bold block leading-none">{seller.sellerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Rating: ★ {seller.rating} &bull; {seller.deliveryTime}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-blue-400 block leading-none">
                    ${seller.price}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">Quote</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
