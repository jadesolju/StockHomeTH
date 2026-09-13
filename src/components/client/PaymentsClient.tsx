'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GEMCOIN_TOPUP_PACKAGES, GEMCOIN_SUBSCRIPTION_TIERS } from '@/config/gemCoinPackages';
import { GEMCOIN_STRIPE_PRICE_IDS, SUBSCRIPTION_STRIPE_PRICE_IDS, SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS } from '@/config/stripePriceIds';
import {
  PiggyBankSvg,
  WalletSvg,
  BriefcaseSvg,
  RoadsterSvg,
  CrownSvg,
  RocketSvg,
  CastleSvg,
  WhaleSvg,
} from '@/components/ui/TierSvgIcons';
import type { GemCoinTopupPackage } from '@/config/gemCoinPackages';
import { Loader2, Zap, Crown, AlertCircle, ShieldCheck, ArrowRight, Check, Sparkles, CreditCard, QrCode, History, Ticket, CheckCircle2, Gift } from 'lucide-react';
import { useClientAuth } from '@/lib/context/ClientAuthContext';
import { useSubscription, OWNER_DEV_IDENTIFIERS } from '@/lib/context/SubscriptionContext';

function TierIcon({ iconType, className }: { iconType: GemCoinTopupPackage['iconType']; className?: string }) {
  const props = { className: className ?? 'w-7 h-7' };
  switch (iconType) {
    case 'piggy':     return <PiggyBankSvg {...props} />;
    case 'wallet':    return <WalletSvg {...props} />;
    case 'briefcase': return <BriefcaseSvg {...props} />;
    case 'roadster':  return <RoadsterSvg {...props} />;
    case 'crown':     return <CrownSvg {...props} />;
    case 'rocket':    return <RocketSvg {...props} />;
    case 'castle':    return <CastleSvg {...props} />;
    case 'whale':     return <WhaleSvg {...props} />;
    default:          return <Zap {...props} />;
  }
}

type Tab = 'topup' | 'subscription' | 'redeem';

export default function PaymentsClient() {
  const { user, openAuthModal } = useClientAuth();
  const { totalGemCoinsAvailable, openGemCoinModal, redeemPromoCode } = useSubscription();
  const [activeTab, setActiveTab] = useState<Tab>('topup');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Promo Code Redemption State
  const [promoInput, setPromoInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    success: boolean;
    message: string;
    coinsAdded?: number;
  } | null>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);

  // Auto-switch tab if URL contains ?tab=redeem or #redeem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'redeem' || window.location.hash === '#redeem') {
        setActiveTab('redeem');
      } else if (tabParam === 'subscription') {
        setActiveTab('subscription');
      }
    }
  }, []);

  // Auto-focus promo input whenever redeem tab becomes active
  useEffect(() => {
    if (activeTab === 'redeem') {
      setTimeout(() => {
        promoInputRef.current?.focus();
      }, 150);
    }
  }, [activeTab]);

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim() || redeemLoading) return;
    setRedeemLoading(true);
    setRedeemResult(null);
    try {
      const res = await redeemPromoCode(promoInput.trim());
      setRedeemResult(res);
      if (res.success) {
        setPromoInput('');
      }
    } catch (err: any) {
      setRedeemResult({
        success: false,
        message: err?.message || 'เกิดข้อผิดพลาดในการแลกโค้ด กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const isOwnerUser = Boolean(
    user &&
    (OWNER_DEV_IDENTIFIERS.emails.includes(user.email ?? '') ||
      OWNER_DEV_IDENTIFIERS.firebaseUids.includes(user.uid) ||
      OWNER_DEV_IDENTIFIERS.supabaseUids.includes(user.uid))
  );

  const handleCheckout = useCallback(
    async (packageId: string, mode: 'payment' | 'subscription') => {
      if (loadingId) return;

      if (!user) {
        // Guest Guard: Intercept guest checkout, save pending package choice, and open login modal
        try {
          sessionStorage.setItem(
            'pending_checkout_package',
            JSON.stringify({ packageId, mode, billingCycle })
          );
        } catch {}
        setErrorMsg('กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนทำการเติมเงิน เพื่อให้ GemCoins และสิทธิ์สมาชิกผูกกับบัญชีของคุณอย่างปลอดภัยถาวร');
        openAuthModal('login');
        return;
      }

      setLoadingId(packageId);
      setErrorMsg(null);

      const priceId =
        mode === 'payment'
          ? GEMCOIN_STRIPE_PRICE_IDS[packageId]
          : billingCycle === 'yearly'
          ? SUBSCRIPTION_YEARLY_STRIPE_PRICE_IDS[packageId]
          : SUBSCRIPTION_STRIPE_PRICE_IDS[packageId];

      if (!priceId || priceId.startsWith('price_REPLACE')) {
        setErrorMsg('Stripe Price ID ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้พัฒนา');
        setLoadingId(null);
        return;
      }

      try {
        const res = await fetch('/api/payment/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId,
            packageId,
            mode,
            userId: user?.uid || undefined,
            userEmail: user?.email || undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error ?? 'ไม่สามารถสร้าง Checkout ได้ กรุณาลองใหม่');
          setTimeout(() => setLoadingId(null), 1_500);
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg('ไม่ได้รับ URL จาก Stripe กรุณาลองใหม่');
          setLoadingId(null);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
        setLoadingId(null);
      }
    },
    [loadingId, billingCycle, user, openAuthModal]
  );

  // Auto-resume pending checkout after user logs in
  React.useEffect(() => {
    if (!user) return;
    try {
      const pendingRaw = sessionStorage.getItem('pending_checkout_package');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        sessionStorage.removeItem('pending_checkout_package');
        if (pending?.packageId && pending?.mode) {
          handleCheckout(pending.packageId, pending.mode);
        }
      }
    } catch {}
  }, [user, handleCheckout]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* ──── Hero Header ──── */}
      <div className="payment-hero">
        <div className="payment-hero-badge">
          <Zap size={14} />
          <span>StockHome Official Store</span>
        </div>
        <h1 className="payment-hero-title">
          เลือกแพ็กเกจที่ใช่สำหรับคุณ
        </h1>
        <p className="payment-hero-desc">
          เติม GemCoin ถาวร ไม่มีวันหมดอายุ ใช้วิเคราะห์หุ้นและตลาดกับ AI โมเดลเรือธงได้ทันที
        </p>
      </div>

      <div className="payment-page-container">
        {/* ──── Guest Mode Banner & Security Reassurance ──── */}
        {!user && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#f59e0b',
                }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fef08a' }}>
                  💡 คุณกำลังใช้งานในฐานะ Guest (ยังไม่ได้เข้าสู่ระบบ)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.4 }}>
                  เข้าสู่ระบบก่อนเติมเงิน เพื่อให้ <strong>GemCoins</strong> และ <strong>ระดับสมาชิก</strong> ผูกกับบัญชีของคุณถาวรบน Cloud Database สามารถซิงค์และใช้งานข้ามทุกอุปกรณ์ได้อย่างปลอดภัย
                </div>
              </div>
            </div>

            <button
              onClick={() => openAuthModal('login')}
              className="ios-tappable"
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
              }}
            >
              <span>เข้าสู่ระบบก่อนเติมเงิน</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ──── Exclusive Owner Status Banner (Visible ONLY to afillly002@gmail.com) ──── */}
        {isOwnerUser && (
          <div className="payment-owner-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="payment-owner-icon-wrap">
                <Crown size={22} />
              </div>
              <div>
                <div className="payment-owner-title">
                  <span>ยินดีต้อนรับผู้พัฒนา & เจ้าของระบบ (Owner)</span>
                  <span className="payment-owner-god-badge">
                    God Mode
                  </span>
                </div>
                <div className="payment-owner-desc">
                  บัญชี <strong>afillly002@gmail.com</strong> ได้รับสิทธิ์เข้าถึงทุกฟังก์ชัน AI และ GemCoins 99,999,999 ถาวรโดยไม่ต้องชำระเงิน
                </div>
              </div>
            </div>
            <div className="payment-owner-note">
              (สถานะนี้เห็นเฉพาะบัญชีของคุณคนเดียว บุคคลภายนอกจะไม่เห็นแถบนี้)
            </div>
          </div>
        )}

        {/* ──── Wallet Balance & History Action Card ──── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '16px',
            background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="#06b6d4" />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ยอดเหรียญคงเหลือในกระเป๋าของคุณ</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalGemCoinsAvailable.toLocaleString()}{' '}
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GemCoins</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('redeem')}
              className="ios-tappable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: activeTab === 'redeem' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Ticket size={16} />
              <span>แลกโค้ดโปรโมชั่น (Redeem)</span>
            </button>

            <button
              onClick={() => openGemCoinModal('logs')}
              className="ios-tappable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#06b6d4',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <History size={16} />
              <span>ประวัติการใช้ GemCoins</span>
            </button>
          </div>
        </div>

        {/* ──── Tab Switcher ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: '10px' }}>
          {/* Mobile Viewport Tab Dropdown Switcher */}
          <div className="block sm:hidden w-full max-w-[420px]">
            <div className="relative">
              <label htmlFor="payments-mobile-tab-select" className="sr-only">เลือกเมนูบริการ</label>
              <select
                id="payments-mobile-tab-select"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full appearance-none px-4 py-3 bg-slate-900 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shadow-inner cursor-pointer"
              >
                <option value="topup" className="bg-[#0d1319] text-white">⚡ เติม GemCoins (Top-up Packages)</option>
                <option value="subscription" className="bg-[#0d1319] text-white">👑 แผนสมาชิกรายเดือน/ปี (Subscription)</option>
                <option value="redeem" className="bg-[#0d1319] text-amber-300 font-bold">🎫 แลกโค้ดฟรี (Coupon / Voucher)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex ios-segmented-control" style={{ padding: '4px', maxWidth: '580px', width: '100%' }}>
            <button
              onClick={() => setActiveTab('topup')}
              className={`ios-segment-btn ${activeTab === 'topup' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 14px', fontSize: '0.86rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Zap size={16} />
              <span>เติม GemCoins</span>
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`ios-segment-btn ${activeTab === 'subscription' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 14px', fontSize: '0.86rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Crown size={16} />
              <span>แผนสมาชิก</span>
            </button>
            <button
              onClick={() => setActiveTab('redeem')}
              className={`ios-segment-btn ${activeTab === 'redeem' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 14px', fontSize: '0.86rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Ticket size={16} color={activeTab === 'redeem' ? '#f59e0b' : undefined} />
              <span>แลกโค้ดฟรี (Coupon)</span>
            </button>
          </div>
        </div>

        {/* ──── Error Banner ──── */}
        {errorMsg && (
          <div className="payment-error-alert">
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
            <div style={{ flex: 1 }}>{errorMsg}</div>
            <button
              onClick={() => setErrorMsg(null)}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ──── TAB 1: TOP-UP PACKAGES ──── */}
        {activeTab === 'topup' && (
          <div className="payment-grid">
            {/* Quick Promo Code Link Banner */}
            <div
              onClick={() => setActiveTab('redeem')}
              className="glass-card-hover ios-tappable"
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                cursor: 'pointer',
                marginBottom: '8px',
                color: '#f59e0b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Ticket size={20} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    มีโค้ดโปรโมชั่นหรือรหัสบัตรกำนัล?
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    แลกรับ GemCoins ฟรีเข้ากระเป๋าได้ทันทีโดยไม่ต้องชำระเงิน
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                กรอกโค้ดที่นี่ →
              </span>
            </div>
            {GEMCOIN_TOPUP_PACKAGES.map((pkg) => {
              const isLoading = loadingId === pkg.id;
              const isDisabled = loadingId !== null;
              const cardClass = pkg.popular
                ? 'payment-card payment-card-popular'
                : pkg.bestValue
                ? 'payment-card payment-card-best'
                : 'payment-card';

              const btnClass = pkg.popular
                ? 'payment-btn-checkout payment-btn-cyan'
                : pkg.bestValue
                ? 'payment-btn-amber payment-btn-checkout'
                : 'payment-btn-checkout payment-btn-dark';

              return (
                <div key={pkg.id} className={cardClass}>
                  {pkg.tag && <div className="payment-tag">{pkg.tag}</div>}

                  <div>
                    <div className="payment-icon-box">
                      <TierIcon iconType={pkg.iconType} className="w-6 h-6" />
                    </div>

                    <h3 className="payment-card-title">{pkg.name}</h3>

                    <div className="payment-coins-row">
                      <span className="payment-coins-val">
                        {(pkg.gemCoins + pkg.bonusCoins).toLocaleString()}
                      </span>
                      <span className="payment-coins-label">GemCoins</span>
                    </div>

                    {pkg.bonusCoins > 0 && (
                      <div className="payment-bonus-badge">
                        +รวมโบนัส {pkg.bonusCoins.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="payment-price-box">
                    <div className="payment-price-row">
                      <span className="payment-price-promo">฿{pkg.promoPrice}</span>
                      <span className="payment-price-regular">฿{pkg.regularPrice}</span>
                      <span className="payment-price-promo-subtext">
                        1 ด. แรก
                      </span>
                    </div>

                    <button
                      onClick={() => handleCheckout(pkg.id, 'payment')}
                      disabled={isDisabled}
                      className={btnClass}
                    >
                      {isLoading ? <Loader2 size={16} className="spin-anim" /> : <ShieldCheck size={16} />}
                      <span>{isLoading ? 'กำลังเชื่อมต่อ...' : 'ชำระเงิน'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ──── TAB 2: SUBSCRIPTION PLANS ──── */}
        {activeTab === 'subscription' && (
          <div>
            {/* Monthly / Yearly Switch */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div className="ios-segmented-control" style={{ padding: '3px' }}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`ios-segment-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  style={{ padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  รายเดือน
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`ios-segment-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                  style={{ padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>รายปี</span>
                  <span className="payment-discount-pill">
                    ลด 2 เดือน
                  </span>
                </button>
              </div>
            </div>

            <div className="payment-grid payment-subscription-grid">
              {GEMCOIN_SUBSCRIPTION_TIERS.filter((t) => t.tier !== 'free' && t.tier !== 'dev').map((tier) => {
                const isLoading = loadingId === tier.tier;

                const isDisabled = loadingId !== null;
                const isPro = tier.tier === 'pro';
                const isVip = tier.tier === 'vip';

                const price = billingCycle === 'yearly' ? tier.promoPriceYearly : tier.promoPriceMonthly;
                const regularPrice = billingCycle === 'yearly' ? tier.regularPriceYearly : tier.regularPriceMonthly;
                const periodText = billingCycle === 'yearly' ? '/ปี' : '/เดือน';

                return (
                  <div
                    key={tier.tier}
                    className={`payment-card ${isPro ? 'payment-card-popular' : isVip ? 'payment-card-best' : ''}`}
                  >
                    {isPro && <div className="payment-tag">แนะนำสำหรับนักลงทุน</div>}

                    <div>
                      <div className="payment-icon-box">
                        <Crown size={22} color={isVip ? '#a855f7' : isPro ? '#007aff' : '#06b6d4'} />
                      </div>

                      <h3 className="payment-card-title">{tier.name}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '4px 0 12px 0' }}>
                        {tier.highlight}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Check size={14} color="#10b981" />
                          <span>เหรียญรายวัน: <strong>{tier.dailyGemCoins.toLocaleString()}</strong> Coins/วัน</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Check size={14} color="#10b981" />
                          <span>โบนัสถาวรทันที: <strong>+{tier.permanentTopupBonus.toLocaleString()}</strong> Coins</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Check size={14} color="#10b981" />
                          <span>ปลดล็อก AI: {tier.unlockedModels.map((m) => m.name).join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="payment-price-box">
                      <div className="payment-price-row">
                        <span className="payment-price-promo">฿{price.toLocaleString()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{periodText}</span>
                        <span className="payment-price-regular" style={{ marginLeft: 'auto' }}>฿{regularPrice.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => handleCheckout(tier.tier, 'subscription')}
                        disabled={isDisabled}
                        className={isPro ? 'payment-btn-checkout payment-btn-primary' : 'payment-btn-checkout payment-btn-dark'}
                      >
                        {isLoading ? <Loader2 size={16} className="spin-anim" /> : <ShieldCheck size={16} />}
                        <span>{isLoading ? 'กำลังเชื่อมต่อ...' : 'สมัครแพ็กเกจ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ──── Thai Payment Methods & Alternatives Guide ──── */}
            <div
              style={{
                marginTop: '32px',
                padding: '20px 24px',
                borderRadius: '16px',
                background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <CreditCard size={18} color="var(--accent-blue)" />
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ช่องทางชำระเงินที่รองรับ
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {/* 1. Credit & Debit Cards */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'var(--card-bg, rgba(255, 255, 255, 0.02))',
                    border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.06))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CreditCard size={16} color="#3b82f6" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      บัตรเครดิต & เดบิตทุกธนาคาร
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    รองรับบัตรเครดิตและบัตร ATM เดบิต (VISA, Mastercard, JCB) ทุกธนาคารในไทย เพียงเปิดใช้งานช้อปปิ้งออนไลน์ในแอปธนาคาร กรอกเลขบัตร 16 หลักสมัครได้ทันที
                  </p>
                </div>

                {/* 2. PromptPay QR Alternative */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'var(--card-bg, rgba(255, 255, 255, 0.02))',
                    border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.06))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <QrCode size={16} color="#10b981" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      สแกน QR พร้อมเพย์ (PromptPay)
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    หากสะดวกสแกนจ่ายด้วย QR Code ผ่านแอปธนาคาร สามารถสลับไปที่แท็บ <strong>เติม GemCoins</strong> ได้ทันที เหรียญคงอยู่ถาวรไม่มีวันหมดอายุ
                  </p>
                </div>
              </div>

              {/* PromptPay QR Note & Direct Switch CTA */}
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  <QrCode size={18} color="var(--accent-blue)" />
                  <span>
                    <strong>ต้องการสแกนจ่ายด้วย QR พร้อมเพย์ (PromptPay)?</strong> สลับไปที่แท็บ &quot;เติม GemCoins&quot; สแกนผ่านแอปธนาคารไทยได้ทุกแห่ง เหรียญอยู่ถาวรไม่มีวันหมดอายุ
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('topup')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-blue)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>ไปที่เติม GemCoins</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──── TAB 3: REDEEM PROMO CODE ──── */}
        {activeTab === 'redeem' && (
          <div
            style={{
              maxWidth: '620px',
              margin: '0 auto',
              padding: '32px 24px',
              borderRadius: '24px',
              background: 'var(--card-bg, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
                }}
              >
                <Gift size={28} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                แลกโค้ดโปรโมชั่น & บัตรกำนัล
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                นำรหัส Voucher หรือ Promo Code จากกิจกรรมมาแลกเป็น GemCoins ฟรีเข้ากระเป๋าได้ทันที
              </p>
            </div>

            <form onSubmit={handleRedeemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  ref={promoInputRef}
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="พิมพ์โค้ด เช่น Stock-1234"
                  disabled={redeemLoading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.05))',
                    border: '1.5px solid var(--card-sub-border, rgba(255, 255, 255, 0.15))',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={redeemLoading || !promoInput.trim()}
                className="ios-btn-primary ios-tappable"
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: redeemLoading || !promoInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: redeemLoading || !promoInput.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                }}
              >
                {redeemLoading ? (
                  <>
                    <Loader2 size={18} className="spin-anim" />
                    <span>กำลังตรวจสอบโค้ด...</span>
                  </>
                ) : (
                  <>
                    <Ticket size={18} />
                    <span>ยืนยันการแลกโค้ด (Redeem Code)</span>
                  </>
                )}
              </button>
            </form>

            {/* Result Message */}
            {redeemResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: redeemResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${redeemResult.success ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  color: redeemResult.success ? '#10b981' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {redeemResult.success ? <CheckCircle2 size={20} style={{ flexShrink: 0 }} /> : <AlertCircle size={20} style={{ flexShrink: 0 }} />}
                <div>{redeemResult.message}</div>
              </div>
            )}

            {/* Code Format Hint */}
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--card-sub-border, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>รูปแบบโค้ดตัวอย่าง:</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                Stock-1234
              </span>
            </div>

            {/* Helpful Notes */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--card-sub-border, rgba(255, 255, 255, 0.08))',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>คำแนะนำ:</strong> โค้ดแต่ละรหัสสามารถใช้งานได้ตามเงื่อนไขแคมเปญ เหรียญที่ได้รับจากโค้ดจะถูกบันทึกเป็น Permanent GemCoins ถาวรไม่มีวันหมดอายุ
            </div>
          </div>
        )}

        {/* ──── Security Trust Footer ──── */}
        <div
          style={{
            marginTop: '48px',
            padding: '20px 24px',
            borderRadius: '16px',
            background: 'var(--card-sub-bg)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="#10b981" />
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ชำระเงินปลอดภัยมาตรฐานสากลผ่าน Stripe
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                รองรับสแกน QR พร้อมเพย์ (PromptPay) และบัตรเครดิต/เดบิต ทุกธนาคาร (VISA, Mastercard, JCB) เข้ารหัส 256-bit SSL
              </p>

            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
            GemCoins ถาวรไม่มีวันหมดอายุ ✦
          </div>
        </div>
      </div>
    </div>
  );
}
