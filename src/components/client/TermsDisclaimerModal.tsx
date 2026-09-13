'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../lib/context/LanguageContext';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  AlertTriangle,
  CreditCard,
  X,
  Scale,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface TermsDisclaimerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
  initialTab?: PolicyCategory;
}

export type PolicyCategory = 'all' | 'terms' | 'payment' | 'privacy' | 'disclaimer';

export function TermsDisclaimerModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  forceOpen = false,
  initialTab = 'all',
}: TermsDisclaimerModalProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PolicyCategory>(initialTab);

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
      // LocalStorage fallback
    }
  }, [forceOpen, propIsOpen]);

  useEffect(() => {
    if (initialTab) {
      setActiveCategory(initialTab);
    }
  }, [initialTab, isOpen]);

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
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary, #0c1118)',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 122, 255, 0.1)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.22s ease-out',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '20px 26px',
            borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary, #080d14)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'rgba(0, 122, 255, 0.15)',
                color: 'var(--accent-blue, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 122, 255, 0.3)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)', margin: 0, lineHeight: 1.3 }}>
                {isEn ? 'Official Terms, Policies & Conditions of Service' : 'ข้อกำหนด นโยบาย และเงื่อนไขการให้บริการอย่างเป็นทางการ'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary, #94a3b8)', margin: '3px 0 0 0', lineHeight: 1.4 }}>
                StockHomeTH Financial Intelligence Platform • {isEn ? 'Global Standard Edition 2026' : 'ฉบับปรับปรุงมาตรฐานสากล พ.ศ. ๒๕๖๙'}
              </p>
            </div>
          </div>

          {(propIsOpen || forceOpen) && (
            <button
              type="button"
              onClick={handleCloseManual}
              title="ปิดหน้าต่าง"
              style={{
                background: 'var(--card-sub-bg, rgba(255, 255, 255, 0.06))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Category Filter Tabs ── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--bg-secondary, #080d14)',
            borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'all' as PolicyCategory, label: isEn ? 'Overview' : 'ภาพรวมทั้งหมด', icon: FileText },
            { id: 'terms' as PolicyCategory, label: isEn ? 'Terms of Service' : 'ข้อกำหนดการใช้บริการ', icon: Scale },
            { id: 'payment' as PolicyCategory, label: isEn ? 'Payment & Refunds' : 'การชำระเงินและคืนเงิน', icon: CreditCard, highlight: true },
            { id: 'privacy' as PolicyCategory, label: isEn ? 'Privacy & Security' : 'ความเป็นส่วนตัวและความปลอดภัย', icon: Lock },
            { id: 'disclaimer' as PolicyCategory, label: isEn ? 'Risk Disclaimer (DYOR)' : 'คำเตือนความเสี่ยง (DYOR)', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: isActive
                    ? '1px solid var(--accent-blue, #38bdf8)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive
                    ? 'rgba(0, 122, 255, 0.18)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} color={isActive ? 'var(--accent-blue, #38bdf8)' : '#94a3b8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Content Area ── */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            fontSize: '0.85rem',
            lineHeight: 1.75,
            color: 'var(--text-secondary, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ══════════════════════════════════════════════════════════════
              หมวดที่ ๑: ข้อกำหนดและเงื่อนไขการใช้บริการ (Terms of Service)
              ══════════════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'terms') && (
            <section
              style={{
                background: 'rgba(56, 189, 248, 0.04)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '16px',
                padding: '18px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, marginBottom: '10px', fontSize: '0.92rem' }}>
                <Scale size={18} strokeWidth={2.2} />
                <span>{isEn ? 'Section 1: Terms of Service' : 'หมวดที่ ๑: ข้อกำหนดและเงื่อนไขการใช้บริการ (Terms of Service)'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-primary, #f1f5f9)' }}>
                {isEn ? (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>1.1 Purpose & Scope:</strong> The <strong>StockHomeTH</strong> platform is engineered as a software tool for Financial Data Analytics & AI Research Assistance, strictly intended for personal educational research and market exploration.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>1.2 Legal Developer Status:</strong> This service is maintained by an <strong>Independent Software Developer</strong> and does not operate as a licensed brokerage, financial institution, or fund manager regulated by the SEC.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>1.3 Intellectual Property:</strong> Software code, algorithms, data aggregation frameworks, and user interfaces remain exclusive IP. Reverse engineering, unauthorized copying, or commercial exploitation is strictly prohibited without written consent.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>1.4 As-Is Provision:</strong> Services are rendered on an &ldquo;As-Is&rdquo; and &ldquo;As-Available&rdquo; basis. The maintainer reserves the right to perform system upgrades or security maintenance without prior notice.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>๑.๑ วัตถุประสงค์และขอบเขตการให้บริการ:</strong> แพลตฟอร์ม <strong>StockHomeTH</strong> พัฒนาขึ้นเพื่อเป็นเครื่องมือซอฟต์แวร์สนับสนุนการวิเคราะห์ข้อมูลตลาดทุน (Financial Data Analytics & AI Research Assistant) เพื่อการศึกษา ค้นคว้า และวิจัยส่วนบุคคลของผู้ใช้งานเท่านั้น
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๑.๒ สถานะทางกฎหมายของผู้พัฒนา:</strong> ระบบได้รับการพัฒนาและดูแลโดย <strong>บุคคลธรรมดาในฐานะนักพัฒนาอิสระ (Independent Software Developer)</strong> มิได้ดำเนินงานในฐานะนิติบุคคล สถาบันการเงิน หรือบริษัทหลักทรัพย์ที่ได้รับใบอนุญาตจัดการกองทุนหรือให้คำปรึกษาการลงทุนจากสำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์ (ก.ล.ต.)
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๑.๓ สิทธิ์ในทรัพย์สินทางปัญญา:</strong> โครงสร้างรหัสซอฟต์แวร์ อัลกอริทึม รูปแบบการจัดวางข้อมูล และอินเทอร์เฟซเป็นทรัพย์สินทางปัญญาของผู้พัฒนา ห้ามมิให้ผู้ใดคัดลอก ดัดแปลง วิศวกรรมย้อนกลับ (Reverse Engineer) หรือแสวงหาประโยชน์เชิงพาณิชย์โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษร
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๑.๔ การให้บริการตามสภาพจริง (As-Is Basis):</strong> บริการทั้งหมดจัดให้บนหลักการ &ldquo;ตามสภาพที่เป็นอยู่&rdquo; (As-Is) และ &ldquo;ตามความพร้อมให้บริการ&rdquo; (As-Available) ผู้ให้บริการขอสงวนสิทธิ์ในการปรับปรุง บำรุงรักษา หรือระงับการทำงานบางส่วนเพื่อความปลอดภัยของระบบโดยไม่ต้องแจ้งล่วงหน้า
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════════
              หมวดที่ ๒: นโยบายการชำระเงิน การต่ออายุ และการขอคืนเงิน (Payment & Refund Policy)
              ══════════════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'payment') && (
            <section
              style={{
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '16px',
                padding: '18px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 800, marginBottom: '10px', fontSize: '0.92rem' }}>
                <CreditCard size={18} strokeWidth={2.2} />
                <span>{isEn ? 'Section 2: Payment, Subscriptions & Refund Policy' : 'หมวดที่ ๒: ข้อกำหนดการชำระเงิน สมาชิกภาพ และนโยบายการขอคืนเงิน (Payment & Refund Policy)'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-primary, #f1f5f9)' }}>
                {isEn ? (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>2.1 Payment Gateway Security:</strong> All financial transactions for subscription tiers (Lite, Pro, VIP, Whale) and GemCoin top-ups are processed via <strong>Stripe Payments</strong>. We support Credit/Debit Cards (Visa, Mastercard, JCB, UnionPay) and <strong>PromptPay QR</strong> protected by top-tier <strong>PCI-DSS Level 1 Encryption</strong>. No raw payment details are stored on our servers.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>2.2 Digital Content Classification:</strong> Membership tiers and GemCoin packages are categorized as <strong>Digital Content & Computational Cloud Services</strong>. All features and quotas are granted immediately upon confirmed payment.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>2.3 Subscriptions & Cancellations:</strong>
                    </p>
                    <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '0.82rem', lineHeight: 1.6 }}>
                      <li>Monthly and Yearly plans automatically renew at the end of each billing cycle for seamless access.</li>
                      <li>Users can cancel auto-renewal anytime via the Stripe Customer Portal or user profile settings.</li>
                      <li>Upon cancellation, active benefits remain valid until the end of the current billing term.</li>
                    </ul>
                    <p style={{ margin: 0 }}>
                      <strong>2.4 Refund Policy:</strong> Due to immediate real-time allocation of AI inference GPU servers, <strong>processed transactions or consumed GemCoins are strictly Non-Refundable</strong>, except in documented cases of duplicate billing reported within 7 business days.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>๒.๑ ช่องทางและการประมวลผลธุรกรรมทางการเงิน:</strong> การชำระเงินสำหรับแพ็กเกจสมาชิก (Lite, Pro, VIP, Whale) และแพ็กเกจเหรียญ GemCoins ประมวลผลผ่านเกตเวย์ชำระเงินมาตรฐานสากล <strong>Stripe Payments</strong> รองรับบัตรเครดิต/เดบิต (Visa, Mastercard, JCB, UnionPay) และ <strong>QR PromptPay (พร้อมเพย์)</strong> ภายใต้มาตรฐานการเข้ารหัสข้อมูลสูงสุด <strong>PCI-DSS Level 1</strong> โดยไม่มีการจัดเก็บข้อมูลหมายเลขบัตรเครดิตหรือข้อมูลการเงินส่วนบุคคลไว้บนเซิร์ฟเวอร์ของระบบ
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๒.๒ ลักษณะของสินค้าและบริการดิจิทัล:</strong> ค่าบริการสมาชิกและเหรียญ GemCoins จัดเป็น <strong>สินค้าและบริการประมวลผลข้อมูลดิจิทัล (Digital Content & Computational Cloud Service)</strong> ซึ่งจะได้รับการปลดล็อกโควตาและสิทธิประโยชน์เข้าสู่บัญชีของผู้ใช้งานในทันทีที่ธุรกรรมเสร็จสมบูรณ์
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๒.๓ รอบการเรียกเก็บเงินและการยกเลิกการต่ออายุ (Subscription Renewal & Cancellation):</strong>
                    </p>
                    <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '0.82rem', lineHeight: 1.6 }}>
                      <li>การสมัครสมาชิกแบบรายเดือน (Monthly) และรายปี (Yearly) มีระบบต่ออายุอัตโนมัติเมื่อสิ้นสุดรอบบิล เพื่อความต่อเนื่องในการใช้งาน</li>
                      <li>ผู้ใช้งานสามารถกดยกเลิกการต่ออายุอัตโนมัติ (Cancel Subscription) ได้ตลอดเวลาผ่านหน้า Stripe Customer Portal หรือหน้าการตั้งค่าโปรไฟล์</li>
                      <li>เมื่อทำการยกเลิก สิทธิประโยชน์ของสมาชิกระดับนั้นๆ จะยังคงมีผลใช้งานได้ตามปกติจนกระทั่งสิ้นสุดรอบบิลปัจจุบัน</li>
                    </ul>
                    <p style={{ margin: 0 }}>
                      <strong>๒.๔ นโยบายการขอคืนเงิน (Refund Policy):</strong> เนื่องจากระบบมีต้นทุนการจัดสรรทรัพยากรประมวลผลปัญญาประดิษฐ์ (AI GPU/LLM Inference Ingestion) แบบเรียลไทม์ <strong>รายการคำสั่งซื้อที่ได้รับการประมวลผล หรือมีการบริโภค GemCoins ไปแล้ว จะไม่สามารถขอคืนเงินได้ (Non-Refundable)</strong> ยกเว้นในกรณีข้อผิดพลาดทางเทคนิค เช่น ระบบตัดเงินซ้ำซ้อน ซึ่งผู้ใช้สามารถแจ้งหลักฐานเพื่อขอรับเงินคืนได้ภายใน ๗ วันทำการ
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════════
              หมวดที่ ๓: ความมั่นคงปลอดภัยสารสนเทศและการปกป้องข้อมูล (Information Security & Privacy)
              ══════════════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'privacy') && (
            <section
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '18px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, marginBottom: '10px', fontSize: '0.92rem' }}>
                <Lock size={18} strokeWidth={2.2} />
                <span>{isEn ? 'Section 3: Information Security & Privacy Policy' : 'หมวดที่ ๓: นโยบายความมั่นคงปลอดภัยสารสนเทศและการปกป้องข้อมูล (Information Security & Privacy Policy)'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-primary, #f1f5f9)' }}>
                {isEn ? (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>3.1 Privacy Compliance:</strong> Stored account information is limited to essential email addresses and display names managed securely via Firebase Auth and Supabase Auth. Sensitive personal data is never requested or retained.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>3.2 Client-Side Storage Architecture:</strong> Custom personal AI keys, watchlists, and portfolio preferences are stored and encrypted directly in your browser&apos;s local storage (Client-Side) rather than centralized database servers.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>3.3 Transport Security:</strong> All API communication is safeguarded with <strong>TLS 1.3 / HTTPS</strong> and shielded at the edge with Cloudflare Web Application Firewall (WAF) protection.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>3.4 Non-Disclosure Guarantee:</strong> We strictly prohibit selling, trading, or sharing user data or usage logs with third-party advertisers or data brokers.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>๓.๑ การคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance):</strong> ข้อมูลที่ระบบจัดเก็บมีเพียงอีเมลและชื่อแสดงผลพื้นฐานที่จำเป็นต่อการยืนยันสิทธิ์เข้าใช้งานผ่านบริการ Firebase Auth และ Supabase Auth โดยไม่มีการเก็บรวบรวมข้อมูลส่วนบุคคลที่มีความอ่อนไหว
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๓.๒ สถาปัตยกรรมการจัดเก็บข้อมูลระดับอุปกรณ์ (Client-Side Storage Architecture):</strong> คีย์ส่วนตัวสำหรับการเชื่อมต่อ AI (Personal API Key) พอร์ตการลงทุนจำลอง และรายชื่อหุ้นที่ติดตาม (Watchlist) จะถูกบันทึกและเข้ารหัสไว้บนหน่วยความจำของอุปกรณ์ผู้ใช้โดยตรง (Browser LocalStorage) โดยไม่มีการส่งไปจัดเก็บหรือดักจับบนเซิร์ฟเวอร์ส่วนกลาง
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๓.๓ การเข้ารหัสการรับส่งข้อมูล (End-to-End Transport Security):</strong> ข้อมูลการเรียกใช้งานทั้งหมดเชื่อมต่อผ่านช่องทางเครือข่ายความปลอดภัยสูงด้วยโปรโตคอล <strong>TLS 1.3 / HTTPS</strong> และเสริมความปลอดภัยระดับ Edge ด้วยโครงข่าย Cloudflare Web Application Firewall (WAF)
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๓.๔ นโยบายการไม่เปิดเผยข้อมูล (Non-Disclosure & Anti-Monetization):</strong> ผู้พัฒนายึดมั่นในจริยธรรมข้อมูลอย่างเคร่งครัด โดยไม่มีนโยบายการจำหน่าย แลกเปลี่ยน หรือส่งต่อประวัติการใช้งานและข้อมูลของสมาชิกให้แก่บริษัทโฆษณาหรือบุคคลภายนอกโดยเด็ดขาด
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════════
              หมวดที่ ๔: คำเตือนความเสี่ยงและข้อจำกัดความรับผิด (Risk Disclosure & Disclaimer)
              ══════════════════════════════════════════════════════════════ */}
          {(activeCategory === 'all' || activeCategory === 'disclaimer') && (
            <section
              style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '16px',
                padding: '18px 22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 800, marginBottom: '10px', fontSize: '0.92rem' }}>
                <AlertTriangle size={18} strokeWidth={2.2} />
                <span>{isEn ? 'Section 4: Risk Disclosure & Financial Disclaimer' : 'หมวดที่ ๔: คำเตือนความเสี่ยงและข้อจำกัดความรับผิดชอบทางการเงิน (Risk Disclosure & Financial Disclaimer)'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-primary, #f1f5f9)' }}>
                {isEn ? (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>4.1 Not Financial Advice:</strong> All quotes, financial metrics, chart indicators, and AI-generated summaries displayed across this platform are strictly for informational and research purposes. They do <strong>NOT constitute formal investment advice</strong>, buy/sell recommendations, or financial solicitations.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>4.2 AI Model Limitations:</strong> AI-generated analytics may occasionally experience context inaccuracies or model hallucinations. Users should independently verify data with primary official exchanges (SET, SEC, SEC Filings, Nasdaq) before executing trades.
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>4.3 Do Your Own Research (DYOR):</strong> Capital market investments carry inherent financial risks. Users acknowledge that all investment decisions are executed independently. The software maintainer bears no liability for financial losses or trading outcomes.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>๔.๑ มิใช่คำแนะนำทางการเงิน (Not Financial Advice):</strong> ข้อมูลราคา อัตราส่วนทางการเงิน กราฟสถิติ ดัชนีตลาด ข่าวสาร และบทวิเคราะห์เชิงสังเคราะห์ที่สร้างด้วยปัญญาประดิษฐ์ (AI-Generated Analytics) บนแพลตฟอร์มนี้ <strong>มิใช่คำแนะนำการลงทุน (Investment Advice)</strong> และมิใช่การชี้แนะหรือชักชวนให้เข้าซื้อ ขาย หรือถือครองหลักทรัพย์ สินทรัพย์ดิจิทัล หรือตราสารทางการเงินใดๆ
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๔.๒ ขีดจำกัดของแบบจำลองปัญญาประดิษฐ์ (AI Model Limitations):</strong> ข้อมูลที่ประมวลผลจาก AI อาจมีข้อจำกัดด้านความถูกต้อง ความครบถ้วนสมบูรณ์ หรือความคลาดเคลื่อนทางบริบท (AI Hallucination) ผู้ใช้งานพึงตระหนักและต้องทำการตรวจสอบเทียบเคียงกับแหล่งข้อมูลที่เป็นทางการของตลาดหลักทรัพย์แห่งประเทศไทย (SET) และตลาดหลักทรัพย์ต่างประเทศก่อนการดำเนินการใดๆ
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>๔.๓ หลักการตัดสินใจด้วยตนเอง (Do Your Own Research - DYOR):</strong> การลงทุนในตราสารทุนและหลักทรัพย์มีความเสี่ยงสูง ราคาอาจมีความผันผวนรุนแรงตามสภาวะเศรษฐกิจและการลงทุน ผู้ใช้บริการตกลงและยอมรับว่าการตัดสินใจลงทุนใดๆ เป็นการตัดสินใจโดยอิสระของผู้ใช้เอง ผู้พัฒนาซอฟต์แวร์ไม่ต้องรับผิดชอบต่อความสูญเสีย ความเสียหาย หรือผลขาดทุนใดๆ ทั้งสิ้น
                    </p>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Consent Footer ── */}
        <div
          style={{
            padding: '18px 26px',
            borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            background: 'var(--bg-secondary, #080d14)',
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
              color: 'var(--text-primary, #ffffff)',
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
                accentColor: 'var(--accent-blue, #007AFF)',
                cursor: 'pointer',
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
            <span>
              {isEn
                ? 'I have read, understood, and fully accept all terms of service, payment policies, data security guidelines, and risk disclaimers above.'
                : 'ข้าพเจ้าได้อ่าน ทำความเข้าใจ และยอมรับข้อกำหนดการให้บริการ นโยบายการชำระเงิน การปกป้องข้อมูล และคำเตือนความเสี่ยงทั้งหมดข้างต้นอย่างสมบูรณ์'}
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary, #64748b)' }}>
              🔒 {isEn ? 'Global Security Standards • TLS 1.3 • Stripe PCI-DSS Level 1' : 'มาตรฐานความปลอดภัยระดับสากล • เข้ารหัส TLS 1.3 • Stripe PCI-DSS Level 1'}
            </span>

            <button
              type="button"
              disabled={!hasAcknowledged}
              onClick={handleAccept}
              style={{
                background: hasAcknowledged
                  ? 'linear-gradient(135deg, #007AFF 0%, #0051B3 100%)'
                  : 'var(--card-sub-bg, rgba(255, 255, 255, 0.05))',
                color: hasAcknowledged ? '#ffffff' : 'var(--text-tertiary, #64748b)',
                border: hasAcknowledged ? 'none' : '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                borderRadius: '12px',
                padding: '11px 28px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: hasAcknowledged ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: hasAcknowledged ? '0 4px 18px rgba(0, 122, 255, 0.4)' : 'none',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isEn ? 'I Agree & Accept Terms' : 'เข้าใจและยินยอมรับเงื่อนไข'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsDisclaimerModal;
