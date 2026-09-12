import fs from 'fs';
import path from 'path';

export interface GemAirdrop {
  id: string;
  targetEmail: string;
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
  claimed: boolean;
  claimedAt?: string;
  claimedByUserId?: string;
}

const AIRDROP_FILE = path.join(process.cwd(), 'gem_airdrops.json');

declare global {
  // eslint-disable-next-line no-var
  var __stockhome_gem_airdrops__: GemAirdrop[] | undefined;
}

function loadAirdrops(): GemAirdrop[] {
  if (global.__stockhome_gem_airdrops__) {
    return global.__stockhome_gem_airdrops__;
  }

  try {
    if (fs.existsSync(AIRDROP_FILE)) {
      const data = fs.readFileSync(AIRDROP_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        global.__stockhome_gem_airdrops__ = parsed;
        return parsed;
      }
    }
  } catch {}

  // Seed sample initial records
  const initial: GemAirdrop[] = [
    {
      id: 'airdrop_sample_1',
      targetEmail: 'vip.trader@example.com',
      amount: 10000,
      reason: 'โบนัสพิเศษต้อนรับเข้ากลุ่ม VIP Trader',
      createdBy: 'afillly002@gmail.com',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      claimed: true,
      claimedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  global.__stockhome_gem_airdrops__ = initial;
  return initial;
}

function saveAirdrops(airdrops: GemAirdrop[]) {
  global.__stockhome_gem_airdrops__ = airdrops;
  try {
    fs.writeFileSync(AIRDROP_FILE, JSON.stringify(airdrops, null, 2), 'utf-8');
  } catch {}
}

export function getAllAirdrops(): GemAirdrop[] {
  return loadAirdrops();
}

export function createAirdrop(params: {
  targetEmail: string;
  amount: number;
  reason?: string;
  createdBy?: string;
}): { success: boolean; airdrop?: GemAirdrop; message: string } {
  const email = params.targetEmail.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'กรุณาระบุอีเมลผู้รับให้ถูกต้อง' };
  }

  const numAmount = Number(params.amount);
  if (!numAmount || numAmount <= 0) {
    return { success: false, message: 'จำนวน GemCoins ต้องมากกว่า 0' };
  }

  const airdrops = loadAirdrops();
  const newAirdrop: GemAirdrop = {
    id: 'airdrop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    targetEmail: email,
    amount: Math.floor(numAmount),
    reason: params.reason?.trim() || 'ของขวัญจาก Admin & Dev',
    createdBy: params.createdBy || 'Admin',
    createdAt: new Date().toISOString(),
    claimed: false,
  };

  airdrops.unshift(newAirdrop);
  saveAirdrops(airdrops);

  return {
    success: true,
    airdrop: newAirdrop,
    message: `ส่ง GemCoins จำนวน ${newAirdrop.amount.toLocaleString()} เหรียญให้ ${email} สำเร็จแล้ว`,
  };
}

export function claimAirdropsForEmail(
  email: string,
  userId?: string
): { success: boolean; claimedCount: number; totalGemCoins: number; airdrops: GemAirdrop[]; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, claimedCount: 0, totalGemCoins: 0, airdrops: [], message: 'อีเมลไม่ถูกต้อง' };
  }

  const airdrops = loadAirdrops();
  const pending = airdrops.filter(
    (a) => !a.claimed && a.targetEmail.toLowerCase() === cleanEmail
  );

  if (pending.length === 0) {
    return { success: false, claimedCount: 0, totalGemCoins: 0, airdrops: [], message: 'ไม่มีรายการ GemCoins ค้างรับ' };
  }

  const now = new Date().toISOString();
  let totalGemCoins = 0;
  for (const a of pending) {
    a.claimed = true;
    a.claimedAt = now;
    if (userId) a.claimedByUserId = userId;
    totalGemCoins += a.amount;
  }

  saveAirdrops(airdrops);

  return {
    success: true,
    claimedCount: pending.length,
    totalGemCoins,
    airdrops: pending,
    message: `คุณได้รับ GemCoins จาก Admin จำนวน ${totalGemCoins.toLocaleString()} Coins เรียบร้อยแล้ว!`,
  };
}
