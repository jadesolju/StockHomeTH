import Link from 'next/link';
import { MarketTickerBarServer } from '../components/server/MarketTickerBarServer';
import { DigestHeaderBannerServer } from '../components/server/DigestHeaderBannerServer';
import { NewsFeedClient } from '../components/client/NewsFeedClient';
import { HomeNewsSectionHeader } from '../components/client/HomeSectionHeadersClient';
import { getDynamicDailyDigestSummary, getDynamicMockNewsItems } from '../data/mockNewsData';
import { mockMarketIndices } from '../data/mockMarketData';
import { Globe, Landmark, Building, ArrowRight, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const dynamicDigest = getDynamicDailyDigestSummary();
  const dynamicNews = getDynamicMockNewsItems();

  return (
    <>
      {/* 1. Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* 2. AI Executive Market Briefing & Dynamic Sentiment Gauge */}
      <DigestHeaderBannerServer summary={dynamicDigest} />

      {/* 3. Core Main Section: Real-Time Live AI Financial News Digest & Intelligence */}
      <div style={{ marginBottom: '40px' }}>
        <HomeNewsSectionHeader />
        <NewsFeedClient initialNews={dynamicNews} />
      </div>

      {/* 4. Dedicated Stock Hubs Quick Navigation Cards */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="var(--accent-blue)" /> ค้นหาและวิเคราะห์ราคาหุ้นรายตัว (Stock Market Intelligence)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              เลือกดูภาพรวมตลาดหุ้นทั้งหมด หรือเจาะลึกเฉพาะหุ้นไทย (SET) และหุ้นต่างประเทศ (US)
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Card 1: ตลาดหุ้นทั้งหมด */}
          <Link href="/stocks" style={{ textDecoration: 'none' }}>
            <div className="glass-card-hover" style={{ padding: '18px 20px', borderRadius: '18px', background: 'var(--card-sub-bg)', border: '1px solid var(--card-sub-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={22} color="#10b981" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>ตลาดหุ้นทั้งหมด (ALL)</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>จักรวาลหุ้น 1,500+ ตัว พร้อมตัวคัดกรองแท็ก</p>
                </div>
              </div>
              <ArrowRight size={18} color="var(--text-tertiary)" />
            </div>
          </Link>

          {/* Card 2: หุ้นไทย (SET) */}
          <Link href="/stocks/thai" style={{ textDecoration: 'none' }}>
            <div className="glass-card-hover" style={{ padding: '18px 20px', borderRadius: '18px', background: 'var(--card-sub-bg)', border: '1px solid var(--card-sub-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 122, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={22} color="#007AFF" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>หุ้นไทย (SET & mai)</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>SET50, ปันผลสูง, หุ้นพลังงาน, แบงก์ 800+ ตัว</p>
                </div>
              </div>
              <ArrowRight size={18} color="var(--text-tertiary)" />
            </div>
          </Link>

          {/* Card 3: หุ้นต่างประเทศ (US) */}
          <Link href="/stocks/us" style={{ textDecoration: 'none' }}>
            <div className="glass-card-hover" style={{ padding: '18px 20px', borderRadius: '18px', background: 'var(--card-sub-bg)', border: '1px solid var(--card-sub-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={22} color="#8B5CF6" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>หุ้นต่างประเทศ (US)</h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Magnificent 7, Tech AI, S&P 500, Nasdaq 700+ ตัว</p>
                </div>
              </div>
              <ArrowRight size={18} color="var(--text-tertiary)" />
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
