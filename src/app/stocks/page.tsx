import { MarketTickerBarServer } from '../../components/server/MarketTickerBarServer';
import { StockExplorerClient } from '../../components/client/StockExplorerClient';
import { fetchLiveStockFundamentals } from '../../lib/services/stockDataService';
import { getStockPopularityRank } from '../../lib/utils/stockTagHelper';
import { mockMarketIndices } from '../../data/mockMarketData';
import { Globe, Sparkles, BarChart3, ArrowUpDown } from 'lucide-react';

export const metadata = {
  title: 'ตลาดหุ้นทั้งหมด (ALL Markets) | StockHomeTH',
  description: 'สำรวจและวิเคราะห์ราคาหุ้น ปัจจัยพื้นฐาน P/E ปันผล และคะแนน AI ของหุ้นไทยและหุ้นสหรัฐฯ กว่า 1,500 ตัว',
};

export default async function AllStocksPage() {
  const allStocks = await fetchLiveStockFundamentals();
  const sorted = [...allStocks].sort((a, b) => {
    const rankA = getStockPopularityRank(a, 'ALL');
    const rankB = getStockPopularityRank(b, 'ALL');
    if (rankA !== rankB) return rankA - rankB;
    return (b.sentimentScore ?? 50) - (a.sentimentScore ?? 50);
  });
  const initialStocks = sorted.slice(0, 100);

  return (
    <>
      {/* Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* Page Hero Header */}
      <div className="glass-card" style={{ padding: '24px 28px', borderRadius: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={18} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                ตลาดหุ้นทั้งหมด (ALL Markets)
              </h2>
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '100px', fontWeight: 700 }}>
                1,500+ Universe
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              รวมศูนย์ข้อมูลราคาหุ้นไทย (SET/mai) และหุ้นสหรัฐฯ (S&P 500/Nasdaq) พร้อมตัวคัดกรองแท็กและระบบเรียงลำดับอัจฉริยะ
            </p>
          </div>
        </div>
      </div>

      {/* Stock Explorer Core */}
      <StockExplorerClient initialStocks={initialStocks} />
    </>
  );
}
