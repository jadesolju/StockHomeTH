import { MarketTickerBarServer } from '../../../components/server/MarketTickerBarServer';
import { StockExplorerClient } from '../../../components/client/StockExplorerClient';
import { fetchLiveStockFundamentals } from '../../../lib/services/stockDataService';
import { getStockPopularityRank } from '../../../lib/utils/stockTagHelper';
import { mockMarketIndices } from '../../../data/mockMarketData';
import { Landmark, Clock, Activity, ShieldCheck, TrendingUp } from 'lucide-react';
import { getSetMarketStatus } from '../../../lib/utils/marketHours';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'หุ้นไทย (SET & mai) | StockHomeTH',
  description: 'ศูนย์ข้อมูลหุ้นไทย ตลาดหลักทรัพย์แห่งประเทศไทย (SET & mai) กว่า 800+ บริษัท วิเคราะห์งบการเงิน P/E ปันผล และคะแนน AI',
};

export default async function ThaiStocksPage() {
  const allStocks = await fetchLiveStockFundamentals();
  const thaiStocks = allStocks.filter((s) => s.market === 'SET');
  const sortedThai = [...thaiStocks].sort((a, b) => {
    const rankA = getStockPopularityRank(a, 'SET');
    const rankB = getStockPopularityRank(b, 'SET');
    if (rankA !== rankB) return rankA - rankB;
    return (b.sentimentScore ?? 50) - (a.sentimentScore ?? 50);
  });
  const initialStocks = sortedThai.slice(0, 100);
  const setStatus = getSetMarketStatus();

  return (
    <>
      {/* Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* Thai Market Hero Header */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(0, 122, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={18} color="#007AFF" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                หุ้นไทย (SET & mai)
              </h2>
              <span style={{ fontSize: '0.75rem', background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF', padding: '2px 10px', borderRadius: '100px', fontWeight: 700 }}>
                800+ บริษัทจดทะเบียน
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              ตลาดหลักทรัพย์แห่งประเทศไทย • เวลาทำการ ภาคเช้า 10:00 - 12:30 น. และ ภาคบ่าย 14:30 - 16:30 น.
            </p>
          </div>

          {/* Thai Market Session Status Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card-sub-bg)', padding: '10px 16px', borderRadius: '16px', border: '1px solid var(--card-sub-border)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: setStatus.isOpen ? '#00E676' : '#94A3B8', boxShadow: setStatus.isOpen ? '0 0 10px #00E676' : 'none' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {setStatus.statusTextTh}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                {setStatus.nextChange}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thai Stock Explorer */}
      <StockExplorerClient initialStocks={initialStocks} marketOverride="SET" hideMarketTabs={true} />
    </>
  );
}
