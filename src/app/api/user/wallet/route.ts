import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GEMCOIN_SUBSCRIPTION_TIERS } from '@/config/gemCoinPackages';
import { broadcastSyncEvent } from '@/lib/services/serverSyncBroadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface UserWalletRecord {
  uid: string;
  tier: string;
  dailyGemCoins: number;
  dailyGemCoinsRemaining: number;
  topupGemCoins: number;
  lastResetDate: string;
  updatedAt: string;
}

const WALLET_FILE_PATH = path.join(process.cwd(), 'user_wallets.json');

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function readWallets(): Promise<Record<string, UserWalletRecord>> {
  try {
    const data = await fs.readFile(WALLET_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeWallets(wallets: Record<string, UserWalletRecord>): Promise<void> {
  try {
    await fs.writeFile(WALLET_FILE_PATH, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UserWalletAPI] Failed to write wallets file:', err);
  }
}

function getTierDailyCoins(tier: string): number {
  const t = GEMCOIN_SUBSCRIPTION_TIERS.find((item) => item.tier === tier);
  return t ? t.dailyGemCoins : 500;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid')?.trim();

    if (!uid) {
      return NextResponse.json({
        success: true,
        isGuest: true,
        dailyCoins: 0,
        topupCoins: 0,
        message: 'Guest session active',
      });
    }

    const wallets = await readWallets();
    const today = getTodayStr();

    let wallet = wallets[uid];
    if (!wallet) {
      wallet = {
        uid,
        tier: 'free',
        dailyGemCoins: 500,
        dailyGemCoinsRemaining: 500,
        topupGemCoins: 0,
        lastResetDate: today,
        updatedAt: new Date().toISOString(),
      };
      wallets[uid] = wallet;
      await writeWallets(wallets);
    } else {
      // Check midnight daily reset
      if (wallet.lastResetDate !== today) {
        const tierQuota = getTierDailyCoins(wallet.tier || 'free');
        wallet.dailyGemCoins = tierQuota;
        wallet.dailyGemCoinsRemaining = tierQuota;
        wallet.lastResetDate = today;
        wallet.updatedAt = new Date().toISOString();
        wallets[uid] = wallet;
        await writeWallets(wallets);
      }
    }

    return NextResponse.json({
      success: true,
      wallet,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching user wallet' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, action, amount, model, summary, tier, newDaily, newTopup } = body;

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const cleanUid = uid.trim();
    const wallets = await readWallets();
    const today = getTodayStr();

    let wallet = wallets[cleanUid] || {
      uid: cleanUid,
      tier: 'free',
      dailyGemCoins: 500,
      dailyGemCoinsRemaining: 500,
      topupGemCoins: 0,
      lastResetDate: today,
      updatedAt: new Date().toISOString(),
    };

    // Check midnight reset before applying action
    if (wallet.lastResetDate !== today) {
      const tierQuota = getTierDailyCoins(wallet.tier || 'free');
      wallet.dailyGemCoins = tierQuota;
      wallet.dailyGemCoinsRemaining = tierQuota;
      wallet.lastResetDate = today;
    }

    if (action === 'deduct') {
      const deductAmt = Number(amount || 0);
      if (deductAmt > 0) {
        let deductFromDaily = Math.min(wallet.dailyGemCoinsRemaining, deductAmt);
        let remainingToDeduct = deductAmt - deductFromDaily;
        let deductFromTopup = Math.min(wallet.topupGemCoins, remainingToDeduct);

        wallet.dailyGemCoinsRemaining = Math.max(0, wallet.dailyGemCoinsRemaining - deductFromDaily);
        wallet.topupGemCoins = Math.max(0, wallet.topupGemCoins - deductFromTopup);
      } else if (newDaily !== undefined && newTopup !== undefined) {
        wallet.dailyGemCoinsRemaining = Number(newDaily);
        wallet.topupGemCoins = Number(newTopup);
      }
      wallet.updatedAt = new Date().toISOString();
    } else if (action === 'credit') {
      const creditAmt = Number(amount || 0);
      if (creditAmt > 0) {
        wallet.topupGemCoins = (wallet.topupGemCoins || 0) + creditAmt;
      } else if (newTopup !== undefined) {
        wallet.topupGemCoins = Number(newTopup);
      }
      wallet.updatedAt = new Date().toISOString();
    } else if (action === 'setTier' && tier) {
      wallet.tier = tier;
      const tierQuota = getTierDailyCoins(tier);
      wallet.dailyGemCoins = tierQuota;
      wallet.dailyGemCoinsRemaining = Math.max(wallet.dailyGemCoinsRemaining, tierQuota);
      wallet.updatedAt = new Date().toISOString();
    } else if (action === 'sync') {
      if (typeof newDaily === 'number') wallet.dailyGemCoinsRemaining = newDaily;
      if (typeof newTopup === 'number') wallet.topupGemCoins = newTopup;
      wallet.updatedAt = new Date().toISOString();
    }

    wallets[cleanUid] = wallet;
    await writeWallets(wallets);

    // Broadcast real-time sync event to all active devices (PC, Mobile, Tablet)
    broadcastSyncEvent(cleanUid, 'WALLET_UPDATED', wallet);

    return NextResponse.json({
      success: true,
      wallet,
    });
  } catch (err: any) {
    console.error('[User Wallet POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing user wallet action' },
      { status: 500 }
    );
  }
}
