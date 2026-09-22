import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { isAdminRole } from '@/lib/session-utils';
import { createBrowserReviewService } from '@/lib/mcp/review';
import { revalidatePath, revalidateTag } from 'next/cache';
import { approvalSelection } from '@/lib/mcp/approval-selection';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('apply'), review_token: z.string().regex(/^[a-f0-9]{64}$/), confirm: z.literal(true), selection: approvalSelection.optional() }).strict(),
  z.object({ action: z.literal('reject'), review_token: z.string().regex(/^[a-f0-9]{64}$/), confirm: z.literal(true) }).strict(),
]);
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function service(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
  if (!session?.user.id || !isAdminRole(session) || session.user.banned || ('isBanned' in session.user && session.user.isBanned)) return null;
  return createBrowserReviewService(db, session.user.id, async () => {
    revalidateTag('manga-list', 'max');
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard/admin/mcp-drafts');
  }, process.env.MCP_PUBLIC_SOURCE_HOSTS === undefined ? undefined : process.env.MCP_PUBLIC_SOURCE_HOSTS.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
}
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const review = await service(request);
    if (!review) return json({ error: 'กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแล' }, 403);
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return json({ error: 'ไม่พบข้อเสนอ' }, 400);
    return json(await review.get(id));
  } catch { return json({ error: 'โหลดข้อเสนอไม่ได้ กรุณาตรวจสิทธิ์และลองใหม่' }, 409); }
}
export async function POST(request: Request, context: Context) {
  // Cookie-authenticated mutations require an explicit same-origin request.
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // Next may normalize loopback URLs internally; Host preserves the browser authority.
  // Do not trust client-supplied X-Forwarded-Host for this check.
  const expectedOrigin = request.headers.get('host') ? `${url.protocol}//${request.headers.get('host')}` : url.origin;
  if (!origin || origin !== expectedOrigin) return json({ error: 'คำขอไม่ถูกต้อง' }, 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({ error: 'คำขอไม่ถูกต้อง' }, 415);
  try {
    const review = await service(request);
    if (!review) return json({ error: 'กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแล' }, 403);
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return json({ error: 'ไม่พบข้อเสนอ' }, 400);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'คำขอไม่ครบถ้วน' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    const timer = setTimeout(() => { void reader.cancel().catch(() => {}); }, 5000);
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 32768) { await reader.cancel(); return json({ error: 'คำขอมีขนาดใหญ่เกินไป' }, 413); }
        chunks.push(value);
      }
    } finally { clearTimeout(timer); reader.releaseLock(); }
    let input;
    try { input = bodySchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
    catch { return json({ error: 'กรุณาตรวจข้อเสนอและยืนยันอีกครั้ง' }, 400); }
    return json(await review.decide(id, input.review_token, input.action, randomUUID(), input.action === 'apply' ? input.selection : undefined));
  } catch { return json({ error: 'บันทึกไม่ได้ ข้อมูลอาจเปลี่ยนไปหรือสิทธิ์ไม่พร้อม กรุณาปิดหน้าต่างแล้วตรวจข้อเสนอใหม่' }, 409); }
}
