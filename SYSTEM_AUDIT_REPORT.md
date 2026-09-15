# 🔍 System Audit Report: Trigger & Dashboard System

## 1. Executive Summary
ระบบ **StockHomeTH** ปัจจุบันได้รับการออกแบบโดยเน้นแนวคิด **Code-First, AI-Last Architecture** และมีโครงสร้างพื้นฐานที่ครอบคลุมการประมวลผลข้อมูลการเงินหลายตลาด (SET & US Global) พร้อมระบบซิงค์ข้อมูลผ่าน Next.js App Router, Cron Jobs, Server-Sent Events (SSE), WebSocket/BroadcastChannel และ SQLite Data Lake

**จุดเด่นของระบบ:**
- **Multi-tier Fallback Architecture:** มีระบบสำรองข้อมูลราคาหลายชั้นที่ยืดหยุ่น เช่น การดึงราคาหุ้นผ่าน Yahoo Finance Bridge (`yfinanceBridge.ts`), Webull OpenAPI SDK (`webull_engine.py`), และ Supabase Vector Store
- **Multi-Layer Zero-Rejection Engine:** มีอัลกอริทึม Asset Ambiguity Engine และ Stock Pool Resolver รองรับการแมป Ticker และ Alias ทั้งภาษาไทย/อังกฤษ (เช่น SpaceX ➔ SPCX, ทองคำแท่ง ➔ THAI_GOLD)
- **High-Performance In-Memory Cache:** มีระบบ Anti-Spam Cooldown และ In-Memory Semantic Caching (`semanticCacheService.ts`) ช่วยลดภาระการเรียก External APIs และต้นทุน LLM Tokens

**ปัญหาใหญ่เร่งด่วนที่ต้องรีบแก้ไข (Critical & High Severity Flaws):**
1. **การรักษาความปลอดภัยของ Cron Trigger Endpoints (`CRON_SECRET` Authorization Bypass):** ในไฟล์ `src/app/api/cron/sync-market-pool/route.ts` และ `src/app/api/cron/process-stock-analysis/route.ts` มีการข้ามการตรวจสอบสิทธิ์ `cronSecret` หากสภาพแวดล้อมไม่ได้ตั้งค่าเป็น `production` หรือเมื่อส่งพารามิเตอร์ `?dev=true` หรือ `?key=` ผ่าน URL query string ทำให้ผู้ไม่หวังดีสามารถสแปมยิง Trigger เพื่อสกัดกั้น ทำลายแคช หรือทำ Denial of Service (DoS) บนระบบได้
2. **คอขวดและ Memory Leak บน Real-time Events Stream (SSE / BroadcastChannel):** ใน `src/app/api/sync/events/route.ts` และ `src/lib/services/realtimeSyncService.ts` มีการเปิดสตรีม Server-Sent Events (SSE) และ `setInterval` Heartbeat แบบ Unbounded หากไคลเอนต์มีการเชื่อมต่อหรือ Reconnect ซ้ำๆ โดยไม่มีการจำกัดจำนวน Connections หรือ Throttling จะส่งผลให้เกิด Node.js Event Loop Freeze และ Memory Leak
3. **การขาด Connection Pooling & Unbounded Batch Upserts:** ใน `src/lib/services/stockPoolService.ts` และ Cron Analysis Routes มีการสั่ง Upsert หรือ Query ข้อมูลหุ้นจำนวนมากพร้อมกันโดยไม่มีการแบ่ง Batch Chunking ส่งผลให้เกิด DB Connection Pool Exhaustion บน Supabase (HTTP 504 Gateway Timeout)
4. **ขาด React Error Boundaries ในหน้า Dashboard & Backoffice:** Components หน้า Dashboard เช่น `AdminBackofficeClient.tsx` ขาดการห่อหุ้มด้วย `ComponentErrorBoundary` ทำให้เมื่อข้อมูลจาก Realtime Stream คืนค่าผิดพลาด หรือเป็น `null/undefined` หน้าจอ Dashboard ทั้งหมดจะหยุดทำงานทันที (White Screen of Death)

---

## 2. Identified Issues & Architectural Flaws

### Issue 1: Unprotected Cron Trigger Endpoints & Timing Attack Vulnerability
- **ความรุนแรง:** `[CRITICAL]`
- **สาเหตุของปัญหา:**
  1. ในไฟล์ `src/app/api/cron/sync-market-pool/route.ts` และ `process-stock-analysis/route.ts` โค้ดเปิดช่องทางข้ามการตรวจสอบสิทธิ์เมื่อรันนอกโหมด `production` หรือรับพารามิเตอร์ `?dev=true`:
     ```typescript
     if (cronSecret && authHeader !== `Bearer ${cronSecret}` && url.searchParams.get('key') !== cronSecret) {
       if (process.env.NODE_ENV === 'production' && !url.searchParams.get('dev')) {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
       }
     }
     ```
  2. การเปรียบเทียบข้อความ `authHeader !== Bearer ${cronSecret}` ใช้ String Comparison แบบปกติ ซึ่งเสี่ยงต่อการถูกโจมตีด้วย Timing Attack เพื่อคาดเดาโทเค็น `CRON_SECRET`
- **ไฟล์ที่มีปัญหา:**
  - `src/app/api/cron/sync-market-pool/route.ts`
  - `src/app/api/cron/process-stock-analysis/route.ts`

### Issue 2: Unbounded SSE Subscriptions & Memory Leak in Event Bus
- **ความรุนแรง:** `[HIGH]`
- **สาเหตุของปัญหา:** ใน `src/app/api/sync/events/route.ts` สตรีม Server-Sent Events เปิดรับการเชื่อมต่อผ่าน `subscribeUserSync` และเริ่ม `setInterval` ส่ง Ping Heartbeat ทุก 20 วินาที หากไคลเอนต์ขาดการเชื่อมต่ออย่างไม่สมบูรณ์ (Abrupt Disconnect) หรือเมื่อเกิด Network Flickering ตัว `heartbeatTimer` และ Callback บันทึกใน `Map<string, Set<Subscriber>>` จะไม่ถูกทำลายอย่างถูกต้อง ทำให้เกิด Memory Leak และเพิ่ม CPU Utilization บน Node.js runtime
- **ไฟล์ที่มีปัญหา:**
  - `src/app/api/sync/events/route.ts`
  - `src/lib/services/serverSyncBroadcaster.ts`
  - `src/lib/services/realtimeSyncService.ts`

### Issue 3: Absence of Connection Pooling & Unbounded Database Upserts
- **ความรุนแรง:** `[HIGH]`
- **สาเหตุของปัญหา:** ใน `src/lib/services/stockPoolService.ts` การทำ `upsertStocksToPool` ส่งอาเรย์ข้อมูลหุ้นทั้งหมดรวดเดียวไปยัง Supabase PgVector Database หากจักรวาลหุ้นมีขนาดใหญ่เกิน 10,000 รายการ จะส่งผลให้ Connection Pool ของ Supabase เต็ม เกิด Timeout (504 Gateway Timeout) และการประมวลผล Cron พังกลางคัน
- **ไฟล์ที่มีปัญหา:**
  - `src/lib/services/stockPoolService.ts`
  - `src/app/api/cron/process-stock-analysis/route.ts`

### Issue 4: Missing Component Error Boundaries on Dashboard UI Widgets
- **ความรุนแรง:** `[MEDIUM]`
- **สาเหตุของปัญหา:** ในหน้า `src/app/hq-master-88/page.tsx` และ `src/components/client/AdminBackofficeClient.tsx` ไม่มี React Error Boundary เฉพาะจุดสำหรับห่อหุ้ม Widget แสดงราคา, สถิติ Quotas, และ Live Logs หากมีข้อมูล JSON payload ผิดรูป หรือ WebSocket Message มีค่า `undefined` จะส่งผลให้ React Render Tree ล่มทั้งหน้า
- **ไฟล์ที่มีปัญหา:**
  - `src/app/hq-master-88/page.tsx`
  - `src/components/client/AdminBackofficeClient.tsx`

---

## 3. Recommended Solutions (Software Engineering Best Practices)

### 3.1 Timing-Safe Verification & Strict Authorization Refactoring

**โค้ดเดิมที่พบปัญหา (`src/app/api/cron/sync-market-pool/route.ts`):**
```typescript
// ❌ ปัญหา: เปิดช่องทางให้ยิง Trigger ได้ฟรีเมื่อมี ?dev หรือนอก production และเปรียบเทียบแบบ insecure
if (cronSecret && authHeader !== `Bearer ${cronSecret}` && url.searchParams.get('key') !== cronSecret) {
  if (process.env.NODE_ENV === 'production' && !url.searchParams.get('dev')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
```

**โค้ดใหม่ที่ปรับปรุงแล้ว (`src/app/api/cron/sync-market-pool/route.ts`):**
```typescript
// 🛠️ โค้ดที่แก้ไขแล้ว: บังคับใช้ Constant-time Signature Verification เสมอ และยกเลิกการข้าม Auth
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron Security] CRON_SECRET is not configured in environment variables');
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!token || !safeCompare(token, cronSecret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized Trigger Request' }, { status: 401 });
  }

  // ดำเนินการ Trigger และ Ingest ข้อมูลอย่างปลอดภัย...
}
```

---

### 3.2 Robust SSE Heartbeat & Cleanup Refactoring

**โค้ดปรับปรุงระบบ SSE Stream (`src/app/api/sync/events/route.ts`):**
```typescript
// 🛠️ โค้ดที่แก้ไขแล้ว: จัดการ Resource Cleanup และ Error Catching อย่างรัดกุม
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId')?.trim();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const cleanUp = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      };

      const safeEnqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          cleanUp();
        }
      };

      // Initial PING
      safeEnqueue(`data: ${JSON.stringify({ type: 'PING', userId, payload: { connected: true }, timestamp: Date.now() })}\n\n`);

      // Subscribe user sync
      unsubscribe = subscribeUserSync(userId, (msg) => {
        safeEnqueue(`data: ${JSON.stringify(msg)}\n\n`);
      });

      // Heartbeat interval
      heartbeatTimer = setInterval(() => {
        safeEnqueue(`data: ${JSON.stringify({ type: 'PING', userId, payload: { heartbeat: true }, timestamp: Date.now() })}\n\n`);
      }, 20000);
    },
    cancel() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

---

### 3.3 Vitest Automated Test Suite for Trigger Security & Ingestion

ตัวอย่างไฟล์ทดสอบระบบ Trigger และความปลอดภัย (`src/app/api/cron/sync-market-pool/route.test.ts`):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/services/yfinanceBridge', () => ({
  fetchLiveStocksFromYFinance: vi.fn().mockResolvedValue([
    { ticker: 'PTT', name: 'PTT Public Company', price: 34.25, change: 0.5, currency: 'THB' },
  ]),
}));

vi.mock('@/lib/services/stockPoolService', () => ({
  upsertStocksToPool: vi.fn().mockResolvedValue(1),
}));

describe('Cron Trigger Security & Ingestion Suite', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test_secret_key_999');
  });

  it('should return 401 Unauthorized if Bearer token is missing', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Unauthorized/i);
  });

  it('should return 401 Unauthorized if Bearer token is invalid', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool', {
      headers: { authorization: 'Bearer invalid_secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 200 OK and trigger sync with valid Bearer token', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool', {
      headers: { authorization: 'Bearer test_secret_key_999' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedCount).toBe(1);
  });
});
```

---

## 4. Performance & Scalability Enhancements

### 1. Chunked Batch Processing & Connection Pooling
- **แนวทางแก้ไข:** ในการประมวลผล Trigger ข้อมูลหุ้นปริมาณมาก ควรทำ Chunking แบ่ง Batch ไม่เกิน 100-200 รายการต่อการบันทึกลง Supabase Database เพื่อไม่ให้เกินความสามารถของ Supabase PgVector Pool:
  ```typescript
  export async function chunkedBatchUpsert<T>(
    items: T[],
    chunkSize: number,
    processor: (chunk: T[]) => Promise<number>
  ): Promise<number> {
    let totalProcessed = 0;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      totalProcessed += await processor(chunk);
    }
    return totalProcessed;
  }
  ```

### 2. Client Memory Leak Prevention on Dashboard & Real-time Logs
- **แนวทางแก้ไข:** บนหน้า Dashboard และ Log Bus (`AdminBackofficeClient.tsx`) ควรกำหนดขีดจำกัดจำนวน Log Items สะสมไม่เกิน 100 - 150 รายการ เพื่อรักษาสภาพแวดล้อมการทำงานของ DOM ให้ราบรื่น และป้องกัน Memory Leak:
  ```typescript
  setSyncLogs((prevLogs) => {
    const updated = [newLogEntry, ...prevLogs];
    return updated.slice(0, 150); // 🔒 Cap max log items to 150 to keep UI responsive
  });
  ```

### 3. Database Indexing Strategy for Trigger Status
- **แนวทางแก้ไข:** สร้าง Compound Index บน PostgreSQL / Supabase สำหรับตาราง `stock_pool` เพื่อให้การค้นหา Trigger ในสถานะ `pending` รวดเร็วระดับ <2ms:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_stock_pool_status_updated
  ON stock_pool (analysis_status, last_updated DESC);
  ```

---
*รายงานนี้จัดทำขึ้นโดย Senior Software Engineer & System Architect สำหรับระบบ StockHomeTH*
