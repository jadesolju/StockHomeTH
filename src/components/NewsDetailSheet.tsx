import React from 'react';
import type { StockNewsItem } from '../types/stockNews';
import { X, Bookmark, Share2, TrendingUp, AlertTriangle, ShieldCheck, Target, Newspaper, Compass } from 'lucide-react';

interface NewsDetailSheetProps {
  item: StockNewsItem | null;
  onClose: () => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}

export const NewsDetailSheet: React.FC<NewsDetailSheetProps> = ({
  item,
  onClose,
  onToggleBookmark,
}) => {
  if (!item) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${item.title}\n${item.summary}`);
      alert('คัดลอกข้อความสรุปข่าวไปยังคลิปบอร์ดแล้ว!');
    }
  };

  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <div className="ios-sheet-content" onClick={(e) => e.stopPropagation()}>
        
        {/* iOS Handle Pill Bar */}
        <div style={{ width: '40px', height: '4px', background: 'rgba(255, 255, 255, 0.3)', borderRadius: '100px', margin: '0 auto 20px auto' }} />

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '100px',
              background: item.region === 'thai' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              color: item.region === 'thai' ? '#007AFF' : '#8B5CF6',
              fontWeight: 600
            }}>
              {item.marketName}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {item.periodLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title="แชร์สรุปข่าว"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={16} />
            </button>

            <button
              onClick={(e) => onToggleBookmark(item.id, e)}
              title="เซฟข่าว"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: item.isBookmarked ? '#FFCC00' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bookmark size={16} fill={item.isBookmarked ? '#FFCC00' : 'none'} />
            </button>

            <button
              onClick={onClose}
              title="ปิด"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '14px', color: 'var(--text-primary)' }}>
          {item.title}
        </h2>

        {/* Key Takeaways Box */}
        <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px 18px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} /> สรุปสาระสำคัญ (Key Takeaways):
          </div>
          <div className="takeaway-list">
            {item.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className="takeaway-item" style={{ fontSize: '0.9rem' }}>
                <div className="takeaway-bullet" style={{ marginTop: '8px' }} />
                <span style={{ color: 'var(--text-primary)' }}>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Impact Analysis Box */}
        <div style={{ background: 'var(--glass-bg)', padding: '18px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--glass-border-glow)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="var(--accent-blue)" /> วิเคราะห์ผลกระทบต่อราคาหุ้น (AI Impact Analysis):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {item.impactAnalysis.bullishReason && (
              <div style={{ background: 'var(--accent-bullish-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent-bullish-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-bullish)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> ปัจจัยบวก (Bullish Catalysts)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {item.impactAnalysis.bullishReason}
                </div>
              </div>
            )}

            {item.impactAnalysis.bearishReason && (
              <div style={{ background: 'var(--accent-bearish-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent-bearish-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-bearish)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> ปัจจัยเสี่ยง (Bearish Risks)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {item.impactAnalysis.bearishReason}
                </div>
              </div>
            )}
          </div>

          {item.impactAnalysis.priceTrendOutlook && (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} color="var(--accent-blue)" />
              <span><strong>แนวโน้มราคา:</strong> {item.impactAnalysis.priceTrendOutlook}</span>
            </div>
          )}
        </div>

        {/* Full Article Text */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Newspaper size={16} /> เนื้อหาข่าวฉบับเต็ม
          </h3>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {item.fullContent}
          </div>
        </div>

        {/* Source & Tickers Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            ที่มาข้อมูล: {item.source}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {item.tickers.map((sym) => (
              <span key={sym} className="ticker-pill">
                ${sym}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
