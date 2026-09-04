/**
 * StockHomeTH - Bilingual Translation Dictionary (TH / EN)
 * Complete coverage for UI navigation, metrics, stock explorer, news, filters, and actions.
 */

export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Brand & Header
    brandSubtitle: 'ระบบวิเคราะห์หุ้นและสรุปข่าวการเงิน AI',
    thaiStocks: 'หุ้นไทย (SET)',
    foreignStocks: 'หุ้นต่างประเทศ (US)',
    marketAndCharts: 'ตลาดหุ้น & กราฟสด',
    newsDigest: 'สรุปข่าว AI Digest',
    liveAiDigest: 'สรุปข่าวสด AI',
    generatingAi: 'AI กำลังสรุป...',
    bookmarked: 'ที่บันทึกไว้',
    refreshData: 'อัปเดตข้อมูลสด',
    themeLight: 'โหมดสว่าง',
    themeDark: 'โหมดมืด',
    themeSystem: 'ตามระบบ',
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    member: 'สมาชิก',

    // Stock Market Explorer
    marketOverview: 'ภาพรวมตลาดหุ้นและราคาล่าสุด',
    marketOverviewDesc: 'ข้อมูลราคาล่าสุด, กราฟเทคนิค, P/E, ปันผล, มูลค่าตลาด และบทวิเคราะห์ AI',
    allMarkets: 'ตลาดทั้งหมด',
    thaiMarketTab: 'หุ้นไทย (SET / mai)',
    usMarketTab: 'หุ้นสหรัฐฯ (SEC / US)',
    topGainers: 'หุ้นบวกแรง',
    topLosers: 'หุ้นปรับฐาน',
    lowPE: 'P/E ต่ำ',
    liveConnected: 'เชื่อมต่อสด',
    syncing: 'กำลังซิงค์...',
    searchStockPlaceholder: 'ค้นหาชื่อย่อหุ้น หรือชื่อบริษัท (เช่น PTT, NVDA, CPALL, AAPL)...',
    allSectors: 'กลุ่มอุตสาหกรรมทั้งหมด',

    // Table Headers
    colTickerName: 'ชื่อย่อ / บริษัท',
    colPrice: 'ราคาล่าสุด',
    col24hChange: 'เปลี่ยนแปลง 24ชม.',
    colMarketCap: 'มูลค่าตลาด',
    colPE: 'P/E',
    colDivYield: 'ปันผล',
    colAnalyst: 'มุมมองนักวิเคราะห์',
    colTrend7d: 'แนวโน้ม (7 วัน)',

    // Stock Modal / Detail
    realtimePrice: 'ราคาล่าสุด (Real-time)',
    analystTarget: 'เป้าหมายนักวิเคราะห์ (Target Price)',
    recommendation: 'คำแนะนำ',
    aiInsightTitle: 'AI FUNDAMENTAL INTELLIGENCE',
    volume: 'ปริมาณซื้อขาย',
    relatedNewsTitle: 'ข่าวที่เกี่ยวข้องกับ',
    viewAllNews: 'ดูกระดานข่าวทั้งหมด',
    noDirectNews: 'ยังไม่มีข่าวระบุหุ้นตัวนี้โดยตรงในรอบล่าสุด',

    // News Feed Section
    newsFeedTitle: 'สรุปข่าวการเงินและหุ้นรายตัว (Live AI News Feed)',
    newsFeedSubtitle: 'ดึงข่าวสดแบบ Real-Time พร้อมสรุปสาระสำคัญและคะแนนผลกระทบต่อราคาหุ้นด้วย AI',
    dailyNews: 'ข่าวสรุปประจำวันล่าสุด',
    weeklyNews: 'ข่าวสรุปประจำสัปดาห์ล่าสุด',
    foundItems: 'พบทั้งหมด',
    itemsCount: 'รายการ',
    noNewsFound: 'ไม่พบรายการข่าวสรุปที่ตรงกับเงื่อนไขการกรอง',
    clearFilters: 'ล้างการกรองทั้งหมด',
    readMore: 'อ่านฉบับเต็ม',
    close: 'ปิด',
    keyTakeaways: 'ประเด็นสำคัญที่ต้องรู้',
    impactAnalysis: 'การวิเคราะห์ผลกระทบต่อตลาด & อุตสาหกรรม',
    bullishFactors: 'ปัจจัยเชิงบวก (Bullish Factors)',
    bearishFactors: 'ปัจจัยความเสี่ยง (Risk Factors)',
    targetSector: 'กลุ่มอุตสาหกรรมเป้าหมาย',
    trendOutlook: 'คาดการณ์แนวโน้มระยะสั้น',
    source: 'แหล่งข่าว',
    relatedTickers: 'หุ้นที่เกี่ยวข้อง',

    // Sentiments
    sentimentBullish: 'เชิงบวก (Bullish)',
    sentimentBearish: 'เชิงลบ (Bearish)',
    sentimentNeutral: 'เป็นกลาง (Neutral)',

    // Filter categories
    catAll: 'ทุกหมวดหมู่',
    catMacro: 'เศรษฐกิจมหภาค',
    catTech: 'เทคโนโลยี & AI',
    catEnergy: 'พลังงาน & สาธารณูปโภค',
    catFinance: 'ธนาคาร & การเงิน',
    catRetail: 'ค้าปลีก & ท่องเที่ยว',
    catHealth: 'การแพทย์ & สุขภาพ',

    // Timeframes & Regions
    timeframeDaily: 'สรุปประจำวัน (Daily)',
    timeframeWeekly: 'สรุปประจำสัปดาห์ (Weekly)',
    regionAll: 'ทุกตลาด (Global & Thai)',
    regionThai: 'ตลาดหุ้นไทย (SET)',
    regionGlobal: 'ตลาดต่างประเทศ (US / Global)',

    // Analyst Ratings
    ratingStrongBuy: 'ซื้อทันที (Strong Buy)',
    ratingBuy: 'ซื้อ (Buy)',
    ratingHold: 'ถือ (Hold)',
    ratingSell: 'ขาย (Sell)',
  },

  en: {
    // Brand & Header
    brandSubtitle: 'AI Stock Intelligence & Financial Digest',
    thaiStocks: 'Thai Stocks (SET)',
    foreignStocks: 'US Stocks',
    marketAndCharts: 'Market & Charts',
    newsDigest: 'AI News Digest',
    liveAiDigest: 'Live AI Summary',
    generatingAi: 'AI Summarizing...',
    bookmarked: 'Saved',
    refreshData: 'Refresh Feed',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeSystem: 'System Theme',
    login: 'Sign In',
    logout: 'Sign Out',
    member: 'Member',

    // Stock Market Explorer
    marketOverview: 'Stock Market Overview & Live Quotes',
    marketOverviewDesc: 'Real-time quotes, technical charts, P/E, dividend yields, market cap, and AI insights',
    allMarkets: 'All Markets',
    thaiMarketTab: 'Thai Stocks (SET / mai)',
    usMarketTab: 'US Stocks (SEC / US)',
    topGainers: 'Top Gainers',
    topLosers: 'Top Losers',
    lowPE: 'Low P/E',
    liveConnected: 'Live Feed',
    syncing: 'Syncing...',
    searchStockPlaceholder: 'Search symbol or company name (e.g. PTT, NVDA, AAPL, CPALL)...',
    allSectors: 'All Sectors',

    // Table Headers
    colTickerName: 'TICKER / NAME',
    colPrice: 'PRICE',
    col24hChange: '24H CHANGE',
    colMarketCap: 'MARKET CAP',
    colPE: 'P/E',
    colDivYield: 'DIV YIELD',
    colAnalyst: 'ANALYST',
    colTrend7d: 'TREND (7D)',

    // Stock Modal / Detail
    realtimePrice: 'Latest Price (Real-time)',
    analystTarget: 'Analyst Target Price',
    recommendation: 'Recommendation',
    aiInsightTitle: 'AI FUNDAMENTAL INTELLIGENCE',
    volume: 'Volume',
    relatedNewsTitle: 'News related to',
    viewAllNews: 'View all news',
    noDirectNews: 'No recent direct news found for this ticker',

    // News Feed Section
    newsFeedTitle: 'Financial News & Stock Intelligence (Live AI Feed)',
    newsFeedSubtitle: 'Real-time multi-source financial news summarized with stock impact scores by AI',
    dailyNews: 'Latest Daily Briefing',
    weeklyNews: 'Latest Weekly Briefing',
    foundItems: 'Found',
    itemsCount: 'items',
    noNewsFound: 'No news matches the active filter criteria',
    clearFilters: 'Clear all filters',
    readMore: 'Read Full Analysis',
    close: 'Close',
    keyTakeaways: 'Key Takeaways',
    impactAnalysis: 'Market & Sector Impact Analysis',
    bullishFactors: 'Bullish Factors',
    bearishFactors: 'Risk Factors',
    targetSector: 'Target Sector',
    trendOutlook: 'Short-term Outlook',
    source: 'Source',
    relatedTickers: 'Related Tickers',

    // Sentiments
    sentimentBullish: 'Bullish',
    sentimentBearish: 'Bearish',
    sentimentNeutral: 'Neutral',

    // Filter categories
    catAll: 'All Categories',
    catMacro: 'Macro Economy',
    catTech: 'Tech & AI',
    catEnergy: 'Energy & Utilities',
    catFinance: 'Banking & Finance',
    catRetail: 'Retail & Consumer',
    catHealth: 'Healthcare & Pharma',

    // Timeframes & Regions
    timeframeDaily: 'Daily Digest',
    timeframeWeekly: 'Weekly Digest',
    regionAll: 'All Markets',
    regionThai: 'Thai Market (SET)',
    regionGlobal: 'Global Markets (US)',

    // Analyst Ratings
    ratingStrongBuy: 'Strong Buy',
    ratingBuy: 'Buy',
    ratingHold: 'Hold',
    ratingSell: 'Sell',
  }
} as const;

export type TranslationKey = keyof typeof translations.th;
