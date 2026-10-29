import fs from 'node:fs';
import path from 'node:path';

const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isPreviewOrigin(value, extraOrigins = []) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      && (loopback.has(url.hostname) || extraOrigins.includes(url.origin));
  } catch { return false; }
}

/** Explicit origins preserve tunnel previews without trusting arbitrary websites. */
export function allowPreviewRequest(req, res, port, extraOrigins = []) {
  if (!['localhost', '127.0.0.1', '[::1]'].some(host => req.headers.host === `${host}:${port}`)) return false;
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if (origin && !isPreviewOrigin(origin, extraOrigins)) return false;
  if (!origin && referer && !isPreviewOrigin(referer, extraOrigins)) return false;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', new URL(origin).origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  return true;
}

/** /source is only the browser's HTML fallback, never a general file API. */
export function previewSourcePath(root, name) {
  if (!name || name.includes('\\') || name.includes(':') || path.isAbsolute(name)
    || name.split('/').some(part => part === '..' || part.startsWith('.'))
    || !/\.html?$/i.test(name)) throw new Error('Forbidden source');
  const realRoot = fs.realpathSync(root);
  const file = fs.realpathSync(path.resolve(realRoot, name));
  const relative = path.relative(realRoot, file);
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
    || !/\.html?$/i.test(file) || !fs.statSync(file).isFile()) throw new Error('Forbidden source');
  return file;
}
