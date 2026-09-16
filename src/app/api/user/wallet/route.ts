import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GEMCOIN_SUBSCRIPTION_TIERS } from '@/config/gemCoinPackages';
import { broadcastSyncEvent } from '@/lib/services/serverSyncBroadcaster';
import { createAdminClient } from '@/lib/supabase/server';

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

async function syncToSupabase(wallet: UserWalletRecord) {
  try {
    const supabase = createAdminClient();
    await supabase.from('user_wallets').upsert({
      user_id: wallet.uid,
      tier: wallet.tier,
      daily_gem_coins: wallet.dailyGemCoins,
      daily_gem_coins_remaining: wallet.dailyGemCoinsRemaining,
      topup_gem_coins: wallet.topupGemCoins,
      last_reset_date: wallet.lastResetDate,
      updated_at: wallet.updatedAt,
    });
  } catch (err) {
    // Non-blocking fallback
  }
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

    const today = getTodayStr();
    let wallet: UserWalletRecord | null = null;

    // 1. Try reading from Supabase PostgreSQL first
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (!error && data) {
        wallet = {
          uid: data.user_id,
          tier: data.tier || 'free',
          dailyGemCoins: Number(data.daily_gem_coins) || 500,
          dailyGemCoinsRemaining: Number(data.daily_gem_coins_remaining) || 500,
          topupGemCoins: Number(data.topup_gem_coins) || 0,
          lastResetDate: data.last_reset_date || today,
          updatedAt: data.updated_at || new Date().toISOString(),
        };
      }
    } catch {
      // Ignore Supabase connection error and fall back to local store
    }

    const wallets = await readWallets();

    if (!wallet) {
      wallet = wallets[uid] || {
        uid,
        tier: 'free',
        dailyGemCoins: 500,
        dailyGemCoinsRemaining: 500,
        topupGemCoins: 0,
        lastResetDate: today,
        updatedAt: new Date().toISOString(),
      };
    }

    // Check midnight daily reset
    if (wallet.lastResetDate !== today) {
      const tierQuota = getTierDailyCoins(wallet.tier || 'free');
      wallet.dailyGemCoins = tierQuota;
      wallet.dailyGemCoinsRemaining = tierQuota;
      wallet.lastResetDate = today;
      wallet.updatedAt = new Date().toISOString();
    }

    // Keep both Supabase and local JSON file in sync
    wallets[uid] = wallet;
    await writeWallets(wallets);
    syncToSupabase(wallet);

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
    syncToSupabase(wallet);

    // If transaction details provided, record to user_wallet_transactions
    if (action === 'deduct' || action === 'credit') {
      try {
        const supabase = createAdminClient();
        await supabase.from('user_wallet_transactions').insert({
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: cleanUid,
          type: action,
          amount: Number(amount || 0),
          model_name: model || 'StockHome AI',
          summary: summary || '',
          created_at: new Date().toISOString(),
        });
      } catch {}
    }

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
