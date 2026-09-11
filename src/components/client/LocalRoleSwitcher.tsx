'use client';

import React, { useState, useEffect } from 'react';
import { useSubscription, SubscriptionTier, OWNER_DEV_IDENTIFIERS } from '../../lib/context/SubscriptionContext';
import { useClientAuth } from '../../lib/context/ClientAuthContext';
import { ShieldCheck, Zap, Crown, Sparkles, ChevronUp, ChevronDown, Check, Settings } from 'lucide-react';
import Link from 'next/link';
import { ADMIN_PORTAL_PATH } from '../../config/adminConfig';

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
    { id: 'dev', name: 'Dev + Owner (God Mode)', icon: Crown, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
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
      <div className="local-role-container">
        {/* Toggle Bar */}
        <div
          className="local-role-toggle-bar"
          onClick={() => setIsOpen(!isOpen)}
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
          <span className="local-role-tier-label">
            LOCAL TIER: <span style={{ textTransform: 'uppercase', color: currentTier === 'vip' ? '#a855f7' : currentTier === 'pro' ? 'var(--accent-blue)' : 'var(--accent-bullish)' }}>{currentTier}</span>
          </span>
          {isOpen ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronUp size={14} color="var(--text-secondary)" />}
        </div>

        {/* Expanded Panel */}
        {isOpen && (
          <div className="local-role-panel">
            <div className="local-role-panel-header">
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
                    className={`local-role-btn ${active ? 'active' : ''}`}
                    style={{
                      borderColor: active ? t.color : undefined,
                      background: active ? t.bg : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={14} color={active ? (t.id === 'dev' ? '#ec4899' : t.color) : 'var(--text-secondary)'} />
                      <span style={{ color: active ? (t.id === 'dev' ? '#ec4899' : t.color) : undefined }}>{t.name}</span>
                    </div>
                    {active && <Check size={14} color={t.color} />}
                  </button>
                );
              })}
            </div>

            <div className="local-role-info-box">
              <div>• โควตา AI วันนี้: <b>{aiUsageToday} ครั้ง</b></div>
              <div>• ขีดจำกัด Watchlist: <b>{getWatchlistLimit()} ตัว</b></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => {
                  restoreOwnerGodMode();
                }}
                className="local-role-restore-btn"
              >
                <Crown size={14} color="#f472b6" /> คืนสิทธิ์ Dev + Owner (99.9M Coins)
              </button>

              <Link
                href={ADMIN_PORTAL_PATH}
                onClick={() => setIsOpen(false)}
                className="local-role-admin-link"
              >
                <Settings size={13} color="#10b981" /> ไปที่หน้า Admin Portal ({ADMIN_PORTAL_PATH})
              </Link>

              <Link
                href="/payments"
                onClick={() => setIsOpen(false)}
                className="local-role-payment-link"
              >
                <Sparkles size={13} /> ไปที่หน้าร้านค้า & ชำระเงิน (/payments)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
