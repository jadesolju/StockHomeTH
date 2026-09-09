'use client';

import React, { useState, useEffect } from 'react';
import { useSubscription, type SubscriptionTier } from '../../lib/context/SubscriptionContext';
import { PRICING_PLANS } from '../../config/pricingPlans';
import { MockPaymentModal } from './MockPaymentModal';
import { X, Check, Zap, Sparkles, ShieldCheck, Crown, ArrowRight, Coffee, QrCode } from 'lucide-react';

export function PricingModal() {
  const { isPricingModalOpen, closePricingModal, currentTier, setTier, billingCycle, setBillingCycle } = useSubscription();
  const [isLocal, setIsLocal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [paymentModalTier, setPaymentModalTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLocal(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
  }, []);

  if (!isLocal || !isPricingModalOpen) return null;

  const handleSelectPlan = (planId: SubscriptionTier) => {
    if (planId === 'free') {
      setTier('free');
      setSuccessToast(`ปรับสิทธิ์เป็น Free Member เรียบร้อยแล้ว`);
      setTimeout(() => {
        setSuccessToast(null);
        closePricingModal();
      }, 1200);
      return;
    }

    // Open Mock Payment Modal for paid tiers (Coffee Supporter / Pro / VIP)
    setPaymentModalTier(planId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePricingModal();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '1220px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px',
          background: 'var(--card-bg, #1c1c1e)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          padding: '36px 28px',
        }}
      >
        {/* Close Button */}
        <button
          onClick={closePricingModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <X size={20} />
        </button>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '100px',
              padding: '6px 14px',
              color: 'var(--accent-blue)',
              fontSize: '12.5px',
              fontWeight: 800,
              marginBottom: '12px',
            }}
          >
            <Sparkles size={14} /> STOCKHOMETH MEMBERSHIP PLANS
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            เลือกแพ็กเกจที่เหมาะกับการลงทุนของคุณ
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', maxWidth: '620px', margin: '0 auto', lineHeight: 1.5 }}>
            ปลดล็อกพลัง AI วิเคราะห์งบการเงิน, การแจ้งเตือนราคาหุ้นสดเข้า LINE, และ Watchlist ไม่จำกัด
          </p>

          {/* Billing Cycle Switcher (Monthly / Yearly) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.05))',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--card-sub-border, rgba(255, 255, 255, 0.1))',
              marginTop: '20px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                background: billingCycle === 'monthly' ? 'var(--accent-blue)' : 'transparent',
                color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                background: billingCycle === 'yearly' ? 'var(--accent-blue)' : 'transparent',
                color: billingCycle === 'yearly' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              รายปี <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--accent-bullish)', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>ประหยัด 35%</span>
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {successToast && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid var(--accent-bullish)',
              color: 'var(--accent-bullish)',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '14px',
              marginBottom: '20px',
              animation: 'bounce 0.3s ease',
            }}
          >
            {successToast}
          </div>
        )}

        {/* 3 Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'stretch',
          }}
        >
          {PRICING_PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id;
            const displayPrice = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                style={{
                  background: plan.popular ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.12) 0%, rgba(18, 18, 20, 0.8) 100%)' : 'var(--card-sub-bg, rgba(255, 255, 255, 0.04))',
                  border: `2px solid ${plan.popular ? 'var(--accent-blue)' : plan.borderColor}`,
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transform: plan.popular ? 'scale(1.02)' : 'none',
                  boxShadow: plan.popular ? '0 12px 36px rgba(59, 130, 246, 0.2)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: plan.popular ? 'var(--accent-blue)' : plan.id === 'vip' ? '#a855f7' : plan.id === 'lite' ? '#eab308' : 'var(--accent-bullish)',
                      color: plan.id === 'lite' ? '#000000' : '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '100px',
                      letterSpacing: '0.04em',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{plan.name}</h3>
                    {plan.id === 'vip' ? (
                      <Crown size={22} color="#a855f7" />
                    ) : plan.id === 'pro' ? (
                      <Zap size={22} color="var(--accent-blue)" />
                    ) : plan.id === 'lite' ? (
                      <Sparkles size={22} color="#eab308" />
                    ) : (
                      <ShieldCheck size={22} color="var(--accent-bullish)" />
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', minHeight: '38px', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {displayPrice === 0 ? 'ฟรี' : `฿${displayPrice}`}
                    </span>
                    {displayPrice > 0 && (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        / เดือน {billingCycle === 'yearly' && '(ชำระรายปี)'}
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plan.features.map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '13px',
                          color: feat.included ? (feat.highlight ? 'var(--text-primary)' : 'var(--text-secondary)') : 'var(--text-tertiary)',
                          opacity: feat.included ? 1 : 0.4,
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: feat.included ? (plan.id === 'vip' ? 'rgba(168, 85, 247, 0.2)' : plan.popular ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)') : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {feat.included ? (
                            <Check size={12} color={plan.id === 'vip' ? '#a855f7' : plan.popular ? 'var(--accent-blue)' : 'var(--accent-bullish)'} />
                          ) : (
                            <X size={11} color="var(--text-tertiary)" />
                          )}
                        </div>
                        <span style={{ flex: 1, fontWeight: feat.highlight ? 700 : 500, lineHeight: 1.4 }}>
                          {feat.text}
                          {feat.badge && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: 'var(--accent-blue)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              {feat.badge}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div style={{ marginTop: '28px' }}>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: isCurrent ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                      background: isCurrent
                        ? 'rgba(255, 255, 255, 0.08)'
                        : plan.popular
                        ? 'var(--accent-blue)'
                        : plan.id === 'vip'
                        ? '#a855f7'
                        : 'var(--card-sub-border, #2c2c2e)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isCurrent ? (
                      '✓ แพ็กเกจปัจจุบันของคุณ'
                    ) : (
                      <>
                        {plan.id === 'free' ? 'เลือกใช้งานฟรี' : `อัปเกรดเป็น ${plan.name} (${plan.currency}${plan.priceMonthly})`} <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Local Test Mode Disclaimer */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Local Sandbox Environment — รองรับ PromptPay QR จำลอง พร้อมปุ่ม [Dev: Simulate Success] เพื่อทดสอบสิทธิ์ทันที
        </div>
      </div>

      {/* Mock Payment PromptPay Sandbox Modal */}
      {paymentModalTier && (
        <MockPaymentModal
          isOpen={Boolean(paymentModalTier)}
          targetTier={paymentModalTier}
          onClose={() => setPaymentModalTier(null)}
          onSuccess={() => {
            setSuccessToast(`อัปเกรดเป็น ${paymentModalTier.toUpperCase()} เรียบร้อยแล้ว!`);
            setTimeout(() => {
              setSuccessToast(null);
              closePricingModal();
            }, 1500);
          }}
        />
      )}
    </div>
  );
}
