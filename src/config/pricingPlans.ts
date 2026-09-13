export interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  badge?: string;
}

export interface PricingPlan {
  id: 'free' | 'lite' | 'pro' | 'vip' | 'whale' | 'dev';
  name: string;
  tagline: string;
  badge?: string;
  popular?: boolean;
  priceMonthly: number;
  priceYearly: number; // Price per year (discounted)
  currency: string;
  periodText: string;
  color: string;
  accentBg: string;
  borderColor: string;
  features: PricingFeature[];
  limits: {
    watchlistLimit: number;
    aiOnDemandDailyLimit: number;
    realtimeStreaming: boolean;
    lineAlerts: boolean;
    exportData: boolean;
    adFree: boolean;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Member',
    tagline: 'ดูข้อมูลงบย้อนหลัง กราฟพื้นฐาน ติดตามหุ้นมั่นใจ',
    badge: 'ฟรีตลอดชีพ',
    priceMonthly: 0,
    priceYearly: 0,
    currency: '฿',
    periodText: 'ใช้งานฟรีตลอดไป',
    color: 'var(--accent-bullish)',
    accentBg: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
    limits: {
      watchlistLimit: 25,
      aiOnDemandDailyLimit: 500, // 500 GemCoins daily
      realtimeStreaming: true,
      lineAlerts: false,
      exportData: false,
      adFree: false,
    },
    features: [
      { text: 'เข้าถึงข้อมูลหุ้นครบ 10,689+ ตัว (SET, mai, US)', included: true, highlight: true },
      { text: 'ราคาหุ้นสด Real-time และข่าวด่วนแปลไทยไม่อั้น', included: true },
      { text: 'AI GemCoins: 500 เหรียญต่อวัน (รีเซ็ตทุกเที่ยงคืน)', included: true, highlight: true, badge: '500 Coins/วัน' },
      { text: 'สร้าง Watchlist ติดตามหุ้นโปรดได้สูงสุด 25 ตัว', included: true },
      { text: 'ดูกราฟเทคนิค และ Sparkline ย้อนหลัง', included: true },
      { text: 'โมเดล AI พื้นฐาน: Gemini Flash Lite & DeepSeek V3', included: true },
      { text: 'Clean UI ไร้โฆษณา & สแกนเนอร์สัญญาณเทคนิคเชิงลึก', included: false },
    ],
  },
  {
    id: 'lite',
    name: 'Lite Plan',
    tagline: 'แถม 12,000 GemCoins ถาวร + 2,500 ต่อวัน ไร้โฆษณา',
    badge: 'เริ่มต้นสุดคุ้ม (89 บ.)',
    priceMonthly: 89,
    priceYearly: 890,
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: '#38bdf8',
    accentBg: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    limits: {
      watchlistLimit: 60,
      aiOnDemandDailyLimit: 2500, // 2,500 GemCoins daily
      realtimeStreaming: true,
      lineAlerts: false,
      exportData: false,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์ทั้งหมดของ Free Member', included: true },
      { text: 'Clean UI สบายตา ไร้โฆษณารบกวน 100%', included: true, highlight: true, badge: 'Ad-Free' },
      { text: 'เหรียญรายวัน: 2,500 Coins/วัน + โบนัสถาวร +12,000 Coins', included: true, highlight: true, badge: '2,500 Coins/วัน' },
      { text: 'ปลดล็อก AI: Gemini 3.8 Flash, Gemini 3.1 Pro', included: true },
      { text: 'ขยาย Watchlist ติดตามหุ้นได้สูงสุด 60 ตัว', included: true },
      { text: 'ระบบความจำต่อเนื่อง Rolling Summary สูงสุด 25 ข้อความ', included: true },
      { text: 'แจ้งเตือนข่าวด่วนและไฮไลท์หุ้นสำคัญผ่าน Web Push', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    tagline: 'แถม 45,000 GemCoins ถาวร + 10,000 ต่อวัน + Real-time Stock Context',
    badge: 'แนะนำสำหรับนักลงทุน (299 บ.)',
    popular: true,
    priceMonthly: 299,
    priceYearly: 2990, // ~249 THB/mo
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: 'var(--accent-blue)',
    accentBg: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    limits: {
      watchlistLimit: 150,
      aiOnDemandDailyLimit: 10000, // 10,000 GemCoins daily
      realtimeStreaming: true,
      lineAlerts: true,
      exportData: true,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์ทั้งหมดของระดับ Lite', included: true },
      { text: 'เหรียญรายวัน: 10,000 Coins/วัน + โบนัสถาวร +45,000 Coins', included: true, highlight: true, badge: '10,000 Coins/วัน' },
      { text: 'ปลดล็อก AI: Gemini 3.1 Pro, GPT-5 (Luna), Claude Sonnet 5', included: true, highlight: true },
      { text: 'วิเคราะห์งบการเงินและ Valuation เชิงลึก (Max 6,144 Tokens)', included: true, highlight: true },
      { text: 'แนบเอกสารงบการเงินได้สูงสุด 30,000 Tokens (งบทั้งไตรมาส)', included: true },
      { text: 'ความจำอัจฉริยะ Rolling Memory 60 ข้อความ สรุปฟรี 0 บาท', included: true },
      { text: 'แจ้งเตือนราคาหุ้นและข่าวด่วนผ่าน LINE / Web Push', included: true, badge: 'LINE Alert' },
      { text: 'ส่งออกข้อมูลราคาย้อนหลัง & ข่าวเป็น Excel / CSV', included: true },
    ],
  },
  {
    id: 'vip',
    name: 'VIP Investor',
    tagline: 'แถม 180,000 GemCoins ถาวร + 50,000 ต่อวัน + Priority Speed',
    badge: 'เทรดเดอร์มืออาชีพ (999 บ.)',
    priceMonthly: 999,
    priceYearly: 9990, // ~833 THB/mo
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    limits: {
      watchlistLimit: 9999,
      aiOnDemandDailyLimit: 50000, // 50,000 GemCoins daily
      realtimeStreaming: true,
      lineAlerts: true,
      exportData: true,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์ทั้งหมดของระดับ Pro', included: true },
      { text: 'เหรียญรายวัน: 50,000 Coins/วัน + โบนัสถาวร +180,000 Coins', included: true, highlight: true, badge: '50,000 Coins/วัน' },
      { text: 'ปลดล็อก AI: DeepSeek R1 Reasoning, Claude 3.5 Opus, GPT-5', included: true, highlight: true },
      { text: 'Fast-Track Priority Queue: คิวระดับสูง ตอบกลับเร็วพิเศษ', included: true, highlight: true },
      { text: 'แนบเอกสารงบสูงสุด 100,000 Tokens + Max Output 8,192 Tokens', included: true },
      { text: 'ความจำระดับ 150 ข้อความย้อนหลัง สรุปฟรี 0 บาทตลอดชีพ', included: true },
      { text: 'สแกนเนอร์หุ้น Volume ผิดปกติ + สัญญาณเทคนิค Breakout', included: true },
      { text: 'พอร์ตโฟลิโอจำลอง ติดตามกำไร/ขาดทุน (P/L) อัตโนมัติ', included: true },
    ],
  },
  {
    id: 'whale',
    name: 'Whale Fund',
    tagline: 'แถม 500,000 GemCoins ถาวร + 150,000 ต่อวัน + Luxury Institutional Access',
    badge: '🐋 วาฬสถาบัน VIP Ultra (2,499 บ.)',
    priceMonthly: 2499,
    priceYearly: 24990, // ~2,083 THB/mo
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.6)',
    limits: {
      watchlistLimit: 99999,
      aiOnDemandDailyLimit: 150000, // 150,000 GemCoins daily
      realtimeStreaming: true,
      lineAlerts: true,
      exportData: true,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์สูงสุดระดับ Institutional Full Access', included: true, highlight: true },
      { text: 'เหรียญรายวัน: 150,000 Coins/วัน + โบนัสถาวร +500,000 Coins', included: true, highlight: true, badge: '150,000 Coins/วัน' },
      { text: 'ปลดล็อก AI ระดับสูงสุดของโลก: GPT-6 Astra, Claude Fable 5.1, Claude Opus 5, Grok 4.6', included: true, highlight: true, badge: 'Ultra Flagships' },
      { text: 'Bypass Queue: ทะลุคิวทันที 0ms ประมวลผลเป็นลำดับแรกเสมอ', included: true, highlight: true },
      { text: 'แนบเอกสารงบการเงินไม่จำกัดขนาด (Unlimited 56-1 One Report)', included: true, highlight: true },
      { text: 'Infinite Memory: จำประวัติการสนทนายาวไม่จำกัดรอบ สรุปฟรี 0 บาท', included: true },
      { text: 'Private Dedicated Support + สิทธิ์ขอฟีเจอร์วิเคราะห์พิเศษ', included: true, badge: 'Whale Exclusive' },
      { text: 'Watchlist และพอร์ตการลงทุนไม่จำกัดจำนวนหุ้น', included: true },
    ],
  },
  {
    id: 'dev',
    name: '👑 Dev + Owner',
    tagline: 'สิทธิ์ผู้พัฒนาและเจ้าของแพลตฟอร์ม สูงสุดทุกฟังก์ชัน',
    badge: 'God Mode',
    priceMonthly: 0,
    priceYearly: 0,
    currency: '฿',
    periodText: 'ฟรีถาวรสำหรับ Owner',
    color: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.5)',
    limits: {
      watchlistLimit: 99999,
      aiOnDemandDailyLimit: 999999,
      realtimeStreaming: true,
      lineAlerts: true,
      exportData: true,
      adFree: true,
    },
    features: [
      { text: '👑 สิทธิ์ระดับ Owner / Super Admin สูงสุด 100%', included: true, highlight: true },
      { text: 'ปลดล็อก AI ทุกตระกูล (GPT-5, Claude, Gemini Pro, DeepSeek)', included: true, highlight: true },
      { text: 'เหรียญ GemCoins ไม่อั้น 99,999,999 Coins', included: true, highlight: true },
      { text: 'เข้าถึงหน้า Admin Backoffice และ Developer Portal ได้ทันที', included: true, highlight: true },
      { text: 'Bypass คิว 0ms และใช้งาน API แบบไร้ข้อจำกัด', included: true },
      { text: 'Watchlist ติดตามหุ้นไม่จำกัดจำนวน', included: true },
    ],
  },
];

