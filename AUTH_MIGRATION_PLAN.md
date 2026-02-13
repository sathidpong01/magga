# Auth.js v5 Migration Plan

## สถานะปัจจุบัน: ใช้ `next-auth` v4

โปรเจค Magga ใช้ `next-auth` v4.24.13 กับ `@next-auth/prisma-adapter` v1.0.7

### ไฟล์ที่เกี่ยวข้อง (10+ ไฟล์)

- `proxy.ts` — withAuth middleware
- `app/api/auth/[...nextauth]/` — API route
- `app/actions/submit.ts` — session access
- `app/dashboard/` — session checks
- `app/settings/` — useSession()
- `app/components/layout/` — Providers, Header, Sidebar, Footer
- `app/components/security/DevToolsProtection.tsx`
- `types/next-auth.d.ts` — type augmentation

## เหตุผลที่ยังไม่ migrate ตอนนี้

1. กระทบ 10+ ไฟล์ — เสี่ยงเกินไปสำหรับการ migrate แบบ batch
2. `@next-auth/prisma-adapter` ต้องเปลี่ยนเป็น `@auth/prisma-adapter`
3. Cookie name เปลี่ยนจาก `next-auth.session-token` → `authjs.session-token` (user อาจต้อง login ใหม่)
4. Environment variables ต้องเปลี่ยน prefix `NEXTAUTH_` → `AUTH_`

## ขั้นตอนเมื่อพร้อม migrate

### Phase 1: เตรียม

- [ ] ติดตั้ง `next-auth@5` (หรือ `next-auth@latest`)
- [ ] ติดตั้ง `@auth/prisma-adapter` แทน `@next-auth/prisma-adapter`
- [ ] เปลี่ยน env: `NEXTAUTH_SECRET` → `AUTH_SECRET`

### Phase 2: Config

- [ ] สร้าง `auth.ts` / `auth.config.ts` ที่ root
- [ ] Export `handlers`, `auth`, `signIn`, `signOut`
- [ ] อัพเดต API route `app/api/auth/[...nextauth]/route.ts`

### Phase 3: Code

- [ ] แทน `getServerSession()` ด้วย `auth()`
- [ ] แทน `useSession()` ด้วย server-side `auth()` ใน Server Components
- [ ] อัพเดต `proxy.ts` (middleware → proxy pattern)
- [ ] อัพเดต type augmentation `types/next-auth.d.ts`

### Phase 4: Test

- [ ] ทดสอบ sign-in/sign-out flow
- [ ] ทดสอบ protected routes
- [ ] ทดสอบ admin authorization
- [ ] ทดสอบ session persistence

> ⚠️ แนะนำทำใน branch แยก และทดสอบให้ละเอียดก่อน merge
