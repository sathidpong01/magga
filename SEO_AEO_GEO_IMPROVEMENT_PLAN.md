# แผนปรับปรุง SEO, AEO และ GEO ของ Magga

วันที่ตรวจ: 25 กันยายน 2026
ขอบเขต: วางแผนจากโค้ดและการสุ่มตรวจ `https://magga.vercel.app`; นำชุดแก้ไขไปวางบนฐาน `origin/main` เวอร์ชัน 2.19.6 แล้ว และยังไม่ได้ยืนยันผลหลัง deploy

## สถานะการลงมือใน checkout (25 กันยายน 2026)

- ระยะ 1 ทำแล้วในโค้ด: canonical สำหรับหน้าแรก/มังงะ/หมวดหมู่/แท็ก, `noindex,follow` ให้หน้าแรกที่มีตัวกรองหรือการเรียงลำดับ, sitemap ใช้ `updatedAt` ของมังงะเป็นวันที่จริงและไม่ใส่เวลาปลอมในหน้าอื่น, ใส่เฉพาะหมวดและแท็กที่มีมังงะที่ไม่ซ่อน, หน้ามังงะที่ `isHidden` ตอบ 404 และ DB error ไม่ถูกแปลงเป็น 404
- ระยะ 2 ทำแล้วในโค้ด: H1 และคำแนะนำสั้นบนหน้าแรก, title/description/H1 เฉพาะหมวดและแท็ก, description สำรองตามชื่อมังงะ, URL ใน ComicStory ตรง canonical และ escape ค่า JSON-LD ก่อนฝังใน HTML
- หมวด/แท็กที่ไม่มีมังงะยังเปิดให้ผู้ใช้ดูได้ แต่ตั้ง `noindex` และไม่อยู่ใน sitemap; นโยบายนี้ใช้กับ collection ว่างเท่านั้น
- หน้า `/moxzk` และไฟล์หน้าเว็บที่เกี่ยวข้องถูกลบแล้ว; ตรวจ production รอบแรกพบ soft 404 (HTTP 200) จาก dynamic manga route จึงเพิ่ม route handler ที่ตอบ HTTP 404 โดยตรงและต้องตรวจซ้ำหลัง deploy รอบถัดไป; เอา machine metadata `rating: mature` และ `adult: true` ที่เคยใช้ทั้งเว็บออก และเอาคำว่า `18+` ออกจากคำอธิบายหลักและท้ายเว็บ แต่คงหน้าต่างยืนยันอายุ
- ตรวจบน worktree จาก `origin/main` ล่าสุด: `npm run lint` และ `npx tsc --noEmit` ผ่าน; `npm test` ผ่าน 144 tests แต่ 4 test suites ของ MCP ล้มเหลวเพราะ repo ไม่มีไฟล์ `db/migrations/0008_mcp_access_and_drafts.sql` ที่ tests อ้างถึง (ไฟล์ `.sql` เหล่านี้ถูก `.gitignore`); `npm run build` compile และ TypeScript ผ่าน แต่หยุดตอน page data collection เพราะ environment นี้ไม่มี PostgreSQL connection string
- ยังต้องตรวจหลัง deploy: HTML/canonical/robots/sitemap/404 ของ production, URL Inspection และ baseline ใน Search Console, ข้อมูล AI referral, structured data validator, การเข้าถึงมังงะหลังหน้าแรกของ infinite scroll; ยังไม่มีหลักฐานพอจะกล่าวว่าอันดับหรือการถูกอ้างอิงจาก AI ดีขึ้น
- ระยะ 3 ยังไม่สร้างหน้า Q&A เพิ่ม เพราะยังไม่มีคำถามจริงและข้อมูลต้นทางที่ตรวจสอบได้; เริ่มได้หลังเก็บ baseline และเลือกเนื้อหาที่มีคุณค่าจริง

## หลักฐานตั้งต้น

- `robots.txt` และ `sitemap.xml` ของเว็บจริงตอบ HTTP 200; sitemap มี 64 URL (มังงะ 30, หมวดหมู่ 4, แท็ก 28, หน้าแรกและ changelog อย่างละ 1)
- หน้าแรก หมวดหมู่ แท็ก และมังงะที่สุ่มตรวจไม่มี `rel="canonical"`; หน้าแรกที่สุ่มตรวจไม่มี H1
- URL ค้นหาและเรียงลำดับ เช่น `/?search=dog` และ `/?sort=views` ตอบ 200 พร้อม title เดียวกับหน้าแรกและไม่มี canonical
- `<lastmod>` ของมังงะ 30 URL ใน sitemap ที่ตรวจเป็นสตริง PostgreSQL (`2026-09-23 17:51:17...+00`) ซึ่งไม่ใช่รูปแบบ W3C Datetime; หน้าอื่นใช้เวลาสร้าง sitemap แทนเวลาเปลี่ยนเนื้อหา
- หน้าหมวดหมู่และแท็กตัวอย่างสืบทอด description ทั่วไปของเว็บ; หน้ามังงะตัวอย่างไม่มี meta description
- title หมวดหมู่บนเว็บจริงเป็นภาษาไทย; โค้ดบนฐาน `origin/main` ใหม่ก็เป็นภาษาไทยแล้ว จึงคงรูปแบบเดิมและเพิ่มคำอธิบายเฉพาะหน้า
- ยังไม่มีข้อมูล Search Console, Core Web Vitals ภาคสนาม หรือข้อมูลการอ้างอิงจาก AI; ห้ามตีความว่าหน้า 200 เท่ากับถูก index
- `/moxzk` ยังตอบ 200 บนเว็บจริง ณ วันที่ตรวจ; หลัง deploy งานลบ route ต้องตรวจว่า URL นี้ตอบ 404 และไม่อยู่ใน sitemap
- เอา metadata `rating: mature` และ `adult: true` ที่ root layout ซึ่งเคยสืบทอดไปทุกหน้าออกจาก checkout แล้วตามคำขอ; หน้าต่างยืนยันอายุยังอยู่

## ระยะ 0 — ยืนยันฐานวัดและนโยบายเนื้อหา

1. ยืนยัน production deployment/commit, โดเมนหลัก, URL ใน `NEXT_PUBLIC_APP_URL` และต้นทาง canonical โดยตรวจชื่อและสถานะ config เท่านั้น ไม่บันทึกค่าลับ
2. เก็บ baseline จาก Search Console: Page indexing, URL Inspection ของหน้าแรก/หมวดหมู่/แท็ก/มังงะ, sitemap status, search performance และรายงาน AI เมื่อมีให้ใช้ แยกคำค้นแบรนด์กับคำค้นทั่วไป
3. กำหนดรายหน้าใดเป็นเนื้อหา 18+ และรายหน้าใดไม่ใช่ โดยเฉพาะ privacy, terms, changelog สำหรับการวิเคราะห์ผลใน Search Console; ตามการตัดสินใจปัจจุบันไม่เพิ่ม rating/adult metadata และคงหน้าต่างยืนยันอายุตามคำขอ
4. กำหนดว่ามังงะ `isHidden` ต้องตอบ 404, 410 หรือยังเปิดหน้าได้แต่ `noindex`; ใช้นโยบายเดียวกันกับรายการ, sitemap และหน้าโดยตรง

**ผ่านเมื่อ:** มีรายการ URL ตัวอย่างพร้อมสถานะ HTTP, indexability, Google-selected canonical และ baseline ที่ตรวจซ้ำได้; ถ้าไม่มีสิทธิ์ Search Console ให้บันทึกช่องว่างนี้ไว้ ไม่เดาตัวเลข

## ระยะ 1 — แก้ technical SEO ที่มีหลักฐานชัดเจน

1. เพิ่ม canonical ที่ metadata ระดับหน้าให้หน้าแรก (`app/page.tsx`), หน้ามังงะ (`app/[mangaId]/page.tsx`), หมวดหมู่ และแท็ก; URL ต้องตรงโดเมนหลักและ URL ใน sitemap อย่าวาง canonical `/` ใน root layout เพราะอาจสืบทอดไปทุกหน้า
2. กำหนดนโยบาย URL ตัวกรองใน `app/page.tsx`: หน้าค้นหาภายในที่ไม่ได้ออกแบบเป็น landing page ควร `noindex`; URL เรียงลำดับที่เนื้อหาซ้ำควรชี้ canonical ไปหน้าหลัก ตรวจว่าไม่ตัดหน้าที่มีคุณค่าเฉพาะโดยไม่ตั้งใจ
3. แก้ `app/sitemap.ts`: แปลง `updatedAt` ของมังงะเป็นวันที่ ISO/W3C, ไม่ใช้ `new Date()` เป็น `lastmod` ของทุกหน้าทุกครั้งที่สร้าง sitemap, และใส่เฉพาะ URL ที่ตอบ 200, indexable, canonical ตรงกัน; ไม่จำเป็นต้องใส่ `changefreq`/`priority` เพราะ Google ไม่ใช้ค่าเหล่านี้
4. ปรับการอ่านมังงะโดยตรงให้เคารพ `isHidden` ตามนโยบายจากระยะ 0; ตรวจ invalid slug และ DB error ไม่ให้กลายเป็น soft 404 หรือ metadata ที่ชวนเข้าใจผิด
5. ตรวจว่าการลบ `rating`/`adult` แบบครอบทุกหน้าจาก `app/layout.tsx` แสดงผลบน production หลัง deploy โดยไม่เปลี่ยนหน้าต่างยืนยันอายุ; Google ยังอาจจัดประเภทเนื้อหา 18+ จากข้อความและภาพได้เอง

**ผ่านเมื่อ:** URL ตัวอย่างทุกชนิดมี canonical ที่ตั้งใจ, URL ค้นหา/ตัวกรองไม่สร้างหน้าซ้ำที่ index ได้, ทุก `<lastmod>` ถูกต้องและตรงการแก้เนื้อหาจริง, URL ที่ซ่อนไม่ปรากฏใน sitemap และมีพฤติกรรมหน้าโดยตรงตามนโยบาย

## ระยะ 2 — ปรับเนื้อหาและ metadata ที่คนกับ crawler อ่านได้

1. เพิ่ม H1 และข้อความแนะนำสั้น ๆ ที่บอกคุณค่าของเว็บใน `app/page.tsx`; ตรวจ HTML ที่ server ส่งจริง ไม่พึ่งเฉพาะข้อความหลัง hydration
2. ให้ `app/category/[categoryName]/page.tsx` และ `app/tag/[tagName]/page.tsx` มี title, description, H1 และข้อความอธิบายที่ต่างกันตามหมวด/แท็ก โดยไม่สร้างข้อความซ้ำหรือยัดคำค้น
3. ให้ `app/[mangaId]/page.tsx` มี meta description ที่สอดคล้องกับเรื่องย่อบนหน้า; ถ้าข้อมูลต้นทางว่าง ให้ใช้ข้อความ fallback ที่มีชื่อเรื่องและข้อมูลจริง แทนข้อความอังกฤษทั่วไป
4. ตรวจ JSON-LD `ComicStory` กับข้อความที่มองเห็น โดยเฉพาะผู้สร้าง จำนวนหน้า เรตติ้ง รูป และ URL; เพิ่ม schema เฉพาะข้อมูลที่แสดงและตรวจสอบได้
5. ตรวจลิงก์ภายในจากหน้าแรก หมวดหมู่ แท็ก ไปยังมังงะ และการเข้าถึงรายการหลังหน้าแรกของ infinite scroll เพื่อไม่ให้เรื่องสำคัญกลายเป็น orphan page

**ผ่านเมื่อ:** หน้าเป้าหมายที่สุ่มตรวจมีข้อความหัวเรื่องและคำอธิบายเฉพาะ, ไม่มี metadata ว่าง/ผิดภาษาโดยไม่ตั้งใจ, และ structured data ผ่าน Schema Markup Validator โดยตรงกับเนื้อหาที่ผู้ใช้เห็น

## ระยะ 3 — AEO/GEO หลังจากหน้าพื้นฐานผ่าน

1. เริ่มจากคำถามที่ผู้ใช้เว็บถามจริง เช่น แนวเรื่อง ผู้สร้าง ลำดับการอ่าน และเงื่อนไขการเข้าถึง; เลือกเฉพาะหัวข้อที่มีข้อมูลต้นทางถูกต้องและไม่ซ้ำกับหน้ามังงะเดิม
2. จัดข้อมูลที่ตอบคำถามได้ให้เป็นข้อความ HTML ที่ชัดเจนบนหน้าที่เกี่ยวข้อง พร้อมแหล่งที่มาหรือเครดิตผู้สร้างเมื่อมีสิทธิ์เผยแพร่; หลีกเลี่ยงข้อความสร้างจำนวนมากที่ไม่มีคุณค่าใหม่
3. วัดการพบเห็นจาก Search Console, referral ที่ระบุแหล่งได้ และการตรวจคำถามตัวอย่างแบบบันทึกวันที่/คำค้น/คำตอบ ไม่อ้างว่าเพิ่ม schema แล้วจะถูก AI อ้างอิงแน่นอน
4. พิจารณา `llms.txt` เฉพาะเมื่อมีระบบปลายทางหรือกรณีใช้งานที่พิสูจน์ว่าต้องใช้; Google ระบุว่าไม่ใช้ไฟล์นี้เป็นสัญญาณสำหรับ Search/AI Overviews

**ผ่านเมื่อ:** มีหน้าคำตอบที่เป็นประโยชน์และตรวจสอบข้อเท็จจริงได้จริง พร้อมวิธีวัดผลก่อนและหลัง; ไม่ใช้จำนวน FAQ schema หรือจำนวนคำเป็นตัวชี้วัดความสำเร็จ

## การตรวจและการออกสู่ production

- ทำเป็นชุดเปลี่ยนเล็ก ๆ ตามระยะ โดยอ่านสถานะ working tree ก่อนแก้และไม่ทับงานที่มีอยู่
- หลังแก้แต่ละชุด: ทดสอบ metadata/sitemap/hidden-page policy ที่เกี่ยวข้อง, `npm run lint`, `npm test`; ใช้ `npm run build` ก่อน release ที่เปลี่ยน route หรือ metadata ของ Next.js
- ตรวจ HTML ที่ deploy จริง, response status, robots, sitemap, canonical และ JSON-LD ทั้งบน desktop/mobile; ทดสอบ URL ที่มีและไม่มี query string
- หลัง deploy การลบหน้า ตรวจ `/moxzk` ตอบ 404, ไม่อยู่ใน sitemap และตรวจ URL Inspection เพื่อให้ Google ประมวลผลการนำหน้าออกตามรอบ crawl
- ใช้ Search Console URL Inspection และติดตาม indexing, impressions, clicks และ query mix หลัง deploy อย่างน้อย 28 วัน; เปรียบเทียบกับ baseline โดยคำนึงถึงฤดูกาลและการเปลี่ยนแปลงคอนเทนต์
- การเปลี่ยนโค้ดครั้งนี้ถูกย้ายมาไว้ใน worktree จาก `origin/main` ล่าสุดเพื่อไม่ย้อนการเปลี่ยนแปลง 36 commit; หลัง push ต้องตรวจผล Vercel build และ production แยกจากผลตรวจในเครื่อง

## แหล่งอ้างอิงหลัก

- Google: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google canonical: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Sitemap protocol: https://www.sitemaps.org/protocol.html
- Google explicit content: https://developers.google.com/search/docs/specialty/explicit/guidelines
