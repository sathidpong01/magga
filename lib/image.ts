import { promises as fs } from 'fs';
import path from 'path';

// R2 storage domain
const R2_DOMAIN = 'pub-1f8d25d164134702943300ef6d01fc35.r2.dev';

export async function resolveLocalImage(src?: string) {
  if (!src) return '';

  // Quick check: if it's an R2 URL, return as-is
  if (src.includes(R2_DOMAIN)) {
    return src;
  }

  // If it's already a relative path starting with /uploads/, check existence
  try {
    const u = new URL(src);
    const pathname = u.pathname + (u.search || '');
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || pathname.includes('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', pathname);
      try {
        await fs.access(filePath);
        return pathname;
      } catch {
        return src; // Return original if file not found locally
      }
    }
    // Not a local uploads URL — return original
    return src;
  } catch {
    // Not an absolute URL. If it starts with /uploads/, check existence
    if (src.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', src);
      try {
        await fs.access(filePath);
        return src;
      } catch {
        return src; // Return original
      }
    }
    return src;
  }
}

