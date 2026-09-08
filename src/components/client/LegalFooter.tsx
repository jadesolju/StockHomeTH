'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, ExternalLink, UserCheck, Key, FileText, Lock } from 'lucide-react';
import { TermsDisclaimerModal } from './TermsDisclaimerModal';

export function LegalFooter() {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  return (
    <>
      <footer
        style={{
          marginTop: '60px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(13, 15, 20, 0.6) 0%, rgba(8, 9, 12, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
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
                border: '1px solid rgba(255, 159, 10, 0.2)',
                background: 'rgba(255, 159, 10, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning, #FF9F0A)', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={16} />
                <span>คำเตือนความเสี่ยงการลงทุน (DYOR)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                ข้อมูลทั้งหมดบนระบบ รวมถึงข้อมูลราคา ดัชนี สถิติ และบทวิเคราะห์ AI จัดทำขึ้นเพื่อประโยชน์ในการศึกษาและวิจัยส่วนบุคคลเท่านั้น <strong>มิใช่คำแนะนำการลงทุน (Not Financial Advice)</strong> การลงทุนมีความเสี่ยง ผู้ใช้บริการต้องตัดสินใจด้วยวิจารณญาณของตนเอง
              </p>
            </div>

            {/* Developer Identity Highlight */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid rgba(0, 122, 255, 0.2)',
                background: 'rgba(0, 122, 255, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue, #007AFF)', fontWeight: 700, marginBottom: '6px' }}>
                <UserCheck size={16} />
                <span>สถานะผู้พัฒนา (บุคคลธรรมดา)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                ระบบพัฒนาและดูแลโดย<strong>บุคคลธรรมดาในฐานะนักพัฒนาอิสระ (Independent Developer)</strong> มิได้เป็นนิติบุคคล สถาบันการเงิน หรือบริษัทหลักทรัพย์ที่ได้รับอนุญาตหรือขึ้นทะเบียนกับสำนักงาน ก.ล.ต. บริการทั้งหมดจัดให้แบบ &ldquo;ตามสภาพ&rdquo; (As-Is Basis)
              </p>
            </div>

            {/* Bitcoiner Cyber Security Standard */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                background: 'rgba(34, 197, 94, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-bullish, #22C55E)', fontWeight: 700, marginBottom: '6px' }}>
                <Lock size={16} />
                <span>ความปลอดภัยแบบ Bitcoiner</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                ยึดหลักการ <strong>&ldquo;Not your keys, not your data&rdquo;</strong> และ <strong>&ldquo;Don&apos;t Trust, Verify&rdquo;</strong> คีย์ AI ส่วนตัวจะถูกบันทึกในอุปกรณ์ของผู้ใช้เท่านั้น และข้อมูลตัวเลขทุกจุดสามารถกดตรวจสอบเทียบกับตลาดทางการได้เสมอ
              </p>
            </div>
          </div>

          {/* Bottom Links & Copyright */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
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

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Key size={12} />
                <span>รับ API Key ฟรี (Google AI Studio)</span>
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
