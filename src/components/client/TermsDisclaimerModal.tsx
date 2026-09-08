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
    // Check if user has previously accepted
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
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #151821 0%, #0d0f14 100%)',
          border: '1px solid rgba(0, 122, 255, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 122, 255, 0.15)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 26px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
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
                border: '1px solid rgba(255, 159, 10, 0.3)',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                ข้อกำหนด นโยบาย และคำเตือนความเสี่ยงการลงทุน
              </h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                โปรดอ่านและทำความเข้าใจข้อตกลงและขอบเขตการให้บริการก่อนเข้าใช้งานแพลตฟอร์ม
              </p>
            </div>
          </div>

          {/* Close button only visible if user already accepted before (opened manually from footer) */}
          {(propIsOpen || forceOpen) && (
            <button
              type="button"
              onClick={handleCloseManual}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
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
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '24px 26px',
            overflowY: 'auto',
            fontSize: '0.86rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Section 1: Developer Identity */}
          <div
            style={{
              background: 'rgba(0, 122, 255, 0.05)',
              border: '1px solid rgba(0, 122, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '6px' }}>
              <UserCheck size={18} />
              <span>๑. คำแถลงสถานะผู้พัฒนา (Developer Identity & Legal Status)</span>
            </div>
            <p style={{ margin: 0 }}>
              แพลตฟอร์ม <strong>StockHomeTH</strong> ได้รับการริเริ่ม พัฒนา และดูแลระบบโดย<strong>บุคคลธรรมดาในฐานะนักพัฒนาอิสระ (Independent Developer / Technology Enthusiast)</strong> เพื่อการค้นคว้า ทดลอง และแลกเปลี่ยนองค์ความรู้ทางเทคโนโลยีทางการเงิน 
              <strong>มิได้ดำเนินงานในรูปแบบนิติบุคคล บริษัทจำกัด บริษัทมหาชน หรือสถาบันการเงินใดๆ ทั้งสิ้น</strong> และมิได้เป็นผู้ประกอบธุรกิจหลักทรัพย์ ที่ปรึกษาการลงทุน หรือผู้ให้บริการจัดอันดับหรือวิเคราะห์หลักทรัพย์ที่ได้รับใบอนุญาตหรือขึ้นทะเบียนกับสำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์ (ก.ล.ต.) หรือหน่วยงานกำกับดูแลใดๆ
            </p>
          </div>

          {/* Section 2: Non-Advice Disclaimer */}
          <div
            style={{
              background: 'rgba(255, 159, 10, 0.05)',
              border: '1px solid rgba(255, 159, 10, 0.25)',
              borderRadius: '16px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning, #FF9F0A)', fontWeight: 700, marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <span>๒. คำเตือนความเสี่ยงและข้อสงวนสิทธิ์ทางการเงิน (Non-Advice / DYOR)</span>
            </div>
            <p style={{ margin: 0 }}>
              ข้อมูลทั้งหมดที่ปรากฏบนระบบ รวมถึงข้อมูลราคา ดัชนี สถิติ อัตราส่วนทางการเงิน ตลอดจนบทสรุปข่าวและข้อมูลเชิงลึกที่ประมวลผลด้วยปัญญาประดิษฐ์ (AI) 
              <strong>จัดทำขึ้นเพื่อวัตถุประสงค์ในการศึกษา ค้นคว้าข้อมูลส่วนบุคคล และเพื่อประโยชน์ทางสถิติเท่านั้น</strong> ไม่ถือเป็นคำแนะนำทางการเงิน (Financial Advice) ไม่ใช่คำปรึกษาด้านการลงทุน และมิใช่การชักชวน ชี้แนะ หรือเสนอแนะให้ซื้อ ขาย หรือถือครองหลักทรัพย์ สินทรัพย์ดิจิทัล หรือตราสารทางการเงินใดๆ
            </p>
          </div>

          {/* Section 3: Limitation of Liability */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>
              <FileText size={18} />
              <span>๓. ข้อจำกัดความรับผิดและการยอมรับความเสี่ยง (Limitation of Liability)</span>
            </div>
            <p style={{ margin: 0 }}>
              การลงทุนในตลาดหลักทรัพย์มีความเสี่ยงสูง ราคาอาจมีความผันผวนรุนแรง และผู้ลงทุนอาจสูญเสียเงินลงทุนทั้งหมดหรือบางส่วน 
              <strong>ผู้ใช้บริการพึงตระหนักว่าการตัดสินใจลงทุนใดๆ ต้องกระทำด้วยเจตจำนง วิจารณญาณ และการศึกษาค้นคว้าด้วยตนเองอย่างรอบคอบ (Do Your Own Research - DYOR)</strong> 
              ผู้พัฒนาระบบให้บริการในลักษณะ &ldquo;ตามสภาพที่เป็นอยู่&rdquo; (As-Is Basis) โดยไม่รับประกันความครบถ้วนสมบูรณ์ ความถูกต้องปราศจากข้อผิดพลาด หรือความต่อเนื่องของการเชื่อมต่อข้อมูล และไม่ต้องรับผิดชอบต่อความสูญเสีย ความเสียหาย หรือผลขาดทุนใดๆ ไม่ว่าทางตรงหรือทางอ้อมที่เกิดขึ้นจากการนำข้อมูลบนแพลตฟอร์มนี้ไปใช้ในทุกกรณี
            </p>
          </div>

          {/* Section 4: Privacy & Bitcoiner Sovereignty */}
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-bullish, #22C55E)', fontWeight: 700, marginBottom: '6px' }}>
              <Lock size={18} />
              <span>๔. มาตรฐานความเป็นส่วนตัวและสิทธิเสรีภาพข้อมูล (Privacy & Self-Custody)</span>
            </div>
            <p style={{ margin: 0 }}>
              ระบบยึดมั่นในปรัชญาความโปร่งใสแบบ <strong>&ldquo;Don&apos;t Trust, Verify&rdquo;</strong> ข้อมูลราคาและบทวิเคราะห์จะมีลิงก์เพื่อตรวจสอบเทียบกับแหล่งข้อมูลทางการเสมอ (SET, SEC, Yahoo Finance) 
              สำหรับกุญแจส่วนตัว (Self-Custody AI API Key) จะถูกจัดเก็บไว้เฉพาะใน Browser (LocalStorage) ของผู้ใช้เอง ไม่มีการส่งไปเก็บไว้ในฐานข้อมูลของเซิร์ฟเวอร์ และระบบไม่มีนโยบายจำหน่าย จ่ายแจก หรือส่งต่อข้อมูลส่วนบุคคลให้แก่บุคคลภายนอกโดยเด็ดขาด
            </p>
          </div>
        </div>

        {/* Footer & Consent Check */}
        <div
          style={{
            padding: '18px 26px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 12, 16, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '0.84rem',
              color: 'var(--text-primary)',
              userSelect: 'none',
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
              }}
            />
            <span>
              ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับว่าข้อมูลทั้งหมดมีไว้เพื่อการศึกษาเท่านั้น และผู้พัฒนาเป็นบุคคลธรรมดามิใช่ที่ปรึกษาการลงทุน
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              disabled={!hasAcknowledged}
              onClick={handleAccept}
              style={{
                background: hasAcknowledged
                  ? 'linear-gradient(135deg, #007AFF 0%, #0051B3 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: hasAcknowledged ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 28px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: hasAcknowledged ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: hasAcknowledged ? '0 4px 16px rgba(0, 122, 255, 0.4)' : 'none',
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
