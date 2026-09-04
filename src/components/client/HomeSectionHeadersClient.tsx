'use client';

import React from 'react';
import { useLanguage } from '../../lib/context/LanguageContext';
import { Newspaper, Building2 } from 'lucide-react';

export function HomeNewsSectionHeader() {
  const { language } = useLanguage();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={20} color="var(--accent-blue)" />{' '}
          {language === 'en'
            ? 'Live AI Financial News & Stock Intelligence'
            : 'สรุปข่าวการเงินและหุ้นรายตัว (Live AI News Feed)'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
          {language === 'en'
            ? 'Real-time financial news aggregated from premier market outlets with AI impact analysis and key takeaways'
            : 'ดึงข่าวสดแบบ Real-Time จากสำนักข่าวการเงินชั้นนำ พร้อมสรุปสาระสำคัญและคะแนนผลกระทบต่อราคาหุ้นด้วย AI'}
        </p>
      </div>
    </div>
  );
}

export function HomeStockSectionHeader() {
  const { language } = useLanguage();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--accent-blue)" />{' '}
          {language === 'en'
            ? 'Stock Market Overview & Fundamentals'
            : 'ภาพรวมราคาหุ้นและปัจจัยพื้นฐาน (Stock Market Overview)'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
          {language === 'en'
            ? 'Live prices, P/E ratios, dividend yields, market cap, and AI fundamentals intelligence (SET & US)'
            : 'ข้อมูลราคาล่าสุด, P/E, ปันผล, มูลค่าตลาด และบทวิเคราะห์ AI รายตัว (SET & US)'}
        </p>
      </div>
    </div>
  );
}
