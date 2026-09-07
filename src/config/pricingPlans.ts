export interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  badge?: string;
}

export interface PricingPlan {
  id: 'free' | 'lite' | 'pro' | 'vip';
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
    tagline: 'ครบเครื่องเรื่องตลาดหุ้น เริ่มต้นลงทุนได้อย่างมั่นใจ',
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
      aiOnDemandDailyLimit: 2,
      realtimeStreaming: true,
      lineAlerts: false,
      exportData: false,
      adFree: false,
    },
    features: [
      { text: 'เข้าถึงข้อมูลหุ้นครบ 10,689+ ตัว (SET, mai, US)', included: true, highlight: true },
      { text: 'ราคาหุ้นสด Real-time จาก Master Cache', included: true },
      { text: 'อ่านข่าวหุ้นไทย & ข่าว US แปลไทยไม่อั้น', included: true, highlight: true },
      { text: 'กราฟราคา และ Sparkline 7 วัน', included: true },
      { text: 'สร้าง Watchlist ติดตามหุ้นโปรดได้สูงสุด 25 ตัว', included: true },
      { text: 'AI Market Briefing สรุปภาพรวมตลาดประจำวัน', included: true },
      { text: 'ประสบการณ์ใช้งาน Clean UI ไร้โฆษณา', included: false },
      { text: 'แจ้งเตือนราคาหุ้นทะลุแนวต้านผ่าน LINE Notify', included: false },
    ],
  },
  {
    id: 'lite',
    name: 'Lite Supporter',
    tagline: 'ราคาเบาๆ สบายกระเป๋า ไร้โฆษณา พร้อม AI ถามตอบรายตัว',
    badge: '⚡ คุ้มค่าเริ่มต้น (250 บ./ปี)',
    priceMonthly: 39,
    priceYearly: 250, // ~20.8 THB/mo!
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
      { text: 'สิทธิประโยชน์ทั้งหมดของสายฟรี', included: true },
      { text: '✨ ประสบการณ์ใช้งาน Clean UI ไร้โฆษณา 100%', included: true, highlight: true, badge: 'Ad-Free' },
      { text: '🤖 AI On-Demand: สั่งวิเคราะห์หุ้นรายตัวได้ 10 ครั้ง/วัน', included: true, highlight: true, badge: 'AI Starter' },
      { text: '📊 ขยาย Watchlist ติดตามหุ้นได้สูงสุด 60 ตัว', included: true },
      { text: '🔔 แจ้งเตือนข่าวด่วนและไฮไลท์หุ้นสำคัญผ่าน Web Push', included: true },
      { text: '🎖️ ตราสัญลักษณ์ Supporter Badge สนับสนุนผู้พัฒนา', included: true },
      { text: 'แจ้งเตือนราคาหุ้นและข่าวด่วนเข้า LINE Notify สด', included: false },
      { text: 'ส่งออกข้อมูลราคาและงบเป็น Excel / CSV', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Investor',
    tagline: 'มี AI ส่วนตัวช่วยวิเคราะห์ + แจ้งเตือนหุ้นสดเข้า LINE',
    badge: '⭐ ยอดนิยมที่สุด',
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
      { text: '🤖 AI On-Demand: วิเคราะห์งบและประเมินมูลค่า 50 ครั้ง/วัน', included: true, highlight: true, badge: 'Smart AI' },
      { text: '🔔 แจ้งเตือนราคาหุ้นและข่าวด่วนผ่าน LINE / Web Push', included: true, highlight: true, badge: 'LINE Alert' },
      { text: '📊 สร้างโฟลเดอร์ Watchlist แยกกลุ่มได้ไม่จำกัด (150 ตัว)', included: true },
      { text: '🚀 ส่งออกข้อมูลราคาย้อนหลัง & ข่าวเป็น Excel / CSV', included: true },
      { text: '📈 สแกนหุ้น Momentum และกลุ่มอุตสาหกรรมเด่น', included: true },
    ],
  },
  {
    id: 'vip',
    name: 'VIP Trader',
    tagline: 'สำหรับเทรดเดอร์มืออาชีพ พร้อมเครื่องมือระดับสถาบัน',
    badge: '👑 สิทธิพิเศษสูงสุด',
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
      { text: '🤖 AI On-Demand วิเคราะห์เจาะลึกงบ & Valuation ไม่จำกัด', included: true, highlight: true },
      { text: '📈 สแกนเนอร์หุ้น Volume ผิดปกติ + สัญญาณเทคนิค Breakout', included: true, highlight: true },
      { text: '💼 พอร์ตโฟลิโอจำลอง ติดตามกำไร/ขาดทุน (P/L) อัตโนมัติ', included: true },
      { text: '⚡ Watchlist ไม่จำกัดจำนวนหุ้น', included: true },
      { text: '👑 สิทธิ์เข้าถึง Private API Endpoint ส่วนบุคคล', included: true, badge: 'VIP Only' },
      { text: '🎖️ ตราสัญลักษณ์ VIP Badge + ช่องทาง Support พิเศษ', included: true },
    ],
  },
];
