# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment (เสร็จแล้ว)

- [x] ✅ Code optimizations completed
- [x] ✅ Build tested locally (no errors)
- [x] ✅ ISR/SSG configured
- [x] ✅ Database logging optimized
- [x] ✅ Image optimization configured
- [x] ✅ API caching configured
- [x] ✅ Documentation created

---

## 📋 Deployment Steps

### 1. Environment Variables Setup

เข้าไปที่ [Vercel Dashboard](https://vercel.com/dashboard) → เลือก project → Settings → Environment Variables

#### Required Variables

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app  # ⚠️ ต้องเปลี่ยนเป็น production URL
NEXTAUTH_SECRET=your-secret-here

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-url.r2.dev
```

#### Optional Variables

```bash
# Debug query logging (เปิดเมื่อต้องการ debug)
ENABLE_QUERY_LOG=true
```

**Environment Selection:**

- ✅ Production
- ✅ Preview
- ✅ Development

---

### 2. Deploy to Vercel

#### Option A: Git Push (Recommended)

```bash
git add .
git commit -m "feat: Vercel optimization - ISR, SSG, caching"
git push origin main
```

Vercel จะ auto-deploy ทันทีที่ push

#### Option B: Vercel CLI

```bash
# Install Vercel CLI (ถ้ายังไม่มี)
npm i -g vercel

# Deploy
vercel --prod
```

---

### 3. Monitor Deployment

#### Build Phase

ดูใน Vercel Dashboard → Deployments → Latest

**ตรวจสอบ:**

- ✅ Build Command: `prisma generate && next build`
- ✅ Build Time: ควร ~20-30 วินาที
- ✅ Static Pages: ควรเห็น home + 50 manga pages
- ✅ No errors in build logs

**Expected Output:**

```
Route (app)                                 Size  First Load JS  Revalidate
┌ ○ /                                    6.15 kB         202 kB          1m
├ ● /[mangaId]                           5.06 kB         151 kB          1h
├   ├ /cat-แมว
├   ├ /placehoder
...
```

#### Deploy Phase

- ✅ Deployment succeeds
- ✅ Domain assigned/updated
- ✅ SSL certificate active

---

### 4. Post-Deployment Testing

#### Basic Functionality

1. **Homepage**

   ```
   https://your-domain.vercel.app
   ```

   - [ ] โหลดเร็ว (<1s)
   - [ ] แสดง manga cards ถูกต้อง
   - [ ] Search & filters ทำงาน

2. **Manga Detail Page**

   ```
   https://your-domain.vercel.app/manga-slug
   ```

   - [ ] โหลดเร็ว (<1.5s)
   - [ ] Images แสดงผลถูกต้อง
   - [ ] Pages แสดงครบ

3. **Category/Tag Pages**

   ```
   https://your-domain.vercel.app/category/your-category
   https://your-domain.vercel.app/tag/your-tag
   ```

   - [ ] โหลดได้ถูกต้อง
   - [ ] แสดง manga ในหมวดหมู่/แท็ก

4. **Admin Panel**
   ```
   https://your-domain.vercel.app/admin
   ```
   - [ ] Login ทำงาน
   - [ ] สามารถ create/edit/delete manga
   - [ ] Upload images ทำงาน

#### Performance Testing

Open Chrome DevTools → Network → Reload

**Home Page:**

- [ ] TTFB < 200ms (Time to First Byte)
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] Response Header มี `x-vercel-cache: HIT` (หลัง refresh ครั้งที่ 2)

**Manga Page:**

- [ ] TTFB < 200ms
- [ ] Images ใช้ WebP/AVIF format
- [ ] Cache headers ถูกต้อง

**API Routes:**

- [ ] Response มี `cache-control: s-maxage=60, stale-while-revalidate=300`

---

### 5. Verify Optimizations

#### Vercel Analytics (รอ 24 ชั่วโมง)

เข้าไปที่ Dashboard → Analytics

**Core Web Vitals:**

- LCP: เป้าหมาย <2.5s (พยายามให้ <1.5s)
- FID: เป้าหมาย <100ms
- CLS: เป้าหมาย <0.1

**Performance Score:**

- เป้าหมาย: >90/100

#### Functions Dashboard

Dashboard → Functions → Overview

**Before vs After:**

- Function Invocations: ควรลดลง ~95%
- Avg Duration: ควรลดลง ~50%
- Error Rate: ควร <1%

#### Database (Turso)

เข้า [Turso Dashboard](https://turso.tech/)

**Metrics:**

- Rows Read: ควรลดลง ~95%
- Queries: ควรลดลงมาก
- Latency: ควรคงที่หรือดีขึ้น

---

## 🐛 Troubleshooting

### Build Fails

**Error: Environment variables missing**

→ ตรวจสอบว่าตั้ง env vars ครบใน Vercel Settings

**Error: Prisma generate fails**

→ Build command ควรเป็น: `prisma generate && next build`

### Pages Not Caching

**Home page ไม่ cache**

```bash
# ตรวจสอบใน page.tsx
export const revalidate = 60;
export const dynamic = 'force-static';
```

**API ไม่ cache**

→ ตรวจสอบ vercel.json มี headers configuration

### Images Not Loading

**CORS errors**

→ ตรวจสอบ R2 CORS settings

**Images slow**

→ ตรวจสอบว่าใช้ `next/image` component

---

## 📊 Success Metrics

### Week 1 Targets

- [ ] **Performance Score**: >85
- [ ] **Cache Hit Rate**: >70%
- [ ] **Function Invocations**: <5% of page views
- [ ] **Error Rate**: <1%
- [ ] **TTFB (Home)**: <300ms
- [ ] **LCP**: <2.5s

### Month 1 Targets

- [ ] **Performance Score**: >90
- [ ] **Cache Hit Rate**: >85%
- [ ] **Function Invocations**: <3% of page views
- [ ] **Error Rate**: <0.5%
- [ ] **TTFB (Home)**: <200ms
- [ ] **LCP**: <2s

---

## 📞 Support Resources

### Documentation

- [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) - คู่มือ optimization
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Environment variables setup

### External Resources

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Turso Dashboard](https://turso.tech/)
- [Vercel Status](https://www.vercel-status.com/)

### Monitoring

- **Vercel Analytics**: Dashboard → Analytics
- **Vercel Speed Insights**: Dashboard → Speed Insights
- **Runtime Logs**: Dashboard → Deployments → View Function Logs

---

## ✅ Final Checklist

**Pre-Deploy:**

- [x] Code optimizations complete
- [x] Build tested locally
- [ ] Environment variables documented
- [ ] Team notified

**Deploy:**

- [ ] Environment variables set in Vercel
- [ ] Code pushed to Git
- [ ] Build succeeds
- [ ] Deployment live

**Post-Deploy:**

- [ ] Basic functionality tested
- [ ] Performance verified
- [ ] Analytics setup
- [ ] Monitoring configured
- [ ] Team notified

---

**พร้อม Deploy! 🚀**

หากมีปัญหา ดูใน Troubleshooting section หรือตรวจสอบ Vercel logs
