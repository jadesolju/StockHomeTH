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
      aiOnDemandDailyLimit: 3,
      realtimeStreaming: true,
      lineAlerts: false,
      exportData: false,
      adFree: false,
    },
    features: [
      { text: 'เข้าถึงข้อมูลหุ้นครบ 10,689+ ตัว (SET, mai, US)', included: true, highlight: true },
      { text: 'ราคาหุ้นสด Real-time และข่าวด่วนแปลไทยไม่อั้น', included: true },
      { text: 'AI On-Demand วิเคราะห์หุ้น 3 ครั้ง / วัน', included: true, highlight: true, badge: '3 เครดิต/วัน' },
      { text: 'สร้าง Watchlist ติดตามหุ้นโปรดได้สูงสุด 25 ตัว', included: true },
      { text: 'ดูกราฟเทคนิค และ Sparkline ย้อนหลัง', included: true },
      { text: 'ประสบการณ์ใช้งาน Clean UI ไร้โฆษณา', included: false },
      { text: 'สแกนเนอร์สัญญาณเทคนิค & งบการเงินเชิงลึก', included: false },
    ],
  },
  {
    id: 'lite',
    name: 'Coffee Supporter',
    tagline: 'เลี้ยงกาแฟผู้พัฒนา 1 แก้ว ปลดล็อก AI ไร้โฆษณา',
    badge: 'เลี้ยงกาแฟ (19 บ.)',
    priceMonthly: 19,
    priceYearly: 190,
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: '#eab308',
    accentBg: 'rgba(234, 179, 8, 0.12)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
    limits: {
      watchlistLimit: 60,
      aiOnDemandDailyLimit: 10,
      realtimeStreaming: true,
      lineAlerts: false,
      exportData: false,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์ทั้งหมดของ Free Member', included: true },
      { text: 'Clean UI สบายตา ไร้โฆษณารบกวน 100%', included: true, highlight: true, badge: 'Ad-Free' },
      { text: 'AI On-Demand: วิเคราะห์หุ้นรายตัว 10 ครั้ง/วัน', included: true, highlight: true, badge: '10 เครดิต/วัน' },
      { text: 'ขยาย Watchlist ติดตามหุ้นได้สูงสุด 60 ตัว', included: true },
      { text: 'ตราสัญลักษณ์ Coffee Supporter สนับสนุนผู้พัฒนา', included: true },
      { text: 'แจ้งเตือนข่าวด่วนและไฮไลท์หุ้นสำคัญผ่าน Web Push', included: true },
      { text: 'สแกนเนอร์สัญญาณเทคนิค & งบการเงินเชิงลึก', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Investor',
    tagline: 'วิเคราะห์งบการเงินเชิงลึก + สแกนเนอร์สัญญาณทางเทคนิค',
    badge: 'ยอดนิยมที่สุด (129 บ.)',
    popular: true,
    priceMonthly: 129,
    priceYearly: 990, // ~82.5 THB/mo
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: 'var(--accent-blue)',
    accentBg: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    limits: {
      watchlistLimit: 150,
      aiOnDemandDailyLimit: 50,
      realtimeStreaming: true,
      lineAlerts: true,
      exportData: true,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์ทั้งหมดของระดับ Lite', included: true },
      { text: 'AI On-Demand: วิเคราะห์งบและประเมินมูลค่า 50 ครั้ง/วัน', included: true, highlight: true, badge: 'Smart AI' },
      { text: 'แจ้งเตือนราคาหุ้นและข่าวด่วนผ่าน LINE / Web Push', included: true, highlight: true, badge: 'LINE Alert' },
      { text: 'สร้างโฟลเดอร์ Watchlist แยกกลุ่มได้ไม่จำกัด (150 ตัว)', included: true },
      { text: 'ส่งออกข้อมูลราคาย้อนหลัง & ข่าวเป็น Excel / CSV', included: true },
      { text: 'สแกนหุ้น Momentum และกลุ่มอุตสาหกรรมเด่น', included: true },
    ],
  },
  {
    id: 'vip',
    name: 'VIP Trader',
    tagline: 'สำหรับเทรดเดอร์มืออาชีพ พร้อมเครื่องมือระดับสถาบัน',
    badge: 'สิทธิพิเศษสูงสุด',
    priceMonthly: 299,
    priceYearly: 2490, // ~207 THB/mo
    currency: '฿',
    periodText: 'บาท / เดือน',
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    limits: {
      watchlistLimit: 9999,
      aiOnDemandDailyLimit: 9999,
      realtimeStreaming: true,
      lineAlerts: true,
      exportData: true,
      adFree: true,
    },
    features: [
      { text: 'สิทธิประโยชน์ทั้งหมดของระดับ Pro', included: true },
      { text: 'AI On-Demand วิเคราะห์เจาะลึกงบ & Valuation ไม่จำกัด', included: true, highlight: true },
      { text: 'สแกนเนอร์หุ้น Volume ผิดปกติ + สัญญาณเทคนิค Breakout', included: true, highlight: true },
      { text: 'พอร์ตโฟลิโอจำลอง ติดตามกำไร/ขาดทุน (P/L) อัตโนมัติ', included: true },
      { text: 'Watchlist ไม่จำกัดจำนวนหุ้น', included: true },
      { text: 'สิทธิ์เข้าถึง Private API Endpoint ส่วนบุคคล', included: true, badge: 'VIP Only' },
      { text: 'ตราสัญลักษณ์ VIP Badge + ช่องทาง Support พิเศษ', included: true },
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
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
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
      { text: 'Watchlist ติดตามหุ้นไม่จำกัดจำนวน', included: true },
      { text: 'Export ข้อมูลและใช้งาน API แบบไร้ข้อจำกัด', included: true },
    ],
  },
];

