'use client';

import React, { useState } from 'react';
import { useSubscription, type SubscriptionTier } from '../../lib/context/SubscriptionContext';
import { PRICING_PLANS } from '../../config/pricingPlans';
import { X, QrCode, Upload, CheckCircle2, ShieldCheck, Sparkles, Terminal, ArrowRight, Loader2, Coffee, Zap, Crown } from 'lucide-react';

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier: SubscriptionTier;
  onSuccess?: () => void;
}

export function MockPaymentModal({ isOpen, onClose, targetTier, onSuccess }: MockPaymentModalProps) {
  const { setTier, billingCycle } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txnDetails, setTxnDetails] = useState<any>(null);

  if (!isOpen) return null;

  const plan = PRICING_PLANS.find((p) => p.id === targetTier) || PRICING_PLANS[1];
  const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

  const handleSimulatePayment = async (isDevFastPass = false) => {
    setIsProcessing(true);

    try {
      // Simulate API call to mock verify
      const res = await fetch('/api/payment/mock-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetTier,
          amount,
          slipUploaded: Boolean(slipFile) || isDevFastPass,
        }),
      });

      const data = await res.json();

      setTimeout(() => {
        setIsProcessing(false);
        if (data.success) {
          setPaymentSuccess(true);
          setTxnDetails(data);
          // Upgrade local tier immediately
          setTier(targetTier);

          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
          }, 1800);
        }
      }, isDevFastPass ? 400 : 1200);
    } catch (err) {
      setIsProcessing(false);
      // Fallback local upgrade
      setTier(targetTier);
      setPaymentSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          background: 'var(--card-bg, #1a1a1e)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          padding: '28px 24px',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        {!isProcessing && !paymentSuccess && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Success State */}
        {paymentSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '2px solid var(--accent-bullish)',
                color: 'var(--accent-bullish)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto',
              }}
            >
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              ชำระเงินสำเร็จ (Simulated)!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              อัปเกรดเป็น <b style={{ color: plan.color }}>{plan.name}</b> เรียบร้อยแล้ว สิทธิ์ของคุณเริ่มมีผลทันที
            </p>
            {txnDetails && (
              <div
                style={{
                  background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.04))',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'monospace',
                  marginBottom: '10px',
                }}
              >
                TXN: {txnDetails.transactionId} • ยอด {txnDetails.amount} ฿
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '100px',
                  padding: '4px 12px',
                  color: 'var(--accent-blue)',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  marginBottom: '10px',
                }}
              >
                <QrCode size={13} /> THAI QR PAYMENT SANDBOX
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                สแกนชำระผ่าน PromptPay (จำลอง)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                แพ็กเกจ: <b style={{ color: plan.color }}>{plan.name}</b> • ยอดชำระ <b style={{ color: '#ffffff' }}>฿{amount.toFixed(2)}</b>
              </p>
            </div>

            {/* PromptPay QR Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                marginBottom: '20px',
                position: 'relative',
              }}
            >
              {/* Thai QR Logo Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ background: '#003d79', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 900 }}>
                  PromptPay
                </span>
                <span style={{ color: '#1a1a1a', fontSize: '12px', fontWeight: 800 }}>พร้อมเพย์</span>
              </div>

              {/* QR Graphic */}
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  margin: '0 auto',
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <QrCode size={120} color="#0f172a" />
                <div
                  style={{
                    position: 'absolute',
                    background: '#003d79',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                  }}
                >
                  ฿{amount.toFixed(2)}
                </div>
              </div>

              <div style={{ marginTop: '12px', color: '#475569', fontSize: '11.5px', lineHeight: 1.4 }}>
                ชื่อบัญชี: <b>StockHome Intelligence (Mock)</b><br />
                รหัสอ้างอิง: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>REF-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            {/* Slip Upload & Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Upload Slip Mock Button */}
              <label
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1px dashed var(--glass-border, rgba(255, 255, 255, 0.2))',
                  background: slipFile ? 'rgba(34, 197, 94, 0.12)' : 'var(--card-sub-bg, rgba(255, 255, 255, 0.04))',
                  color: slipFile ? 'var(--accent-bullish)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <Upload size={16} />
                <span>{slipFile ? '✓ อัปโหลดสลิปเรียบร้อย (Mock)' : 'อัปโหลดสลิป (Mock Slip)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSlipFile(e.target.files[0].name);
                    } else {
                      setSlipFile('mock_slip_01.jpg');
                    }
                  }}
                />
              </label>

              {/* Confirm Pay Button */}
              <button
                disabled={isProcessing}
                onClick={() => handleSimulatePayment(false)}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--accent-blue, #007AFF)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spin" /> กำลังตรวจสอบรายการ...
                  </>
                ) : (
                  <>
                    ยืนยันการโอนเงิน (จำลอง) <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Developer Shortcut: [Dev: Simulate Success] */}
              <button
                disabled={isProcessing}
                onClick={() => handleSimulatePayment(true)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: '#eab308',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <Terminal size={14} /> [Dev: Simulate Success] (อัปเกรดสิทธิ์ทันที)
              </button>
            </div>

            {/* Sandbox Notice */}
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              🔒 สภาพแวดล้อม Local Sandbox — ปลอดภัย 100% ไม่มีตัดเงินจริง
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
