'use client';

import React from 'react';
import { CustomStockChart } from './CustomStockChart';

interface TradingViewChartProps {
  initialSymbol?: string;
}

/**
 * Replaced third-party TradingView Widget with Native Custom Stock Chart.
 * Backwards-compatible export to preserve existing page and component references.
 */
export function TradingViewChart({ initialSymbol = 'SET:PTT' }: TradingViewChartProps) {
  // Convert SET:PTT or NASDAQ:NVDA to standard ticker format
  let clean = initialSymbol.replace(/^SET:/i, '').replace(/^NASDAQ:/i, '').replace(/^NYSE:/i, '');
  let country: 'th' | 'us' | 'jp' | 'hk' | 'uk' | 'sg' = 'th';

  if (clean.endsWith('.BK') || initialSymbol.startsWith('SET:')) {
    country = 'th';
    if (!clean.endsWith('.BK')) clean = `${clean}.BK`;
  } else if (clean.endsWith('.T')) {
    country = 'jp';
  } else if (clean.endsWith('.HK')) {
    country = 'hk';
  } else if (clean.endsWith('.L')) {
    country = 'uk';
  } else if (clean.endsWith('.SI')) {
    country = 'sg';
  } else {
    country = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD'].includes(clean) ? 'us' : 'th';
    if (country === 'th' && !clean.endsWith('.BK')) clean = `${clean}.BK`;
  }

  return <CustomStockChart initialSymbol={clean} initialCountry={country} />;
}

export { CustomStockChart };
export default CustomStockChart;
