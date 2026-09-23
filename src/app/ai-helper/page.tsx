import { Metadata } from 'next';
import Link from 'next/link';
import { Send, Sparkles, ShieldCheck, Zap, TrendingUp, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Telegram Bot ศูนย์สรุปข่าวและราคาทองคำ | StockHomeTH',
  description:
    'รับสรุปข่าวสารการลงทุน หุ้นไทย หุ้นสหรัฐฯ และราคาทองคำแท่ง Realtime วันละ 2 รอบ ฟรี 100% ผ่าน Telegram Bot @StockHomeTHBot',
};

export default function AiHelperPage() {
  return (
    <main
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px 80px',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          borderRadius: '28px',
          padding: '36px 28px',
          textAlign: 'center',
          background: 'var(--card-bg)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow backdrop blob */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Telegram Hero Icon Badge */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #0ea5e9 100%)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(14, 165, 233, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Send size={38} style={{ marginLeft: '-4px' }} />
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '100px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800, fontSize: '0.82rem', marginBottom: '16px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          <Sparkles size={14} /> ยกระดับสู่ Telegram Market Engine ฟรี 100%
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px', lineHeight: 1.3 }}>
          รับสรุปข่าวหุ้น & ราคาทองคำแท่งสด<br />
          <span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ตรงถึงมือถือของคุณผ่าน Telegram Bot
          </span>
        </h1>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 28px' }}>
          เพื่อความรวดเร็ว แม่นยำ และประหยัดค่าใช้จ่ายของสมาชิก เราได้รวมพลัง AI และระบบบรอดแคสต์ส่งตรงผ่าน Telegram วันละ 2 รอบ (08:00 และ 18:00 น.) <b>ฟรีตลอดชีพ 0 บาท ไม่ต้องเติมเหรียญ</b>
        </p>

        {/* 4 Feature Highlights Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', textAlign: 'left', marginBottom: '32px' }}>
          <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
              <Zap size={16} /> สรุปข่าว 2 รอบ/วัน
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              รอบเช้า 08:00 น. เตรียมพร้อมก่อนตลาดเปิด และรอบเย็น 18:00 น. สรุปภาพรวมหลังปิดตลาด
            </div>
          </div>

          <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
              <Award size={16} /> เช็คราคาทองคำ Realtime
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              พิมพ์คำสั่ง <code>/gold</code> เพื่อตรวจราคาทองคำแท่ง 96.5% และทองรูปพรรณจากสมาคมค้าทองคำ
            </div>
          </div>

          <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
              <TrendingUp size={16} /> สัญญาณหุ้นเด่น & ดัชนี
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              พิมพ์ <code>/stock</code> เช็คดัชนี SET, S&P 500, NASDAQ, Dow Jones และ Bitcoin
            </div>
          </div>

          <div style={{ background: 'var(--card-sub-bg)', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
              <ShieldCheck size={16} /> โควตาฟรี 100% (0 บาท)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              ใช้งานได้ไม่จำกัดจำนวนครั้ง ไม่ติดค่า Token ไม่ต้องสมัครบัตรเครดิต
            </div>
          </div>
        </div>

        {/* Big Action CTA Button */}
        <a
          href="https://t.me/StockHomeTHBot"
          target="_blank"
          rel="noopener noreferrer"
          className="ios-tappable"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            maxWidth: '420px',
            padding: '16px 24px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0284c7 30%, #0369a1 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.05rem',
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(2, 132, 199, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            marginBottom: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={20} />
          <span>เริ่มใช้งาน @StockHomeTHBot (ฟรี)</span>
          <ArrowRight size={18} />
        </a>

        {/* Back Link */}
        <div>
          <Link
            href="/"
            style={{
              color: 'var(--text-tertiary)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← กลับสู่หน้าสรุปข่าวบนเว็บไซต์
          </Link>
        </div>
      </div>
    </main>
  );
}
