'use client';

import React, { useState, useEffect } from 'react';
import { useSubscription, SubscriptionTier, OWNER_DEV_IDENTIFIERS } from '../../lib/context/SubscriptionContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { ShieldCheck, Zap, Crown, Sparkles, ChevronUp, ChevronDown, Check, Settings } from 'lucide-react';
import Link from 'next/link';

export function LocalRoleSwitcher() {
  const { currentTier, setTier, isOwnerOrDev, isOwnerAccount, restoreOwnerGodMode, openPricingModal, aiUsageToday, getWatchlistLimit } = useSubscription();
  const { user } = useClientAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLocalEnv, setIsLocalEnv] = useState<boolean>(false);

  // Show in local development or if user is owner/dev
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        process.env.NODE_ENV === 'development';
      setIsLocalEnv(isLocal);
    }
  }, []);

  const isAuthorized =
    isLocalEnv ||
    isOwnerOrDev ||
    isOwnerAccount ||
    Boolean(
      user &&
        (OWNER_DEV_IDENTIFIERS.emails.includes(user.email?.toLowerCase().trim() ?? '') ||
          OWNER_DEV_IDENTIFIERS.firebaseUids.includes(user.uid))
    );

  if (!isAuthorized) return null;

  const tiers: { id: SubscriptionTier; name: string; icon: any; color: string; bg: string }[] = [
    { id: 'free', name: 'Free (สายฟรี)', icon: ShieldCheck, color: 'var(--accent-bullish)', bg: 'rgba(34, 197, 94, 0.15)' },
    { id: 'lite', name: 'Lite Supporter', icon: Sparkles, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
    { id: 'pro', name: 'Pro Investor', icon: Zap, color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.15)' },
    { id: 'vip', name: 'VIP Trader', icon: Crown, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
    { id: 'dev', name: '👑 Dev + Owner (God Mode)', icon: Crown, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  ];


  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9000,
        fontFamily: 'inherit',
      }}
    >
      {/* Floating Pill / Launcher */}
      <div
        style={{
          background: 'rgba(20, 20, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Toggle Bar */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: currentTier === 'vip' ? '#a855f7' : currentTier === 'pro' ? 'var(--accent-blue)' : 'var(--accent-bullish)',
              boxShadow: `0 0 8px ${currentTier === 'vip' ? '#a855f7' : currentTier === 'pro' ? 'var(--accent-blue)' : 'var(--accent-bullish)'}`,
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
            LOCAL TIER: <span style={{ textTransform: 'uppercase', color: currentTier === 'vip' ? '#a855f7' : currentTier === 'pro' ? 'var(--accent-blue)' : 'var(--accent-bullish)' }}>{currentTier}</span>
          </span>
          {isOpen ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronUp size={14} color="var(--text-secondary)" />}
        </div>

        {/* Expanded Panel */}
        {isOpen && (
          <div
            style={{
              padding: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minWidth: '220px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              สลับระดับสิทธิ์เพื่อทดสอบ
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tiers.map((t) => {
                const Icon = t.icon;
                const active = currentTier === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: `1px solid ${active ? t.color : 'rgba(255, 255, 255, 0.06)'}`,
                      background: active ? t.bg : 'rgba(255, 255, 255, 0.03)',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: active ? 800 : 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={14} color={t.color} />
                      <span>{t.name}</span>
                    </div>
                    {active && <Check size={14} color={t.color} />}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px',
                borderRadius: '8px',
                lineHeight: 1.4,
              }}
            >
              <div>• โควตา AI วันนี้: <b>{aiUsageToday} ครั้ง</b></div>
              <div>• ขีดจำกัด Watchlist: <b>{getWatchlistLimit()} ตัว</b></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => {
                  restoreOwnerGodMode();
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(236, 72, 153, 0.45)',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                  color: '#f472b6',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(236, 72, 153, 0.2)',
                  transition: 'all 0.15s',
                }}
              >
                <Crown size={14} color="#f472b6" /> คืนสิทธิ์ Dev + Owner (99.9M Coins)
              </button>

              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <Settings size={13} color="#10b981" /> ไปที่หน้า Admin Portal (/admin)
              </Link>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                openPricingModal();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #a855f7 100%)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Sparkles size={13} /> เปิดหน้าต่างตารางราคา
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
