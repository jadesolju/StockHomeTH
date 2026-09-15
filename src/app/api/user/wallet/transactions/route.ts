import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { broadcastSyncEvent } from '@/lib/services/serverSyncBroadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface UserTransactionRecord {
  id: string;
  timestamp: string;
  model: string;
  gemCoinsUsed: number;
  source: 'daily' | 'topup';
  summary?: string;
  platform?: string;
}

const TX_FILE_PATH = path.join(process.cwd(), 'user_wallet_transactions.json');

async function readAllTransactions(): Promise<Record<string, UserTransactionRecord[]>> {
  try {
    const data = await fs.readFile(TX_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeAllTransactions(data: Record<string, UserTransactionRecord[]>): Promise<void> {
  try {
    await fs.writeFile(TX_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WalletTransactionsAPI] Failed to write transactions file:', err);
  }
}

// GET /api/user/wallet/transactions?uid=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid')?.trim();

    if (!uid) {
      return NextResponse.json({
        success: true,
        transactions: [],
        message: 'Guest or empty UID',
      });
    }

    const allTx = await readAllTransactions();
    const userTx = allTx[uid] || [];

    return NextResponse.json({
      success: true,
      transactions: userTx,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching transactions' },
      { status: 500 }
    );
  }
}

// POST /api/user/wallet/transactions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, transaction, transactions } = body;

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const cleanUid = uid.trim();
    const allTx = await readAllTransactions();
    let currentTx = allTx[cleanUid] || [];

    if (Array.isArray(transactions) && transactions.length > 0) {
      // Bulk merge
      const txMap = new Map<string, UserTransactionRecord>();
      for (const t of currentTx) {
        if (t && t.id) txMap.set(t.id, t);
      }
      for (const t of transactions) {
        if (t && t.id) txMap.set(t.id, t);
      }
      currentTx = Array.from(txMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else if (transaction && transaction.id) {
      // Single transaction append
      const exists = currentTx.some((t) => t.id === transaction.id);
      if (!exists) {
        currentTx.unshift(transaction);
      }
      currentTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Keep top 100 transactions per user
    const capped = currentTx.slice(0, 100);
    allTx[cleanUid] = capped;
    await writeAllTransactions(allTx);

    // Broadcast real-time transaction event
    broadcastSyncEvent(cleanUid, 'WALLET_UPDATED', { transactions: capped });

    return NextResponse.json({
      success: true,
      transactions: capped,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error recording transaction' },
      { status: 500 }
    );
  }
}
