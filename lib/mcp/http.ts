import { randomUUID } from 'node:crypto';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { AccessError, authenticate, type KeyRecord } from './auth';
import { createServer, toolNames, type Audit, type Catalog } from './tools';
import type { DraftService } from './drafts';
import type { ReviewService } from './review';

export type Dependencies = { lookup: (hash: string) => Promise<KeyRecord | undefined>; consume: (id: string) => Promise<boolean>; catalog: Catalog; audit: Audit; drafts?: DraftService; review?: ReviewService };
export async function handleMcp(request: Request, deps: Dependencies) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    const key = await authenticate(request.headers.get('authorization'), deps.lookup);
    if (!await deps.consume(key.id)) throw new AccessError(429);
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
    if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null, { status: 415, headers: { 'Cache-Control': 'no-store' } });
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    const chunks: Uint8Array[] = []; let length = 0; let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 5000);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 65536) { await reader.cancel(); return new Response(null, { status: 413, headers: { 'Cache-Control': 'no-store' } }); }
        chunks.push(value);
      }
    } finally { clearTimeout(timer); reader.releaseLock(); }
    if (timedOut) return new Response(null, { status: 408, headers: { 'Cache-Control': 'no-store' } });
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
    const envelope = body as { method?: unknown; params?: { name?: unknown } } | null;
    const event = envelope?.method === 'tools/call' ? {
      requestId: randomUUID(), keyId: key.id, ownerUserId: key.ownerUserId,
      toolName: typeof envelope.params?.name === 'string' && toolNames.includes(envelope.params.name) ? envelope.params.name : 'unknown',
    } : null;
    if (event) await deps.audit({ ...event, outcome: 'started' });
    const server = createServer(key, deps.catalog, deps.drafts, event?.requestId, deps.review);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
      await server.connect(transport);
      const response = await transport.handleRequest(request, { parsedBody: body });
      let bytes = await response.arrayBuffer();
      if (event) {
        const result = bytes.byteLength ? JSON.parse(Buffer.from(bytes).toString('utf8')) : null;
        await deps.audit({ ...event, outcome: response.ok && result?.result && !result.result.isError && !result.error ? 'success' : 'failed' });
        // SDK validation/unknown-tool errors may echo client-supplied strings.
        if (result?.error) result.error = { code: result.error.code, message: 'Tool request failed' };
        if (result?.result?.isError) result.result = { isError: true, content: [{ type: 'text', text: 'Tool request failed' }] };
        if (result) bytes = new TextEncoder().encode(JSON.stringify(result)).buffer;
      }
      const headers = new Headers(response.headers); headers.set('Cache-Control', 'no-store');
      return new Response(bytes.byteLength ? bytes : null, { status: response.status, headers });
    } catch {
      if (event) { try { await deps.audit({ ...event, outcome: 'failed' }); } catch { /* Return no data when auditing fails. */ } }
      throw new AccessError(503);
    } finally { await server.close(); }
  } catch (error) {
    const status = error instanceof AccessError ? error.status : 503;
    return Response.json({ error: status === 429 ? 'Rate limit exceeded' : 'Request unavailable' }, { status, headers: { 'Cache-Control': 'no-store', ...(status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {}), ...(status === 429 ? { 'Retry-After': '60' } : {}) } });
  }
}
