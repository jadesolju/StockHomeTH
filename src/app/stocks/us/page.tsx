import { MarketTickerBarServer } from '../../../components/server/MarketTickerBarServer';
import { StockExplorerClient } from '../../../components/client/StockExplorerClient';
import { fetchLiveStockFundamentals } from '../../../lib/services/stockDataService';
import { getStockPopularityRank } from '../../../lib/utils/stockTagHelper';
import { mockMarketIndices } from '../../../data/mockMarketData';
import { Building, Clock, Activity, Cpu, TrendingUp } from 'lucide-react';
import { getUsMarketStatus } from '../../../lib/utils/marketHours';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'หุ้นต่างประเทศ (US Markets) | StockHomeTH',
  description: 'ศูนย์ข้อมูลหุ้นสหรัฐฯ S&P 500, NASDAQ, Dow Jones, Magnificent 7 และผู้นำเทคโนโลยี AI ระดับโลกกว่า 700+ บริษัท',
};

export default async function UsStocksPage() {
  const allStocks = await fetchLiveStockFundamentals();
  const usStocks = allStocks.filter((s) => s.market === 'US');
  const sortedUs = [...usStocks].sort((a, b) => {
    const rankA = getStockPopularityRank(a, 'US');
    const rankB = getStockPopularityRank(b, 'US');
    if (rankA !== rankB) return rankA - rankB;
    return (b.sentimentScore ?? 50) - (a.sentimentScore ?? 50);
  });
  const initialStocks = sortedUs.slice(0, 100);
  const usStatus = getUsMarketStatus();

  return (
    <>
      {/* Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* US Market Hero Header */}
      <div className="glass-card p-6 md:px-7 rounded-3xl mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                <Building size={18} color="#8B5CF6" />
              </div>
              <h2 className="text-2xl font-extrabold m-0 text-[var(--text-primary)]">
                หุ้นต่างประเทศ (US Markets)
              </h2>
              <span className="text-xs py-0.5 px-2.5 rounded-full font-bold" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
                700+ หุ้นสหรัฐฯ & Tech Giants
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] m-0">
              NYSE & NASDAQ (New York) • Regular Hours: 09:30 - 16:00 ET (20:30 - 03:00 น. เวลาไทย)
            </p>
          </div>

          {/* US Market Session Status Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card-sub-bg)', padding: '10px 16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: usStatus.isOpen ? '#00E676' : '#94A3B8', boxShadow: usStatus.isOpen ? '0 0 10px #00E676' : 'none' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {usStatus.statusTextTh}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                {usStatus.nextChange}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* US Stock Explorer */}
      <StockExplorerClient initialStocks={initialStocks} marketOverride="US" hideMarketTabs={true} />
    </>
  );
}
