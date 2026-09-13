# 📈 StockHomeTH — Enterprise Financial Intelligence & AI Stock Analytics Platform

> **แพลตฟอร์มศูนย์รวมข้อมูลและผู้ช่วย AI วิเคราะห์การลงทุนอัจฉริยะแบบเรียลไทม์ ครอบคลุมตลาดหุ้นไทย (SET / mai) และตลาดสากล (US Markets / Global)**  
> ขับเคลื่อนด้วยสถาปัตยกรรม **Next.js 15+ (App Router)**, **Universal Financial Asset Router v2.0**, **Multi-Tier Grounding Engine (Web Cache + Supabase 10,637 Stocks)**, ระบบกระเป๋าเหรียญ **UID-Isolated GemCoin Cloud Wallet**, และเกตเวย์ชำระเงินมาตรฐานสากล **Stripe Live Checkout (บัตรเครดิต & พร้อมเพย์)**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.25-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-10%2C637_Stocks-emerald?logo=supabase)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-amber?logo=firebase)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Live_PromptPay_%26_Cards-6366f1?logo=stripe)](https://stripe.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tested-green?logo=vitest)](https://vitest.dev/)

---

## 🌟 จุดเด่นและนวัตกรรมหลักของระบบ (Core Innovations)

### 1. 🛡️ Universal Financial Asset Router v2.0 (Zero-Assumption Architecture)
- **นโยบายห้ามสุ่มเดา (Zero-Assumption Policy):** AI จะไม่ทึกทักหรือสรุปสินทรัพย์ไปเองเด็ดขาดเมื่อคำถามมีความกำกวม
- **3-Pillar Validation (การตรวจสอบ 3 มิติข้อมูล):**
  1. **Asset Identity:** ข้อมูลระบุตัวตน (เช่น Apple, ทองคำ, น้ำมัน, Bitcoin)
  2. **Trading Venue / Exchange:** ตลาดอ้างอิง (เช่น NASDAQ, SET, สมาคมค้าทองคำแห่งประเทศไทย, Bitkub)
  3. **Denomination Currency:** สกุลเงินอ้างอิง (เช่น THB, USD)
- **การขจัดปัญหา Ticker Collision & ความกำกวม:**
  - **ทองคำ (Gold):** แยกชัดเจนระหว่าง 1) สมาคมค้าทองคำในไทย (บาทละ) 2) Spot Gold (XAU/USD) 3) กองทุน SPDR Gold Shares (GLD) 4) หุ้นร้านทอง AURA (SET) — *แก้ปัญหาเดิมที่ระบบเคยทึกทักว่าเป็น GLD ทั้งหมด*
  - **น้ำมัน (Crude Oil):** แยกราคาหน้าปั๊มในไทย, WTI, Brent, และหุ้นโรงกลั่น/พลังงานไทย
  - **อัตราแลกเปลี่ยน (Forex vs หุ้น/ดัชนี):** แยกค่าเงิน JPY/THB และ USD/THB ออกจากตลาดหุ้นและดัชนีต่างประเทศ
  - **หุ้นข้ามตลาด (Cross-Market Equities):** แยกหุ้นแม่ในสหรัฐฯ (เช่น NASDAQ: AAPL, TSLA) ออกจากตราสาร DRx ในตลาดหุ้นไทย (SET: AAPL80X, TSLA80X)
- **Interactive Quick Reply Buttons (Sci-Com & Eng-Com UI):** เมื่อพบความกำกวม ระบบจะส่งการตอบกลับใน 15ms เพื่อแสดงผล "ปุ่มตัวเลือกด่วน" บนหน้าต่างแชตให้ผู้ใช้คลิกเลือกได้ทันทีโดยไม่หัก GemCoins และไม่เสียค่า Token

### 2. ⚡ Multi-Tier Stock Grounding Engine (ข้อมูลตรงหน้าเว็บ 100% & เสถียรบน Cloud)
แก้ปัญหาคลาสสิกของ Vercel Serverless ที่มักโดนบล็อก IP จากภายนอก ด้วยสถาปัตยกรรมการดึงข้อมูล 3 ชั้น:
- **Tier 1 (Instant Web Cache):** ค้นหาจาก `market_cache.json` หรือ Memory Cache ของหน้าเว็บก่อนเสมอ (< 1ms) เพื่อให้ราคาและตัวเลขตรงกับที่ผู้ใช้เห็นบนหน้าจอ 100%
- **Tier 2 (Supabase Cloud Catalog):** เชื่อมต่อฐานข้อมูล Supabase REST API ครอบคลุมหุ้นกว่า **10,637 ตัว** ทั้งหุ้นไทย (SET/mai) และหุ้นสหรัฐฯ ดึงข้อมูลสดเร็วและเสถียรบน Vercel Production
- **Tier 3 (External Real-Time Fallback):** เรียกใช้งาน Yahoo Finance / Finnhub เฉพาะเมื่อไม่พบในสองแหล่งแรก พร้อม Fail-safe ป้องกันค่าว่าง

### 3. 🤖 ระบบ AI Assistant ระดับเรือธง (Multi-Model Flagship Chat)
- **Multi-Model Intelligence:**
  - **Google Gemini:** Gemini 3.8 Flash (โมเดลหลัก ความเร็วสูง), Gemini 3.1 Pro, Gemini 2.5 Flash
  - **Anthropic Claude:** Claude 3.5 Sonnet (วิเคราะห์งบการเงินและกราฟเทคนิคเชิงลึก)
  - **OpenAI:** GPT-4o, GPT-5 Preview
  - **DeepSeek:** DeepSeek R1 (Chain of Thought Reasoning) และ DeepSeek V3
- **Real-Time SSE Streaming:** ถ่ายทอดข้อความตัวอักษรต่อตัวอักษรแบบสด ลื่นไหล ปราศจากอาการค้าง
- **Rolling Context Summarization:** สรุปและบีบอัดประวัติการสนทนาย้อนหลังอัตโนมัติ ทำให้ AI จดจำบริบทได้ยาวนานโดยไม่เปลือง Token

### 4. 💎 ระบบเศรษฐกิจ GemCoin & UID-Isolated Cloud Wallet
- **การแยกสิทธิ์บัญชีเด็ดขาด (Account Isolation):** กระเป๋าเหรียญผูกกับ Firebase UID ของผู้ใช้แต่ละคน หมดปัญหาเหรียญรั่วข้ามบัญชี หรือยอดเหรียญรีเซ็ตกลับเป็น 500 เมื่อสลับผู้ใช้
- **Dual Persistence Architecture:** บันทึกข้อมูล 2 ชั้นพร้อมกันลงใน **Firebase Firestore Cloud** และ **Server-side Persistence (`user_wallets.json`)**
- **Dual Balance Economy:**
  - **Daily Free Quota:** โควตาฟรี 500 GemCoins ทุกวันสำหรับสมาชิกทั่วไป (รีเซ็ตเที่ยงคืน 00:00 น.)
  - **Permanent Top-up Balance:** เหรียญเติมแบบถาวร ไม่มีวันหมดอายุ สำหรับสมาชิกที่เติมเงิน
- **Transparent Refund Engine:** ตรวจสอบและคืน GemCoins อัตโนมัติทันทีหากเกิดข้อผิดพลาดในการเชื่อมต่อโมเดล

### 5. 💳 ระบบการชำระเงินมาตรฐานสากล (Stripe Live Checkout)
- **รองรับการชำระเงินหลากหลาย:**
  - 🇹🇭 **QR พร้อมเพย์ (PromptPay Thailand):** สแกนจ่ายง่ายผ่าน Mobile Banking ทุกธนาคาร
  - 💳 **บัตรเครดิตและเดบิตระดับโลก:** Visa, Mastercard, JCB, American Express
- **ระบบสมาชิกและเติมเหรียญ:**
  - แพ็กเกจเติมเหรียญ GemCoin รายครั้ง (1,500 ถึง 1,050,000 GemCoins)
  - แพ็กเกจสมาชิกรายเดือน/รายปี: Lite, Pro, VIP, และ Whale
- **Instant Real-Time Verification:** ตรวจสอบความสำเร็จของการชำระเงินและปลดล็อกสิทธิ์ทันที ไม่ต้องรอนาน

### 6. 📜 มาตรฐานความโปร่งใสและกฎหมาย 2 ภาษา (Bilingual Legal & Sci-Com)
- **Bilingual Legal Modal (`TermsDisclaimerModal`):** รองรับภาษาไทยและอังกฤษ (TH/EN) ครบถ้วนทั้ง 4 หมวด: ข้อกำหนดการใช้งาน (Terms), นโยบายความเป็นส่วนตัว (Privacy), นโยบายการชำระเงิน (Payment), และคำเตือนความเสี่ยง (Disclaimer)
- **Science Communication (Sci-Com) Principles:** บังคับให้ AI ระบุแหล่งที่มา วันที่ เวลา และหน่วยของตัวเลขทางการเงินเสมอ (เช่น `บาทต่อบาททองคำ`, `USD/Ounce`, `ล้านบาท`) ปราศจากการปรุงแต่งตัวเลข

---

## 🏗️ โครงสร้างไฟล์และสถาปัตยกรรม (Project Architecture)

```text
stock-news-app/
├── public/                         # Static Assets, PWA Icons, Manifest, _headers
├── src/
│   ├── app/                        # Next.js 15 App Router Architecture
│   │   ├── page.tsx                # หน้าหลัก (Market Tickers, News Feed, Hub Cards)
│   │   ├── payments/               # หน้าร้านค้าทางการ (Stripe Live Checkout & Subscriptions)
│   │   ├── ai-helper/              # หน้าต่าง AI Chatbot เต็มจอ (Multi-Model, RAG, File Uploads)
│   │   ├── stocks/
│   │   │   ├── page.tsx            # ตลาดหุ้นทั้งหมด (ALL)
│   │   │   ├── thai/page.tsx       # ตลาดหุ้นไทย (SET & mai)
│   │   │   └── us/page.tsx         # ตลาดหุ้นสหรัฐฯ (NYSE & NASDAQ)
│   │   └── api/                    # Serverless API Endpoints
│   │       ├── ai/chat/route.ts    # Core AI Chat, RAG, and Ambiguity Gatekeeper
│   │       ├── payment/            # Stripe Checkout Session Generator
│   │       ├── user/wallet/        # UID-Isolated Centralized Wallet API
│   │       └── webhooks/stripe/    # Stripe Webhook Receiver & Credit Fulfillment
│   ├── components/
│   │   ├── client/                 # Interactive React Client Components
│   │   │   ├── AiHelperChatClient.tsx   # หน้าต่างแชต AI พร้อม Quick Reply Buttons
│   │   │   ├── GemCoinModal.tsx         # Modal จัดการกระเป๋าเหรียญและเติมเงินด่วน
│   │   │   ├── PaymentsClient.tsx       # หน้าร้านค้าทางการ
│   │   │   ├── TermsDisclaimerModal.tsx # ข้อตกลงและนโยบาย 2 ภาษา (TH/EN)
│   │   │   └── NewsDetailSheet.tsx      # หน้าต่างอ่านข่าวพร้อม Safeguard สรุปไม่ซ้ำหัวข้อ
│   │   ├── server/                 # SSR Server Components สำหรับ SEO (MarketTickerBar, DigestBanner)
│   │   └── ui/                     # Reusable Micro-components & GemCoin Icons
│   ├── config/
│   │   ├── assetRegistry.ts        # 🛡️ Universal Asset Disambiguation Registry
│   │   ├── curated-models.ts       # ข้อมูลและสเปกโมเดล AI แต่ละตระกูล
│   │   ├── gemCoinPackages.ts      # ข้อมูลแพ็กเกจเติมเหรียญและสิทธิ์สมาชิก
│   │   └── tierModelLimits.ts      # ข้อจำกัด Token และสิทธิ์การเข้าถึงโมเดลตามระดับสมาชิก
│   ├── lib/
│   │   ├── context/                # React Contexts (Subscription, Auth, Theme)
│   │   ├── firebase/               # Firebase Client & Firestore Initialization
│   │   ├── services/
│   │   │   ├── assetAmbiguityEngine.ts # 🛡️ Zero-Assumption Ambiguity Resolver
│   │   │   ├── assetAmbiguityEngine.test.ts # 🧪 Automated Vitest Suite
│   │   │   ├── yfinanceBridge.ts       # Multi-Tier Stock Fetcher (Web Cache + Supabase)
│   │   │   └── aiChatHistoryService.ts # ประวัติการสนทนาและซิงก์คลาวด์
│   │   └── utils/
│   │       └── newsClassifier.ts   # คัดกรองและสกัดสาระสำคัญข่าวสาร
│   ├── types/
│   │   └── asset.ts                # TypeScript Interfaces สำหรับ 3-Pillar Validation
│   └── styles/                     # Glass iOS CSS, Dark/Light Themes, Custom Animations
├── vitest.config.ts                # Vitest Test Configuration & Path Aliases
├── firestore.rules                 # กฎความปลอดภัย Firestore สำหรับ Wallet UID
├── UPDATELOG.md                    # 📜 บันทึกประวัติการอัปเดตเวอร์ชันและฟีเจอร์อย่างละเอียด
└── README.md                       # เอกสารประกอบโปรเจกต์ฉบับนี้
```

---

## ⚙️ การตั้งค่าตัวแปรสภาพแวดล้อม (.env.local)

สร้างไฟล์ `.env.local` ในโฟลเดอร์ Root และกรอกค่าคอนฟิกดังต่อไปนี้:

```env
# ─── 1. AI API Configuration (OpenRouter) ───
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── 2. Real-Time Market Data APIs ───
FINNHUB_API_KEY=your_finnhub_api_key_here

# ─── 3. Firebase Client Authentication & Firestore ───
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ─── 4. Supabase Cloud Database (10,637 Stocks) ───
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ─── 5. Stripe Payments Gateway (PromptPay & Cards) ───
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

---

## 🚀 เริ่มต้นใช้งานในสภาพแวดล้อมการพัฒนา (Local Development)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันระบบสำหรับพัฒนา (Dev Server)
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่: `http://localhost:3000`

### 3. รันชุดทดสอบอัตโนมัติ (Automated Unit Tests)
```bash
npx vitest run
```

---

## 🛡️ ความปลอดภัยและความโปร่งใสของระบบ (Security & Compliance)

1. **Zero Secret Leakage:** คีย์ลับระดับระบบ (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`) จะถูกประมวลผลบน Serverless Backend เท่านั้น ไม่ถูกส่งมายัง Client ฝั่งผู้ใช้
2. **Account UID Isolation:** การอ่านและเขียนยอดเหรียญ GemCoins มีการตรวจสอบ UID เจ้าของบัญชีในทุก Transaction ป้องกันการปลอมแปลง
3. **Automatic Dev State Clearing:** เมื่อผู้ใช้งานกดออกจากระบบ (Logout) ข้อมูลสถานะจำลอง Dev หรือ God-mode ใน LocalStorage จะถูกลบล้างทันที
4. **Production Build Cleanliness:** โค้ดได้รับการปรับแต่งให้คอมไพล์ผ่าน Webpack บน Vercel Production 100% ปราศจากปัญหาโมดูลสูญหาย

---

## 📜 ประวัติการอัปเดตระบบ (Changelog)
ดูประวัติการอัปเดตเวอร์ชันและรายละเอียดการแก้ไขในแต่ละรุ่นอย่างสมบูรณ์ได้ที่ไฟล์ [UPDATELOG.md](./UPDATELOG.md)

---

## 📄 ใบอนุญาต (License)
MIT License • พัฒนาด้วยความมุ่งมั่นเพื่อสร้างมาตรฐานใหม่ของแพลตฟอร์มการเงินและ AI ประจำประเทศไทย โดย **StockHomeTH Team**
