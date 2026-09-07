---
name: localhost-prototype
description: คู่มือแนวทางการรันและทดสอบระบบสแกนหุ้นและ AI วิเคราะห์การลงทุนบนสภาพแวดล้อม Local (localhost:3000)
---

# SKILL.md — Localhost Prototype Guide

คู่มือแนวทางการรันและทดสอบระบบระบบสแกนหุ้นและ AI วิเคราะห์การลงทุนบนสภาพแวดล้อม Local (`localhost:3000`)

---

## 1. ข้อมูลจำเพาะของสภาพแวดล้อม (Local Environment)

* **Port:** `3000`
* **AI Provider:** Google Gemini API (โมเดล `gemini-1.5-flash` เพื่อคุมความเร็วและประหยัดโควตา)
* **Auth:** Mock User Session หรือ Local Storage / Simple Cookie
* **Database / Cache:** SQLite หรือ In-Memory (Node.js Map / Dict) สำหรับเก็บสถานะโควตา

---

## 2. โครงสร้างระดับสิทธิ์และการจัดสรรเครดิต (Tier Logic)

| ระดับสมาชิก (Tier) | ราคาแสดงผล | เครดิต AI / วัน | สิทธิ์การใช้งานหลัก |
| :--- | :--- | :--- | :--- |
| **Free Member** | 0 บ. | 3 ครั้ง | ดูข้อมูลงบย้อนหลัง, กราฟพื้นฐาน, Watchlist 25 ตัว |
| **Coffee Supporter** | 19 บ. | 10 ครั้ง | ปลดล็อก AI ไร้โฆษณา, Watchlist 60 ตัว |
| **Pro Investor** | 129 บ. | 50 ครั้ง | วิเคราะห์งบเชิงลึก, สแกนเนอร์สัญญาณทางเทคนิค |

---

## 3. ตรรกะการทำงานของระบบเครดิต (Credit & Rate Limiting Logic)

1. **Daily Reset:** 
   * ทุกครั้งที่มีคำขอ (Request) เข้ามา ให้เช็ก `last_reset_date` เทียบกับวันที่ปัจจุบันของเซิร์ฟเวอร์
   * หากขึ้นวันใหม่ ให้รีเซ็ตค่า `credits_used = 0`
2. **Deduction Rule:**
   * ตรวจสอบว่า `credits_used < max_credits_by_tier` หรือไม่
   * หากผ่าน: หักเครดิต และส่งคำสั่งต่อไปยัง Gemini API
   * หากไม่ผ่าน: ส่ง Response รหัส `429 (Too Many Requests)` พร้อมข้อความแจ้งเตือนให้อัปเกรดแพ็กเกจ
3. **Smart Cache (Local In-Memory):**
   * เก็บประวัติบทวิเคราะห์ในรูปแบบ Key-Value: `ticker_symbol:date` (เช่น `DELTA:2026-09-08`)
   * หากมีการถามซ้ำภายในวันเดียวกัน ให้ดึงข้อมูลเดิมตอบกลับทันที และไม่หักเครดิต

---

## 4. ระบบจำลองการชำระเงิน (Mock Payment Sandbox)

เนื่องจากยังไม่เชื่อมต่อ Gateway จริง ให้ทำ Flow การทดสอบดังนี้:

* **Trigger:** ผู้ใช้กดปุ่ม "อัปเกรดเป็น Coffee Supporter (19 บ.)" หรือ "Pro Investor (129 บ.)"
* **UI Action:** แสดง Modal รูปภาพ QR PromptPay จำลอง พร้อมปุ่ม "อัปโหลดสลิป (Mock)" และปุ่มลัดสำหรับ Dev: `[Dev: Simulate Success]`
* **State Update:** เมื่อกดยืนยัน ให้จำลองการตอบกลับของ API ตรวจสลิป (`status: "PAID"`, `amount: 19.00`) แล้วปรับ Role ของบัญชีทันทีเพื่อทดสอบสิทธิ์

---

## 5. การตั้งค่าตัวแปรสภาพแวดล้อม (.env.local)

```env
PORT=3000
GEMINI_API_KEY="your-gemini-api-key-here"
DEFAULT_TIER="FREE"
ENABLE_MOCK_PAYMENT=true
CACHE_TTL_HOURS=24
```
