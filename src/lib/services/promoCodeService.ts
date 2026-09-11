// In-memory + persisted promo codes store for Dev/Admin
export interface PromoCode {
  code: string;
  gemCoins: number;
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: string | null; // ISO string or null for permanent
  redeemedUsers: string[]; // User IDs or fingerprints that have redeemed this
  description: string;
  isActive: boolean;
  createdAt: string;
}

// Default seeded promo codes created by Dev/Admin for launch & testing
const initialPromoCodes: PromoCode[] = [
  {
    code: 'DEV-5000',
    gemCoins: 5000,
    maxRedemptions: 100,
    currentRedemptions: 0,
    expiresAt: null,
    redeemedUsers: [],
    description: 'รหัสสำหรับผู้พัฒนาและทดสอบระบบ (+5,000 GemCoins)',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    code: 'STOCKHOME-1000',
    gemCoins: 1000,
    maxRedemptions: 500,
    currentRedemptions: 0,
    expiresAt: null,
    redeemedUsers: [],
    description: 'โค้ดต้อนรับสมาชิกใหม่ StockHomeTH (+1,000 GemCoins)',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    code: 'EARLYBIRD-500',
    gemCoins: 500,
    maxRedemptions: 1000,
    currentRedemptions: 0,
    expiresAt: null,
    redeemedUsers: [],
    description: 'โปรโมชั่นเปิดตัว 1 เดือนแรก (+500 GemCoins)',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    code: 'VIP-WHALE-50000',
    gemCoins: 50000,
    maxRedemptions: 10,
    currentRedemptions: 0,
    expiresAt: null,
    redeemedUsers: [],
    description: 'โค้ดพิเศษสำหรับนักลงทุนพอร์ตใหญ่ระดับ VIP (+50,000 GemCoins)',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Global cache for runtime persistence in Node.js server
declare global {
  // eslint-disable-next-line no-var
  var __stockhome_promo_codes__: PromoCode[] | undefined;
}

export function getPromoCodesStore(): PromoCode[] {
  if (!global.__stockhome_promo_codes__) {
    global.__stockhome_promo_codes__ = [...initialPromoCodes];
  }
  return global.__stockhome_promo_codes__;
}

export function findPromoCode(code: string): PromoCode | undefined {
  const store = getPromoCodesStore();
  const normalized = code.trim().toUpperCase();
  return store.find((p) => p.code.toUpperCase() === normalized);
}

export function redeemCodeForUser(
  code: string,
  userId: string
): { success: boolean; message: string; gemCoins?: number } {
  const promo = findPromoCode(code);
  if (!promo) {
    return { success: false, message: 'ไม่พบรหัสโปรโมชั่นนี้ หรือรหัสไม่ถูกต้อง' };
  }

  if (!promo.isActive) {
    return { success: false, message: 'รหัสโปรโมชั่นนี้ถูกปิดการใช้งานแล้ว' };
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { success: false, message: 'รหัสโปรโมชั่นนี้หมดอายุการใช้งานแล้ว' };
  }

  if (promo.currentRedemptions >= promo.maxRedemptions) {
    return { success: false, message: 'รหัสโปรโมชั่นนี้ถูกแลกรับสิทธิ์ครบตามจำนวนแล้ว' };
  }

  const cleanUserId = userId?.trim() || 'anonymous';
  if (promo.redeemedUsers.includes(cleanUserId)) {
    return { success: false, message: 'คุณเคยใช้สิทธิ์แลกรับรหัสโปรโมชั่นนี้ไปแล้ว' };
  }

  // Deduct/Mark redeemed
  promo.currentRedemptions += 1;
  promo.redeemedUsers.push(cleanUserId);

  return {
    success: true,
    message: `ยินดีด้วย! คุณได้รับ ${promo.gemCoins.toLocaleString()} GemCoins เข้าสู่กระเป๋า Top-up สำเร็จ`,
    gemCoins: promo.gemCoins,
  };
}

export function createPromoCode(
  newCode: Omit<PromoCode, 'currentRedemptions' | 'redeemedUsers' | 'createdAt'>
): { success: boolean; promo?: PromoCode; message: string } {
  const store = getPromoCodesStore();
  const normalized = newCode.code.trim().toUpperCase();

  if (store.some((p) => p.code.toUpperCase() === normalized)) {
    return { success: false, message: `รหัส "${normalized}" มีอยู่ในระบบแล้ว` };
  }

  const created: PromoCode = {
    ...newCode,
    code: normalized,
    currentRedemptions: 0,
    redeemedUsers: [],
    createdAt: new Date().toISOString(),
  };

  store.unshift(created);
  return { success: true, promo: created, message: `สร้างรหัส "${normalized}" สำเร็จ` };
}
