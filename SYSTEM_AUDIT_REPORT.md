# 🔍 System Audit Report: Trigger & Dashboard System

## 1. Executive Summary
ระบบ StockHomeTH ปัจจุบันได้รับการออกแบบโดยเน้นแนวคิด **Code-First, AI-Last Architecture** และมีโครงสร้างพื้นฐานที่ครอบคลุมการประมวลผลข้อมูลการเงินหลายตลาด (SET & US Global) พร้อมระบบซิงค์ข้อมูลผ่าน Next.js App Router, Cron Jobs และ SQLite Data Lake

**จุดเด่นของระบบ:**
- มีสถาปัตยกรรมแบบ Multi-tier Fallback ที่ยืดหยุ่น เช่น การดึงราคาหุ้นผ่าน Yahoo Finance Bridge, Webull OpenAPI SDK และ Supabase Vector Store
- มีระบบ Anti-Spam Cooldown และ In-Memory Cache ที่ช่วยลดภาระการเรียก External APIs

**ปัญหาใหญ่เร่งด่วนที่ต้องแก้ไข (Critical & High Flaws):**
1. **การรักษาความปลอดภัยของ Cron Trigger Endpoints (`CRON_SECRET` Bypass):** ในไฟล์ `src/app/api/cron/sync-market-pool/route.ts` มีการข้ามการตรวจสอบสิทธิ์ `cronSecret` หากสภาพแวดล้อมไม่ได้ตั้งค่าเป็น `production` หรือเมื่อส่งพารามิเตอร์ `?dev=true` ทำให้ผู้ไม่หวังดีสามารถสแปมยิง Trigger เพื่อสกัดกั้นหรือทำลายแคชระบบได้
2. **คอขวดและ Memory Leak ใน WebSocket / Interval Event Bus บน Client:** ใน `MarketSyncContext.tsx` มีการใช้ `setInterval` และ `clearInterval` ซ้ำซ้อนโดยเปิด Polling Interval ทุกๆ 15-30 วินาที พร้อมกับการอัปเดต State ขนาดใหญ่ของหุ้นมากกว่า 1,500 ตัวโดยตรง ส่งผลให้เกิดปัญหา React Cascading Re-renders และ DOM Freeze เมื่อรันแอปพลิเคชันเป็นเวลานาน
3. **ขาด WebSocket Backpressure Management & Connection Pooling:** เมื่อมี Trigger ข้อมูลราคาสดส่งเข้ามาปริมาณมาก การยิง REST Requests แบบ Polling พร้อมกันหลายร้อยเครื่องส่งผลให้เกิด I/O Bottleneck บน Node.js Event Loop และ Supabase Connection Pool สัญญาณตอบสนองช้าลงอย่างเห็นได้ชัด

---

## 2. Identified Issues & Architectural Flaws

### Issue 1: Unprotected Cron Trigger Endpoints & Authorization Bypass
- **ความรุนแรง:** `[CRITICAL]`
- **สาเหตุของปัญหา:** ในไฟล์ `src/app/api/cron/sync-market-pool/route.ts` โค้ดมีการตรวจสอบสิทธิ์ดังนี้:
  ```typescript
  if (process.env.NODE_ENV === 'production' && !url.searchParams.get('dev')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  ```
  หากระบบรันใน Preview environment หรือเปิดโหมด `dev` ผู้ใช้ภายนอกทุกคนสามารถยิง trigger endpoint นี้เพื่อบังคับให้เซิร์ฟเวอร์รัน Yahoo Finance fetch แบบหนักหน่วงได้ไม่จำกัด ส่งผลให้เกิด Denial of Service (DoS) หรือถูก External API บล็อก IP
- **ไฟล์ที่มีปัญหา:** `src/app/api/cron/sync-market-pool/route.ts`

### Issue 2: React Cascading Re-renders & Memory Leak in MarketSyncContext
- **ความรุนแรง:** `[HIGH]`
- **สาเหตุของปัญหา:** ใน `src/lib/context/MarketSyncContext.tsx` มีการประกาศ `useEffect` หลายตัวซ้อนกันเพื่อจัดการกับการ Polling และการอัปเดต `syncLogs` โดยเรียก `setState` ภายใน `useEffect` แบบ Synchronous โดยตรง ทำให้ React Compiler ไม่สามารถปรับแต่งประสิทธิภาพได้ และก่อให้เกิด Cascading Render ลูปซ้ำซ้อน
- **ไฟล์ที่มีปัญหา:** `src/lib/context/MarketSyncContext.tsx`

### Issue 3: Absence of Database Connection Pooling & Unbounded Batch Upserts
- **ความรุนแรง:** `[HIGH]`
- **สาเหตุของปัญหา:** ใน `src/app/api/cron/sync-market-pool/route.ts` มีการเรียก `upsertStocksToPool(stocks)` โดยส่งอาเรย์ข้อมูลหุ้นทั้งหมดรวดเดียวโดยไม่มีการทำ Chunking หรือ Connection Throttling หากปริมาณหุ้นขยายตัวมากกว่า 10,000 ตัว จะทำให้ Supabase Connection Queue เต็ม (HTTP 504 Gateway Timeout)
- **ไฟล์ที่มีปัญหา:** `src/app/api/cron/sync-market-pool/route.ts`, `src/lib/services/stockPoolService.ts`

### Issue 4: Missing Error Boundaries on Real-time Dashboard Widgets
- **ความรุนแรง:** `[MEDIUM]`
- **สาเหตุของปัญหา:** ใน `src/components/client/AdminBackofficeClient.tsx` และ Dashboard Widgets ขาดการห่อหุ้มด้วย React Error Boundary เฉพาะจุด ทำให้หากมี WebSocket message หรือราคาหุ้นที่ได้รับคืนค่ามาเป็น `null/undefined` หน้าจอ Dashboard ทั้งหมดจะพังทันที (White Screen of Death)
- **ไฟล์ที่มีปัญหา:** `src/components/client/AdminBackofficeClient.tsx`

---

## 3. Recommended Solutions (Software Engineering Best Practices)

### 3.1 Refactoring Authorization Logic for Cron Triggers

**โค้ดเดิมที่พบปัญหา (`src/app/api/cron/sync-market-pool/route.ts`):**
```typescript
// ❌ ปัญหา: เปิดช่องทางให้ยิง Trigger ได้ฟรีเมื่อมี ?dev หรือนอก production
if (cronSecret && authHeader !== `Bearer ${cronSecret}` && url.searchParams.get('key') !== cronSecret) {
  if (process.env.NODE_ENV === 'production' && !url.searchParams.get('dev')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
```

**โค้ดใหม่ที่ปรับปรุงแล้ว (`src/app/api/cron/sync-market-pool/route.ts`):**
```typescript
// 🛠️ โค้ดที่แก้ไขแล้ว: บังคับใช้ Constant-time Signature Verification เสมอ
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[Cron Security] CRON_SECRET missing in environment');
    return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || !safeCompare(token, expectedSecret)) {
    return NextResponse.json({ success: false, error: 'Unauthorized Trigger Request' }, { status: 401 });
  }

  // ดำเนินการ Process Trigger ข้อมูล...
}
```

---

### 3.2 Vitest Unit Test Suite for Trigger Security & Ingestion Service

เพื่อสร้างความมั่นใจในความถูกต้องของระบบ Trigger ปรับปรุงระบบทดสอบด้วย Vitest ดังนี้:

```typescript
// src/app/api/cron/sync-market-pool/trigger.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

describe('Cron Trigger Security & Ingestion Test Suite', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'super_secret_cron_token_123');
  });

  it('should reject unauthorized request without Bearer token with 401', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool');
    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Unauthorized/i);
  });

  it('should accept valid Bearer token and trigger pool sync', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool', {
      headers: {
        authorization: 'Bearer super_secret_cron_token_123'
      }
    });

    // Mock response for live market fetch
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
```

---

## 4. Performance & Scalability Enhancements

### 1. Connection Pooling & Batch Queue Processing
- **การปรับปรุง:** เปลี่ยนจากการสั่ง `upsert` ข้อมูลหุ้นทั้งหมดในคำสั่งเดียว เป็นการใช้ Concurrent Worker Queue (เช่น `p-limit` หรือ Batch Chunks ขนาดไม่เกิน 200 รายการต่อครั้ง) เพื่อป้องกันปัญหา Database Pool Exhaustion บน Supabase
- **สถาปัตยกรรม:**
  ```
  [ Trigger Event ] ➔ [ Redis / In-Memory Queue ] ➔ [ Worker Chunks (200 items/batch) ] ➔ [ Supabase PgVector Pool ]
  ```

### 2. Management of Memory Leak on WebSocket Connections
- **การปรับปรุง:** หน้า Dashboard Client ที่เปิดรับข้อความ WebSocket หรือ Polling ควรกำหนด `maxLogItems` ไม่เกิน 100 รายการเพื่อไม่ให้เกิด Memory Leak ในระบบ
- **ตัวอย่างโค้ดป้องกัน Memory Leak:**
  ```typescript
  setSyncLogs((prevLogs) => {
    const updated = [newLogEntry, ...prevLogs];
    return updated.slice(0, 100); // 🔒 จำกัดจำนวน Log บน Memory เพื่อให้ UI ลื่นไหลตลอดเวลา
  });
  ```

### 3. Database Indexing Strategy for High-Frequency Triggers
- **การปรับปรุง:** สร้าง Compound Index บน PostgreSQL / Supabase สำหรับตาราง `stock_pool` และ `market_cache` เพื่อให้การค้นหา Trigger ในสถานะ `pending` รวดเร็วระดับ <2ms:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_stock_pool_status_updated
  ON stock_pool (analysis_status, last_updated DESC);
  ```
