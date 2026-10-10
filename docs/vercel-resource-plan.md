# แผนลดทรัพยากร Vercel Hobby ของ Magga

ผล implementation วันที่ 10 ตุลาคม 2026 อยู่ใน [รายงานเวอร์ชัน 2.25.0](vercel-cpu-implementation-2026-10-10.md): comments/search และ correctness แก้แล้ว; taxonomy full-route ISR พักเนื่องจาก Next matcher bug กับ `%`; reader cache และ ad batching ยังรอข้อมูลตาม gate ตัวเลข baseline ด้านล่างยังเป็น snapshot เดิม

วันที่ตรวจ: 9 ตุลาคม 2026 ใช้การอ่านโค้ดร่วมกับ Vercel Usage และ Production Observability
ตัวเลขเป็น snapshot ณ เวลาตรวจ ไม่ใช่ผลประหยัดหลังแก้ และไม่ใช่วันรีเซ็ตโควตา

## ขอบเขตที่ตกลง

- ปิดคอมเมนต์รายรูปในหน้าอ่านทั้งมือถือและ desktop ก่อน ยังไม่ใช้งานระบบนี้
- คงคอมเมนต์รวมท้ายเรื่อง, replies, สิทธิ์ member/guest, moderation และข้อมูลเดิม
- เอาแผงและการ fetch รายรูปออกจริง รวมถึงพื้นที่ 340px ที่เคยเว้นให้แผง
- คงรูปจาก R2, lazy loading, ขนาดภาพ, skeleton และ reading progress
- API/schema ของคอมเมนต์เดิมยังรองรับข้อมูลรายรูปเพื่อรักษาความเข้ากันได้ การปิดนี้หยุดการเรียกอัตโนมัติจากหน้าอ่าน ไม่ใช่การบล็อก request จาก client เก่าหรือ client ภายนอก
- ไม่เปิดกลับอัตโนมัติ ต้องมีการตัดสินใจและการตรวจ request ใหม่ก่อนเปิดใช้
- ชุดถัดมาเพิ่ม Speed Insights sampling 10% และปิดการ refresh โฆษณาอัตโนมัติ โดยสุ่มลิงก์ครั้งเดียวต่อการโหลดหน้า
- การปรับแคช, query และ search ด้านล่างยังเป็นแผน

## Baseline

Usage ย้อนหลัง 30 วัน:

| รายการ | ใช้แล้ว | โควตา | สัดส่วนประมาณ |
| --- | ---: | ---: | ---: |
| Fluid Active CPU | 2 ชม. 45 นาที | 4 ชม. | 69.1% |
| CDN Requests | 468,189 | 1,000,000 | 46.8% |
| Function Invocations | 296,262 | 1,000,000 | 29.6% |
| Fast Origin Transfer | 2.65 GB | 10 GB | 26.5% |
| Speed Insights Events | 9,193 | 10,000 | 91.9% |
| Image Transformations | 670 | 5,000 | 13.4% |

CPU 7 วันล่าสุดประมาณ 83 นาที: 11.9 นาที/วัน หรือ 5.9 ชั่วโมงเมื่อเทียบเป็น 30 วัน
หากอัตราคงเดิมต้องลดประมาณ 33% เพื่ออยู่ใน 4 ชั่วโมง; เป้าหมายมีพื้นที่เผื่อคือ
ลด 45–55% หรือประมาณ 5.6–6.5 นาที/วัน ตัวเลขเหล่านี้เป็นเป้าหมาย ไม่ใช่คำรับรองผล
Hobby ไม่มี billing cycle แบบแพลนเสียเงิน จึงไม่สมมติว่ายอดทั้งหมดรีเซ็ตต้นเดือน

Production Functions ในช่วง 12 ชั่วโมงที่ตรวจ:

| Route | Invocations ประมาณ | Active CPU ที่ UI แสดง (ปัดเศษ) |
| --- | ---: | ---: |
| `/api/comments/me` | 9,700 | 2 นาที |
| `/api/comments` | 5,000 | 2 นาที |
| `/api/comments/identity` | 5,000 | 1 นาที |
| `/tag/[tagName]` | 2,400 | 1 นาที |
| `/[mangaId]` | 262 | 1 นาที |
| `/` | 204 | 44 วินาที |
| `/api/advertisements` | 180 | 6 วินาที |

สาม API คอมเมนต์รวมประมาณ 19,700 จาก 24,000 invocations (82%) และประมาณ
66% ของ CDN requests ในช่วงเดียวกัน ไม่ได้หมายความว่า 82% ของ CPU มาจากคอมเมนต์
API กลุ่มนี้รวมคอมเมนต์ท้ายเรื่องด้วย จึงไม่คาดว่าการปิดรายรูปจะลบยอดกลุ่มนี้ทั้งหมด

## ลำดับงาน

### 1. ปิดคอมเมนต์รายรูป — ชุดปัจจุบัน

- ลบการ fetch, cache, refresh callbacks, CommentBox/CommentList และ observer เฉพาะคอมเมนต์จาก `MangaReader`
- คง observer ที่ติดตามหน้าที่อ่านและ refs สำหรับกลับมาอ่านต่อ
- ตรวจหน้าอ่านที่ใช้ page objects พร้อม dimensions และ legacy URL strings
- ตรวจทั้งมือถือและ desktop: เลื่อนอ่านแล้วไม่มี `/api/comments` หรือ `/api/comments/me` ที่มี `imageIndex`; `/identity` ไม่เพิ่มตามจำนวนรูป
- คอมเมนต์ท้ายเรื่องอาจยังเรียกทั้งสาม API ตามหน้าที่ของมัน
- ตรวจภาพแรกโหลดก่อน, ภาพถัดไป lazy-load, ภาพไม่เข้า Vercel optimizer และไม่เว้นช่อง sidebar
- ไม่ลบข้อมูลหรือ migration ย้อนกลับ เปิดระบบเดิมได้จากประวัติ Git หากจำเป็น

### 2. วัดผลหลัง deploy 24–72 ชั่วโมง

- บันทึก CPU/วัน, invocations/วัน, CDN requests/วัน และยอดต่อ route ในช่วงเวลาที่เทียบกันได้
- ใช้ Network ของการอ่านเรื่องเดียวกันก่อน/หลัง ควบคู่กับยอดรวม เพราะ traffic อาจเพิ่ม
- ใช้ readings/page count ที่วัดได้; analytics ที่ต้อง consent ไม่ครอบคลุมผู้ใช้ทั้งหมด
- ยืนยันว่าจำนวน comment requests ไม่เติบโตตามจำนวนรูปอีก
- ใช้ข้อมูลใหม่จัดลำดับงานถัดไป ไม่บวกเปอร์เซ็นต์ประหยัดจากหลายมาตรการตรง ๆ
- ชุดนี้ช่วยเมื่อ deploy แล้ว ไม่คืนโควตาที่ใช้ไปก่อนหน้า และ browser เก่าต้องโหลดหน้าใหม่

### 3. ลด Speed Insights sampling — ทำแล้วในชุดถัดมา

- ตั้ง `sampleRate={0.1}` ที่ `ConditionalAnalytics` แล้ว; คง consent flow เดิม
- ลด events ที่ส่งในอนาคตประมาณ 90% โดยแลกกับรายละเอียดสถิติที่น้อยลง
- ไม่ปิด Web Analytics และไม่ถือว่าวิธีนี้แก้ Function CPU โดยตรง

### 4. ปรับ API คอมเมนต์ท้ายเรื่องตามต้นทุนที่เหลือ

- เลือกเฉพาะ comment ID, owner และ status ใน `getCommentCapabilities` แทน select ทุกคอลัมน์ของ manga ที่มี `pages`
- เก็บ manga visibility predicate, member/guest ownership, bans และ pending/private state ครบ
- ประเมินการอ่านจำนวนหน้าแทน pages ทั้งชุดสำหรับ bounds validation
- แชร์ identity/in-flight request ภายใน browser หากยังมีการโหลดซ้ำที่วัดได้
- ห้าม shared CDN cache `/identity` หรือ `/me`; ห้ามข้ามสิทธิ์เพียงเพราะไม่มี member session
- ไม่เพิ่ม abstraction สำหรับ dedup รายรูปซึ่งปิดไปแล้ว
- ตรวจ owner isolation, guest, banned actor, hidden manga, invalid index และ reply pagination

### 5. ซ่อม invalidation แล้วทำ ISR หน้าแท็ก/หมวดหมู่

- ครอบคลุม create/approve/publish/edit/rename/hide/show/bulk/delete/MCP และการเปลี่ยน author/category/tag
- ซ่อนและลบต้อง invalidate ทันที; ไม่ใช้ stale-while-revalidate ที่ยังเสิร์ฟเนื้อหาที่ควรถูกถอน
- เปลี่ยน slug ต้อง invalidate URL เก่าและใหม่
- หน้า `tag/[tagName]` และ `category/[categoryName]` มี TTL แต่ไม่มี `generateStaticParams`
- ใช้ empty `generateStaticParams()` ตามเอกสาร Next ที่ติดตั้ง แล้วตรวจ build/HTML/RSC ว่าใช้ ISR จริง
- Baseline หน้าแท็กมีประมาณ 2,400 invocations/12h และ cache hit 0%; จึงเป็นตัวเลือกที่คุ้มหลังปิดรายรูป
- เกณฑ์ผ่าน: request ซ้ำได้ cache hit และแก้/ซ่อน/ลบแล้วข้อมูลสาธารณะไม่ค้าง

### 6. Published reader ISR — ทำเมื่อยังต้องลด CPU เพิ่ม

- หน้าอ่านปัจจุบัน `force-dynamic`; React `cache()` dedupes ภายใน request ไม่ใช่ระหว่างผู้ชม
- แยก published content ออกจาก authenticated draft preview ก่อน shared page caching
- ทำ invalidation ให้ครบทั้ง reader, metadata, slug เก่า/ใหม่ และ relations ก่อนเพิ่ม TTL
- ตรวจ anonymous draft 404, staff preview, banned actor และ cached → hide/delete
- หน้าแรกอ่าน server `searchParams`; ห้ามตั้ง force-static จน search/filter/author URLs หาย
- เปลี่ยนโครงสร้างหน้าแรกหรือ Cache Components เมื่อมีผลวัดรองรับและตรวจ SEO/URL behavior แล้ว

### 7. งานรองตามข้อมูลใหม่

- Ads — ทำแล้วในชุดถัดมา: ปิด refresh เมื่อ focus/navigation (เดิมมี freshness gate 30 วินาที ไม่ใช่ polling timer); ใช้ snapshot จนโหลดหน้าใหม่ และ fetch ครั้งเดียวเมื่อไม่มี server snapshot
- สุ่มลิงก์โฆษณาหนึ่งครั้งต่อโฆษณาหลัง hydration ใช้ลิงก์เดียวกันในแบนเนอร์/กริด ไม่สุ่มเมื่อคลิกหรือเปิดหน้าไว้; โหลดหน้าใหม่อาจสุ่มได้ลิงก์เดิมตามความน่าจะเป็น
- การแก้หรือปิดแคมเปญจะเข้าถึง browser ที่เปิดค้างเมื่อโหลดหน้าใหม่
- Ads data ใน root layout: ประเมิน TTL 300 → 3600 วินาทีหลังตรวจ immediate tag invalidation และ route TTL ใน build
- ไม่ใส่ CDN TTL ให้ ads admin `all=true`; data cache invalidation ไม่ได้ล้าง HTTP CDN cache โดยอัตโนมัติทุกแบบ
- Search: autocomplete + homepage navigation ขณะพิมพ์ทำสองงาน; พิจารณา full search เมื่อ Enter โดยคง filter actions
- Firewall: ใช้เฉพาะ unwanted traffic ที่พิสูจน์ได้ ไม่บล็อก Google/Facebook preview แบบเหมารวม
- Auth focus refresh, view dedup และ ad event batching ทำเมื่อข้อมูลใหม่ระบุว่าต้นทุนสูงจริง

## สิ่งที่ยังไม่ต้องเปลี่ยน

- Reader images ส่งตรง R2 และ lazy-load อยู่แล้ว
- รูปปกมี optimizer cache hit ประมาณ 97.7% ในช่วงที่ตรวจ; ไม่ปิด optimizer ทั้งเว็บ
- MangaCard และหลายลิงก์ปิด prefetch แล้ว
- Cron สองตัววันละครั้ง ใน snapshot ใช้ CPU เพียงประมาณ 40 ms ต่อตัว
- Timer เตือน session ตรวจเวลาท้องถิ่น ไม่ใช่ polling ทุก 30 วินาที
- ไม่เพิ่ม dependency, queue, cache service หรือย้าย hosting ในชุดนี้

## Validation และการปล่อย

- ใช้ Bun 1.4.2, focused regression tests และ `bun run lint`, `bun run typecheck`, `bun run test`
- ชุดเปลี่ยน render/cache ต้องตรวจ `bun run build` หรือ `bun run build:local` กับฐานข้อมูล synthetic ที่แยกจาก production
- bump `package.json` และ `bun.lock` ด้วย `bun run version patch` สำหรับชุดปิดรายรูปและ maintenance ที่เข้ากันได้
- บันทึกผลตรวจที่ทำจริง ไม่ใช้ baseline หรือการอ่านโค้ดแทนผลประหยัด production
- ทดสอบ hide/delete/rename และสิทธิ์ draft ก่อนปล่อย shared reader cache

ผลตรวจชุดปิดรายรูป (เวอร์ชัน 2.24.2):

- `bun run lint` และ `bun run typecheck` ผ่าน
- `bun run test`: 435 pass, 0 fail รวม regression หน้าอ่านสำหรับ page objects, legacy URL strings, reading progress และไม่มีการ fetch รายรูป
- `bun run build:local --keep-db` ผ่านในสำเนาทดสอบที่ติดตั้ง dependency ตาม lockfile และใช้ฐานข้อมูล synthetic ใหม่
- ตรวจ DOM ที่ขนาด desktop 1280px และมือถือ 390px: รูปโหลดสำเร็จและไม่มีพื้นที่ sidebar คอมเมนต์
- Network ของหน้า synthetic เมื่อ reload มี `/identity`, `/comments` และ `/me` สำหรับท้ายเรื่อง รวม 3 requests ไม่มี `imageIndex`
- ยังไม่ได้ deploy หรือวัดผลประหยัด production; ไม่ได้ทดสอบส่งคอมเมนต์ผ่าน browser ในชุดนี้

ผลตรวจชุด sampling/โฆษณา (เวอร์ชัน 2.24.3):

- `bun run lint`, `bun run typecheck` และ `bun run test` ผ่าน: 435 pass, 0 fail
- ทดสอบสุ่มครั้งเดียวหลัง hydration, คง snapshot เมื่อ render/เปลี่ยน props/focus, โหลดหน้าใหม่เลือกใหม่ และ abort เมื่อ unmount
- ทดสอบ click/keyboard/Ctrl/Cmd/middle-click ไม่สุ่มใหม่และไม่ขัด native navigation; คงการตรวจ safe URLs และ click tracking
- production build ผ่านด้วย `bun run build:local --keep-db` ในสำเนาทดสอบและฐานข้อมูล synthetic ใหม่
- Network หลัง reload หน้าอ่าน synthetic ไม่มี GET `/api/advertisements`; event tracking ยังส่งตามเดิม
- ไม่ได้ทดสอบการคลิกไปยังปลายทางโฆษณาผ่าน browser ในชุดนี้; ยังไม่ได้ deploy หรือวัดยอด events/requests บน production

## แหล่งข้อมูล

- [Vercel Usage](https://vercel.com/zayhiii/~/usage)
- [Magga Production Functions](https://vercel.com/zayhiii/magga/observability/vercel-functions?environment=production)
- [Magga Production CDN Requests](https://vercel.com/zayhiii/magga/observability/cdn-requests?environment=production)
- [Hobby plan และ quota behavior](https://vercel.com/docs/plans/hobby)
- [Fluid Compute: Active CPU ต่างจากเวลารอ I/O](https://vercel.com/docs/functions/usage-and-pricing)
- [CDN/ISR: cache hit ลด Function แต่ยังมี CDN request](https://vercel.com/docs/how-vercel-cdn-works)
- [Speed Insights sampleRate](https://vercel.com/docs/speed-insights/package)
- เอกสาร Next ใน `node_modules/next/dist/docs/` เป็นหลักสำหรับการลงมือในเวอร์ชันที่ติดตั้ง
