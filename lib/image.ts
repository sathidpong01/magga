import { promises as fs } from 'fs';
import path from 'path';

const PLACEHOLDER = 'https://via.placeholder.com/300x400.png?text=No+Cover';

export async function resolveLocalImage(src?: string) {
  if (!src) return PLACEHOLDER;

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
        return PLACEHOLDER;
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
        return PLACEHOLDER;
      }
    }
    return src;
  }
}
