# Auth.js v5 Migration Plan

## สถานะ: ✅ Migration เสร็จสิ้น (2026-02-14)

โปรเจค Magga migrate จาก `next-auth` v4.24.13 → v5.0.0-beta.30 สำเร็จ

### สิ่งที่เปลี่ยนแปลง

- `@next-auth/prisma-adapter` → `@auth/prisma-adapter`
- สร้าง `auth.ts` + `auth.config.ts` ที่ root
- `getServerSession(authOptions)` → `auth()` ใน 35+ ไฟล์
- `withAuth` middleware → `auth()` wrapper ใน `proxy.ts`
- Type augmentation: `next-auth/jwt` → `@auth/core/jwt`
- ENV: `NEXTAUTH_SECRET` → `AUTH_SECRET`, `NEXTAUTH_URL` → `AUTH_URL`
- Cookie name เปลี่ยนจาก `next-auth.session-token` → `authjs.session-token`

### Bug fixes ระหว่าง migration

- แก้ role case mismatch ใน `admin/users/[id]/ban/route.ts` (`"admin"` → `"ADMIN"`)
- แก้ admin comment delete check ใน `comments/[commentId]/route.ts`
- แก้ self-demotion guard dead code ใน `admin/users/route.ts`

### Phase 1: เตรียม

- [x] ติดตั้ง `next-auth@5` (หรือ `next-auth@latest`)
- [x] ติดตั้ง `@auth/prisma-adapter` แทน `@next-auth/prisma-adapter`
- [x] เปลี่ยน env: `NEXTAUTH_SECRET` → `AUTH_SECRET`

### Phase 2: Config

- [x] สร้าง `auth.ts` / `auth.config.ts` ที่ root
- [x] Export `handlers`, `auth`, `signIn`, `signOut`
- [x] อัพเดต API route `app/api/auth/[...nextauth]/route.ts`

### Phase 3: Code

- [x] แทน `getServerSession()` ด้วย `auth()`
- [x] แทน `useSession()` ด้วย server-side `auth()` ใน Server Components
- [x] อัพเดต `proxy.ts` (middleware → proxy pattern)
- [x] อัพเดต type augmentation `types/next-auth.d.ts`

### Phase 4: Test

- [ ] ทดสอบ sign-in/sign-out flow
- [ ] ทดสอบ protected routes
- [ ] ทดสอบ admin authorization
- [ ] ทดสอบ session persistence

> ⚠️ หลัง deploy ผู้ใช้ทุกคนจะต้อง login ใหม่เนื่องจาก cookie name เปลี่ยน
