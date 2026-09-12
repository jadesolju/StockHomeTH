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


const NAV_CARDS = [
  {
    href: '/stocks',
    icon: Globe,
    iconColor: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    title: 'ตลาดหุ้นทั้งหมด (ALL)',
    description: 'จักรวาลหุ้น 1,500+ ตัว พร้อมตัวคัดกรองแท็ก',
  },
  {
    href: '/stocks/thai',
    icon: Landmark,
    iconColor: '#007AFF',
    iconBg: 'rgba(0, 122, 255, 0.15)',
    title: 'หุ้นไทย (SET & mai)',
    description: 'SET50, ปันผลสูง, หุ้นพลังงาน, แบงก์ 800+ ตัว',
  },
  {
    href: '/stocks/us',
    icon: Building,
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139, 92, 246, 0.15)',
    title: 'หุ้นต่างประเทศ (US)',
    description: 'Magnificent 7, Tech AI, S&P 500, Nasdaq 700+ ตัว',
  },
];

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
      <div className="mb-10">
        <HomeNewsSectionHeader />
        <NewsFeedClient initialNews={dynamicNews} />
      </div>

      {/* 4. Dedicated Stock Hubs Quick Navigation Cards */}
      <div className="glass-card p-6 rounded-3xl mb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-extrabold m-0 text-[var(--text-primary)] flex items-center gap-2">
              <BarChart3 size={20} color="var(--accent-blue)" /> ค้นหาและวิเคราะห์ราคาหุ้นรายตัว (Stock Market Intelligence)
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1 mb-0">
              เลือกดูภาพรวมตลาดหุ้นทั้งหมด หรือเจาะลึกเฉพาะหุ้นไทย (SET) และหุ้นต่างประเทศ (US)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV_CARDS.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link key={card.href} href={card.href} className="no-underline">
                <div className="glass-card-hover py-4 px-5 rounded-2xl bg-[var(--card-sub-bg)] border border-[var(--card-sub-border)] flex items-center justify-between cursor-pointer transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: card.iconBg }}
                    >
                      <IconComponent size={22} color={card.iconColor} />
                    </div>
                    <div>
                      <h4 className="m-0 text-[0.95rem] font-bold text-[var(--text-primary)]">{card.title}</h4>
                      <p className="m-0 mt-0.5 text-xs text-[var(--text-tertiary)]">{card.description}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} color="var(--text-tertiary)" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
