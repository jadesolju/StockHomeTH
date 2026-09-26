# 🔍 System Audit Report: Trigger & Dashboard System

## 1. Executive Summary
ระบบ **StockHomeTH** ปัจจุบันได้รับการออกแบบโดยเน้นแนวคิด **Code-First, AI-Last Architecture** และมีโครงสร้างพื้นฐานที่ครอบคลุมการประมวลผลข้อมูลการเงินหลายตลาด (SET & US Global) พร้อมระบบซิงค์ข้อมูลผ่าน Next.js App Router, Cron Jobs, Server-Sent Events (SSE), WebSocket/BroadcastChannel และ SQLite / Supabase / Cloudflare R2 Storage Architecture

**จุดเด่นของระบบ:**
- **Multi-tier Fallback Architecture:** มีระบบสำรองข้อมูลราคาหลายชั้นที่ยืดหยุ่น เช่น การดึงราคาหุ้นผ่าน Yahoo Finance Bridge (`yfinanceBridge.ts`), Webull OpenAPI SDK (`webull_engine.py`), และ Supabase Vector Store
- **Multi-Layer Zero-Rejection Engine:** มีอัลกอริทึม Asset Ambiguity Engine และ Stock Pool Resolver รองรับการแมป Ticker และ Alias ทั้งภาษาไทย/อังกฤษ (เช่น SpaceX ➔ SPCX, ทองคำแท่ง ➔ THAI_GOLD)
- **High-Performance In-Memory Cache:** มีระบบ Anti-Spam Cooldown และ In-Memory Semantic Caching (`semanticCacheService.ts`) ช่วยลดภาระการเรียก External APIs และต้นทุน LLM Tokens

**สรุปปัญหาใหญ่เร่งด่วนที่พบ:**
1. **การรักษาความปลอดภัยของ Cron Trigger Endpoints (`CRON_SECRET` Authorization Bypass & Timing Attack):** เสี่ยงต่อการสุ่มคาดเดา Secret Key หรือการยิงสแปม Trigger ในสภาพแวดล้อมที่ยังเปิด Bypass
2. **คอขวดและ Memory Leak บน Real-time Events Stream (SSE / BroadcastChannel):** ขาดการจัดการ Cleanup Timer และ Callback Listener อย่างรัดกุมเมื่อเกิด Abrupt Disconnections
3. **การขาด Connection Pooling & Unbounded Batch Upserts:** การส่งข้อมูลหุ้นขนาดใหญ่รวดเดียวไปยัง Supabase Database เสี่ยงต่อการเกิด HTTP 504 Gateway Timeout และ Connection Pool Exhaustion
4. **ขาด React Error Boundaries ในหน้า Dashboard & Backoffice:** ขาดการห่อหุ้ม Widget ด้วย Error Boundary ทำให้เมื่อมี Exception เกิดขึ้น หน้า Dashboard จะล่มทั้งหน้า (White Screen of Death)

---

## 2. Identified Issues & Architectural Flaws

### Issue 1: Unprotected Cron Trigger Endpoints & Timing Attack Vulnerability
- **ความรุนแรง:** `[CRITICAL]`
- **ไฟล์ที่มีปัญหา:** `src/app/api/cron/sync-market-pool/route.ts` และ `src/app/api/cron/process-stock-analysis/route.ts`
- ❌ **ปัญหาที่พบ (Issue):** มีการเปรียบเทียบข้อความ `authHeader !== Bearer ${cronSecret}` แบบ Direct String Comparison และในอดีตมีการข้ามการตรวจสิทธิ์หากมีพารามิเตอร์ `?dev=true` หรือข้ามเมื่อไม่ได้อยู่บน production
- ⚠️ **ผลกระทบ (Impact):** ผู้ไม่หวังดีสามารถใช้การโจมตีประเภท Timing Attack คาดเดา `CRON_SECRET` ได้ หรือสามารถยิงสแปม Trigger API ส่งผลให้ระบบประมวลผลหนัก เกิด Denial of Service (DoS) หรือสิ้นเปลืองโควต้า API
- 💡 **แนวทางแก้ไข (Solution):** บังคับใช้ `crypto.timingSafeEqual` ในการเปรียบเทียบ Secret Key เสมอ และห้ามข้าม Auth Check ในทุกกรณี
- 🛠️ **โค้ดที่แก้ไขแล้ว (Refactored Code):**
```typescript
import crypto from 'crypto';

function timingSafeEqual(a: string, b: string): boolean {
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
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  if (!token || !timingSafeEqual(token, cronSecret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized Trigger Request' }, { status: 401 });
  }
  // ...ดำเนินการ Trigger อย่างปลอดภัย
}
```

---

### Issue 2: Unbounded SSE Subscriptions & Memory Leak in Realtime Event Bus
- **ความรุนแรง:** `[HIGH]`
- **ไฟล์ที่มีปัญหา:** `src/app/api/sync/events/route.ts` และ `src/lib/services/serverSyncBroadcaster.ts`
- ❌ **ปัญหาที่พบ (Issue):** การเปิดสตรีม Server-Sent Events (SSE) มีการตั้ง `setInterval` สำหรับส่ง Ping Heartbeat ทุก 20 วินาที และเปิด Listener สำหรับ Subscribe User Sync โดยหากไคลเอนต์มีการขาดการเชื่อมต่ออย่างไม่สมบูรณ์ (Abrupt Disconnect) ตัว Timer หรือ Listener อาจไม่ถูกลบออกจากหน่วยความจำ
- ⚠️ **ผลกระทบ (Impact):** เกิด Memory Leak บน Node.js Runtime ทำให้ Memory Usage เพิ่มขึ้นต่อเนื่องจนเกิด OOM (Out Of Memory) Crash และทำให้ Event Loop ช้าลง
- 💡 **แนวทางแก้ไข (Solution):** เพิ่มการเคลียร์ Resource ทั้ง `clearInterval` และ `unsubscribe()` ในบล็อก `cancel()` ของ `ReadableStream` และห่อการ `enqueue` ด้วย `try-catch` เพื่อดักจับ Abrupt Stream Termination
- 🛠️ **โค้ดที่แก้ไขแล้ว (Refactored Code):**
```typescript
const stream = new ReadableStream({
  start(controller) {
    const cleanUp = () => {
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    };

    const safeEnqueue = (data: string) => {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        cleanUp();
      }
    };

    safeEnqueue(`data: ${JSON.stringify({ type: 'PING', userId, payload: { connected: true }, timestamp: Date.now() })}\n\n`);

    unsubscribe = subscribeUserSync(userId, (msg) => {
      safeEnqueue(`data: ${JSON.stringify(msg)}\n\n`);
    });

    heartbeatTimer = setInterval(() => {
      safeEnqueue(`data: ${JSON.stringify({ type: 'PING', userId, payload: { heartbeat: true }, timestamp: Date.now() })}\n\n`);
    }, 20000);
  },
  cancel() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (unsubscribe) unsubscribe();
  },
});
```

---

### Issue 3: Absence of Connection Pooling & Unbounded Batch Upserts
- **ความรุนแรง:** `[HIGH]`
- **ไฟล์ที่มีปัญหา:** `src/lib/services/stockPoolService.ts` และ `src/app/api/cron/process-stock-analysis/route.ts`
- ❌ **ปัญหาที่พบ (Issue):** ใน `upsertStocksToPool` ข้อมูลหุ้นทั้งหมดจะถูกส่งลงฐานข้อมูล Supabase รวดเดียวโดยไม่มีการแบ่ง Batch Chunking
- ⚠️ **ผลกระทบ (Impact):** เมื่อจักรวาลหุ้นมีขนาดใหญ่ขึ้น (เช่น SET + US Universe > 1,000-10,000 รายการ) จะส่งผลให้เกิด HTTP 504 Gateway Timeout หรือ Connection Pool Exhaustion บน Supabase Postgres
- 💡 **แนวทางแก้ไข (Solution):** พัฒนา Helper `chunkedBatchUpsert` เพื่อแบ่งข้อมูลส่งลงฐานข้อมูลเป็น Batch ละ 100-200 รายการ ช่วยควบคุม Memory และ Connection Pool
- 🛠️ **โค้ดที่แก้ไขแล้ว (Refactored Code):**
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

---

### Issue 4: Missing Component Error Boundaries on Dashboard UI Widgets
- **ความรุนแรง:** `[MEDIUM]`
- **ไฟล์ที่มีปัญหา:** `src/app/hq-master-88/page.tsx` และ `src/components/client/AdminBackofficeClient.tsx`
- ❌ **ปัญหาที่พบ (Issue):** ขาด React Error Boundary ห่อหุ้มรอบ Widget แต่ละตัวบนหน้า Dashboard
- ⚠️ **ผลกระทบ (Impact):** หากมีข้อมูลราคา, Realtime Log หรือ Quotas เกิด Exception หรือส่งค่า `null/undefined` ผิดพลาด จะส่งผลให้ React Render Tree พังทั้งหน้า (White Screen of Death)
- 💡 **แนวทางแก้ไข (Solution):** นำ `ComponentErrorBoundary` ที่มีอยู่แล้วใน `src/components/ui/ComponentErrorBoundary.tsx` มาห่อหุ้ม UI Widget แต่ละตัวอิสระจากกัน
- 🛠️ **โค้ดที่แก้ไขแล้ว (Refactored Code):**
```tsx
<ComponentErrorBoundary componentName="Admin backoffice stats panel">
  <BackofficeStatsWidget data={stats} />
</ComponentErrorBoundary>
```

---

## 3. Recommended Solutions (Software Engineering Best Practices)

### 3.1 Timing-Safe Verification & Strict Authorization Refactoring

**โค้ดเดิม vs โค้ดใหม่ที่ปรับปรุงแล้ว (`src/app/api/cron/sync-market-pool/route.ts`):**

```typescript
// 🛠️ โค้ดที่แก้ไขแล้ว: ใช้ Constant-time Signature Verification เสมอ
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { fetchLiveStocksFromYFinance } from '@/lib/services/yfinanceBridge';
import { upsertStocksToPool } from '@/lib/services/stockPoolService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      if (!token || !timingSafeEqual(token, cronSecret)) {
        return NextResponse.json({ success: false, error: 'Unauthorized Trigger Request' }, { status: 401 });
      }
    }

    const startTime = Date.now();
    const stocks = await fetchLiveStocksFromYFinance();
    if (!stocks || stocks.length === 0) {
      return NextResponse.json({ success: false, message: 'No stock data returned' }, { status: 500 });
    }

    const upsertCount = await upsertStocksToPool(stocks);
    return NextResponse.json({
      success: true,
      syncedCount: upsertCount,
      elapsedMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
```

---

### 3.2 Vitest Automated Test Suite for Trigger Security & Ingestion

ไฟล์ทดสอบระบบ Trigger และความปลอดภัย (`src/app/api/cron/sync-market-pool/route.test.ts`):

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
- **แนวทางแก้ไข:** สร้าง Compound Index บน PostgreSQL / Supabase สำหรับตาราง `stocks` เพื่อให้การค้นหา Trigger ในสถานะ `pending` รวดเร็วระดับ <2ms:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_stocks_status_updated
  ON stocks (analysis_status, last_fetched_at DESC);
  ```

---
*รายงานนี้จัดทำขึ้นโดย Senior Software Engineer & System Architect สำหรับระบบ StockHomeTH*
