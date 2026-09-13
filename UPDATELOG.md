# 📜 StockHomeTH — Product Update Log & Release History

เอกสารบันทึกประวัติการพัฒนา การอัปเกรดสถาปัตยกรรม และการเปิดตัวฟีเจอร์สำคัญของแพลตฟอร์ม **StockHomeTH** อย่างเป็นทางการ

## 🎫 [v2.0.1] - 2026-09-13 (Preview Update)
### "Quick Promo Code Redemption, Guest Checkout Guard, Catalyst Linking & AI Enhancements"
- **ปุ่มแลกโค้ดหน้า Profile (Desktop & Mobile):** เพิ่มปุ่ม "แลกโค้ด" (`header-redeem-btn`) โดดเด่นข้างหน้าปุ่ม Profile บนแถบ Header เมนูผู้ใช้ และป๊อปอัปตั้งค่าโปรไฟล์
- **เชื่อมต่อหน้าร้านค้าและเติมเงิน (/payments):**
  - เพิ่มแท็บ "กรอกโค้ดฟรี" บนหน้า `/payments` พร้อมฟอร์มแลกรับเหรียญ GemCoins ทันทีโดยไม่ต้องเปิดโมดัล
  - เพิ่มปุ่ม "แลกโค้ดโปรโมชั่น" ในการ์ดยอดคงเหลือกระเป๋าเงิน (Wallet Balance Card)
  - เพิ่มแบนเนอร์สิทธิพิเศษในแท็บเติมเงิน
  - ปรับปรุงข้อความตัวอย่างในช่องกรอกโค้ดเป็น `Stock-1234` และปิดการแสดงรหัสจริงเพื่อความปลอดภัย
  - **สลับ Dropdown และเนื้อหาเข้าสู่ "🎫 แลกโค้ดฟรี (Coupon / Voucher)" ทันที** เมื่อกดปุ่มแลกโค้ด พร้อมระบบ Auto-focus ช่องกรอกโค้ดทันที
  - รองรับ URL Query `?tab=redeem` สลับเข้าแท็บกรอกโค้ดอัตโนมัติ
- **Guest Checkout Guard & Auto-Resume Top-up:**
  - เพิ่มระบบป้องกัน Guest Checkout: แสดงแบนเนอร์แจ้งเตือนให้เข้าสู่ระบบก่อนทำการเติมเงิน เพื่อให้ยอดเหรียญและสิทธิ์สมาชิกผูกกับบัญชีผู้ใช้ถาวรบน Cloud
  - บันทึกแพ็กเกจที่เลือกไว้ใน `sessionStorage` และเปิดหน้าต่างล็อกอินทันที เมื่อล็อกอินสำเร็จ ระบบจะสานต่อการชำระเงิน (Auto-resume Checkout) ให้อัตโนมัติ
- **Market Catalysts Direct News Linking:**
  - เชื่อมโยงหัวข้อปัจจัยสำคัญ (Market Catalysts) บน Digest Header Banner เข้ากับข่าวสารตัวจริงในระบบผ่าน `newsId` และ Fuzzy Title Matching เมื่อคลิกจะเปิดอ่านข่าวเต็มได้ทันที
- **AI Financial Slash Commands & Context Continuity:**
  - เพิ่มชุดคำสั่งลัดทางการเงิน: `/stock <ชื่อหุ้น>`, `/news <ชื่อหุ้น/ตลาด>`, `/port <สัดส่วนพอร์ต>`, `/pe <ชื่อหุ้น>`, `/macro`, `/gold`, `/btc`, `/help`
  - ปรับปรุงการกดปุ่ม Enter ให้เป็นการขึ้นบรรทัดใหม่ และคงความต่อเนื่องของการสนทนาหลายรอบ (Multi-turn Chat Continuity)
- **Guest-to-Cloud Chat Session Migration & Firestore Hardening:**
  - เพิ่มระบบ `migrateGuestSessionsToUser`: นำประวัติการสนทนาที่ผู้ใช้คุยไว้ขณะเป็น Guest ย้ายเข้าบัญชีผู้ใช้อัตโนมัติและซิงก์ขึ้น Firestore Cloud ทันทีเมื่อล็อกอิน
  - ปรับปรุง Security Rules ของ Firestore สำหรับ Subcollection `users/{userId}/chat_sessions/{sessionId}` ป้องกัน Permission Denied
- **AI Agent Typography & Mobile Spacing Optimization:**
  - ปรับลดระยะห่างแนวตั้ง (Vertical Margins/Padding) ในการเรนเดอร์ Markdown ของ AI Assistant ให้กระชับ สบายตา
  - นำ `white-space: pre-wrap;` ออกเพื่อป้องกันการเบิ้ลเว้นวรรคบรรทัดซ้ำซ้อน
  - ปรับปรุงการแสดงผลบนหน้าจอมือถือ (`< 640px`): ฟองข้อความกว้างขึ้น (90%) ลด padding ขอบจอ
- **Automated Theme Contrast Checking Suite:**
  - เพิ่ม Utility `themeContrastChecker.ts` และชุดทดสอบความเปรียบต่างสีตามมาตรฐานสากล WCAG 2.1 AA/AAA สำหรับ Dark/Light Mode

---

## 🚀 [v2.0.0] - 2026-09-13 (Production Enterprise Release)
### "Universal Financial Asset Router, Multi-Tier Grounding & Cloud Hardening"

การอัปเกรดครั้งใหญ่ระดับสถาปัตยกรรม เพื่อเตรียมความพร้อม 100% สำหรับการเปิดให้บริการบน Production:

#### 🛡️ Universal Financial Asset Router & Zero-Assumption Policy
- **3-Pillar Validation:** เพิ่มระบบตรวจสอบความชัดเจน 3 มิติ (Asset Identity, Trading Venue/Exchange, Denomination Currency) ก่อนเริ่มการวิเคราะห์
- **Zero-Assumption Engine (`src/lib/services/assetAmbiguityEngine.ts`):** AI จะไม่ทึกทักหรือสรุปสินทรัพย์ไปเองเด็ดขาดเมื่อคำถามมีความกำกวม
- **ขจัดปัญหาการทึกทักทองคำเป็น GLD:** ถอดการผูกคำตายตัว `'ทอง': 'GLD'` ออกอย่างสมบูรณ์ และเพิ่มระบบแยก 4 รูปแบบของทองคำ (สมาคมค้าทองคำไทย, Spot Gold XAU/USD, กองทุน SPDR, หุ้นร้านทอง AURA)
- **Universal Asset Registry (`src/config/assetRegistry.ts`):** รองรับการแยกความกำกวมของ:
  - 🪙 ทองคำ (Gold)
  - 🛢️ น้ำมันดิบและค้าปลีก (Crude Oil)
  - 💴 ค่าเงินเยน (JPY/THB vs หุ้น/ETF ญี่ปุ่น)
  - 💵 ค่าเงินดอลลาร์ (USD/THB vs ดัชนีตลาดหุ้นสหรัฐฯ)
  - 🇺🇸 หุ้นแม่สหรัฐฯ vs 🇹🇭 ตราสาร DRx ในไทย (AAPL vs AAPL80X, TSLA vs TSLA80X)
  - 🪙 เหรียญ Bitcoin Spot vs หุ้นถือครองคริปโต (MSTR, COIN)
  - 🎯 คำถามแนะนำหุ้นแบบกว้างๆ สำหรับคัดกรองกรอบเวลาการลงทุน
- **Interactive Quick Reply Buttons:** เรนเดอร์กล่องปุ่มกดด่วนบนหน้าต่างแชต AI ให้ผู้ใช้คลิกเลือกตลาดได้ในคลิกเดียวในเวลาเพียง 15ms โดยไม่หักเหรียญ GemCoins และไม่เสียค่า Token

#### ⚡ Multi-Tier Stock Grounding Engine (Web Cache & Supabase 10,637 หุ้น)
- **แก้ปัญหาราคาบน Vercel Production ไม่ตรงหน้าเว็บ:**
  - **Tier 1 (Instant Web Cache):** ดึงราคาจาก Cache หน้าเว็บก่อนเป็นอันดับแรก (< 1ms) เพื่อให้ราคาตรงกับที่ผู้ใช้เห็น 100%
  - **Tier 2 (Supabase Cloud Catalog):** เชื่อมต่อฐานข้อมูล Supabase REST API ค้นหาหุ้นครอบคลุม **10,637 ตัว** รันบน Vercel Production ได้เสถียร ไม่โดนบล็อก IP
  - **Tier 3 (External Real-Time Fallback):** ระบบสำรองภายนอกพร้อมระบบ Fail-safe ป้องกันการส่งคืนค่าว่าง
- **ฟังก์ชัน `fetchStockFromSupabase`:** ดึงข้อมูล P/E, Dividend Yield, High/Low 52w, Volume, Market Cap และกราฟ 7 วันจาก Supabase โดยตรง

#### 💎 UID-Isolated GemCoin Wallet & Dual Persistence
- **แก้ไขปัญหาเหรียญรั่วข้ามบัญชีและรีเซ็ตกลับเป็น 500:**
  - แยก Storage และ Database Record เด็ดขาดตาม Firebase UID ของผู้ใช้แต่ละคน
  - บันทึกข้อมูลแบบ Dual Persistence ทั้งใน **Firebase Firestore Cloud** และ **Server-side Persistence (`user_wallets.json`)**
  - เพิ่มกฎความปลอดภัย `firestore.rules` ป้องกันไม่ให้ผู้ใช้เข้าถึงกระเป๋าเหรียญของผู้อื่น
  - บังคับล็อกอินก่อนใช้งาน AI (Guest Quota = 0) เพื่อความปลอดภัยของระบบ

#### 📜 นโยบายทางกฎหมาย 2 ภาษา & ความโปร่งใสของข้อมูล (Sci-Com)
- **100% Bilingual Legal Modal (`TermsDisclaimerModal.tsx`):** แปลข้อตกลงและนโยบายทางกฎหมายทั้ง 4 หมวดเป็นภาษาอังกฤษฉบับสมบูรณ์ (Terms, Privacy, Payment, Risk Disclaimer)
- **Science Communication Principles:** AI ต้องระบุแหล่งที่มา วันที่ เวลา และหน่วยของตัวเลขทางการเงินเสมอ (เช่น บาทต่อบาททองคำ, USD/Ounce, ล้านบาท)

#### 📰 ขัดเกลาระบบข่าวสาร (News Polish)
- **Digest Header Banner:** แก้ไขการตัดคำพาดหัวข่าว ให้แสดงผลชื่อข่าวแบบเต็ม ไม่ขาดท่อน
- **News Detail Sheet & Classifier:** เพิ่ม Safeguard ป้องกัน AI สรุปเนื้อหาซ้ำกับพาดหัวข่าว โดยจะ Fallback ดึงสาระสำคัญจาก `keyTakeaways` มาแสดงแทน

#### 🧪 ระบบทดสอบอัตโนมัติ (Automated Unit Tests)
- ติดตั้งและตั้งค่า **Vitest** (`vitest.config.ts`) รองรับ Path Aliases `@/`
- สร้างชุดทดสอบ **`assetAmbiguityEngine.test.ts`** ครอบคลุมทั้ง Happy Path และ Ambiguous Path

---

## ⚡ [v1.9.0] - 2026-09-12
### "AI Chat RAG Anchoring, Platform Knowledge & Streaming Engine"
- **Strict Anchoring Lore:** บังคับให้ AI อ้างอิงราคาหุ้นจากข้อมูล RAG เรียลไทม์เท่านั้น ป้องกันการกุราคาในอดีต (Zero Hallucination)
- **Platform Knowledge Context:** ป้อนข้อมูลระบบ StockHomeTH, อัตราแลกเปลี่ยนเหรียญ, และแพ็กเกจสมาชิกเข้าสู่ AI Prompt
- **Vernacular Thai Stock Name Mapping:** เพิ่มพจนานุกรมชื่อย่อและชื่อภาษาไทยสำหรับหุ้นไทยชั้นนำ (เช่น ปตท, การท่า, แอดวานซ์, เดลต้า, รถไฟฟ้า)
- **SSE Real-time Streaming:** แสดงผลข้อความคำตอบแบบตัวอักษรต่อตัวอักษรลื่นไหล
- **Rolling Context Summarization:** สรุปย่อบริบทการสนทนายาวเพื่อประหยัด Token

---

## 💳 [v1.8.0] - 2026-09-11
### "Stripe Live PromptPay & Glass iOS Storefront"
- **Thai PromptPay QR Code:** เปิดใช้งานการชำระเงินผ่าน QR พร้อมเพย์สำหรับประเทศไทย
- **Live Price IDs Integration:** เชื่อมโยง Price IDs จริงจากแดชบอร์ด Stripe สำหรับทุกแพ็กเกจ
- **Real-Time Verification:** ตรวจสอบเซสชันการชำระเงินสำเร็จทันที ไม่ต้องรอ Rate-limit ดีเลย์
- **Glass iOS Storefront:** ดีไซน์หน้าร้านค้าใหม่ในสไตล์ iOS Glassmorphism รองรับ Dark/Light Mode คมชัดระดับ WCAG AAA

---

## 📱 [v1.7.0] - 2026-09-10
### "Mobile PWA Experience & Cloud History Sync"
- **PWA Bottom Navigation Bar:** แถบนำทางด้านล่างมือถือ รองรับ Safe Area Inset ของ iPhone
- **Responsive Mobile Tabs:** เมนูร้านค้าบนมือถือเปลี่ยนเป็น Dropdown อัตโนมัติ ป้องกันปุ่มเบียด
- **Full-Screen Mobile Chat:** หน้าต่าง AI Chat เต็มหน้าจอ พร้อมปุ่มย้อนกลับและประวัติการคุย
- **Cloud History Synchronization:** ประวัติการสนทนา AI ซิงค์อัตโนมัติข้ามอุปกรณ์ผ่าน Firebase Firestore

---

## 📈 [v1.5.0] - 2026-09-08
### "Dual-Market Universe & Market Ticker Bar"
- **แยกศูนย์ข้อมูล 2 ตลาด:**
  - ตลาดหุ้นไทย (`/stocks/thai`): ครอบคลุมบริษัทจดทะเบียน SET และ mai
  - ตลาดหุ้นสหรัฐฯ (`/stocks/us`): หุ้น Magnificent 7, S&P 500, และ NASDAQ
- **Real-Time Market Ticker Bar:** แถบแสดงดัชนีตลาดหลักทรัพย์ (SET, S&P 500, Dow Jones, ราคาทองคำ, น้ำมันดิบ)
- **AI Stock Classifier:** ระบบจัดหมวดหมู่ข่าวสารและวิเคราะห์ Sentiment ตลาดแบบอัตโนมัติ
