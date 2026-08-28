import React from 'react';
import type { DailyWeeklyDigestSummary } from '../types/stockNews';
import { Zap, CheckCircle2 } from 'lucide-react';

interface DigestHeaderBannerProps {
  summary: DailyWeeklyDigestSummary;
}

export const DigestHeaderBanner: React.FC<DigestHeaderBannerProps> = ({ summary }) => {
  const { bullishPercent, neutralPercent, bearishPercent } = summary.marketSentimentScore;

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', borderLeft: '4px solid var(--accent-blue)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            EXECUTIVE RECAP • {summary.periodLabel}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          อัปเดตล่าสุด: {summary.updatedAt}
        </span>
      </div>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '12px', color: 'var(--text-primary)' }}>
        {summary.mainHeadline}
      </h2>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
        {summary.overviewSummary}
      </p>

      {/* Grid of Sentiment & Key Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        
        {/* Sentiment Gauge Bar */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            สภาวะอารมณ์ตลาด (Market Sentiment AI)
          </div>
          <div style={{ display: 'flex', height: '10px', borderRadius: '100px', overflow: 'hidden', gap: '2px', marginBottom: '8px' }}>
            <div style={{ width: `${bullishPercent}%`, background: 'var(--accent-bullish)' }} title={`Bullish ${bullishPercent}%`} />
            <div style={{ width: `${neutralPercent}%`, background: 'var(--accent-neutral)' }} title={`Neutral ${neutralPercent}%`} />
            <div style={{ width: `${bearishPercent}%`, background: 'var(--accent-bearish)' }} title={`Bearish ${bearishPercent}%`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--accent-bullish)' }}>🟢 บวก {bullishPercent}%</span>
            <span style={{ color: 'var(--accent-neutral)' }}>⚪ ปานกลาง {neutralPercent}%</span>
            <span style={{ color: 'var(--accent-bearish)' }}>🔴 ลบ {bearishPercent}%</span>
          </div>
        </div>

        {/* Key Catalysts List */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '8px' }}>
            ปัจจัยขับเคลื่อนสำคัญ (Key Catalysts)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {summary.keyCatalysts.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={13} color="var(--accent-blue)" flex-shrink={0} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
