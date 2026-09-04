# 📈 StockHomeTH - Modern Real-Time Stock Market & Financial Intelligence Platform

> **แพลตฟอร์มสรุปข่าวสารและวิเคราะห์ข้อมูลตลาดหุ้นไทย (SET / mai) และหุ้นต่างประเทศ (US / Global)**  
> ผสานพลัง Real-Time Multi-Source Engine, Gemini AI Summarization (Token-Optimized), และระบบดึงข้อมูลตลาดหุ้นอัตโนมัติพร้อม Checkpoint & Logging

---

## 🌟 จุดเด่นและฟังก์ชันหลัก (Core Highlights)

- 🇹🇭 **ระบบแยกส่วนชัดเจน หุ้นไทย (SET/mai) & หุ้นต่างประเทศ (US/Global)**: รองรับการสลับดูรายชื่อหุ้น, ราคาเรียลไทม์, กราฟเชิงลึก, และข่าวสารเฉพาะภูมิภาค
- 🌐 **ปุ่มสลับภาษา TH / ENG ทันที (Instant Bilingual Toggle)**: รองรับการสลับภาษาทั้งระบบพร้อมจำค่าไว้ใน LocalStorage
- 🎨 **รองรับ 3 ธีม (Light / Dark / System Mode)** พร้อมดีไซน์ Glassmorphism iOS พรีเมียม และไอคอน Lucide SVG คมชัด 80%+
- 📊 **Dynamic Charts & Technical Visuals**: กราฟแท่งเทียน/เส้นแบบอินเตอร์แอคทีฟ และ TradingView integration
- 🤖 **Gemini AI Summarizer (Token-Optimized)**: สรุปสาระสำคัญ ประเมิน Sentiment และ Sentiment Score อย่างแม่นยำ พร้อมแคชผลลัพธ์ลดการใช้โควต้า Token
- 📱 **PWA Ready**: ติดตั้งเป็น Web App บน iOS, Android, macOS, และ Windows ได้ทันที

---

## 🛠️ สถาปัตยกรรมการดึงข้อมูลหุ้น (Automated & Resilient Extraction)

ระบบมีชุดคำสั่ง Python สำหรับอัปเดตข้อมูลหุ้นทั้งสองตลาดอย่างมีเสถียรภาพและทนทานสูง:

### 1. 🇺🇸 US Stocks Directory (`update_us_stocks.py`)
- ดึงรายชื่อบริษัทจดทะเบียนในตลาดหุ้นสหรัฐฯ ทั้งหมด (10,000+ บริษัท) จาก **SEC.gov API** (`https://www.sec.gov/files/company_tickers.json`) แบบสาธารณะ
- ส่งต่อเข้า `us_stocks.json` และ `server/data/us_stocks.json` พร้อมดึงราคาและข้อมูลล่าสุด

### 2. 🇹🇭 Thai Stocks Extraction with Checkpoint & Logs (`update_thai_stocks.py`)
- **State Persistence**: บันทึก Chunk Index ล่าสุดลง `checkpoint.json` รองรับการปิดโปรแกรมหรือเน็ตหลุด
- **Batch Chunking (20 tickers/chunk)**: ป้องกัน Rate Limit และประหยัด Bandwidth
- **Idempotency**: ดึงต่อจากจุดเดิมทันที (Offline Recovery) ไม่ทำให้ข้อมูลเดิมสูญหาย
- **Robust Logging**: บันทึกสถานะและข้อผิดพลาดลง `crawler.log` และ `update_log.txt` สำหรับตรวจสอบย้อนหลัง

### 3. 🚀 Master Sync Runner (`update_stocks.py`)
รันอัปเดตทั้งตลาดไทยและตลาดสหรัฐฯ ในคำสั่งเดียว:
```bash
py update_stocks.py
```

---

## 🚀 การติดตั้งและรันในเครื่อง (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
# Node.js Dependencies
npm install

# Python Dependencies
pip install -r requirements.txt
# หรือ
pip install yfinance pandas requests fastapi uvicorn beautifulsoup4
```

### 2. กำหนดค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env` และแก้ไขค่าตามต้องการ:
```bash
cp .env.example .env
```

### 3. รันระบบ (Development Mode)
สามารถดับเบิ้ลคลิก `start-local.bat` หรือรันผ่าน Terminal:
```bash
# รัน Next.js Frontend & API Server
npm run dev

# หรือรัน Python Live Backend Engine
py main.py
```

เปิดบราวเซอร์ไปที่ `http://localhost:3000`

---

## 🛡️ Security & Privacy Guidelines
- ไฟล์ข้อมูลสำคัญ (`.env`, `.env*.local`, `server/data/users.json`, `checkpoint.json`, `*.log`) ถูกกำหนดให้อยู่ใน `.gitignore` อย่างเข้มงวด ป้องกันการรั่วไหลของข้อมูลและ API Secrets

---

## 📄 License
MIT License • Developed with ❤️ for Investors & Developers
