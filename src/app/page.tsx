import { fetchLiveStockFundamentals } from '../lib/services/stockDataService';
import { mockMarketIndices } from '../data/mockMarketData';
import { mockDailyDigestSummary, mockNewsItems } from '../data/mockNewsData';
import { MarketTickerBarServer } from '../components/server/MarketTickerBarServer';
import { DigestHeaderBannerServer } from '../components/server/DigestHeaderBannerServer';
import { StockExplorerClient } from '../components/client/StockExplorerClient';
import { NewsFeedClient } from '../components/client/NewsFeedClient';
import { StockNewsItemSchema, DigestSummarySchema } from '../lib/schemas/newsSchema';
import { Newspaper, Building2 } from 'lucide-react';

export const revalidate = 30; // ISR / Server Cache revalidation every 30s

export default async function HomePage() {
  const stocks = await fetchLiveStockFundamentals();
  const validatedDigest = DigestSummarySchema.parse(mockDailyDigestSummary);
  const validatedNews = mockNewsItems.map((item) => StockNewsItemSchema.parse(item));

  return (
    <>
      {/* 1. Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* 2. AI Executive Market Briefing & Dynamic Sentiment Gauge */}
      <DigestHeaderBannerServer summary={validatedDigest} />

      {/* 3. Core Section: Real-Time Live AI Financial News Digest */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Newspaper size={20} color="var(--accent-blue)" /> สรุปข่าวการเงินและหุ้นรายตัว (Live AI News Feed)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
              ดึงข่าวสดแบบ Real-Time จากสำนักข่าวการเงินชั้นนำ พร้อมสรุปสาระสำคัญและคะแนนผลกระทบต่อราคาหุ้นด้วย AI
            </p>
          </div>
        </div>
        <NewsFeedClient initialNews={validatedNews} />
      </div>

      {/* 4. Stock Market Fundamental Intelligence Table */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--accent-blue)" /> ภาพรวมราคาหุ้นและปัจจัยพื้นฐาน (Stock Market Overview)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
              ข้อมูลราคาล่าสุด, P/E, ปันผล, มูลค่าตลาด และบทวิเคราะห์ AI รายตัว (SET & US)
            </p>
          </div>
        </div>
        <StockExplorerClient initialStocks={stocks} />
      </div>
    </>
  );
}
