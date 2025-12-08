# คู่มือการตั้งค่า Environment Variables บน Vercel

## ⚠️ สำคัญมาก!

ไฟล์ `.env.local` ในเครื่องของคุณ **ไม่ถูก deploy ขึ้น Vercel** เพราะอยู่ใน `.gitignore`

คุณต้องตั้งค่า Environment Variables ในหน้า Dashboard ของ Vercel แยกต่างหาก

## วิธีตั้งค่า Environment Variables บน Vercel

### ขั้นตอนที่ 1: เข้าสู่ Vercel Dashboard

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจคของคุณ
3. ไปที่แท็บ **Settings**
4. เลือกเมนู **Environment Variables** ทางซ้ายมือ

### ขั้นตอนที่ 2: เพิ่ม Environment Variables

คัดลอกค่าจากไฟล์ `.env.local` ของคุณมาใส่ทีละตัว:

#### Database (Turso)

```
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

**หมายเหตุ:** ตรวจสอบว่าใช้ชื่อตัวแปรเป็น `TURSO_*` หรือ `DATABASE_*` ให้ตรงกับที่ใช้ใน `lib/prisma.ts`

#### Database Migration (New!)

หากอัพเดทจากเวอร์ชันก่อน 2025-12-08 ต้องรัน SQL ใน Turso Console:

```sql
ALTER TABLE "Manga" ADD COLUMN "authorName" TEXT;
```

จากนั้นรัน `npx prisma generate` เพื่ออัพเดท Prisma client

#### NextAuth

```
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=your-secret-from-env-local
```

**⚠️ สำคัญ:** `NEXTAUTH_URL` ต้องเป็น URL ของ production เช่น `https://magga.vercel.app` (ไม่ใช่ localhost)

#### Admin Credentials

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
```

#### Cloudflare R2

```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-public-url.r2.dev
```

### ขั้นตอนที่ 2.5: Environment Variables แบบ Optional

สำหรับการ optimize และ debugging:

```
ENABLE_QUERY_LOG=true
```

**หมายเหตุ:**

- `ENABLE_QUERY_LOG`: เปิดเมื่อต้องการ debug database queries ใน production (ค่า default จะ log เฉพาะ errors)
- `NODE_ENV`: Vercel จะตั้งค่าให้อัตโนมัติเป็น `production`

### ขั้นตอนที่ 3: เลือก Environment

สำหรับแต่ละตัวแปร ให้เลือก:

- ✅ Production
- ✅ Preview
- ✅ Development

### ขั้นตอนที่ 4: Redeploy

หลังจากตั้งค่าเสร็จแล้ว:

1. กลับไปที่แท็บ **Deployments**
2. คลิกที่ **... (three dots)** ของ deployment ล่าสุด
3. เลือก **Redeploy**
4. เลือก **Use existing Build Cache** (ไม่ต้องเลือก)
5. คลิก **Redeploy**

## ตรวจสอบการตั้งค่า

หลังจาก deploy ใหม่ ให้ตรวจสอบว่า:

- ✅ Build สำเร็จ (ไม่มี error เรื่อง `Cannot read properties of undefined`)
- ✅ เข้าสู่ระบบได้ที่หน้า `/auth/signin`
- ✅ หน้าเว็บแสดงผลถูกต้อง

---

## การแก้ปัญหา

### หากยังมี Error หลัง Deploy

1. **ตรวจสอบชื่อตัวแปร** - ตรวจสอบว่าใช้ `TURSO_DATABASE_URL` หรือ `DATABASE_URL` ให้ตรงกับที่ใช้ในโค้ด
2. **ตรวจสอบค่าของตัวแปร** - อย่าลืมใส่เครื่องหมาย quotes ถ้าจำเป็น
3. **ตรวจสอบ Logs** - ดู Runtime Logs ใน Vercel เพื่อดูข้อผิดพลาดที่เกิดขึ้น

### ดู Logs

1. ไปที่แท็บ **Deployments**
2. คลิกที่ deployment ที่ล้มเหลว
3. ดูที่ **Build Logs** หรือ **Runtime Logs**
