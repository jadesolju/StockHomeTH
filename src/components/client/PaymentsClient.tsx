'use client';

import React, { useState, useCallback } from 'react';
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
import { Loader2, Zap, Crown, AlertCircle, ShieldCheck, ArrowRight, Check, Sparkles, CreditCard, QrCode, History } from 'lucide-react';
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

type Tab = 'topup' | 'subscription';

export default function PaymentsClient() {
  const { user } = useClientAuth();
  const { totalGemCoinsAvailable, openGemCoinModal } = useSubscription();
  const [activeTab, setActiveTab] = useState<Tab>('topup');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwnerUser = Boolean(
    user &&
    (OWNER_DEV_IDENTIFIERS.emails.includes(user.email ?? '') ||
      OWNER_DEV_IDENTIFIERS.firebaseUids.includes(user.uid) ||
      OWNER_DEV_IDENTIFIERS.supabaseUids.includes(user.uid))
  );


  const handleCheckout = useCallback(
    async (packageId: string, mode: 'payment' | 'subscription') => {
      if (loadingId) return;
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
    [loadingId, billingCycle, user]
  );

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
            <span>ดูประวัติการใช้งาน GemCoins (History)</span>
          </button>
        </div>

        {/* ──── Tab Switcher ──── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>

          <div className="ios-segmented-control" style={{ padding: '4px', maxWidth: '420px', width: '100%' }}>
            <button
              onClick={() => setActiveTab('topup')}
              className={`ios-segment-btn ${activeTab === 'topup' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.88rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Zap size={16} />
              <span>เติม GemCoins</span>
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`ios-segment-btn ${activeTab === 'subscription' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.88rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Crown size={16} />
              <span>แผนสมาชิกรายเดือน/ปี</span>
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
