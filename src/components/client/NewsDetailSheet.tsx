'use client';

import React from 'react';
import type { StockNewsItem } from '../../lib/schemas/newsSchema';
import { useLanguage } from '../../lib/context/LanguageContext';
import { X, Bookmark, Share2, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Target, Newspaper, Compass } from 'lucide-react';

interface NewsDetailSheetProps {
  item: StockNewsItem | null;
  onClose: () => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
}

export function NewsDetailSheet({
  item,
  onClose,
  onToggleBookmark,
}: NewsDetailSheetProps) {
  const { t } = useLanguage();

  if (!item) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: item.summary,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${item.title}\n\n${item.summary}`);
      alert('คัดลอกข้อความสรุปข่าวไปยังคลิปบอร์ดแล้ว!');
    }
  };

  const getSentimentBadge = () => {
    switch (item.sentiment) {
      case 'bullish':
        return (
          <span className="badge-sentiment badge-bullish">
            <TrendingUp size={13} /> {t('sentimentBullish')}
          </span>
        );
      case 'bearish':
        return (
          <span className="badge-sentiment badge-bearish">
            <TrendingDown size={13} /> {t('sentimentBearish')}
          </span>
        );
      default:
        return (
          <span className="badge-sentiment badge-neutral">
            <Minus size={13} /> {t('sentimentNeutral')}
          </span>
        );
    }
  };

  return (
    <div className="ios-sheet-overlay" onClick={onClose}>
      <div className="ios-sheet-content" onClick={(e) => e.stopPropagation()}>
        {/* iOS Handle Pill Bar */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '100px',
            margin: '0 auto 20px auto',
          }}
        />

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '100px',
                background: item.region === 'thai' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                color: item.region === 'thai' ? '#007AFF' : '#8B5CF6',
                fontWeight: 600,
              }}
            >
              {item.marketName}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.periodLabel}</span>
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

        {/* Sentiment & Date Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          {getSentimentBadge()}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            {item.date} {item.time && `• ${item.time}`} • {item.readTime}
          </span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '16px', color: 'var(--text-primary)' }}>
          {item.title}
        </h2>

        {/* Key Takeaways Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '16px',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={15} /> {t('keyTakeaways')}
          </div>
          <div className="takeaway-list" style={{ gap: '10px' }}>
            {item.keyTakeaways.map((takeaway, idx) => (
              <div key={idx} className="takeaway-item" style={{ alignItems: 'flex-start' }}>
                <div className="takeaway-bullet" style={{ marginTop: '6px' }} />
                <span style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Detailed Content */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Newspaper size={16} /> {t('readMore')}
          </h4>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
            {item.fullContent}
          </p>
        </div>

        {/* Institutional Impact Analysis Box */}
        {item.impactAnalysis && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(139, 92, 246, 0.05))',
              border: '1px solid rgba(0, 122, 255, 0.2)',
              padding: '18px',
              borderRadius: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={18} color="var(--accent-blue)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t('impactAnalysis')}
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {item.impactAnalysis.targetSector && (
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{t('targetSector')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.impactAnalysis.targetSector}</div>
                </div>
              )}

              {item.impactAnalysis.priceTrendOutlook && (
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{t('trendOutlook')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-bullish)' }}>{item.impactAnalysis.priceTrendOutlook}</div>
                </div>
              )}
            </div>

            {item.impactAnalysis.bullishReason && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-bullish)' }}>
                <TrendingUp size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>{t('bullishFactors')}:</strong> {item.impactAnalysis.bullishReason}</span>
              </div>
            )}

            {item.impactAnalysis.bearishReason && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-bearish)' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>{t('bearishFactors')}:</strong> {item.impactAnalysis.bearishReason}</span>
              </div>
            )}
          </div>
        )}

        {/* Source & Tickers Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {t('source')}: <strong>{item.source}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('relatedTickers')}:</span>
            {item.tickers.map((t) => (
              <span key={t} className="ticker-pill">
                ${t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
