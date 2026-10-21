import React from 'react';

/**
 * SpendMesh AI Official Brand Logo
 * Geometric protective shield with interconnected neural mesh nodes and financial escrow core.
 */
export function LogoIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="shieldGradIcon" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3B82F6" />
          <stop offset="60%" stop-color="#2563EB" />
          <stop offset="100%" stop-color="#1D4ED8" />
        </linearGradient>
        <linearGradient id="meshGradIcon" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#67E8F9" />
          <stop offset="100%" stop-color="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* Outer Shield Contour */}
      <path
        d="M24 2L42 8.5V22C42 34 34.5 43.5 24 48C13.5 43.5 6 34 6 22V8.5L24 2Z"
        fill="url(#shieldGradIcon)"
      />

      {/* Subtle Inner Bevel */}
      <path
        d="M24 5L39 10.5V22C39 32 32.5 40.5 24 44.5C15.5 40.5 9 32 9 22V10.5L24 5Z"
        stroke="#93C5FD"
        strokeWidth="1"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* Neural Mesh Nodes */}
      <circle cx="24" cy="13" r="2" fill="#FFFFFF" />
      <circle cx="15" cy="19" r="1.8" fill="#67E8F9" />
      <circle cx="33" cy="19" r="1.8" fill="#67E8F9" />
      <circle cx="16" cy="31" r="1.8" fill="#67E8F9" />
      <circle cx="32" cy="31" r="1.8" fill="#67E8F9" />
      <circle cx="24" cy="37" r="1.8" fill="#FFFFFF" />

      {/* Interconnecting Mesh Lines */}
      <path
        d="M24 13L15 19M24 13L33 19M15 19L16 31M33 19L32 31M16 31L24 37M32 31L24 37M15 19L24 25M33 19L24 25M16 31L24 25M32 31L24 25M24 13L24 25M24 25L24 37"
        stroke="url(#meshGradIcon)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      {/* Central Security Core / Escrow Check */}
      <circle cx="24" cy="25" r="4.2" fill="#0F172A" stroke="#67E8F9" strokeWidth="1.5" />
      <path
        d="M22.5 25.2L23.7 26.4L26 23.8"
        stroke="#38BDF8"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ size = 32, subtitle = 'Policy Layer • Escrow', className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="rounded-lg shadow-xs flex items-center justify-center shrink-0">
        <LogoIcon size={size} />
      </div>
      <div>
        <span className="font-bold text-[15px] tracking-tight text-[#0F172A] block leading-none">
          SpendMesh <span className="text-[#2563EB]">AI</span>
        </span>
        {subtitle && (
          <span className="text-[10px] text-[#64748B] font-semibold block mt-1 tracking-tight uppercase">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
