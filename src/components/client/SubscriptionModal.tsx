'use client';

import { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: 0,
      features: [
        'ติดตามราคาหุ้น SET & US Real-time',
        'อ่านสรุปข่าวหุ้นรายวัน (Daily Digest)',
        'จำกัดการขอสรุป AI 5 ข่าว/วัน',
        'เข้าถึง Public Financial Data',
      ],
    },
    {
      id: 'pro',
      name: 'PRO Intelligence',
      price: 490,
      featured: true,
      features: [
        'ทุกฟีเจอร์ของ Free Starter',
        'AI สรุปข่าวสดเรียลไทม์ ไม่จำกัดจำนวน',
        'ฟังเสียงสังเคราะห์สรุปข่าว (Audio Narration)',
        'บทวิเคราะห์ความเสี่ยงและ Price Target แบบเจาะลึก',
        'สิทธิ์เข้าถึง Developer API Key (10,000 req/mo)',
      ],
    },
    {
      id: 'team',
      name: 'Team / Enterprise',
      price: 1890,
      features: [
        'ทุกฟีเจอร์ของ PRO Intelligence',
        'ทีมงานและพอร์ตโฟลิโอร่วมกันสูงสุด 10 บัญชี',
        'Custom Webhooks & Alerts ผ่าน Line/Telegram',
        'Dedicated Support & SLA 99.9%',
      ],
    },
  ];

  const handleCheckout = (planId: string) => {
    setMessage(`เปิดใช้งานแพ็กเกจ ${planId.toUpperCase()} เรียบร้อยแล้ว (Demo Sandbox)`);
    setTimeout(() => {
      setMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <section className="subscription-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button auth-close" onClick={onClose} aria-label="ปิด">
          <X size={19} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={18} color="var(--accent-blue)" />
          <p className="eyebrow" style={{ margin: 0 }}>SUBSCRIPTION PLANS</p>
        </div>
        <h2>ยกระดับการลงทุนด้วย Pro Intelligence</h2>
        <p className="auth-copy">เลือกแพ็กเกจที่เหมาะกับคุณ ยกเลิกได้ตลอดเวลา ไม่มีข้อผูกมัด</p>

        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={`plan-card ${plan.featured ? 'featured' : ''}`} key={plan.id}>
              {plan.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent-blue)',
                    color: '#ffffff',
                    padding: '2px 12px',
                    borderRadius: '100px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  RECOMMENDED
                </div>
              )}
              <h3>{plan.name}</h3>
              <p className="plan-price">
                {plan.price === 0 ? 'ฟรี' : `฿${plan.price.toLocaleString()}`}
                <small>{plan.price ? ' / เดือน' : ''}</small>
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} color="var(--accent-bullish)" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={plan.id === 'free' ? 'outline-button' : 'solid-button'}
                onClick={() => (plan.id === 'free' ? onClose() : handleCheckout(plan.id))}
              >
                {plan.id === 'free' ? 'แผนปัจจุบัน (เริ่มต้นฟรี)' : `เลือก ${plan.name}`}
              </button>
            </article>
          ))}
        </div>

        {message && <p className="subscription-message">{message}</p>}
      </section>
    </div>
  );
}
