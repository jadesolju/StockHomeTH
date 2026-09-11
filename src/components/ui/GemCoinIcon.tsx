'use client';

import React from 'react';

interface GemCoinIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}

export const GemCoinIcon: React.FC<GemCoinIconProps> = ({
  className = '',
  size = 20,
  glow = true,
  style,
}) => {
  const pixelSize = `${size}px`;

  return (
    <span
      className={className}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
        maxWidth: pixelSize,
        maxHeight: pixelSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: glow ? 'drop-shadow(0 0 6px rgba(78, 255, 248, 0.45))' : undefined,
        verticalAlign: 'middle',
        ...style,
      }}
      title="GemCoin (Token:Coin)"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="goldRingComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE259" />
            <stop offset="50%" stopColor="#FFA751" />
            <stop offset="100%" stopColor="#D48806" />
          </linearGradient>

          <radialGradient id="gemRadialComp" cx="50%" cy="45%" r="55%" fx="40%" fy="35%">
            <stop offset="0%" stopColor="#4EFFF8" />
            <stop offset="35%" stopColor="#00D2B4" />
            <stop offset="70%" stopColor="#008E76" />
            <stop offset="100%" stopColor="#004D40" />
          </radialGradient>
        </defs>

        {/* Drop Shadow */}
        <circle cx="50" cy="52" r="44" fill="#000000" fillOpacity="0.4" />

        {/* Golden Coin Outer Rim */}
        <circle cx="50" cy="50" r="45" fill="url(#goldRingComp)" stroke="#FFF2A3" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="40" fill="#09201C" stroke="#D48806" strokeWidth="1.2" />

        {/* Faceted Gem Center Polygon */}
        <polygon points="50,16 78,32 78,68 50,84 22,68 22,32" fill="url(#gemRadialComp)" />

        {/* Facet Highlights */}
        <polygon points="50,16 66,36 50,42 34,36" fill="#A7FFEB" fillOpacity="0.35" />
        <polygon points="66,36 78,32 78,68 66,62" fill="#004D40" fillOpacity="0.45" />
        <polygon points="22,32 34,36 34,62 22,68" fill="#1DE9B6" fillOpacity="0.3" />
        <polygon points="34,62 50,84 66,62 50,56" fill="#00382E" fillOpacity="0.55" />

        {/* Core Table */}
        <polygon points="50,30 63,45 50,60 37,45" fill="#E0F2F1" fillOpacity="0.65" />
        <polygon points="50,34 59,45 50,55 41,45" fill="#FFFFFF" fillOpacity="0.9" />

        {/* Sparkle Glint */}
        <circle cx="34" cy="30" r="2.5" fill="#FFFFFF" />
        <path d="M34,25 L34,35 M29,30 L39,30" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="64" cy="62" r="1.5" fill="#FFE259" />
      </svg>
    </span>
  );
};
