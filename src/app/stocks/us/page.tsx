import { MarketTickerBarServer } from '../../../components/server/MarketTickerBarServer';
import { StockExplorerClient } from '../../../components/client/StockExplorerClient';
import { fetchLiveStockFundamentals } from '../../../lib/services/stockDataService';
import { mockMarketIndices } from '../../../data/mockMarketData';
import { Building, Clock, Activity, Cpu, TrendingUp } from 'lucide-react';
import { getUsMarketStatus } from '../../../lib/utils/marketHours';

export const metadata = {
  title: 'หุ้นต่างประเทศ (US Markets) | StockHomeTH',
  description: 'ศูนย์ข้อมูลหุ้นสหรัฐฯ S&P 500, NASDAQ, Dow Jones, Magnificent 7 และผู้นำเทคโนโลยี AI ระดับโลกกว่า 700+ บริษัท',
};

export default async function UsStocksPage() {
  const allStocks = await fetchLiveStockFundamentals();
  const usStocks = allStocks.filter((s) => s.market === 'US');
  const initialStocks = usStocks.slice(0, 50);
  const usStatus = getUsMarketStatus();

  return (
    <>
      {/* Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* US Market Hero Header */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={18} color="#8B5CF6" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                หุ้นต่างประเทศ (US Markets)
              </h2>
              <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', padding: '2px 10px', borderRadius: '100px', fontWeight: 700 }}>
                700+ หุ้นสหรัฐฯ & Tech Giants
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
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
