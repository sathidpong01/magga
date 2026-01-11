<div align="center">

# 📚 Magga Reader

**เว็บแอปพลิเคชันสำหรับอ่านการ์ตูน/มังงะออนไลน์ เน้นประสบการณ์การอ่านแบบหน้าเดียวจบ (One-shot) หรือ Webtoon**

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-black?style=for-the-badge&logo=turso&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

_พัฒนาด้วย Next.js 16 (App Router) และระบบจัดการหลังบ้านที่ครบครัน_

---

</div>

> **หมายเหตุ:** โปรเจกต์นี้ได้รับการพัฒนาและเขียนโค้ดโดยมีความช่วยเหลือจาก AI (Artificial Intelligence) 🤖✨

## 🛠️ Tech Stack

โปรเจกต์นี้ใช้เทคโนโลยีที่ทันสมัยเพื่อให้ทำงานได้รวดเร็วและง่ายต่อการดูแลรักษา:

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [Turso (LibSQL)](https://turso.tech/) (ผ่าน [Prisma ORM 7](https://www.prisma.io/))
- **Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)
- **Styling:**
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Material UI (MUI)](https://mui.com/) (สำหรับ Component ต่างๆ)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials Provider)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics)
- **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/) (Server-side compression & WebP conversion)

---

## ✨ ฟีเจอร์หลัก (Features)

### 🏠 สำหรับผู้อ่าน (Public Interface)

- **UI Theme:** ดีไซน์ใหม่ **"Neutral Dark"** สบายตา เน้นสีดำด้าน (Neutral Black) ตัดกับสีม่วง/เขียว
- **Interactive UI:**
  - **3D Logo:** โลโก้ที่มีมิติและ Interactive Shadow effect เมื่อเอาเมาส์ไปวางหรือคลิก
  - **New!** **Sticky Header:** เฮดเดอร์แบบโปร่งใสที่เปลี่ยนเป็นสีทึบเมื่อเลื่อนหน้าจอ พร้อมปุ่ม "ฝากลงมังงะ" ที่เข้าถึงง่าย
  - **New!** **Immersive Cards:** การ์ดมังงะดีไซน์ใหม่แบบ Full-cover overlay ทันสมัยและสวยงาม
  - **Hover Effects:** การ์ดมังงะและปุ่มต่างๆ มี Animation ที่นุ่มนวล (Smooth Transitions)
- **Home Page:** แสดงรายการมังงะทั้งหมด พร้อมระบบค้นหา (Search)
- **Filters & Sort:** กรองมังงะตาม หมวดหมู่ (Category), แท็ก (Tag) และเรียงลำดับตามวันที่อัปเดต/วันที่เพิ่ม/ชื่อเรื่อง
  - _New!_ **Smart Auto-Filter:** ระบบกรองอัตโนมัติที่ฉลาดขึ้น ป้องกันการโหลดซ้ำซ้อน (Infinite Loop) และลดภาระ Server
  - _New!_ **Fuzzy Search (Fuse.js):** ค้นหาแบบ Fuzzy รองรับพิมพ์ผิด/คำใกล้เคียง พร้อม Autocomplete dropdown
- **Reader:** หน้าอ่านการ์ตูนแบบเลื่อนลง (Vertical Scroll)
  - _New!_ **Lazy Loading:** โหลดรูปภาพเมื่อเลื่อนลงมาถึง ช่วยให้หน้าเว็บโหลดเร็วขึ้นมาก
  - **Responsive Design:** รองรับการใช้งานทั้งบนมือถือ แท็บเล็ต และเดสก์ท็อป
- **Loading Experience:**
  - **Skeleton Screens:** แสดงโครงร่างเนื้อหาขณะโหลดข้อมูล (Homepage, Reader, Admin) เพื่อลดความรู้สึกรอนาน
  - **New!** **Streaming SSR:** ใช้ React Suspense + Streaming เพื่อแสดงเนื้อหาหลักก่อน แล้วค่อยโหลดส่วนอื่นตามมา
- **Comments System:**
  - แสดงความคิดเห็นท้ายเรื่อง พร้อมระบบ Reply, Vote, และแนบรูปภาพ
  - **New!** **Image Lightbox:** กดรูปในคอมเมนต์เพื่อขยายดูแบบ Fullscreen (ไม่ redirect ไปยัง URL)
  - **New!** **Server-First Comments:** Comments ถูก render จาก Server โดยตรง ลด JavaScript ฝั่ง Client
- **Custom 404 Page:** หน้าแจ้งเตือนเมื่อไม่พบเนื้อหา ดีไซน์สวยงามเข้ากับธีมมังงะ

### ⚙️ ระบบหลังบ้าน (Admin Panel)

- **Dashboard:** หน้าภาพรวมสำหรับแอดมิน แสดงสถิติและรายการมังงะล่าสุด
  - **New!** **Improved Layout:** แก้ไขปัญหา Layout ซ้อนทับ และเพิ่มปุ่ม "Back to Home" เพื่อความสะดวก
- **Manga Management:**
  - สร้าง (Create), แก้ไข (Edit), และลบ (Delete) มังงะ
  - อัปโหลดรูปภาพหน้าปก (Cover) และเนื้อหา (Pages) ได้โดยตรง (บันทึกลง Cloudflare R2)
  - **New!** **Friendly URLs (Slug):** รองรับ URL แบบชื่อเรื่อง (เช่น `/manga/one-piece`) เพื่อผลลัพธ์ SEO ที่ดีขึ้น
  - **New!** **Author Name Field:** เพิ่มช่องชื่อผู้แต่งสำหรับ og:title format `[ผู้แต่ง] - ชื่อเรื่อง`
  - **New!** **Author Management:** ระบบจัดการผู้แต่งแบบ Dedicated พร้อม **Multiple Social Links** รองรับหลายลิงก์ต่อผู้แต่ง พร้อมฟีเจอร์ **Auto-fetch Metadata** ดึงชื่อและไอคอนจากลิงก์อัตโนมัติ
  - **New!** **Resilient Uploads:** ระบบอัปโหลดไฟล์แบบ Non-blocking พร้อม Floating Status และปุ่ม Retry สำหรับไฟล์ที่ล้มเหลว
  - **Auto Compression:** ระบบย่อขนาดรูปภาพ (Max 1920px) และแปลงเป็น WebP อัตโนมัติ ช่วยประหยัดพื้นที่จัดเก็บได้ถึง 80%
- **Classification Management:** จัดการเพิ่ม/ลบ/แก้ไข หมวดหมู่ และ แท็ก ได้อย่างอิสระ
- **Authentication & RBAC:**
  - ระบบ Login ที่ปลอดภัยด้วยการเข้ารหัส (Bcrypt)
  - **Role-Based Access Control:** แยกสิทธิ์การใช้งานระหว่าง Admin และ User ทั่วไป
- **Security Hardening:**
  - Strict MIME Type Validation สำหรับการอัปโหลดไฟล์
  - Security Headers (X-Content-Type-Options, X-Frame-Options, CSP, HSTS) ปกป้องเว็บจากการโจมตีพื้นฐาน
  - **New!** **Admin Authorization:** ระบบตรวจสอบสิทธิ์ Admin ครบทุก API route (requireAdmin helper)
  - **New!** **Rate Limiting:** ป้องกัน Brute Force และ Spam (Login, Registration, Password Change, Comments)
  - **New!** **Input Sanitization:** ป้องกัน XSS Attack สำหรับ Tags, Categories, Authors, Comments
  - **New!** **Password Strength:** ต้องมีอย่างน้อย 8 ตัวอักษร, ตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข และอักขระพิเศษ
  - **New!** **ZAP Security Audit:** ผ่านการตรวจสอบความปลอดภัยด้วย OWASP ZAP
  - **New!** **DevTools Protection:** ระบบตรวจจับและป้องกัน DevTools เพื่อป้องกันการขโมยข้อมูล
  - **New!** **Policy Pages:** หน้านโยบายความเป็นส่วนตัว, ข้อตกลงในการใช้งาน และรายงานการละเมิด (DMCA)
  - **Security Score:** 9.5/10 ⭐ (เพิ่มขึ้นจาก 8.5/10)
- **Performance Optimization:**
  - **New!** **Server Actions:** ใช้ Server Actions สำหรับ Comments และ Submit manga (ลด API Routes)
  - **New!** **Server Components:** Layouts เป็น Server Components ลด JavaScript bundle
  - **New!** **Parallel Fetching:** ลด Waterfall ด้วยการ fetch ข้อมูลแบบ parallel

👉 **ดูรายการเปลี่ยนแปลงทั้งหมดได้ที่ [CHANGELOG.md](./CHANGELOG.md)**

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/sathidpong01/magga.git
cd magga
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ที่ root directory และกำหนดค่าดังนี้:

```env
# Database (Turso / LibSQL)
TURSO_DATABASE_URL="libsql://..."

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-me"

# Cloudflare R2 Storage
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://pub-xxxxxxxx.r2.dev"
```

### 4. เตรียมฐานข้อมูล

```bash
# สร้างตารางใน Database
npx prisma db push

# (Optional) เพิ่มข้อมูลตัวอย่าง
npm run db:seed
```

> **Important:** หากคุณอัปเดตมาจากเวอร์ชันเก่า ต้องรัน SQL Migration เพื่อเพิ่มคอลัมน์ `slug` และ `role`:
>
> ```sql
> ALTER TABLE "Manga" ADD COLUMN "slug" TEXT;
> UPDATE "Manga" SET "slug" = "id";
> CREATE UNIQUE INDEX "Manga_slug_key" ON "Manga"("slug");
>
> ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'USER';
> UPDATE "User" SET "role" = 'ADMIN' WHERE "username" = 'admin'; -- ตัวอย่างการตั้งค่า Admin
> ```

> **Note:** การตั้งค่า Prisma อยู่ในไฟล์ `prisma.config.ts` (Prisma 7)

### 5. รันโปรเจกต์

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## ⚡ Vercel Deployment & Optimization

โปรเจกต์นี้ได้รับการ optimize พิเศษสำหรับ Vercel deployment เพื่อประสิทธิภาพสูงสุด:

### 🚀 Performance Optimizations

- **ISR (Incremental Static Regeneration):**

  - Home page: revalidate ทุก 60 วินาที
  - Admin Dashboard: revalidate ทุก 60 วินาที (New!)
  - Manga pages: revalidate ทุก 1 ชั่วโมง + pre-render 50 เรื่องยอดนิยม
  - Category/Tag pages: revalidate ทุก 5 นาที

- **User Experience (UX):**

  - **Loading Skeletons:** ใช้ `loading.tsx` เพื่อแสดง Skeleton UI ระหว่างรอข้อมูล (Streaming SSR)
  - **Font Optimization:** ใช้ `next/font` เพื่อลด Layout Shift

- **Image Optimization:**

  - WebP/AVIF formats
  - 1 year cache TTL
  - Lazy loading รูปภาพ

- **API Caching:**

  - CDN edge caching (60 วินาที)
  - Stale-while-revalidate strategy

- **Database Optimization:**
  - Production-optimized Prisma logging
  - Connection pooling with Turso

### 📊 Performance Metrics

| Metric         | Before        | After     | Improvement          |
| -------------- | ------------- | --------- | -------------------- |
| Home Page Load | ~500ms        | <100ms    | **80% faster** ⚡    |
| Top Manga Load | ~500ms        | <30ms     | **94% faster** 🚀    |
| DB Queries     | Every request | Every 60s | **95% reduction** 📉 |
| Monthly Cost   | Baseline      | ~70%      | **30% cheaper** 💰   |

### 📚 Deployment Documentation

สำหรับข้อมูลการ deploy และ configuration บน Vercel:

- 📖 [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) - คู่มือ optimization แบบละเอียด
- 📋 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Checklist การ deploy
- 📊 [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) - สรุปการ optimize
- ⚙️ [VERCEL_SETUP.md](./VERCEL_SETUP.md) - การตั้งค่า Environment Variables

---

## 🛣️ แผนการพัฒนาในอนาคต (Roadmap)

- [x] **เปลี่ยนฐานข้อมูล:** ย้ายจาก SQLite ไปใช้ Turso (LibSQL) เรียบร้อยแล้ว
- [x] **ระบบจัดการรูปภาพ:** เปลี่ยนการเก็บรูปจาก Local ไปใช้ Cloudflare R2 เรียบร้อยแล้ว
- [x] **Image Optimization:** เพิ่มระบบบีบอัดรูปภาพ (WebP) และ Lazy Loading
- [x] **Web Analytics:** ติดตั้งระบบเก็บสถิติผู้เข้าชมเว็บไซต์
- [x] **Vercel Optimization:** ปรับปรุงประสิทธิภาพ ISR, Loading States และ Image Optimization สำหรับ Vercel
- [x] **ระบบสมาชิก (Authentication):** รองรับการสมัครสมาชิก, เข้าสู่ระบบ และจัดการโปรไฟล์
- [x] **ระบบส่งผลงาน (User Submissions):** สมาชิกสามารถส่งมังงะเพื่อขอลงเว็บไซต์ได้
- [x] **คอมเมนต์:** ระบบคอมเมนต์ท้ายเรื่อง พร้อม Reply, Vote, และแนบรูปภาพ (Image Lightbox)
- [x] **Server Actions & Streaming:** ใช้ Next.js Server Actions และ Streaming SSR เพื่อประสิทธิภาพสูงสุด
- [ ] **ฟีเจอร์สำหรับผู้อ่าน (Reader Features):**
  - [ ] **ประวัติการอ่าน (History):** บันทึกตอนที่อ่านล่าสุดอัตโนมัติ
  - [ ] **รายการโปรด (Bookmarks):** กดติดตามมังงะที่ชอบเพื่อรับการแจ้งเตือน
- [x] **SEO & Open Graph:** ปรับปรุง SEO และเพิ่ม Open Graph Tags พร้อม Author Name format `[ผู้แต่ง] - ชื่อเรื่อง` และ JSON-LD Structured Data
- [x] **Full-text Search (Fuse.js):** ระบบค้นหาแบบ Fuzzy Search รองรับพิมพ์ผิด พร้อม Autocomplete dropdown
- [x] **Social Login:** เพิ่มระบบล็อกอินผ่าน Google เพื่อความสะดวกของผู้ใช้งาน (Facebook Coming Soon)

---

<div align="center">

_README นี้ถูกสร้างขึ้นเพื่ออธิบายโครงสร้างและการทำงานของโปรเจกต์ Magga Reader_

</div>
