# 📈 StockHomeTH — Modern Real-Time Financial Intelligence & AI Stock Analytics Platform

> **แพลตฟอร์มวิเคราะห์และสรุปข่าวสารตลาดหุ้นไทย (SET / mai) และหุ้นต่างประเทศ (US / Global) ด้วย AI อัจฉริยะแบบเรียลไทม์**  
> ขับเคลื่อนด้วยสถาปัตยกรรม **Next.js 15+ (App Router)**, **Real-Time Strict Anchoring RAG**, โมเดล AI ระดับเรือธง (Gemini, Claude, GPT, DeepSeek), ระบบกระเป๋าเหรียญ **GemCoin Cloud Wallet**, และเกตเวย์ชำระเงินจริง **Stripe Checkout**

---

## 🌟 จุดเด่นและฟังก์ชันหลัก (Core Highlights)

### 1. 🇹🇭 & 🇺🇸 จักรวาลหุ้นสองตลาด (Dual-Market Stock Hubs)
- **หุ้นไทย (SET & mai)**: ครอบคลุม 800+ บริษัทจดทะเบียน แยกกลุ่ม SET50, ปันผลสูง, พลังงาน, ธนาคาร พร้อมสถานะเวลาทำการตลาดและตัวชี้วัดราคาเรียลไทม์
- **หุ้นต่างประเทศ (US Markets)**: หุ้นสหรัฐฯ ชั้นนำ 700+ ตัว, หุ้นกลุ่ม Magnificent 7, Tech Giants AI, S&P 500, และ NASDAQ
- **Real-Time Market Tickers & Indices**: แถบดัชนีตลาดหลักทรัพย์ (SET Index, S&P 500, Nasdaq, Dow Jones, ราคาทองคำ, และน้ำมันดิบ) พร้อม Sentiment Gauge

### 2. ⚡ สถาปัตยกรรม Real-Time RAG & Strict Anchoring
- **Zero Hallucination Guarantee**: ระบบดึงข้อมูลราคา ปริมาณการซื้อขาย และอัตราการเปลี่ยนแปลงแบบสด ๆ ผ่าน Yahoo Finance & Finnhub Bridge
- ข้อมูลตลาดล่าสุดจะถูกแนบลงในโครงสร้าง `<current_market_data>` ส่งเข้า System Prompt ของ LLM พร้อมคำสั่ง **Strict Anchoring** ทำให้ AI ตอบราคาและแนวโน้มปัจจุบันได้อย่างแม่นยำ ไม่เพ้อฝัน ไม่ใช้ข้อมูลเก่าในอดีต

### 3. 🤖 ระบบ AI Assistant ระดับเรือธง (Multi-Model AI Chat)
- **โมเดล AI หลากหลายค่ายในระบบเดียว**:
  - **Google Gemini**: Gemini 3.8 Flash (Baseline ความเร็วสูง), Gemini 3.1 Pro, Gemini 2.5 Flash
  - **Anthropic Claude**: Claude 3.5 Sonnet (วิเคราะห์กราฟและรายงานการเงินเชิงลึก)
  - **OpenAI**: GPT-4o, GPT-5 Preview
  - **DeepSeek**: DeepSeek R1 (Chain of Thought Reasoning) และ DeepSeek V3
  - **Alibaba**: Qwen 2.5 72B
- **SSE Streaming & WebSockets-Ready**: แสดงผลคำตอบแบบตัวอักษรต่อตัวอักษรแบบ Real-time ลื่นไหล
- **Rolling Summarization & Context Compression**: ระบบบีบอัดและสรุปบริบทการสนทนาอัตโนมัติ ช่วยรักษาความจำของการคุยระยะยาวโดยไม่เปลือง Token

### 4. 💎 ระบบเศรษฐกิจ GemCoin & Centralized Cloud Wallet
- **กระเป๋าเหรียญ 2 ส่วน (Dual Balance System)**:
  - **Daily Free Quota**: โควตาเหรียญฟรีทุกวัน (Free Tier รับ 500 GemCoins/วัน รีเซ็ตเที่ยงคืน)
  - **Permanent Top-up Balance**: เหรียญเติมแบบถาวร ไม่มีวันหมดอายุ ใช้หักเมื่อโควตารายวันหมด
- **Multi-Device Real-time Sync**: ยอดเหรียญและประวัติการใช้งานซิงค์ตรงกับฐานข้อมูล PostgreSQL บนคลาวด์แบบทันทีทั้งบนคอมพิวเตอร์และสมาร์ตโฟน
- **Transparent Token Refund Engine**: ตรวจสอบและคืนเครดิตอัตโนมัติหาก AI เกิดข้อผิดพลาดหรือ Token ไม่ได้ถูกใช้จริง

### 5. 💳 ระบบการชำระเงินมาตรฐานโลก (Stripe Live Checkout)
- **หน้าร้านค้าทางการ (`/payments`)**:
  - เติมเหรียญ GemCoins รายครั้ง (One-time Top-up) ตั้งแต่ 1,500 ถึง 1,050,000 GemCoins
  - สมัครสมาชิกรายเดือนและรายปี (ลดเพิ่ม 20% / แถมฟรี 2 เดือน) สำหรับแผน Lite, Pro, VIP, และ Whale
- **In-App Quick Top-up**: ซื้อแพ็กเกจผ่าน Modal ได้โดยตรงด้วย Stripe Checkout Session ปลอดภัยมาตรฐาน PCI-DSS
- **Voucher Promo Code Engine**: รองรับการกรอกโค้ดเพื่อรับ GemCoins ฟรีจากแคมเปญ

### 6. 🔐 ระบบความปลอดภัยและการยืนยันตัวตนคู่ (Dual Auth Architecture)
- **Client Auth (Firebase Authentication)**: สำหรับผู้ใช้งานทั่วไป รองรับ Google Sign-In, อีเมล/รหัสผ่าน, และการกู้คืนรหัสผ่าน
- **Admin Auth (Supabase Backoffice)**: สำหรับทีมงานและผู้ดูแลระบบ เข้าถึงแดชบอร์ดจัดการ Airdrop, ปรับโควตา, และดู Logs แบบแยกสิทธิ์อย่างเคร่งครัด
- **State Isolation**: เมื่อ Logout ระบบจะเคลียร์สิทธิ์ Dev/Owner ใน LocalStorage ทันที ป้องกันสถานะแอดมินค้างสู่โหมดผู้เยี่ยมชม

### 7. 📱 Mobile-First Progressive Web App (PWA)
- ติดตั้งใช้งานเสมือนแอปเนทีฟบน iOS, Android, iPadOS, macOS, และ Windows
- แถบนำทางด้านล่าง **PwaBottomNav** รองรับ Safe Area Inset และ Gesture Bar ของ iPhone อย่างสมบูรณ์
- **Responsive Dropdown**: เมนูร้านค้าบนมือถือเปลี่ยนเป็น Dropdown อัตโนมัติ ป้องกันปัญหาแท็บบีบอัดและข้อความหลุดกรอบ
- **Antigravity Glass iOS Design System**: รองรับ **Dark Mode**, **Light Mode**, และ **System Theme** พร้อมความคมชัดระดับ WCAG AAA

---

## 🏗️ โครงสร้างโปรเจกต์ (Project Structure)

```text
stock-news-app/
├── public/                     # Static Assets, PWA Icons, Manifest
├── src/
│   ├── app/                    # Next.js 15 App Router Routes
│   │   ├── page.tsx            # หน้าหลัก (Market Tickers, News Feed, Hub Cards)
│   │   ├── payments/           # หน้าร้านค้าหลัก (Stripe Live Checkout & Subscriptions)
│   │   ├── ai-helper/          # หน้า AI Chatbot เต็มจอ (Multi-model, RAG, File Uploads)
│   │   ├── stocks/
│   │   │   ├── page.tsx        # ตลาดหุ้นทั้งหมด (ALL)
│   │   │   ├── thai/page.tsx   # ตลาดหุ้นไทย (SET & mai)
│   │   │   └── us/page.tsx     # ตลาดหุ้นสหรัฐฯ (NYSE & NASDAQ)
│   │   └── api/                # Next.js Serverless API Endpoints
│   │       ├── ai/chat/route.ts# Core AI Chat & RAG Engine (SSE Stream)
│   │       ├── payment/        # Stripe Checkout Session Generator
│   │       ├── gemcoin/        # Cloud Wallet, Sync, and Airdrop APIs
│   │       └── webhooks/stripe # Stripe Webhook Receiver & Credit Fulfillment
│   ├── components/
│   │   ├── client/             # Interactive React Client Components
│   │   │   ├── AiHelperChatClient.tsx # หน้าต่างสนทนา AI
│   │   │   ├── GemCoinModal.tsx       # Pop-up จัดการกระเป๋าเหรียญ & ซื้อด่วน
│   │   │   ├── PaymentsClient.tsx     # หน้าร้านค้าทางการ
│   │   │   ├── PwaBottomNav.tsx       # แถบนำทางด้านล่างมือถือ
│   │   │   └── HeaderClientNav.tsx    # แถบหัวเว็บและเมนูผู้ใช้
│   │   ├── server/             # SSR / Server Components สำหรับ SEO และความเร็ว
│   │   └── ui/                 # Reusable Micro-components & Tier SVG Icons
│   ├── config/                 # ค่ากำหนดโมเดล, ราคา, และแพ็กเกจ
│   │   ├── curated-models.ts   # รายชื่อโมเดล AI และพารามิเตอร์ Token
│   │   ├── gemCoinPackages.ts  # ข้อมูลแพ็กเกจเหรียญและแผนสมาชิก
│   │   └── stripePriceIds.ts   # Stripe Live Price ID Mapping
│   ├── lib/
│   │   ├── context/            # Global React Contexts (Auth, Subscriptions, Theme)
│   │   ├── services/           # Backend Bridges (Yahoo Finance, Finnhub, Wallet Sync)
│   │   └── supabase/           # Supabase Client & Server Utilities
│   └── styles/                 # Glass iOS CSS, Dark/Light Themes, Animations
└── README.md                   # เอกสารประกอบโปรเจกต์ฉบับนี้
```

---

## ⚙️ การกำหนดค่าตัวแปรสภาพแวดล้อม (.env.local)

สร้างไฟล์ `.env.local` ในโฟลเดอร์ Root และกรอกค่าคอนฟิกดังต่อไปนี้:

```env
# ─── 1. AI API Configuration (OpenRouter / Flagship Models) ───
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── 2. Real-Time Market Data APIs ───
FINNHUB_API_KEY=your_finnhub_api_key_here

# ─── 3. Firebase Authentication (Client Side) ───
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ─── 4. Supabase Database & Admin Backoffice ───
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ─── 5. Stripe Payments Gateway ───
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

---

## 🚀 เริ่มต้นใช้งานบนเครื่องคอมพิวเตอร์ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
```bash
npm run dev
```

เปิดบราวเซอร์ไปที่: `http://localhost:3000`

### 3. ตรวจสอบการทำงานของแต่ละส่วน
- **หน้าแรก**: `http://localhost:3000/`
- **ตลาดหุ้นไทย**: `http://localhost:3000/stocks/thai`
- **ตลาดหุ้นสหรัฐฯ**: `http://localhost:3000/stocks/us`
- **ระบบวิเคราะห์ AI Chat**: `http://localhost:3000/ai-helper`
- **หน้าร้านค้าชำระเงิน**: `http://localhost:3000/payments`

---

## 🧪 การทดสอบระบบชำระเงินและ Webhook (Stripe Testing)

สำหรับการทดสอบการตอบรับการชำระเงินจาก Stripe ไปยัง Local Server สามารถใช้ Stripe CLI ดักฟังเหตุการณ์:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

เมื่อลูกค้าชำระเงินผ่านบัตรเครดิตหรือพร้อมเพย์สำเร็จ Stripe จะส่งเหตุการณ์ `checkout.session.completed` เข้ามาที่ Webhook เพื่อเติมเหรียญ GemCoins หรือปรับเลื่อนระดับสมาชิกเข้าสู่ฐานข้อมูล Supabase อัตโนมัติทันที

---

## 🛡️ ความปลอดภัยและความเป็นส่วนตัว (Security Best Practices)
1. **Zero Secret Leakage**: กุญแจลับระดับระบบ (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`) จะถูกเก็บและเรียกใช้เฉพาะบนเซิร์ฟเวอร์ (Next.js Server Actions / API Routes) เท่านั้น ไม่ส่งไปยังบราวเซอร์ของลูกค้า
2. **Strict Identity Validation**: การหักหรือเติมเหรียญ GemCoins ต้องผ่านการตรวจสอบสิทธิ์และลายเซ็นต์ของเซสชันผู้ใช้ทุกครั้ง
3. **Automatic Dev Demotion**: หากผู้ใช้ลงชื่อออกจากระบบ สิทธิ์บัญชีนักพัฒนา (God Mode) จะถูกทำลายและคืนค่าสู่โควตาผู้ใช้งานทั่วไปทันที

---

## 📄 ใบอนุญาต (License)
MIT License • พัฒนาด้วย ❤️ เพื่อนักลงทุนและนักพัฒนายุคใหม่โดย **StockHomeTH Team**
