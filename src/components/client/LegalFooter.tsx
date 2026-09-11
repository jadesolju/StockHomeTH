'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, AlertTriangle, ExternalLink, Scale, FileText, Lock, CreditCard, ChevronRight } from 'lucide-react';
import { TermsDisclaimerModal, PolicyCategory } from './TermsDisclaimerModal';

export function LegalFooter() {
  const pathname = usePathname();
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [modalTab, setModalTab] = useState<PolicyCategory>('all');

  // Hide footer on AI Helper page so chat has 100% viewport height
  if (pathname === '/ai-helper') {
    return null;
  }

  const openPolicyTab = (tab: PolicyCategory) => {
    setModalTab(tab);
    setIsDisclaimerOpen(true);
  };

  return (
    <>
      <footer
        style={{
          marginTop: '60px',
          borderTop: '1px solid var(--footer-border)',
          background: 'var(--footer-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '40px 24px 30px',
          color: 'var(--text-secondary)',
          fontSize: '0.82rem',
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Top Notice Grid - 4 Categorized Policy Pillars */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {/* 1. Risk Disclaimer Highlight */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid var(--accent-neutral-border)',
                background: 'var(--accent-neutral-bg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-neutral)', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertTriangle size={16} />
                  <span>คำเตือนความเสี่ยงการลงทุน (DYOR)</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  ข้อมูลราคา ดัชนี สถิติ และบทวิเคราะห์ AI จัดทำขึ้นเพื่อการศึกษาและวิจัยส่วนบุคคลเท่านั้น <strong>มิใช่คำแนะนำการลงทุน (Not Financial Advice)</strong> การตัดสินใจลงทุนเป็นดุลยพินิจและความรับผิดชอบของผู้ใช้งานแต่เพียงผู้เดียว
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPolicyTab('disclaimer')}
                style={{
                  marginTop: '10px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--accent-neutral)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>อ่านคำเตือนฉบับเต็ม</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {/* 2. Developer Identity Highlight */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid var(--accent-blue-border)',
                background: 'var(--accent-blue-bg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '6px' }}>
                  <Scale size={16} />
                  <span>สถานะการให้บริการทางเทคโนโลยี</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  ระบบพัฒนาและดูแลโดย<strong>บุคคลธรรมดาในฐานะนักพัฒนาอิสระ (Independent Developer)</strong> มิได้เป็นสถาบันการเงิน หรือบริษัทหลักทรัพย์ที่ได้รับอนุญาตจากสำนักงาน ก.ล.ต. บริการทั้งหมดจัดให้แบบ &ldquo;ตามสภาพจริง&rdquo; (As-Is Basis)
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPolicyTab('terms')}
                style={{
                  marginTop: '10px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>อ่านข้อกำหนดการใช้บริการ</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {/* 3. Payment & Billing Security Policy */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                background: 'rgba(168, 85, 247, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 700, marginBottom: '6px' }}>
                  <CreditCard size={16} />
                  <span>การชำระเงินและนโยบายคืนเงิน</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  ธุรกรรมสมาชิกและ GemCoins ประมวลผลผ่าน <strong>Stripe Payments</strong> มาตรฐาน <strong>PCI-DSS Level 1</strong> รองรับบัตรเครดิต/เดบิต และ <strong>QR PromptPay</strong> สมาชิกยกเลิกต่ออายุได้ตลอดเวลา บริการดิจิทัลไม่สามารถขอคืนเงินเมื่อเริ่มประมวลผลแล้ว
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPolicyTab('payment')}
                style={{
                  marginTop: '10px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#c084fc',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>อ่านนโยบายการชำระเงินและคืนเงิน</span>
                <ChevronRight size={12} />
              </button>
            </div>

            {/* 4. Information Security & Privacy Standard */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid var(--accent-bullish-border)',
                background: 'var(--accent-bullish-bg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-bullish)', fontWeight: 700, marginBottom: '6px' }}>
                  <ShieldCheck size={16} />
                  <span>ความปลอดภัยและการปกป้องข้อมูล</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  ระบบปกป้องข้อมูลด้วยการเข้ารหัสความปลอดภัยสูง <strong>TLS 1.3</strong> คีย์ AI ส่วนตัวจะถูกจัดเก็บบนหน่วยความจำอุปกรณ์ของผู้ใช้งานโดยตรง (Client-Side Storage) ตามมาตรฐานสากล โดยไม่มีการส่งไปจัดเก็บบนเซิร์ฟเวอร์ส่วนกลาง
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPolicyTab('privacy')}
                style={{
                  marginTop: '10px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--accent-bullish)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>อ่านนโยบายความเป็นส่วนตัว</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Bottom Links & Copyright */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--footer-divider)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <span>© {new Date().getFullYear()} StockHomeTH — แพลตฟอร์มวิเคราะห์ข้อมูลตลาดทุนเพื่อการศึกษา</span>
            </div>

            {/* Quick Policy Actions */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <button
                type="button"
                onClick={() => openPolicyTab('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                <FileText size={14} />
                <span>ข้อกำหนดและนโยบายฉบับเต็ม</span>
              </button>

              <button
                type="button"
                onClick={() => openPolicyTab('payment')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  padding: 0,
                }}
              >
                <span>นโยบายการชำระเงิน</span>
              </button>

              <button
                type="button"
                onClick={() => openPolicyTab('privacy')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  padding: 0,
                }}
              >
                <span>ความปลอดภัย & ข้อมูล</span>
              </button>

              <a
                href="https://www.set.or.th"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>ตลาดหลักทรัพย์ (SET)</span>
                <ExternalLink size={12} />
              </a>

              <a
                href="https://www.sec.or.th"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>ก.ล.ต. (SEC Thailand)</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Manual Terms & Disclaimer Reader Modal */}
      {isDisclaimerOpen && (
        <TermsDisclaimerModal
          isOpen={isDisclaimerOpen}
          onClose={() => setIsDisclaimerOpen(false)}
          forceOpen={true}
          initialTab={modalTab}
        />
      )}
    </>
  );
}
