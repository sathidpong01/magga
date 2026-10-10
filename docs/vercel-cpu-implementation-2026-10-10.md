# ผลปรับลดงานเซิร์ฟเวอร์และแก้บัค Magga

วันที่: 10 ตุลาคม 2026 · เวอร์ชัน 2.25.0 · Bun 1.4.2 · Next.js 16.3.8

เริ่มจาก HEAD `0524513ab33dd3b716336b7e427b0b367551a959` และ working tree สะอาด งานอยู่ใน checkout หลัก ยังไม่ได้ commit, push หรือ deploy ไม่เปลี่ยนบริการหรือเพิ่มค่าใช้จ่าย และไม่ใช้ Cloudflare proxy/custom domain

รายงานนี้สรุปผล implementation หลัง audit และรวมการตรวจทวนของ agents ตัวเลข usage เดิมเป็น baseline จากภาพ/รายงานก่อนหน้า ไม่ใช่ผลประหยัดของชุดนี้ ไม่มีการเขียนฐานข้อมูลหรือ storage production

## สถานะตามแผน

| ชุด | สถานะ | ผลลัพธ์ |
| --- | --- | --- |
| A — Authorization / asset safety | แก้แล้ว โดยมีงาน ownership ของไฟล์เก่าค้าง | ตรวจสิทธิ์สดก่อนอ่าน admin data/เขียนข้อมูล, ban flags แบบ OR, revoke session ใน transaction, password cookie/legacy account recovery; comment asset retirement ledger ก่อนลบไฟล์ |
| B — Mutation / pagination | แก้แล้ว | manga+tags/submissions เป็น transaction; bulk ระบุ show/hide ชัดและใช้ server acknowledgement; invalidation กลาง; pagination/order/filter สม่ำเสมอ; rating/view atomic writes |
| C — Comments | แก้และตรวจ browser แล้ว | lazy ทั้ง subtree ท้ายเรื่อง, query เลือกคอลัมน์เท่าที่ใช้, identity รวมเฉพาะ request ที่กำลังทำ, reply composer mount เมื่อเปิดครั้งแรก, scope/actor generation guards |
| D — Search / prefetch | แก้และตรวจ browser แล้ว | พิมพ์ทำ suggestions; Enter/ปุ่มจึงค้นหาเต็มหน้า; URL/history/IME/abort guards; ปิด prefetch ของลิงก์ reader/author/profile ที่เกี่ยวข้อง |
| E — Taxonomy full-route ISR | ทดลองแล้วพักไว้ | candidate ผ่าน withdrawal ปกติ แต่พบ upstream matcher bug กับชื่อที่มี `%`; final คง Data Cache และ dynamic HTML/RSC |
| F — Public reader cache / private preview split | ยังไม่เปิดตาม gate | คง reader `force-dynamic`; รอวัดหลัง C/D บน production 24–72 ชั่วโมงก่อนตัดสินใจ |
| G — Ads correctness / event batching | correctness เสร็จ; batching ยังไม่เปิด | HTTP acknowledgement, bounded retry ด้วย UUID เดิม, Retry-After, snapshot เดียว, native navigation; batch ต้องมีหลักฐาน CPU ของ event route ก่อน |

มี API สำหรับลองล้างแคชใหม่โดยไม่ replay mutation จึง bump minor ตามนโยบายโปรเจค และ sync `package.json` / `bun.lock` แล้ว

## พฤติกรรมที่เปลี่ยน

### คอมเมนต์และค้นหา

- หน้าอ่านยังปิดคอมเมนต์รายรูปตามขอบเขตเดิม ลบพื้นที่ว่าง 340px ที่เหลืออยู่ และไม่เปิดคอมเมนต์ใน hidden preview
- คอมเมนต์ท้ายเรื่องเริ่ม mount เมื่ออยู่ห่าง viewport ประมาณ 300px มีปุ่มโหลดด้วยคีย์บอร์ดเป็นทางเลือก ใช้ minHeight/skeleton ระหว่างรอ
- หลังเริ่มแล้วไม่ unmount เมื่อเลื่อนออกหรือ refresh เพื่อรักษาข้อความ/รูปที่ยังไม่ส่ง ช่องตอบกลับที่ยังไม่เคยเปิดไม่เรียก identity และไม่สร้าง nested reply composer
- identity ไม่ persist เป็น shared cache; `/me` และ identity ยังคง private การเปลี่ยนบัญชี/scope ยกเลิกหรือทิ้งผล request เก่าและล้างความสามารถของ actor เดิม
- public comment DTO/cursor/capability queries ไม่อ่าน manga pages หรือ private fields ที่ไม่จำเป็น ใช้ Map แทนการค้นซ้ำในลูป
- search แยกข้อความที่กำลังพิมพ์จาก filter ที่ยืนยันแล้ว รับ suggestions จาก server โดยตรง และรองรับ Back/Forward, tags ที่มี comma, stable sort/ID, bounded query และการยกเลิก request เก่า
- pagination ใช้ raw dataset สม่ำเสมอทุกหน้าแล้ว client filter ตาม preference; แม้หน้าที่ถูกกรองเหลือว่างยังโหลดหน้าต่อได้ ไม่ใส่ preference ส่วนตัวใน shared SSR cache

### ข้อมูลและสิทธิ์

- admin server pages/data access ตรวจ fresh session ก่อน query; privileged mutations ไม่ใช้ cookie cache เป็นสิทธิ์ และถือ `banned || isBanned` เป็นถูกระงับ
- เปลี่ยน role/ban/unban และ revoke sessions ภายใน transaction เดียวกัน; session revoke ล้มเหลวจะ rollback profile change
- settings ส่งเฉพาะ public profile DTO และ boolean ว่ามีรหัสผ่าน ไม่ส่ง hash; legacy profile password ยังแสดงช่อง current password และตรวจ bcrypt ก่อนเชื่อม credential
- password API ส่งต่อ Set-Cookie ทุกค่าและ error response ของ Better Auth; legacy register ใช้ Better Auth signup จึงมี credential account ที่เข้าสู่ระบบได้
- manga create/update/quick edit รวม relations ใน transaction; selected IDs ถูกตรวจ UUID/dedupe/limit; pages ใหม่เก็บ JSONB array และ reader ยังรองรับ scalar string เก่า
- single/bulk visibility ระบุ target ชัดเพื่อไม่ให้ retry กลายเป็น publish; UI ใช้แถว/IDs ที่ server ยืนยัน ป้องกัน double-submit และ reconcile ข้อมูลจาก router refresh
- submission quota อิงวันกรุงเทพฯ พร้อม transactional ownership/status checks; approve/reject/edit/delete ไม่อาศัย status snapshot ที่หมดอายุ
- rating aggregate และ view dedup marker ถูกเขียนพร้อมยอดรวมใน transaction ที่ lock manga row; hidden/nonexistent manga ไม่รับ writes; GET คะแนนส่วนบุคคลเป็น private/no-store
- rating/view/upload มี bounded abuse budgets; view 240 requests ต่อ IP ต่อ 10 นาที และ weighted upload quota ปิดรับเมื่อ limiter ล้มเหลว ค่าเหล่านี้ต้องติดตามผู้ใช้ที่แชร์ IP หลัง deploy

### แคชและ recovery

- `invalidateMangaContent()` expire data tags ทันทีหลัง commit และครอบคลุม home, taxonomy patterns, old/new reader slug, sitemap และ admin views
- `/api/manga/list` และ `/api/search` เป็น HTTP no-store แล้วใช้ Next Data Cache ที่ invalidate ได้ เพื่อไม่ให้ CDN query variants แสดงเรื่องที่ซ่อน/ลบต่อไป
- หาก DB commit แล้ว refresh ล้มเหลว ส่ง `cache_refresh_pending` หรือ header; form/table แจ้งว่าข้อมูลบันทึกแล้ว และมีปุ่มลองเฉพาะการล้างแคชผ่าน `POST /api/admin/manga/cache-refresh`
- recovery ต้อง fresh admin, same-origin และ quota; retry ไม่สร้าง/แก้/ลบ manga ซ้ำ และไม่ upload ซ้ำ
- no-store ของ API อาจเพิ่ม function invocations เมื่อเทียบกับ CDN hit เดิม ต้องวัดการแลกเปลี่ยนนี้ ไม่ถือว่าทุกการแก้ลด CPU

### ไฟล์ โฆษณา และแบบฟอร์ม

- comment deletion/user removal/manga removal commit retirement ledger ก่อนทำ object deletion; ลบไฟล์ล้มเหลวเก็บ ledger ให้ cleanup cron retry; business transaction rollback ไม่ลบไฟล์
- cleanup ไม่ลบ rejected-submission URLs ที่ยังไม่มี ownership/ref proof และเก็บ record ไว้เป็นรายการรอตรวจ อาจมี storage retention เพิ่มขึ้น
- asset keys ใช้ UUID; storage URL ต้องตรง origin/base path และไม่รับ traversal/query/hash; R2 delete ตรวจ Errors; upload มี file/byte/weighted quota และ image processing budget
- failed batch upload ชดเชยลบเฉพาะ UUID keys ที่สร้างใน operation นั้น; ถ้าการชดเชยล้มเหลวรายงาน pending อย่างตรงไปตรงมา แต่ยังไม่มี durable public-asset reconciliation ledger
- MangaForm มี synchronous save lock, upload checkpoints/timeout/abort/unmount cleanup; metadata response ที่มาช้าไม่ทับข้อมูลที่ผู้ใช้แก้หรือลบแล้ว
- submissions/settings lists ยกเลิก stale requests และใช้ acknowledgement; preference failure คืนค่าล่าสุดที่ server เคยยืนยัน
- ads ใช้ provider snapshot เดียว, retry transient failure ด้วย UUID เดิมแบบจำกัด, honor Retry-After, ไม่ mark success ก่อน HTTP acknowledgement และเก็บ fallback ใน memory เมื่อ browser storage ใช้ไม่ได้
- metadata fetch จำกัด DNS+redirect+body รวม 5 วินาที/512 KiB และเชื่อมต่อเฉพาะ IP ที่ตรวจแล้ว โดยรักษา Host/SNI
- environment sync ต้องเลือก target/keys เอง ใช้ stdin แทน argv, dry-run ไม่เผยค่า และ exit nonzero เมื่อมี failure; workflow เป็น manual dry-run ไม่ส่ง secrets อัตโนมัติ; เพิ่ม ignore ของ credential artifacts

## การตรวจที่ผ่านจริง

| การตรวจ | ผล |
| --- | --- |
| Bun runtime / frozen lockfile | Bun 1.4.2 parent/child และ frozen install ผ่าน |
| Typecheck / lint | ผ่านทั้งโปรเจค |
| Bun isolated tests | 516 ผ่าน / 0 ล้มเหลว / 70 ไฟล์; รันด้วย `--no-env-file` |
| Local DB shutdown tests | อีก 4 ผ่าน / 0 ล้มเหลว; ตรวจว่า test port ว่างก่อนเริ่ม |
| Final production build | ผ่านใน managed verification worktree เวอร์ชัน 2.25.0 ไม่มีไฟล์ credential; ใช้ PGlite/socket/schema/data synthetic ใหม่ |
| Final withdrawal checks | 52 รายการผ่าน: warm data cache, anonymous HTML/RSC, hide/show/delete, reader/taxonomy rename, negative lookup→create, list/search/sitemap, fresh-cookie demotion/ban |
| Taxonomy encoded names ใน final build | HTML/RSC 8 checks ผ่านสำหรับภาษาไทย ช่องว่าง `100%`, literal `%20` และ `%25`; ไม่มี full-route ISR |
| Browser comments | 20 หน้า/20 roots/400 replies: ก่อน scroll 0 comment requests; identity 2 requests รวมการเปิด reply; private capabilities แบ่ง 5 requests ตาม batch 100 IDs; reply draft อยู่หลังพับ/เปิด |
| Browser search | typing 0 home RSC; Enter ยืนยันแล้วมี 1 home RSC; Back คืนข้อความ/filter เดิม |
| Browser ads | click, Enter, middle click, Ctrl+click เปิด 1 tab ต่อครั้ง และ destination ตรง href ของ snapshot |
| Local Better Auth password integration | cookie ใหม่ส่งถึง client, current session ใช้ต่อได้, other session ถูก revoke; ใช้สอง session ของบัญชี synthetic |

PGlite ทดสอบ SQL/rollback จริง แต่ serialize queries จึงยังไม่ใช่หลักฐาน concurrency หลาย connection ของ PostgreSQL production โฆษณาที่ browser ใช้เป็นลิงก์ localhost และไม่ได้ทดสอบปลายทางโฆษณาจริง ไม่ได้ทดสอบ Google OAuth/Turnstile/R2 จริงหรือใช้บัญชีจริง

Next streaming อาจตอบ HTTP 200 พร้อม not-found/redirect payload ตามเอกสารที่ติดตั้ง การตรวจ missing/denied page จึงตรวจ payload, noindex และการไม่ปรากฏ private/content marker ร่วมด้วย ไม่ใช้ status code อย่างเดียว ส่วน API hidden rating/view ตรวจ 404 จริง

## บัค framework ที่เพิ่มในแผน E

candidate ที่เพิ่ม `generateStaticParams() { return []; }` ให้ taxonomy ผ่าน 52 withdrawal checks ของชื่อทั่วไป และ HTTP cache HIT พร้อมพิสูจน์ว่า DB-only title change ไม่เปลี่ยน warm full-route output แต่ขยายการตรวจแล้ว `/tag/100%25` ตอบ 500 ก่อนเข้า Page

หลักฐานจาก Next 16.3.8 ที่ติดตั้ง:

1. `server/route-modules/route-module.js` decode `resolvedPathname` เพื่อใช้เป็น cache/manifest key: `/tag/100%25` กลายเป็น `/tag/100%`
2. `server/route-modules/app-page/app-page-runtime.js` ส่ง path นี้ให้ `PrerenderManifestMatcher`
3. matcher ใช้ `getRouteMatcher` ซึ่ง decode `%` อีกครั้งแล้ว throw E528
4. เมื่อไม่มี taxonomy entry ใน `prerenderManifest.dynamicRoutes` matcher ไม่ทำการ decode รอบนี้; final dynamic build ทดสอบชื่อ `%` ผ่าน

จึงถอด candidate `generateStaticParams` ทั้งสองหน้า ไม่ patch `node_modules`, ไม่ double-encode URL ให้ค้นหาคนละชื่อ และไม่เปลี่ยนรูปแบบ URL ของ taxonomy ทั้งระบบ

อีกจุดหนึ่งที่แก้แล้ว: Page params ของ Next รุ่นนี้เป็น encoded string แต่ metadata ได้ decoded string ต้อง decode เฉพาะ Page การ decode metadata ซ้ำทำให้ literal `%20` กลายเป็นช่องว่าง มี 6 tests ที่เรียก installed Next helper และ Page/metadata จริง

ก่อนเปิด E ให้พิสูจน์ matcher กับชื่อ `%` บน framework รุ่น/แนวทางที่แก้แล้ว จากนั้นทวน HTML/RSC/negative cache/withdrawal matrix อีกครั้ง รวม root ads TTL 300 วินาทีที่อาจลด effective full-route TTL

## งานที่ยังต้องรอและแนวทางนำขึ้นระบบ

1. deploy เฉพาะเมื่อได้รับคำสั่ง แล้ววัด CPU/วันและ CPU ต่อ route, invocations, cache hits, requests และ origin bytes ในช่วง 24–72 ชั่วโมงที่ traffic เทียบกันได้ ผลชุดนี้ไม่คืน quota ที่ใช้ไปแล้ว
2. อย่าสรุป savings จากจำนวน request เป็นเปอร์เซ็นต์ CPU โดยตรง โดยเฉพาะ HTTP no-store, fresh authorization และ abuse quotas ที่เพิ่ม DB work บางส่วน
3. F reader shared cache/private preview ต้องผ่าน fresh-session/hidden HTML+RSC isolation, immediate withdrawal และ relation invalidation ก่อนเปิด; final ยัง force-dynamic
4. G batching ต้องวัด `/api/advertisements/[id]/events` โดยตรง ไม่ใช้ data endpoint เป็นตัวแทน; คง dedup/UUID/retention/event-based quota และไม่เพิ่ม paid queue
5. ต้องมี multi-connection PostgreSQL validation ของ rating/view/submission concurrency ก่อนอ้างว่า concurrency gate ผ่านครบ
6. public/legacy asset ownership และการ reconcile uncertain upload/failed compensation ยังต้องมี durable ledger/reference migration; ห้ามเปิด deletion ของ shared/unowned objectsจาก URLs อย่างเดียว
7. หลัง storage/metadata transport changes ต้องตรวจ live TLS/Host/SNI และ provider delete errors ใน environment ที่ได้รับอนุญาต; ชุดนี้พิสูจน์ผ่าน mocks และ local synthetic build

ไม่รัน migration ของ production และไม่ลบข้อมูลเก่า รายงานการทดสอบฉบับเต็ม/สคริปต์ synthetic อยู่ใน `Documents/Codex/reports/` ของเครื่องนี้
