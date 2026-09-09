'use client';

import React from 'react';

interface SvgIconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

const getIconStyle = (size: number = 24, customStyle?: React.CSSProperties): React.CSSProperties => ({
  width: `${size}px`,
  height: `${size}px`,
  minWidth: `${size}px`,
  minHeight: `${size}px`,
  maxWidth: `${size}px`,
  maxHeight: `${size}px`,
  display: 'inline-block',
  flexShrink: 0,
  verticalAlign: 'middle',
  ...customStyle,
});

// 1. งบน้อย (Piggy Bank SVG)
export const PiggyBankSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M19 11C19 7.686 16.314 5 13 5C9.686 5 7 7.686 7 11C7 11.75 7.14 12.46 7.39 13.11L5 15.5V17H6.5L8.15 15.35C9.5 16.38 11.18 17 13 17C14.82 17 16.5 16.38 17.85 15.35L19.5 17H21V15.5L18.61 13.11C18.86 12.46 19 11.75 19 11Z"
      fill="#F472B6"
      stroke="#FBCFE8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 4V2M15 4.5L16.5 3M9 4.5L7.5 3" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="15.5" cy="9.5" r="1" fill="#831843" />
    <path d="M11 9H13" stroke="#FDF2F8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 17V20M17 17V20" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 2. พอมีเงิน (Wallet SVG)
export const WalletSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#3B82F6" stroke="#93C5FD" strokeWidth="1.5" />
    <path d="M2 9H22" stroke="#1E40AF" strokeWidth="1.5" />
    <rect x="14" y="10" width="7" height="6" rx="2" fill="#1D4ED8" stroke="#DBEAFE" strokeWidth="1.2" />
    <circle cx="17.5" cy="13" r="1" fill="#FBBF24" />
  </svg>
);

// 3. มีตังค์เหลือๆ (Briefcase SVG)
export const BriefcaseSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <rect x="3" y="7" width="18" height="13" rx="2.5" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
    <path d="M8 7V5C8 3.895 8.895 3 10 3H14C15.105 3 16 3.895 16 5V7" stroke="#34D399" strokeWidth="1.5" />
    <path d="M3 12H21" stroke="#047857" strokeWidth="1.5" />
    <rect x="10.5" y="11" width="3" height="3" rx="0.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
  </svg>
);

// 4. พร้อมบวก (Roadster/Speed Car SVG)
export const RoadsterSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M3 13L5.5 8.5C6 7.5 7 7 8.2 7H15.8C17 7 18 7.5 18.5 8.5L21 13V17H3V13Z"
      fill="#F97316"
      stroke="#FED7AA"
      strokeWidth="1.5"
    />
    <path d="M7 11L8.5 8.5H15.5L17 11H7Z" fill="#1E293B" />
    <circle cx="6.5" cy="17" r="2.5" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
    <circle cx="17.5" cy="17" r="2.5" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
    <circle cx="4.5" cy="14" r="0.8" fill="#FEF08A" />
    <circle cx="19.5" cy="14" r="0.8" fill="#FEF08A" />
  </svg>
);

// 5. เสี่ยสั่งลุย (Royal Crown SVG)
export const CrownSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M3 18L5 8L9.5 13L12 5L14.5 13L19 8L21 18H3Z"
      fill="#EAB308"
      stroke="#FEF08A"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="5" cy="7" r="1.5" fill="#F43F5E" />
    <circle cx="12" cy="4" r="1.5" fill="#06B6D4" />
    <circle cx="19" cy="7" r="1.5" fill="#F43F5E" />
    <rect x="4" y="18" width="16" height="2.5" rx="1" fill="#CA8A04" stroke="#FEF08A" strokeWidth="1" />
  </svg>
);

// 6. เจ้าสัวพอร์ตโต (Rocket SVG)
export const RocketSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M14.5 3C14.5 3 20 4.5 20.5 10C20.5 13 18 16 15 17L13 15L7.5 17L9.5 11L7.5 9L10.5 6C11.5 3 14.5 3 14.5 3Z"
      fill="#8B5CF6"
      stroke="#DDD6FE"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="15.5" cy="8.5" r="1.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="0.8" />
    <path d="M8 16L4 20M5 16L4 20L8 19" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 20L6 18" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 7. ป๋าบุญทุ่ม (Imperial Castle SVG)
export const CastleSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M3 21H21V10H18V7L16 9V10H14V6L12 8L10 6V10H8V9L6 7V10H3V21Z"
      fill="#EC4899"
      stroke="#FCE7F3"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <rect x="9.5" y="15" width="5" height="6" rx="2.5" fill="#831843" stroke="#FDF2F8" strokeWidth="1" />
    <circle cx="6" cy="13" r="1" fill="#FDF2F8" />
    <circle cx="18" cy="13" r="1" fill="#FDF2F8" />
  </svg>
);

// 8. วาฬสถาบัน (Whale God / UFO SVG)
export const WhaleSvg: React.FC<SvgIconProps> = ({ className = '', size = 24, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M21 11C20.5 8 18 6 14 6C9 6 3 9 3 13C3 16 6 17 9 17H16C19 17 21 15 21 11Z"
      fill="#06B6D4"
      stroke="#CFFAFE"
      strokeWidth="1.5"
    />
    <path d="M21 11C22 10 23 9 23 7C22 7.5 21 8.5 20.5 9" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="6.5" cy="11.5" r="1" fill="#083344" />
    <path d="M8 6C8 4 9 3 10 2M9 4C10.5 4 12 3 12 2" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12 17C12 19 11 20.5 10 21" stroke="#0891B2" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 9. ป้ายโปรโมชั่นจับเวลา (Countdown Tag SVG)
export const PromoClockSvg: React.FC<SvgIconProps> = ({ className = '', size = 20, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 10. ไอคอนแลกรับโค้ด (Ticket / Voucher SVG)
export const TicketVoucherSvg: React.FC<SvgIconProps> = ({ className = '', size = 20, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={getIconStyle(size, style)}
  >
    <path
      d="M2 9C3.657 9 5 7.657 5 6H19C19 7.657 20.343 9 22 9V15C20.343 15 19 16.343 19 18H5C5 16.343 3.657 15 2 15V9Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M12 6V18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);
