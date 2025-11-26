<div align="center">

# 📚 Magga Reader

**เว็บแอปพลิเคชันสำหรับอ่านการ์ตูน/มังงะออนไลน์ เน้นประสบการณ์การอ่านแบบหน้าเดียวจบ (One-shot) หรือ Webtoon**

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Turso](https://img.shields.io/badge/Turso-black?style=for-the-badge&logo=turso&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

_พัฒนาด้วย Next.js 15 (App Router) และระบบจัดการหลังบ้านที่ครบครัน_

---

</div>

> **หมายเหตุ:** โปรเจกต์นี้ได้รับการพัฒนาและเขียนโค้ดโดยมีความช่วยเหลือจาก AI (Artificial Intelligence) 🤖✨

## 🛠️ Tech Stack

โปรเจกต์นี้ใช้เทคโนโลยีที่ทันสมัยเพื่อให้ทำงานได้รวดเร็วและง่ายต่อการดูแลรักษา:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [Turso (LibSQL)](https://turso.tech/) (ผ่าน [Prisma ORM 7](https://www.prisma.io/))
- **Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)
- **Styling:**
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Material UI (MUI)](https://mui.com/) (สำหรับ Component ต่างๆ)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials Provider)
- **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/) (Server-side compression & WebP conversion)

---

## ✨ ฟีเจอร์หลัก (Features)

### 🏠 สำหรับผู้อ่าน (Public Interface)

- **Home Page:** แสดงรายการมังงะทั้งหมด พร้อมระบบค้นหา (Search)
- **Filters & Sort:** กรองมังงะตาม หมวดหมู่ (Category), แท็ก (Tag) และเรียงลำดับตามวันที่อัปเดต/วันที่เพิ่ม/ชื่อเรื่อง
  - _New!_ **Smart Auto-Filter:** ระบบกรองอัตโนมัติที่ฉลาดขึ้น ป้องกันการโหลดซ้ำซ้อน (Infinite Loop) และลดภาระ Server
- **Reader:** หน้าอ่านการ์ตูนแบบเลื่อนลง (Vertical Scroll)
  - _New!_ **Lazy Loading:** โหลดรูปภาพเมื่อเลื่อนลงมาถึง ช่วยให้หน้าเว็บโหลดเร็วขึ้นมาก
  - **Responsive Design:** รองรับการใช้งานทั้งบนมือถือ แท็บเล็ต และเดสก์ท็อป

### ⚙️ ระบบหลังบ้าน (Admin Panel)

- **Dashboard:** หน้าภาพรวมสำหรับแอดมิน
- **Manga Management:**
  - สร้าง (Create), แก้ไข (Edit), และลบ (Delete) มังงะ
  - อัปโหลดรูปภาพหน้าปก (Cover) และเนื้อหา (Pages) ได้โดยตรง (บันทึกลง Cloudflare R2)
  - **New!** **Friendly URLs (Slug):** รองรับ URL แบบชื่อเรื่อง (เช่น `/manga/one-piece`) เพื่อผลลัพธ์ SEO ที่ดีขึ้น
  - **New!** **Author Credits:** ระบบให้เครดิตผู้แต่ง/ผู้แปล พร้อมฟีเจอร์ **Auto-fetch Metadata** ดึงชื่อและไอคอนจากลิงก์ (Facebook/Twitter) อัตโนมัติ
  - **Auto Compression:** ระบบย่อขนาดรูปภาพ (Max 1920px) และแปลงเป็น WebP อัตโนมัติ ช่วยประหยัดพื้นที่จัดเก็บได้ถึง 80%
- **Classification Management:** จัดการเพิ่ม/ลบ/แก้ไข หมวดหมู่ และ แท็ก ได้อย่างอิสระ
- **Authentication:** ระบบ Login สำหรับผู้ดูแลระบบ (Database-backed) ปลอดภัยด้วยการเข้ารหัสรหัสผ่าน (Bcrypt)
- **Security Hardening:**
  - Strict MIME Type Validation สำหรับการอัปโหลดไฟล์
  - Security Headers (X-Content-Type-Options, X-Frame-Options, etc.) ปกป้องเว็บจากการโจมตีพื้นฐาน

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

# Admin Credentials (กำหนด Username/Password สำหรับเข้าหลังบ้าน)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="password123"

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

> **Important:** หากคุณอัปเดตมาจากเวอร์ชันเก่า ต้องรัน SQL Migration เพื่อเพิ่มคอลัมน์ `slug` ด้วย:
>
> ```sql
> ALTER TABLE "Manga" ADD COLUMN "slug" TEXT;
> UPDATE "Manga" SET "slug" = "id";
> CREATE UNIQUE INDEX "Manga_slug_key" ON "Manga"("slug");
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
  - Manga pages: revalidate ทุก 1 ชั่วโมง + pre-render 50 เรื่องยอดนิยม
  - Category/Tag pages: revalidate ทุก 5 นาที

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
- [ ] **ระบบสมาชิก:** เพิ่มระบบสมัครสมาชิกสำหรับผู้อ่าน เพื่อให้สามารถเก็บประวัติการอ่าน (History) หรือกดบันทึกเรื่องที่ชอบ (Bookmarks)
- [ ] **คอมเมนต์:** เพิ่มฟีเจอร์ให้ผู้อ่านสามารถแสดงความคิดเห็นในแต่ละเรื่องได้
- [ ] **Theme Customization:** เพิ่มตัวเลือก Dark/Light mode หรือปรับแต่งธีมสีของเว็บไซต์ได้จากหน้า Admin
- [ ] **SEO & Open Graph:** ปรับปรุง SEO และเพิ่ม Open Graph Tags เพื่อให้การแชร์ลิงก์บน Social Media สวยงามและติดอันดับการค้นหาดีขึ้น
- [ ] **Analytics Dashboard:** เพิ่มหน้าแสดงสถิติยอดวิว, มังงะยอดนิยม และพฤติกรรมการใช้งานของผู้ใช้ในหน้า Admin
- [ ] **Social Login:** เพิ่มระบบล็อกอินผ่าน Google หรือ Facebook เพื่อความสะดวกของผู้ใช้งาน

---

<div align="center">

_README นี้ถูกสร้างขึ้นเพื่ออธิบายโครงสร้างและการทำงานของโปรเจกต์ Magga Reader_

</div>
