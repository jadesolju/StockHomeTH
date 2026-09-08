# คู่มือความปลอดภัยและนโยบายทางกฎหมายสำหรับนักพัฒนา (Developer Security & Legal Policy)

> **บันทึกสำหรับผู้พัฒนา:** เอกสารฉบับนี้สรุปหลักปฏิบัติด้าน Cyber Security แบบฉบับ Bitcoiner, การจัดการ Secret, การอุดช่องโหว่ระบบ, และข้อพึงระวังทางกฎหมายสำหรับนักพัฒนาอิสระ (บุคคลธรรมดา)

---

## ๑. คำแถลงสถานะทางกฎหมายของผู้พัฒนา (Developer Identity & Legal Shield)

### 📌 สถานะ: บุคคลธรรมดา (Solo / Independent Developer)
1. **มิใช่นิติบุคคลหรือสถาบันการเงิน:** แพลตฟอร์มนี้พัฒนา ดูแล และดำเนินงานโดยบุคคลธรรมดาในฐานะผู้ศึกษาและทดลองเทคโนโลยีทางการเงิน มิได้จดทะเบียนในรูปแบบบริษัทจำกัด บริษัทมหาชน หรือห้างหุ้นส่วน
2. **มิใช่ผู้ประกอบธุรกิจหลักทรัพย์:** ผู้พัฒนามิได้เป็นบริษัทหลักทรัพย์ ที่ปรึกษาการลงทุน หรือผู้ให้บริการวิเคราะห์การลงทุนที่ได้รับใบอนุญาตหรือขึ้นทะเบียนกับสำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์ (ก.ล.ต.)
3. **วัตถุประสงค์เพื่อการศึกษา (Educational / Research Only):** ทุกฟังก์ชัน, ตัวเลขสถิติ, ข้อมูลดัชนี และบทวิเคราะห์ AI จัดทำขึ้นเพื่อประโยชน์ในการศึกษาค้นคว้าส่วนบุคคล มิใช่คำแนะนำทางการเงิน (Non-Advice)
4. **ข้อจำกัดความรับผิด (Limitation of Liability):** ซอฟต์แวร์และข้อมูลทั้งหมดจัดเตรียมไว้แบบ **&ldquo;ตามสภาพที่เป็นอยู่&rdquo; (As-Is Basis)** ผู้ใช้บริการยอมรับความเสี่ยงในการลงทุนด้วยตนเองทั้งหมด (Do Your Own Research - DYOR) ผู้พัฒนาไม่ต้องรับผิดชอบต่อผลขาดทุนหรือความเสียหายใดๆ

---

## ๒. ปรัชญาความปลอดภัยแบบ Bitcoiner (Cyber Security Principles)

ระบบ StockHomeTH นำหลักการของ Bitcoin มาประยุกต์ใช้เพื่อความปลอดภัยและความเป็นส่วนตัวสูงสุด:

### 🔑 ๑. "Not your keys, not your coins / data" (Self-Custody Sovereignty)
* **คีย์ AI ของผู้ใช้:** Gemini API Key หรือ AI Provider Key ใดๆ ที่ผู้ใช้นำมาใส่ **จะต้องจัดเก็บไว้เฉพาะใน LocalStorage บนอุปกรณ์ของผู้ใช้เท่านั้น**
* **ห้ามบันทึกคีย์ลงฐานข้อมูลกลาง:** เซิร์ฟเวอร์และ Database Supabase จะต้องไม่มีตารางหรือคอลัมน์ใดที่จัดเก็บ API Key ส่วนตัวของผู้ใช้ เพื่อป้องกันความเสียหายกรณีฐานข้อมูลถูกโจมตี (Zero-Custody)
* **ผู้ใช้เป็นเจ้าของข้อมูล:** ผู้ใช้สามารถกด "ล้างคีย์" ออกจากเครื่องตนเองได้ตลอดเวลา 100%

### 🔍 ๒. "Don't Trust, Verify" (Zero-Trust & Verifiability)
* **ไม่เชื่อใจข้อมูลลอยๆ:** ทุกตัวเลขราคา, งบการเงิน, และบทวิเคราะห์ ต้องมีลิงก์กด **"Verify ↗"** ไปยังแหล่งข้อมูลทางการ (ตลาดหลักทรัพย์แห่งประเทศไทย SET, ก.ล.ต. SEC Thailand, Yahoo Finance) ให้นักลงทุนตรวจสอบความถูกต้องได้ด้วยตนเอง
* **Input Sanitization 100%:** ทุก Endpoint ต้องตรวจสอบ Input ด้วย Regular Expression (เช่น `/^[A-Za-z0-9._-]+$/`) ห้ามนำ Parameter จาก User ยิงเข้าคำสั่งเชลล์ (`exec`, `spawn`) โดยตรงเด็ดขาด เพื่อขจัดช่องโหว่ Command Injection (RCE)

---

## ๓. ผลการตรวจสอบและแก้ไขช่องโหว่ (Security Audit & Remediation)

| ช่องโหว่เดิม | ความเสี่ยง | การแก้ไขที่ดำเนินการแล้ว |
|---|---|---|
| **Cloudflare R2 Key Leaked** | 🚨 Critical | ลบ Secret Access Key ออกจากโค้ดทั้งหมด บังคับอ่านจาก `.env.local` เท่านั้น |
| **Command Injection ใน `/api/dev/yfinance`** | 🚨 Critical | เพิ่มตัวบล็อก Production (`NODE_ENV === 'development'`) และใส่ Regex Sanitization ป้องกัน Injection |
| **Unauthenticated File Upload ใน `/api/upload/r2`** | ⚠️ High | บังคับตรวจสอบ `userId` / Auth Header, จำกัดชนิดไฟล์เฉพาะรูปภาพ, และจำกัดขนาดไม่เกิน 5MB |
| **Public Cron Trigger ใน `/api/cron/sync`** | ⚠️ High | เพิ่มการตรวจสอบ `Authorization: Bearer <CRON_SECRET>` |
| **Hardcoded API Keys ในบริการข่าว** | ⚠️ Medium | ลบคีย์ Finnhub และ SET ออกจากโค้ดทั้งหมด บังคับอ่านจาก Environment Variables |

---

## ๔. ขั้นตอนหมุนเวียนคีย์ (Key Rotation) บน Cloudflare Dashboard

เนื่องจากคีย์ Cloudflare R2 เดิมเคยถูกคอมมิตลงใน Git ขอแนะนำให้ทำการหมุนเวียนคีย์ใหม่ดังนี้:

1. เข้าสู่ระบบ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ไปที่เมนู **R2** > **Manage R2 API Tokens**
3. กด **Create API Token**
   - **Permissions:** เลือก `Object Read & Write`
   - **Bucket:** เลือกเจาะจงเฉพาะบัคเก็ต `stockhometh`
4. คัดลอก **Access Key ID** และ **Secret Access Key** ใหม่
5. นำไปอัปเดตลงในไฟล์ `.env.local` ของเครื่อง และใน **Environment Variables บน Vercel**:
   ```env
   CLOUDFLARE_R2_ACCESS_KEY_ID="คีย์ใหม่"
   CLOUDFLARE_R2_SECRET_ACCESS_KEY="คีย์ใหม่"
   ```
6. ทำการ **Revoke (ลบ)** Token เดิมบน Cloudflare Dashboard ทันที

---

## ๕. กฎเหล็กก่อนการ Git Commit & Push (Pre-Commit Checklist)

ก่อนสั่ง `git commit` และ `git push` ทุกครั้ง ให้รันคำสั่งตรวจสอบเหล่านี้ในเทอร์มินัล:

```powershell
# ๑. ตรวจสอบว่าไม่มี API Key หรือ Secret ตกค้างในไฟล์โค้ด
git grep -E "(cfat_|sb_secret|ghp_|sk-[a-zA-Z0-9]{20,}|BEGIN PRIVATE KEY)"

# ๒. ตรวจสอบ Type Safety และความถูกต้องของโค้ด
npx tsc --noEmit

# ๓. ตรวจสอบไฟล์ที่กำลังจะคอมมิต
git status -s
```
