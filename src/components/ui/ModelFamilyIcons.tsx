'use client';

import React from 'react';

interface SvgIconProps {
  style?: React.CSSProperties;
  className?: string;
}

/** ♊ Google Gemini — Colorful G-logo facets */
export const GeminiFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#0F172A" />
    {/* Four-color G spark */}
    <path d="M12 5.5C8.41 5.5 5.5 8.41 5.5 12c0 1.93.78 3.67 2.04 4.95L12 12V5.5z" fill="#4285F4" />
    <path d="M12 5.5V12l4.46 4.96A6.49 6.49 0 0 0 18.5 12c0-3.59-2.91-6.5-6.5-6.5z" fill="#34A853" />
    <path d="M7.54 16.95A6.49 6.49 0 0 0 12 18.5v-6.5L7.54 16.95z" fill="#FBBC05" />
    <path d="M12 12v6.5c1.56 0 2.99-.55 4.1-1.46L12 12z" fill="#EA4335" />
    <circle cx="12" cy="12" r="2.5" fill="#ffffff" fillOpacity="0.9" />
  </svg>
);

/** ⚡ OpenAI GPT — Abstract infinity/spark logo */
export const GptFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <circle cx="12" cy="12" r="10" fill="#0D1E16" />
    <path
      d="M12 4.5C8.96 4.5 6.5 6.96 6.5 10c0 1.7.72 3.24 1.87 4.33L5.5 19.5h3.2l1.6-2.8c.54.18 1.1.3 1.7.3 3.04 0 5.5-2.46 5.5-5.5 0-1.7-.72-3.24-1.87-4.33L18.5 4.5h-3.2l-1.6 2.8A5.43 5.43 0 0 0 12 7c-.6 0-1.16.12-1.7.3L12 4.5z"
      fill="none"
    />
    {/* Clean ChatGPT-style hex paths */}
    <path d="M9.5 8.5 Q12 5.5 14.5 8.5 Q17.5 12 14.5 15.5 Q12 18.5 9.5 15.5 Q6.5 12 9.5 8.5Z" fill="#10a37f" fillOpacity="0.2" stroke="#10a37f" strokeWidth="1" />
    <path d="M12 7.5 L15 12 L12 16.5 L9 12 Z" fill="#10a37f" fillOpacity="0.6" />
    <circle cx="12" cy="12" r="1.8" fill="#E5FFF8" />
  </svg>
);

/** Anthropic Claude — Amber dot-matrix mandala */
export const ClaudeFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <circle cx="12" cy="12" r="10" fill="#1C0F00" />
    {/* Stylised A shape inspired by Anthropic branding */}
    <path d="M12 4 L18 18 H14.5 L12 12.5 L9.5 18 H6 L12 4Z" fill="#d97706" fillOpacity="0.9" />
    <path d="M9 15 H15" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill="#FEF3C7" />
  </svg>
);

/** DeepSeek — Ocean wave / whale tail */
export const DeepSeekFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <circle cx="12" cy="12" r="10" fill="#030D1F" />
    {/* Whale-fin wave */}
    <path d="M3 15 Q6 9 10 12 Q13 14 15 10 Q17 6 21 9" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M14 17 Q17 14 21 16" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Sparkle */}
    <circle cx="10" cy="12" r="1.2" fill="#3b82f6" />
    <circle cx="15" cy="10" r="0.9" fill="#93c5fd" />
  </svg>
);

/** xAI Grok — X mark on dark circle */
export const GrokFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <circle cx="12" cy="12" r="10" fill="#0A0A0A" />
    {/* Bold X — X/Twitter style */}
    <path d="M7 7 L17 17 M17 7 L7 17" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.2" fill="#FFFFFF" fillOpacity="0.3" />
  </svg>
);

/** Alibaba Qwen — Stylised Q (arc + dot) */
export const QwenFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <circle cx="12" cy="12" r="10" fill="#1A0A00" />
    {/* Q shape */}
    <circle cx="12" cy="11.5" r="5.5" stroke="#f97316" strokeWidth="1.8" fill="none" />
    <path d="M15 14.5 L18 17.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="11.5" r="2" fill="#f97316" fillOpacity="0.4" />
    <circle cx="12" cy="11.5" r="0.9" fill="#FED7AA" />
  </svg>
);

/** Google Gemma — Open hexagonal gemstone */
export const GemmaFamilySvg: React.FC<SvgIconProps> = ({ style, className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', ...style }} className={className}>
    <circle cx="12" cy="12" r="10" fill="#0D0618" />
    {/* Gem facets */}
    <polygon points="12,5 17,9 17,15 12,19 7,15 7,9" fill="#8b5cf6" fillOpacity="0.25" stroke="#8b5cf6" strokeWidth="1.2" />
    <polygon points="12,5 17,9 12,12 7,9" fill="#a78bfa" fillOpacity="0.6" />
    <polygon points="12,12 17,9 17,15 12,19" fill="#7c3aed" fillOpacity="0.5" />
    <polygon points="12,12 7,9 7,15 12,19" fill="#c4b5fd" fillOpacity="0.35" />
    <circle cx="12" cy="10" r="1" fill="#ffffff" fillOpacity="0.8" />
  </svg>
);

/** Map ModelFamily key → SVG Component */
export const FAMILY_ICON_MAP: Record<string, React.FC<SvgIconProps>> = {
  gemini: GeminiFamilySvg,
  gpt: GptFamilySvg,
  claude: ClaudeFamilySvg,
  deepseek: DeepSeekFamilySvg,
  grok: GrokFamilySvg,
  qwen: QwenFamilySvg,
  gemma: GemmaFamilySvg,
};
