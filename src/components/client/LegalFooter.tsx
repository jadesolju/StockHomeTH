'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, ExternalLink, UserCheck, FileText, Lock } from 'lucide-react';
import { TermsDisclaimerModal } from './TermsDisclaimerModal';

export function LegalFooter() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

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
          {/* Top Notice Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Disclaimer Highlight */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid var(--accent-neutral-border)',
                background: 'var(--accent-neutral-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-neutral)', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={16} />
                <span>คำเตือนความเสี่ยงการลงทุน (DYOR)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ข้อมูลทั้งหมดบนระบบ รวมถึงข้อมูลราคา ดัชนี สถิติ และบทวิเคราะห์ AI จัดทำขึ้นเพื่อประโยชน์ในการศึกษาและวิจัยส่วนบุคคลเท่านั้น <strong>มิใช่คำแนะนำการลงทุน (Not Financial Advice)</strong> การลงทุนมีความเสี่ยง ผู้ใช้บริการต้องตัดสินใจด้วยวิจารณญาณของตนเอง
              </p>
            </div>

            {/* Developer Identity Highlight */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid var(--accent-blue-border)',
                background: 'var(--accent-blue-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '6px' }}>
                <UserCheck size={16} />
                <span>สถานะผู้พัฒนา (บุคคลธรรมดา)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ระบบพัฒนาและดูแลโดย<strong>บุคคลธรรมดาในฐานะนักพัฒนาอิสระ (Independent Developer)</strong> มิได้เป็นนิติบุคคล สถาบันการเงิน หรือบริษัทหลักทรัพย์ที่ได้รับอนุญาตหรือขึ้นทะเบียนกับสำนักงาน ก.ล.ต. บริการทั้งหมดจัดให้แบบ &ldquo;ตามสภาพ&rdquo; (As-Is Basis)
              </p>
            </div>

            {/* Bitcoiner Cyber Security Standard */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid var(--accent-bullish-border)',
                background: 'var(--accent-bullish-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-bullish)', fontWeight: 700, marginBottom: '6px' }}>
                <Lock size={16} />
                <span>ความปลอดภัยแบบ Bitcoiner</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                ยึดหลักการ <strong>&ldquo;Not your keys, not your data&rdquo;</strong> และ <strong>&ldquo;Don&apos;t Trust, Verify&rdquo;</strong> คีย์ AI ส่วนตัวจะถูกบันทึกในอุปกรณ์ของผู้ใช้เท่านั้น และข้อมูลตัวเลขทุกจุดสามารถกดตรวจสอบเทียบกับตลาดทางการได้เสมอ
              </p>
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
              <span>© {new Date().getFullYear()} StockHomeTH — พัฒนาเพื่อการศึกษาโดยนักพัฒนาอิสระ</span>
            </div>

            {/* Quick Policy Actions */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setIsDisclaimerOpen(true)}
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
                <span>ข้อกำหนดและคำเตือนความเสี่ยงฉบับเต็ม</span>
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
        />
      )}
    </>
  );
}
