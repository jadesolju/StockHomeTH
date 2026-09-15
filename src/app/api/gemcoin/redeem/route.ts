import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { redeemCodeForUser } from '@/lib/services/promoCodeService';
import { broadcastSyncEvent } from '@/lib/services/serverSyncBroadcaster';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId, userEmail, email } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสโปรโมชั่น' },
        { status: 400 }
      );
    }

    const effectiveEmail = userEmail || email || '';
    const result = redeemCodeForUser(code, userId || 'local_user', effectiveEmail);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    if (userId && result.gemCoins) {
      const cleanUid = userId.trim();
      const addedCoins = result.gemCoins;

      // 1. Update Server Wallet
      try {
        const walletFile = path.join(process.cwd(), 'user_wallets.json');
        let wallets: Record<string, any> = {};
        try {
          const raw = await fs.readFile(walletFile, 'utf-8');
          wallets = JSON.parse(raw);
        } catch {}

        const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        const wallet = wallets[cleanUid] || {
          uid: cleanUid,
          tier: 'free',
          dailyGemCoins: 500,
          dailyGemCoinsRemaining: 500,
          topupGemCoins: 0,
          lastResetDate: today,
          updatedAt: new Date().toISOString(),
        };

        wallet.topupGemCoins = (wallet.topupGemCoins || 0) + addedCoins;
        wallet.updatedAt = new Date().toISOString();
        wallets[cleanUid] = wallet;
        await fs.writeFile(walletFile, JSON.stringify(wallets, null, 2), 'utf-8');

        // 2. Append to Server Transaction Ledger
        const txFile = path.join(process.cwd(), 'user_wallet_transactions.json');
        let allTx: Record<string, any[]> = {};
        try {
          const txRaw = await fs.readFile(txFile, 'utf-8');
          allTx = JSON.parse(txRaw);
        } catch {}

        const currentTx = allTx[cleanUid] || [];
        const logEntry = {
          id: 'redeem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          timestamp: new Date().toISOString(),
          model: 'Promo Voucher',
          gemCoinsUsed: 0,
          source: 'topup',
          summary: `แลกรับรหัสโปรโมชั่น "${code.toUpperCase()}" (+${addedCoins.toLocaleString()} GemCoins)`,
        };
        currentTx.unshift(logEntry);
        allTx[cleanUid] = currentTx.slice(0, 100);
        await fs.writeFile(txFile, JSON.stringify(allTx, null, 2), 'utf-8');

        // 3. Broadcast real-time update
        broadcastSyncEvent(cleanUid, 'WALLET_UPDATED', {
          action: 'promo_redeem',
          gemCoinsAdded: addedCoins,
          code: code.toUpperCase(),
          topupGemCoins: wallet.topupGemCoins,
          transactions: allTx[cleanUid],
        });
      } catch (err) {
        console.warn('[RedeemAPI] Failed to update server wallet ledger:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      gemCoinsAdded: result.gemCoins,
    });
  } catch (err: any) {
    console.error('Redeem Code Error:', err);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการแลกรับรหัส กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
