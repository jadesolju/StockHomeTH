import fs from 'fs';
import path from 'path';

// In-memory + persisted promo codes store for Dev/Admin
export interface PromoCode {
  code: string;
  gemCoins: number;
  maxRedemptions: number;
  currentRedemptions: number;
  redemptionsCount?: number; // Alias field for UI compatibility
  expiresAt: string | null; // ISO string or null for permanent
  redeemedUsers: string[]; // User IDs or fingerprints that have redeemed this
  description: string;
  isActive: boolean;
  createdAt: string;
}

const PROMO_CODES_FILE = path.join(process.cwd(), 'promo_codes.json');

// Default seeded promo codes created by Dev/Admin for launch & testing
const initialPromoCodes: PromoCode[] = [
  {
    code: 'DEV-5000',
    gemCoins: 5000,
    maxRedemptions: 100,
    currentRedemptions: 0,
    redemptionsCount: 0,
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
    redemptionsCount: 0,
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
    redemptionsCount: 0,
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
    redemptionsCount: 0,
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

function loadPromoCodes(): PromoCode[] {
  if (global.__stockhome_promo_codes__) {
    return global.__stockhome_promo_codes__;
  }

  try {
    if (fs.existsSync(PROMO_CODES_FILE)) {
      const data = fs.readFileSync(PROMO_CODES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const loaded = parsed.map((p: any) => ({
          ...p,
          currentRedemptions: p.currentRedemptions ?? p.redemptionsCount ?? p.redeemedUsers?.length ?? 0,
          redemptionsCount: p.currentRedemptions ?? p.redemptionsCount ?? p.redeemedUsers?.length ?? 0,
          redeemedUsers: Array.isArray(p.redeemedUsers) ? p.redeemedUsers : [],
        }));
        global.__stockhome_promo_codes__ = loaded;
        return loaded;
      }
    }
  } catch {}

  const initial = initialPromoCodes.map((p) => ({
    ...p,
    redemptionsCount: p.currentRedemptions,
  }));
  global.__stockhome_promo_codes__ = initial;
  savePromoCodes(initial);
  return initial;
}

function savePromoCodes(codes: PromoCode[]) {
  global.__stockhome_promo_codes__ = codes;
  try {
    fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify(codes, null, 2), 'utf-8');
  } catch {}
}

export function getPromoCodesStore(): PromoCode[] {
  return loadPromoCodes();
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
  const store = getPromoCodesStore();
  const normalized = code.trim().toUpperCase();
  const promo = store.find((p) => p.code.toUpperCase() === normalized);

  if (!promo) {
    return { success: false, message: 'ไม่พบรหัสโปรโมชั่นนี้ หรือรหัสไม่ถูกต้อง' };
  }

  if (!promo.isActive) {
    return { success: false, message: 'รหัสโปรโมชั่นนี้ถูกปิดการใช้งานแล้ว' };
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { success: false, message: 'รหัสโปรโมชั่นนี้หมดอายุการใช้งานแล้ว' };
  }

  const currentCount = promo.currentRedemptions ?? promo.redeemedUsers?.length ?? 0;

  if (currentCount >= promo.maxRedemptions) {
    return { success: false, message: 'รหัสโปรโมชั่นนี้ถูกแลกรับสิทธิ์ครบตามจำนวนแล้ว' };
  }

  const cleanUserId = userId?.trim() || 'anonymous';
  if (promo.redeemedUsers.includes(cleanUserId)) {
    return { success: false, message: 'คุณเคยใช้สิทธิ์แลกรับรหัสโปรโมชั่นนี้ไปแล้ว' };
  }

  // Deduct/Mark redeemed
  promo.currentRedemptions = currentCount + 1;
  promo.redemptionsCount = promo.currentRedemptions;
  promo.redeemedUsers.push(cleanUserId);

  savePromoCodes(store);

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
    redemptionsCount: 0,
    redeemedUsers: [],
    createdAt: new Date().toISOString(),
  };

  store.unshift(created);
  savePromoCodes(store);
  return { success: true, promo: created, message: `สร้างรหัส "${normalized}" สำเร็จ` };
}

export function deletePromoCode(code: string): { success: boolean; message: string } {
  const store = getPromoCodesStore();
  const normalized = code.trim().toUpperCase();
  const index = store.findIndex((p) => p.code.toUpperCase() === normalized);

  if (index !== -1) {
    store.splice(index, 1);
    savePromoCodes(store);
    return { success: true, message: `ลบรหัส "${normalized}" เรียบร้อยแล้ว` };
  }
  return { success: false, message: 'ไม่พบรหัสที่ระบุ' };
}
