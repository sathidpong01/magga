import prisma from '../lib/prisma';

function toRelative(url?: string) {
  if (!url) return url;
  try {
    const u = new URL(url);
    // If hostname is localhost or includes uploads, return pathname
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return u.pathname + u.search;
    }
    if (u.pathname && u.pathname.includes('/uploads/')) {
      return u.pathname + u.search;
    }
    return url;
  } catch (e) {
    // Not an absolute URL
    const idx = url.indexOf('/uploads/');
    if (idx !== -1) return url.substring(idx);
    return url;
  }
}

async function main() {
  console.log('Normalizing manga upload URLs...');
  const mangas = await prisma.manga.findMany();
  let updated = 0;

  for (const m of mangas) {
    let needsUpdate = false;
    const updates: any = {};

    // coverImage
    const relCover = toRelative(m.coverImage);
    if (relCover !== m.coverImage) {
      updates.coverImage = relCover;
      needsUpdate = true;
    }

    // pages - stored as JSON string or maybe empty
    let pagesArr: string[] = [];
    if (m.pages) {
      if (Array.isArray((m as any).pages)) {
        pagesArr = (m as any).pages as string[];
      } else if (typeof m.pages === 'string') {
        try {
          const parsed = JSON.parse(m.pages);
          if (Array.isArray(parsed)) pagesArr = parsed;
        } catch {
          // maybe newline separated
          pagesArr = m.pages.split('\n').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    const newPages = pagesArr.map(p => toRelative(p));
    if (JSON.stringify(newPages) !== JSON.stringify(pagesArr)) {
      updates.pages = JSON.stringify(newPages);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.manga.update({ where: { id: m.id }, data: updates });
      updated += 1;
      console.log(`Updated manga ${m.id}`);
    }
  }

  console.log(`Done. ${updated} record(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
