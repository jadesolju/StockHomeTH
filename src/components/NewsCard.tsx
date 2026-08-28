import React from 'react';
import type { StockNewsItem } from '../types/stockNews';
import { Volume2, Bookmark, ChevronRight, Star } from 'lucide-react';

interface NewsCardProps {
  item: StockNewsItem;
  onSelectNews: (item: StockNewsItem) => void;
  onPlayAudio: (item: StockNewsItem) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  isPlayingThisAudio?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  onSelectNews,
  onPlayAudio,
  onToggleBookmark,
  isPlayingThisAudio,
}) => {
  const getSentimentBadge = () => {
    switch (item.sentiment) {
      case 'bullish':
        return <span className="badge-sentiment badge-bullish">🟢 Bullish (บวก)</span>;
      case 'bearish':
        return <span className="badge-sentiment badge-bearish">🔴 Bearish (ลบ)</span>;
      default:
        return <span className="badge-sentiment badge-neutral">⚪ Neutral (ปานกลาง)</span>;
    }
  };

  return (
    <div
      className="glass-card"
      onClick={() => onSelectNews(item)}
      style={{
        padding: '20px',
        marginBottom: '16px',
        cursor: 'pointer',
        border: item.isFeatured ? '1px solid rgba(0, 122, 255, 0.4)' : undefined,
      }}
    >
      {/* Top Meta Line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {item.isFeatured && (
            <span style={{ background: 'rgba(255, 204, 0, 0.2)', color: '#FFCC00', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Star size={11} fill="#FFCC00" /> ข่าวเด่น
            </span>
          )}

          <span style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '100px',
            background: item.region === 'thai' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
            color: item.region === 'thai' ? '#007AFF' : '#8B5CF6',
            fontWeight: 600
          }}>
            {item.marketName}
          </span>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {item.periodLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getSentimentBadge()}

          <button
            onClick={(e) => onToggleBookmark(item.id, e)}
            title={item.isBookmarked ? 'ยกเลิกการเซฟ' : 'เซฟข่าว'}
            style={{
              background: 'transparent',
              border: 'none',
              color: item.isBookmarked ? '#FFCC00' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Bookmark size={17} fill={item.isBookmarked ? '#FFCC00' : 'none'} />
          </button>
        </div>

      </div>

      {/* Main Title */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px', color: 'var(--text-primary)' }}>
        {item.title}
      </h3>

      {/* Short Summary */}
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
        {item.summary}
      </p>

      {/* Key Takeaways Box */}
      <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '12px 14px', borderRadius: '12px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.03em', marginBottom: '4px' }}>
          💡 KEY TAKEAWAYS (ประเด็นสำคัญ):
        </div>
        <div className="takeaway-list">
          {item.keyTakeaways.slice(0, 3).map((takeaway, idx) => (
            <div key={idx} className="takeaway-item">
              <div className="takeaway-bullet" />
              <span>{takeaway}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Line: Stock Tickers & Audio Recap Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        
        {/* Tickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>หุ้นเกี่ยวข้อง:</span>
          {item.tickers.map((symbol) => (
            <span key={symbol} className="ticker-pill">
              ${symbol}
            </span>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayAudio(item);
            }}
            style={{
              background: isPlayingThisAudio ? 'var(--accent-blue)' : 'rgba(0, 122, 255, 0.12)',
              color: isPlayingThisAudio ? '#ffffff' : 'var(--accent-blue)',
              border: '1px solid rgba(0, 122, 255, 0.3)',
              borderRadius: '100px',
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease',
            }}
          >
            <Volume2 size={13} className={isPlayingThisAudio ? 'spin-anim' : ''} />
            <span>{isPlayingThisAudio ? 'กำลังเล่น...' : `ฟังเสียง (${item.audioDuration})`}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
            <span>อ่านต่อ</span>
            <ChevronRight size={16} />
          </div>

        </div>

      </div>

    </div>
  );
};
