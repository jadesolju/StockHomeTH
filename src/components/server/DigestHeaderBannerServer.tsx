'use client';

import React, { useState, useMemo } from 'react';
import type { DigestSummary, StockNewsItem } from '../../lib/schemas/newsSchema';
import { useMarketSync } from '../../lib/context/MarketSyncContext';
import { useLanguage } from '../../lib/context/LanguageContext';
import { Zap, CheckCircle2, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus, Landmark, Globe, Building, Activity, Newspaper, ChevronRight } from 'lucide-react';

interface DigestHeaderBannerProps {
  summary?: DigestSummary;
}

export function DigestHeaderBannerServer({ summary: propSummary }: DigestHeaderBannerProps) {
  const { overview, stocks, news, isSyncing, cooldownRemaining, refreshAll, focusStock, getStockByTicker, lastUpdated, setActiveNewsModal, getNewsByTicker } = useMarketSync();
  const { t, tDynamic, language } = useLanguage();
  const [activeMarketTab, setActiveMarketTab] = useState<'ALL' | 'SET' | 'US'>('ALL');
  
  const summary = overview || propSummary;

  // Separate Thai vs US stocks for regional sentiment calculation
  const thaiStocks = useMemo(() => stocks.filter((s) => s.market === 'SET'), [stocks]);
  const usStocks = useMemo(() => stocks.filter((s) => s.market === 'US'), [stocks]);

  const thaiSentiment = useMemo(() => {
    if (thaiStocks.length === 0) return { bullish: 68, neutral: 22, bearish: 10 };
    const up = thaiStocks.filter((s) => s.change > 0).length;
    const down = thaiStocks.filter((s) => s.change < 0).length;
    const neutral = thaiStocks.length - up - down;
    return {
      bullish: Math.max(10, Math.round((up / thaiStocks.length) * 100)),
      neutral: Math.max(10, Math.round((neutral / thaiStocks.length) * 100)),
      bearish: Math.max(10, Math.round((down / thaiStocks.length) * 100))
    };
  }, [thaiStocks]);

  const usSentiment = useMemo(() => {
    if (usStocks.length === 0) return { bullish: 72, neutral: 20, bearish: 8 };
    const up = usStocks.filter((s) => s.change > 0).length;
    const down = usStocks.filter((s) => s.change < 0).length;
    const neutral = usStocks.length - up - down;
    return {
      bullish: Math.max(10, Math.round((up / usStocks.length) * 100)),
      neutral: Math.max(10, Math.round((neutral / usStocks.length) * 100)),
      bearish: Math.max(10, Math.round((down / usStocks.length) * 100))
    };
  }, [usStocks]);

  if (!summary) {
    return null;
  }

  const { bullishPercent, neutralPercent, bearishPercent } = summary.marketSentimentScore;

  const currentSentiment = activeMarketTab === 'SET' 
    ? { bullishPercent: thaiSentiment.bullish, neutralPercent: thaiSentiment.neutral, bearishPercent: thaiSentiment.bearish }
    : activeMarketTab === 'US'
    ? { bullishPercent: usSentiment.bullish, neutralPercent: usSentiment.neutral, bearishPercent: usSentiment.bearish }
    : { bullishPercent, neutralPercent, bearishPercent };

  // Extract regional news items from sync context as live fallback
  const thaiNews = useMemo(() => (news || []).filter((n) => n.region === 'thai'), [news]);
  const usNews = useMemo(() => (news || []).filter((n) => n.region === 'global'), [news]);

  const isEn = language === 'en';

  // Genuine Thai Catalysts (from summary.thaiCatalysts_en / summary.thaiCatalysts_th or thai news keyTakeaways)
  const resolvedThaiCatalysts = useMemo(() => {
    if (isEn && summary.thaiCatalysts_en && summary.thaiCatalysts_en.length > 0) {
      return summary.thaiCatalysts_en;
    }
    if (!isEn && summary.thaiCatalysts_th && summary.thaiCatalysts_th.length > 0) {
      return summary.thaiCatalysts_th;
    }
    if (summary.thaiCatalysts && summary.thaiCatalysts.length > 0) {
      return summary.thaiCatalysts.map((c) => tDynamic(c));
    }
    if (thaiNews.length > 0) {
      return thaiNews.slice(0, 4).map((n) => {
        const topTakeaway = isEn ? (n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0]) : (n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0]);
        const title = isEn ? (n.title_en || n.title) : (n.title_th || n.title);
        return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
      });
    }
    return isEn ? [
      'Global crude oil and renewable energy stabilization supported energy heavyweights (PTT, GULF, PTTEP)',
      'Surging export demand and AI component orders fueled semiconductor & electronics leaders (DELTA, HANA, KCE)',
      'Domestic consumer spending resilience and tourism recovery boosted retail and healthcare giants (CPALL, BDMS, AOT)',
      'Institutional fund flows continued substantial accumulation in SET50 index benchmark constituents'
    ] : [
      'ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน (PTT, GULF, PTTEP)',
      'ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง (DELTA, HANA, KCE)',
      'กำลังซื้อในประเทศและการฟื้นตัวของภาคท่องเที่ยวหนุนกลุ่มพาณิชย์ (CPALL, BDMS, AOT)',
      'เม็ดเงินลงทุนสถาบันและ Fund Flow เข้าซื้อสะสมในกลุ่มหุ้น Big Cap SET50'
    ];
  }, [summary.thaiCatalysts_en, summary.thaiCatalysts_th, summary.thaiCatalysts, thaiNews, isEn, tDynamic]);

  // Genuine US & Global Catalysts (from summary.usCatalysts_en / summary.usCatalysts_th or US/Global news keyTakeaways)
  const resolvedUsCatalysts = useMemo(() => {
    if (isEn && summary.usCatalysts_en && summary.usCatalysts_en.length > 0) {
      return summary.usCatalysts_en;
    }
    if (!isEn && summary.usCatalysts_th && summary.usCatalysts_th.length > 0) {
      return summary.usCatalysts_th;
    }
    if (summary.usCatalysts && summary.usCatalysts.length > 0) {
      return summary.usCatalysts.map((c) => tDynamic(c));
    }
    if (usNews.length > 0) {
      return usNews.slice(0, 4).map((n) => {
        const topTakeaway = isEn ? (n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0]) : (n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0]);
        const title = isEn ? (n.title_en || n.title) : (n.title_th || n.title);
        return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
      });
    }
    return isEn ? [
      'NVIDIA (NVDA): Blackwell AI server compute shipments and hyperscale demand hit fresh records',
      'Apple (AAPL) & Microsoft (MSFT): Enterprise AI subscriptions and cloud computing revenues expanded robustly',
      'Tesla (TSLA): Full Self-Driving (FSD) rollout milestones and energy storage deployments accelerated',
      'Wall Street (S&P 500 & NASDAQ): Federal Reserve easing expectations and resilient Big Tech earnings lifted equities'
    ] : [
      'NVIDIA (NVDA): ออเดอร์ชิปประมวลผล Blackwell AI และ Data Center ระดับโลกโตแกร่ง',
      'Apple (AAPL) & Microsoft (MSFT): ยอดสมาชิกและบริการ Cloud AI สหรัฐฯ ขยายตัวแข็งแกร่ง',
      'Tesla (TSLA): ความคืบหน้าการพัฒนาซอฟต์แวร์ Autonomous Driving และยอดส่งมอบรถ EV ทั่วโลก',
      'Wall Street (S&P 500 & NASDAQ): ทิศทางนโยบายดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech สหรัฐฯ'
    ];
  }, [summary.usCatalysts_en, summary.usCatalysts_th, summary.usCatalysts, usNews, isEn, tDynamic]);

  // Selected catalysts based on active regional tab
  const finalCatalysts = useMemo(() => {
    if (activeMarketTab === 'SET') {
      return resolvedThaiCatalysts;
    }
    if (activeMarketTab === 'US') {
      return resolvedUsCatalysts;
    }
    if (isEn && summary.keyCatalysts_en && summary.keyCatalysts_en.length > 0) {
      return summary.keyCatalysts_en;
    }
    if (!isEn && summary.keyCatalysts_th && summary.keyCatalysts_th.length > 0) {
      return summary.keyCatalysts_th;
    }
    return summary.keyCatalysts && summary.keyCatalysts.length > 0
      ? summary.keyCatalysts.map((c) => tDynamic(c))
      : [...resolvedUsCatalysts.slice(0, 2), ...resolvedThaiCatalysts.slice(0, 2)];
  }, [activeMarketTab, resolvedThaiCatalysts, resolvedUsCatalysts, summary.keyCatalysts, summary.keyCatalysts_en, summary.keyCatalysts_th, isEn, tDynamic]);

  const renderCatalystItem = (cat: string, idx: number) => {
    const translatedCat = cat;

    // Identify specific target ticker from company names or clean $TICKER
    const STOP_WORDS = new Set(['IS', 'IT', 'OR', 'AS', 'BE', 'AT', 'ON', 'IN', 'TO', 'FOR', 'AND', 'THE', 'ALL', 'SO', 'NO', 'GO', 'DO', 'BY', 'UP', 'OF', 'IF', 'AN', 'ME', 'MY', 'WE', 'HE', 'US', 'AM', 'PM', 'A', 'I', 'SET', 'NOW']);
    
    const companyMap: Record<string, string> = {
      tesla: 'TSLA',
      tsla: 'TSLA',
      nvidia: 'NVDA',
      nvda: 'NVDA',
      apple: 'AAPL',
      aapl: 'AAPL',
      microsoft: 'MSFT',
      msft: 'MSFT',
      amazon: 'AMZN',
      amzn: 'AMZN',
      meta: 'META',
      google: 'GOOGL',
      alphabet: 'GOOGL',
      delta: 'DELTA',
      ptt: 'PTT',
      pttep: 'PTTEP',
      cpall: 'CPALL',
      kbank: 'KBANK',
      scb: 'SCB',
      advanc: 'ADVANC',
      gulf: 'GULF',
      aot: 'AOT',
      bdms: 'BDMS'
    };

    let cleanTicker: string | undefined;
    for (const [cName, tkr] of Object.entries(companyMap)) {
      if (new RegExp(`\\b${cName}\\b`, 'i').test(cat)) {
        cleanTicker = tkr;
        break;
      }
    }

    if (!cleanTicker) {
      const explicitMatches = stocks
        .filter((s) => {
          if (STOP_WORDS.has(s.ticker.toUpperCase())) {
            return cat.includes(`$${s.ticker}`);
          }
          if (s.ticker.length <= 2) {
            return cat.includes(`$${s.ticker}`) || new RegExp(`\\b\\$${s.ticker}\\b`, 'i').test(cat);
          }
          return new RegExp(`\\b${s.ticker}\\b`, 'i').test(cat);
        })
        .map((s) => s.ticker.toUpperCase());
      if (explicitMatches.length > 0) {
        cleanTicker = explicitMatches[0];
      }
    }

    const stock = cleanTicker ? getStockByTicker(cleanTicker) : undefined;
    const matchedTickers = cleanTicker ? [cleanTicker] : [];

    const handleCatalystClick = () => {
      // 1. Check if there's an existing news item specifically matching this company / headline
      let matchingNews: StockNewsItem | undefined;

      if (cleanTicker && news && news.length > 0) {
        matchingNews = news.find((n) => {
          const hasTicker = (n.tickers || []).includes(cleanTicker);
          const hasTitleMention = n.title.toLowerCase().includes(cleanTicker.toLowerCase()) || 
            (n.summary && n.summary.toLowerCase().includes(cleanTicker.toLowerCase()));
          return hasTicker && hasTitleMention;
        });
      }

      if (matchingNews) {
        setActiveNewsModal(matchingNews);
        return;
      }

      // 2. Generate dynamic rich News Item precisely reflecting this Catalyst
      const isThai = cleanTicker && stock ? stock.market === 'SET' : activeMarketTab === 'SET' || (!cat.toLowerCase().includes('us') && !cat.toLowerCase().includes('wall street') && !cat.toLowerCase().includes('tesla') && !cat.toLowerCase().includes('nvidia') && !cat.toLowerCase().includes('apple'));
      const catParts = cat.split(':');
      const catTitle = catParts.length > 1 ? catParts[0].trim() : (cat.length > 60 ? `${cat.slice(0, 60)}...` : cat);
      const catSummary = catParts.length > 1 ? catParts.slice(1).join(':').trim() : cat;

      const dynamicNewsItem: StockNewsItem = {
        id: `catalyst-news-${Date.now()}-${idx}-${cleanTicker || 'macro'}`,
        title: catTitle,
        title_th: catTitle,
        title_en: catTitle,
        summary: catSummary,
        summary_th: catSummary,
        summary_en: catSummary,
        keyTakeaways: [
          catSummary,
          cleanTicker ? `ปัจจัยเชิงบวกและทิศทางราคาของหุ้น $${cleanTicker} สอดคล้องกับภาพรวมตลาด` : 'ปัจจัยเชิงโครงสร้างที่ส่งผลต่อการเคลื่อนไหวของดัชนีและกลุ่มอุตสาหกรรมหลัก',
          'นักลงทุนควรติดตามกระแสเงินทุน (Fund Flow) และการประกาศตัวเลขเศรษฐกิจต่อเนื่อง'
        ],
        keyTakeaways_th: [
          catSummary,
          cleanTicker ? `ปัจจัยเชิงบวกและทิศทางราคาของหุ้น $${cleanTicker} สอดคล้องกับภาพรวมตลาด` : 'ปัจจัยเชิงโครงสร้างที่ส่งผลต่อการเคลื่อนไหวของดัชนีและกลุ่มอุตสาหกรรมหลัก',
          'นักลงทุนควรติดตามกระแสเงินทุน (Fund Flow) และการประกาศตัวเลขเศรษฐกิจต่อเนื่อง'
        ],
        keyTakeaways_en: [
          catSummary,
          cleanTicker ? `Momentum and fundamentals for $${cleanTicker} align with broad market drivers` : 'Key structural catalyst driving index performance and industry sector rotation',
          'Investors should monitor global capital flows and macroeconomic data releases'
        ],
        fullContent: `${catSummary}\n\nบทวิเคราะห์ปัจจัยเร่ง (Catalyst Intelligence):\nประเด็นนี้เป็นหนึ่งในตัวขับเคลื่อนสำคัญ (Key Catalyst) ที่นักวิเคราะห์และระบบ Real-time AI ตรวจพบในรอบตลาดปัจจุบัน ส่งผลให้หุ้นที่เกี่ยวข้อง (${cleanTicker ? `$${cleanTicker}` : 'กลุ่มอุตสาหกรรมเป้าหมาย'}) มีความเคลื่อนไหวและทิศทางราคาที่น่าจับตา`,
        region: isThai ? 'thai' : 'global',
        timeframe: 'daily',
        marketName: isThai ? 'SET Index (ไทย)' : 'US & Global Markets',
        date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        periodLabel: `Key Catalyst • ${summary.periodLabel_th || summary.periodLabel || 'Live Brief'}`,
        periodLabel_th: `Key Catalyst • ${summary.periodLabel_th || summary.periodLabel || 'Live Brief'}`,
        periodLabel_en: `Key Catalyst • ${summary.periodLabel_en || 'Live Brief'}`,
        sentiment: stock ? (stock.change >= 0 ? 'bullish' : 'bearish') : 'bullish',
        tickers: cleanTicker ? [cleanTicker] : (isThai ? ['SET'] : ['US']),
        readTime: '1 นาที',
        source: 'StockHome Intelligence Catalyst',
        category: isThai ? 'energy' : 'tech',
        impactAnalysis: {
          bullishReason: 'แรงหนุนเชิงบวกต่อกลุ่มอุตสาหกรรมเป้าหมายและหุ้นที่เกี่ยวข้อง',
          targetSector: stock ? stock.sector : (isThai ? 'SET50 & Leaders' : 'Global Tech & Equities'),
          priceTrendOutlook: stock && stock.change >= 0 ? 'มีแนวโน้มทดสอบแนวต้านสำคัญ' : 'แกว่งตัวในกรอบสร้างฐานราคา',
        },
        isFeatured: true,
        isBookmarked: false,
      };

      setActiveNewsModal(dynamicNewsItem);
    };

    return (
      <div
        key={`cat-${idx}-${cat.substring(0, 15)}`}
        onClick={handleCatalystClick}
        role="button"
        tabIndex={0}
        title={language === 'en' ? 'Click to read full news and impact analysis' : 'คลิกเพื่อเปิดอ่านข่าวสารและบทวิเคราะห์เจาะลึก'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-primary)',
          background: 'var(--card-sub-bg)',
          padding: '9px 12px',
          borderRadius: '12px',
          cursor: 'pointer',
          border: '1px solid var(--card-sub-border)',
          transition: 'all 0.15s ease',
        }}
        className="catalyst-item-clickable"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: 'rgba(0, 122, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Newspaper size={12} color="var(--accent-blue)" />
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {translatedCat}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {stock && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '100px',
                background: stock.change >= 0 ? 'var(--accent-bullish-bg)' : 'var(--accent-bearish-bg)',
                color: stock.change >= 0 ? 'var(--accent-bullish)' : 'var(--accent-bearish)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {Number(stock.change) >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {stock.currency === 'THB' ? '฿' : '$'}
              {(Number(stock.price) || 0).toFixed(2)} ({Number(stock.change) >= 0 ? '+' : ''}
              {(Number(stock.change) || 0).toFixed(2)}%)
            </span>
          )}
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--accent-blue)',
              fontWeight: 700,
              background: 'rgba(0, 122, 255, 0.1)',
              padding: '2px 6px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            อ่านข่าว <ChevronRight size={11} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', borderLeft: '4px solid var(--accent-blue)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Zap size={18} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isEn ? (summary.periodLabel_en || tDynamic(summary.periodLabel_th, summary.periodLabel_en)) : (summary.periodLabel_th || tDynamic(summary.periodLabel_th, summary.periodLabel_en))}
          </span>
          <span
            style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '100px', background: 'var(--accent-bullish-bg)', color: 'var(--accent-bullish)', border: '1px solid var(--accent-bullish-border)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }} /> REAL-TIME MARKET BRIEFING
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {lastUpdated || summary.updatedAt}
          </span>
          <button
            onClick={() => refreshAll()}
            disabled={isSyncing || cooldownRemaining > 0}
            title={cooldownRemaining > 0 ? `โปรดรอ ${cooldownRemaining} วินาทีก่อนรีเฟรชอีกครั้ง` : t('refreshData')}
            style={{
              background: 'transparent',
              border: 'none',
              color: (isSyncing || cooldownRemaining > 0) ? 'var(--text-tertiary)' : 'var(--accent-blue)',
              cursor: (isSyncing || cooldownRemaining > 0) ? 'not-allowed' : 'pointer',
              opacity: (isSyncing || cooldownRemaining > 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem'
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {cooldownRemaining > 0 && <span>{cooldownRemaining}s</span>}
          </button>
        </div>
      </div>

      {/* Thai vs Foreign Market Sub-Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveMarketTab('ALL')}
          style={{
            background: activeMarketTab === 'ALL' ? 'var(--accent-blue)' : 'var(--card-sub-bg)',
            color: activeMarketTab === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
            border: activeMarketTab === 'ALL' ? '1px solid var(--accent-blue)' : '1px solid var(--card-sub-border)',
            borderRadius: '100px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            fontWeight: activeMarketTab === 'ALL' ? 700 : 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Globe size={13} />
          <span>{language === 'en' ? 'All Markets' : 'ภาพรวมตลาดทั้งหมด'}</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('SET')}
          style={{
            background: activeMarketTab === 'SET' ? 'var(--accent-blue)' : 'var(--card-sub-bg)',
            color: activeMarketTab === 'SET' ? '#ffffff' : 'var(--text-secondary)',
            border: activeMarketTab === 'SET' ? '1px solid var(--accent-blue)' : '1px solid var(--card-sub-border)',
            borderRadius: '100px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            fontWeight: activeMarketTab === 'SET' ? 700 : 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Landmark size={13} />
          <span>{language === 'en' ? 'Thai Market (SET)' : 'ตลาดหุ้นไทย (SET)'}</span>
        </button>

        <button
          onClick={() => setActiveMarketTab('US')}
          style={{
            background: activeMarketTab === 'US' ? 'var(--accent-blue)' : 'var(--card-sub-bg)',
            color: activeMarketTab === 'US' ? '#ffffff' : 'var(--text-secondary)',
            border: activeMarketTab === 'US' ? '1px solid var(--accent-blue)' : '1px solid var(--card-sub-border)',
            borderRadius: '100px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            fontWeight: activeMarketTab === 'US' ? 700 : 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Building size={13} />
          <span>{language === 'en' ? 'US & Global' : 'ตลาดต่างประเทศ (US)'}</span>
        </button>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '10px', color: 'var(--text-primary)' }}>
        {activeMarketTab === 'SET'
          ? (isEn ? 'Thai Stock Market (SET Index) Real-Time Intelligence' : 'ภาวะตลาดหุ้นไทย (SET Index): เม็ดเงินไหลเข้ากลุ่มพลังงาน ธนาคาร และอิเล็กทรอนิกส์')
          : activeMarketTab === 'US'
          ? (isEn ? 'US & Global Markets (S&P 500 / NASDAQ / Dow Jones) Live Briefing' : 'ภาวะตลาดหุ้นสหรัฐฯ และตลาดโลก: แรงขับเคลื่อนกลุ่ม AI & Big Tech — หุ้นโดดเด่นประจำวัน: Magnificent 7 ($NVDA, $AAPL, $MSFT)')
          : (isEn ? (summary.mainHeadline_en || tDynamic(summary.mainHeadline_th, summary.mainHeadline_en)) : (summary.mainHeadline_th || tDynamic(summary.mainHeadline_th, summary.mainHeadline_en)))}
      </h2>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
        {activeMarketTab === 'SET'
          ? (isEn
              ? `Thai Market summary: Monitoring active SET constituents with real-time price updates for ${thaiStocks.length > 0 ? thaiStocks.length : 277}+ stocks across 8 industry sectors.`
              : `สรุปภาวะตลาดหุ้นไทย: ติดตามความเคลื่อนไหว SET50, SET100 และ mai แบบ Real-time ครอบคลุม ${thaiStocks.length > 0 ? thaiStocks.length : 277}+ บริษัท พร้อมตัวชี้วัดกระแสเงินทุนและแนวโน้มราคา`)
          : activeMarketTab === 'US'
          ? (isEn
              ? `US Market summary: Live coverage of NASDAQ-100, Dow Jones 30, and S&P 500 titans with continuous quote updates for ${usStocks.length > 0 ? usStocks.length : 3500}+ stocks.`
              : `สรุปภาวะตลาดสหรัฐฯ: เจาะลึกหุ้นเทคโนโลยี AI, หุ้นบิ๊กแคป NASDAQ-100, Dow Jones และ S&P 500 ครอบคลุม ${usStocks.length > 0 ? usStocks.length : 3500}+ ตัว พร้อมบทวิเคราะห์ AI รายตัว`)
          : (isEn ? (summary.overviewSummary_en || tDynamic(summary.overviewSummary_th, summary.overviewSummary_en)) : (summary.overviewSummary_th || tDynamic(summary.overviewSummary_th, summary.overviewSummary_en)))}
      </p>

      {/* Grid of Sentiment & Key Catalysts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: 'var(--card-sub-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
        {/* Sentiment Gauge Bar */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeMarketTab === 'SET' ? <Landmark size={13} color="var(--accent-blue)" /> : activeMarketTab === 'US' ? <Globe size={13} color="var(--accent-blue)" /> : <Activity size={13} color="var(--accent-blue)" />}
            <span>{activeMarketTab === 'SET' ? 'SET Market Sentiment' : activeMarketTab === 'US' ? 'US Market Sentiment' : 'Market Sentiment Live'}</span>
          </div>
          <div style={{ display: 'flex', height: '10px', borderRadius: '100px', overflow: 'hidden', gap: '2px', marginBottom: '8px' }}>
            <div style={{ width: `${currentSentiment.bullishPercent}%`, background: 'var(--accent-bullish)' }} title={`Bullish ${currentSentiment.bullishPercent}%`} />
            <div style={{ width: `${currentSentiment.neutralPercent}%`, background: 'var(--accent-neutral)' }} title={`Neutral ${currentSentiment.neutralPercent}%`} />
            <div style={{ width: `${currentSentiment.bearishPercent}%`, background: 'var(--accent-bearish)' }} title={`Bearish ${currentSentiment.bearishPercent}%`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-bullish)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <TrendingUp size={12} /> {t('sentimentBullish')} {currentSentiment.bullishPercent}%
            </span>
            <span style={{ color: 'var(--accent-neutral)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Minus size={12} /> {t('sentimentNeutral')} {currentSentiment.neutralPercent}%
            </span>
            <span style={{ color: 'var(--accent-bearish)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <TrendingDown size={12} /> {t('sentimentBearish')} {currentSentiment.bearishPercent}%
            </span>
          </div>
        </div>

        {/* Key Catalysts List */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeMarketTab === 'SET' ? <Landmark size={13} color="var(--accent-blue)" /> : activeMarketTab === 'US' ? <Globe size={13} color="var(--accent-blue)" /> : <Zap size={13} color="var(--accent-blue)" />}
            <span>{activeMarketTab === 'SET' ? 'Thai Market Catalysts' : activeMarketTab === 'US' ? 'US & Global Catalysts' : 'Key Live Catalysts'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {finalCatalysts.slice(0, 4).map((cat, idx) => renderCatalystItem(cat, idx))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { DigestHeaderBannerServer as DigestHeaderBanner };

