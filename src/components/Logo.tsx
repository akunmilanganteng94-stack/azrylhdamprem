import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true,
  light = false 
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-base font-black',
    md: 'text-lg sm:text-xl font-black',
    lg: 'text-xl sm:text-2xl font-black',
    xl: 'text-2xl sm:text-3xl font-black'
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Abstract Modern 'A' Mark in Hijau Keren (Muda) */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="azryl-green-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="azryl-green-accent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#a7f3d0" />
            </linearGradient>
            <filter id="green-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background rounded squircle */}
          <rect 
            width="100" 
            height="100" 
            rx="24" 
            fill={light ? '#0f172a' : '#06130d'} 
          />
          
          {/* Subtle outer tech green border */}
          <rect 
            x="2" 
            y="2" 
            width="96" 
            height="96" 
            rx="22" 
            stroke="url(#azryl-green-accent)" 
            strokeWidth="1.5" 
            strokeOpacity="0.4" 
          />

          {/* Futuristic faceted 'A' geometry */}
          {/* Left leg */}
          <path 
            d="M50 16 L22 82 L38 82 L46 62 L50 62 Z" 
            fill="url(#azryl-green-main)" 
          />

          {/* Right leg */}
          <path 
            d="M50 16 L78 82 L62 82 L54 62 L50 62 Z" 
            fill="url(#azryl-green-accent)" 
          />

          {/* Floating Diamond Core */}
          <polygon 
            points="50,34 58,48 50,56 42,48" 
            fill="#ffffff" 
            filter="url(#green-glow)"
          />

          {/* Bottom connecting tech accent */}
          <rect 
            x="40" 
            y="74" 
            width="20" 
            height="4" 
            rx="2" 
            fill="url(#azryl-green-accent)" 
          />
        </svg>
      </div>

      {showText && (
        <span className={`tracking-wider ${textSizes[size]} ${light ? 'text-white' : 'text-slate-900'} font-mono leading-none select-none inline-flex items-center`}>
          AZRYL<span className="text-emerald-500">PREM</span>
        </span>
      )}
    </div>
  );
};
