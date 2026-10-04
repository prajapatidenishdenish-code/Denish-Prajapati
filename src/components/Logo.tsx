import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Custom High-Tech Coin & Play Icon */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 to-emerald-500/30 rounded-xl blur-sm" />
        
        {/* Outer badge */}
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full relative z-10 drop-shadow-md">
          <defs>
            <linearGradient id="logoGradOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="logoGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>

          {/* Hexagonal Shield */}
          <polygon
            points="24,3 43,13 43,35 24,45 5,35 5,13"
            fill="url(#logoGradInner)"
            stroke="url(#logoGradOuter)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Coin Ring Accent */}
          <circle cx="24" cy="24" r="14" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

          {/* Play Triangle / Spark */}
          <polygon points="21,17 33,24 21,31" fill="#F59E0B" />
          <polygon points="22,19 30,24 22,29" fill="#FDE047" />

          {/* Spark star */}
          <circle cx="34" cy="14" r="2.5" fill="#10B981" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black ${textSizes[size]} tracking-tight flex items-center gap-1`}>
            <span className="text-white">AdEarn</span>
            <span className="bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">Pro</span>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 mt-0.5">
            Watch • Complete • Earn
          </span>
        </div>
      )}
    </div>
  );
};
