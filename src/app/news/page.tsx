import { mockNewsItems, mockDailyDigestSummary } from '../../data/mockNewsData';
import { mockMarketIndices } from '../../data/mockMarketData';
import { MarketTickerBarServer } from '../../components/server/MarketTickerBarServer';
import { DigestHeaderBannerServer } from '../../components/server/DigestHeaderBannerServer';
import { NewsFeedClient } from '../../components/client/NewsFeedClient';
import { StockNewsItemSchema, DigestSummarySchema } from '../../lib/schemas/newsSchema';

export const revalidate = 60;

export default async function NewsPage() {
  // Validate data with Zod schemas
  const validatedNews = mockNewsItems.map((item) => StockNewsItemSchema.parse(item));
  const validatedDigest = DigestSummarySchema.parse(mockDailyDigestSummary);

  return (
    <>
      {/* Real-time Market Indices Ticker Bar */}
      <MarketTickerBarServer indices={mockMarketIndices} />

      {/* Daily Digest Headline & Sentiment Gauge Banner */}
      <DigestHeaderBannerServer summary={validatedDigest} />

      {/* Interactive News Feed (Client Island) */}
      <NewsFeedClient initialNews={validatedNews} />
    </>
  );
}
