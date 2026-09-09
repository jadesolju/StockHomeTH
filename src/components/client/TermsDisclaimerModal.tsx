'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Lock, FileText, UserCheck, AlertTriangle, X } from 'lucide-react';

interface TermsDisclaimerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

export function TermsDisclaimerModal({ isOpen: propIsOpen, onClose: propOnClose, forceOpen = false }: TermsDisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      return;
    }
    try {
      const accepted = localStorage.getItem('stockhome_terms_accepted');
      if (!accepted) {
        setIsOpen(true);
      }
    } catch {
      // LocalStorage access issue
    }
  }, [forceOpen, propIsOpen]);

  const handleAccept = () => {
    try {
      localStorage.setItem('stockhome_terms_accepted', new Date().toISOString());
    } catch {}
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const handleCloseManual = () => {
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 159, 10, 0.15)',
                color: 'var(--accent-warning, #FF9F0A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 159, 10, 0.35)',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                ข้อกำหนด นโยบาย และคำเตือนความเสี่ยงการลงทุน
              </h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', margin: '3px 0 0 0', lineHeight: 1.4 }}>
                โปรดอ่านและทำความเข้าใจข้อตกลงก่อนเข้าใช้งานแพลตฟอร์ม
              </p>
            </div>
          </div>
          {(propIsOpen || forceOpen) && (
            <button
              type="button"
              onClick={handleCloseManual}
              title="ปิด"
              style={{
                background: 'var(--card-sub-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: '22px 24px',
            overflowY: 'auto',
            fontSize: '0.86rem',
            lineHeight: 1.75,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Section 1: Developer Identity */}
          <div
            style={{
              background: 'rgba(0, 122, 255, 0.06)',
              border: '1px solid rgba(0, 122, 255, 0.25)',
              borderRadius: '14px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue, #007AFF)', fontWeight: 700, marginBottom: '8px', fontSize: '0.88rem' }}>
              <UserCheck size={17} strokeWidth={2.5} />
              <span>๑. คำแถลงสถานะผู้พัฒนา (Developer Identity &amp; Legal Status)</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              แพลตฟอร์ม <strong>StockHomeTH</strong> ได้รับการพัฒนาโดย{' '}
              <strong>บุคคลธรรมดาในฐานะนักพัฒนาอิสระ (Independent Developer)</strong>{' '}
              เพื่อการค้นคว้าและแลกเปลี่ยนองค์ความรู้ทางเทคโนโลยีทางการเงิน{' '}
              <strong>มิได้ดำเนินงานในรูปแบบนิติบุคคล</strong> และมิได้เป็นผู้ให้บริการด้านหลักทรัพย์ที่ได้รับใบอนุญาตจากสำนักงาน ก.ล.ต. หรือหน่วยงานกำกับดูแลใดๆ
            </p>
          </div>

          {/* Section 2: Non-Advice Disclaimer */}
          <div
            style={{
              background: 'rgba(255, 159, 10, 0.06)',
              border: '1px solid rgba(255, 159, 10, 0.3)',
              borderRadius: '14px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 700, marginBottom: '8px', fontSize: '0.88rem' }}>
              <AlertTriangle size={17} strokeWidth={2.5} />
              <span>๒. คำเตือนความเสี่ยงและข้อสงวนสิทธิ์ทางการเงิน (Non-Advice / DYOR)</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              ข้อมูลทั้งหมดที่ปรากฏบนระบบ รวมถึงบทสรุปข่าวและข้อมูลเชิงลึกที่ประมวลผลด้วย AI{' '}
              <strong>จัดทำขึ้นเพื่อวัตถุประสงค์ในการศึกษาเท่านั้น</strong>{' '}
              ไม่ถือเป็นคำแนะนำทางการเงิน (Financial Advice) และมิใช่การชักชวนให้ซื้อ ขาย หรือถือครองหลักทรัพย์ใดๆ
            </p>
          </div>

          {/* Section 3: Limitation of Liability */}
          <div
            style={{
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px', fontSize: '0.88rem' }}>
              <FileText size={17} strokeWidth={2.5} />
              <span>๓. ข้อจำกัดความรับผิดและการยอมรับความเสี่ยง (Limitation of Liability)</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              การลงทุนในตลาดหลักทรัพย์มีความเสี่ยงสูง ราคาอาจมีความผันผวนรุนแรง{' '}
              <strong>ผู้ใช้บริการพึงตระหนักว่าการตัดสินใจลงทุนใดๆ ต้องกระทำด้วยวิจารณญาณและการศึกษาค้นคว้าด้วยตนเอง (DYOR)</strong>{' '}
              ผู้พัฒนาไม่รับประกันความถูกต้องสมบูรณ์ และไม่ต้องรับผิดชอบต่อความสูญเสียใดๆ จากการนำข้อมูลบนแพลตฟอร์มนี้ไปใช้
            </p>
          </div>

          {/* Section 4: Privacy & Data Sovereignty */}
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '14px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 700, marginBottom: '8px', fontSize: '0.88rem' }}>
              <Lock size={17} strokeWidth={2.5} />
              <span>๔. มาตรฐานความเป็นส่วนตัวและสิทธิเสรีภาพข้อมูล (Privacy &amp; Self-Custody)</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
              ระบบยึดมั่นในปรัชญาความโปร่งใสแบบ{' '}
              <strong>&ldquo;Don&apos;t Trust, Verify&rdquo;</strong>{' '}
              กุญแจ API ส่วนตัว (Self-Custody AI API Key) จะถูกจัดเก็บไว้เฉพาะใน Browser ของผู้ใช้เอง ไม่มีการส่งไปเก็บไว้ในฐานข้อมูลเซิร์ฟเวอร์ และระบบไม่มีนโยบายส่งต่อข้อมูลส่วนบุคคลให้แก่บุคคลภายนอกโดยเด็ดขาด
            </p>
          </div>
        </div>

        {/* Footer: Consent */}
        <div
          style={{
            padding: '18px 24px',
            borderTop: '1px solid var(--card-border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flexShrink: 0,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '0.84rem',
              color: 'var(--text-primary)',
              userSelect: 'none',
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-blue)',
                cursor: 'pointer',
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
            <span>
              ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับว่าข้อมูลทั้งหมดมีไว้เพื่อการศึกษาเท่านั้น และผู้พัฒนาเป็นบุคคลธรรมดามิใช่ที่ปรึกษาการลงทุน
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={!hasAcknowledged}
              onClick={handleAccept}
              style={{
                background: hasAcknowledged
                  ? 'linear-gradient(135deg, #007AFF 0%, #0051B3 100%)'
                  : 'var(--card-sub-bg)',
                color: hasAcknowledged ? '#ffffff' : 'var(--text-tertiary)',
                border: hasAcknowledged ? 'none' : '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '11px 28px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: hasAcknowledged ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: hasAcknowledged ? '0 4px 16px rgba(0, 122, 255, 0.35)' : 'none',
              }}
            >
              <CheckCircle2 size={18} />
              <span>เข้าใจและยินยอมรับเงื่อนไข</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
