'use client';

import React from 'react';
import type { StockNewsItem } from '../../lib/schemas/newsSchema';
import { useLanguage } from '../../lib/context/LanguageContext';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { X, Bookmark, Share2, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Target, Newspaper, Compass, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';

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
  const { t, tDynamic, tDynamicList, language } = useLanguage();
  const { getStockByTicker, focusStock } = useMarketSync();

  if (!item) return null;

  const isEn = language === 'en';
  const resolvedTitle = isEn
    ? (item.title_en || tDynamic(item.title_th, item.title_en))
    : (item.title_th || tDynamic(item.title_th, item.title_en));

  const resolvedSummary = isEn
    ? (item.summary_en || tDynamic(item.summary_th, item.summary_en))
    : (item.summary_th || tDynamic(item.summary_th, item.summary_en));

  const resolvedTakeaways = isEn && item.keyTakeaways_en && item.keyTakeaways_en.length > 0
    ? item.keyTakeaways_en
    : (!isEn && item.keyTakeaways_th && item.keyTakeaways_th.length > 0)
    ? item.keyTakeaways_th
    : item.keyTakeaways.map((takeaway) => tDynamic(takeaway));

  const resolvedPeriodLabel = isEn
    ? (item.periodLabel_en || tDynamic(item.periodLabel_th, item.periodLabel_en))
    : (item.periodLabel_th || tDynamic(item.periodLabel_th, item.periodLabel_en));

  const handleShare = () => {
    const title = resolvedTitle;
    const summary = resolvedSummary;
    if (navigator.share) {
      navigator
        .share({
          title,
          text: summary,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${title}\n\n${summary}`);
      alert(language === 'en' ? 'News summary copied to clipboard!' : 'คัดลอกข้อความสรุปข่าวไปยังคลิปบอร์ดแล้ว!');
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{resolvedPeriodLabel}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              title={language === 'en' ? 'Share summary' : 'แชร์สรุปข่าว'}
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
              title={item.isBookmarked ? (language === 'en' ? 'Remove bookmark' : 'ลบออกจากรายการบันทึก') : (language === 'en' ? 'Bookmark article' : 'บันทึกข่าว')}
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
              title={language === 'en' ? 'Close' : 'ปิดหน้าต่าง'}
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

        {/* Sentiment & Status */}
        <div style={{ marginBottom: '16px' }}>{getSentimentBadge()}</div>

        {/* Title */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.35, color: 'var(--text-primary)', marginBottom: '16px' }}>
          {resolvedTitle}
        </h2>

        {/* Executive Summary */}
        <div style={{ background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={14} /> {language === 'en' ? 'Executive Summary' : 'สาระสำคัญโดยย่อ (Executive Summary)'}
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
            {resolvedSummary}
          </p>
        </div>

        {/* Key Takeaways */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            {t('keyTakeaways')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resolvedTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'var(--card-sub-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--card-sub-border)',
                }}
              >
                <span style={{ color: 'var(--accent-blue)', fontWeight: 800, fontSize: '0.85rem' }}>{idx + 1}.</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Analysis */}
        {item.impactAnalysis && (
          <div
            style={{
              background: 'var(--card-sub-bg)',
              border: '1px solid var(--card-sub-border)',
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
              {(item.impactAnalysis.targetSector_en || item.impactAnalysis.targetSector_th || item.impactAnalysis.targetSector) && (
                <div style={{ background: 'var(--card-sub-bg)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{t('targetSector')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isEn
                      ? (item.impactAnalysis.targetSector_en || tDynamic(item.impactAnalysis.targetSector_th, item.impactAnalysis.targetSector_en))
                      : (item.impactAnalysis.targetSector_th || tDynamic(item.impactAnalysis.targetSector_th, item.impactAnalysis.targetSector_en))}
                  </div>
                </div>
              )}

              {(item.impactAnalysis.priceTrendOutlook_en || item.impactAnalysis.priceTrendOutlook_th || item.impactAnalysis.priceTrendOutlook) && (
                <div style={{ background: 'var(--card-sub-bg)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--card-sub-border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{t('trendOutlook')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-bullish)' }}>
                    {isEn
                      ? (item.impactAnalysis.priceTrendOutlook_en || tDynamic(item.impactAnalysis.priceTrendOutlook_th, item.impactAnalysis.priceTrendOutlook_en))
                      : (item.impactAnalysis.priceTrendOutlook_th || tDynamic(item.impactAnalysis.priceTrendOutlook_th, item.impactAnalysis.priceTrendOutlook_en))}
                  </div>
                </div>
              )}
            </div>

            {(item.impactAnalysis.bullishReason_en || item.impactAnalysis.bullishReason_th || item.impactAnalysis.bullishReason) && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-bullish)' }}>
                <TrendingUp size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>{t('bullishFactors')}:</strong>{' '}
                  {isEn
                    ? (item.impactAnalysis.bullishReason_en || tDynamic(item.impactAnalysis.bullishReason_th, item.impactAnalysis.bullishReason_en))
                    : (item.impactAnalysis.bullishReason_th || tDynamic(item.impactAnalysis.bullishReason_th, item.impactAnalysis.bullishReason_en))}
                </span>
              </div>
            )}

            {(item.impactAnalysis.bearishReason_en || item.impactAnalysis.bearishReason_th || item.impactAnalysis.bearishReason) && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-bearish)' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>{t('bearishFactors')}:</strong>{' '}
                  {isEn
                    ? (item.impactAnalysis.bearishReason_en || tDynamic(item.impactAnalysis.bearishReason_th, item.impactAnalysis.bearishReason_en))
                    : (item.impactAnalysis.bearishReason_th || tDynamic(item.impactAnalysis.bearishReason_th, item.impactAnalysis.bearishReason_en))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Real Source Hyperlink Button */}
        {(item.link || item.sourceUrl) && (
          <div style={{ marginBottom: '24px' }}>
            <a
              href={item.link || item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 20px',
                borderRadius: '14px',
                background: 'var(--accent-blue)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.92rem',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={18} />
              <span>{language === 'en' ? `Read full original article at ${item.source}` : `อ่านข่าวฉบับเต็มจากแหล่งที่มาต้นฉบับ (${item.source})`}</span>
            </a>
          </div>
        )}

        {/* Source & Tickers Footer with Live Linking */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{t('source')}:</span>
            {(item.link || item.sourceUrl) ? (
              <a
                href={item.link || item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-blue)', textDecoration: 'underline', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                {item.source}
                <ExternalLink size={11} />
              </a>
            ) : (
              <strong>{item.source}</strong>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t('relatedTickers')}:</span>
            {item.tickers.map((symbol) => {
              const stock = getStockByTicker(symbol);
              if (stock) {
                const isUp = stock.change >= 0;
                return (
                  <button
                    key={symbol}
                    onClick={() => {
                      onClose();
                      focusStock(symbol);
                    }}
                    title={`เปิดดูข้อมูลราคาและกราฟสด ${stock.name} (${stock.ticker})`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: isUp ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                      border: `1px solid ${isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                      color: isUp ? '#00E676' : '#FF3B30',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>${stock.ticker}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                      {stock.currency === 'THB' ? '฿' : '$'}{stock.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.7rem' }}>
                      ({isUp ? '+' : ''}{stock.change.toFixed(1)}%)
                    </span>
                  </button>
                );
              }
              return (
                <span
                  key={symbol}
                  className="ticker-pill"
                  onClick={() => {
                    onClose();
                    focusStock(symbol);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  ${symbol}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
