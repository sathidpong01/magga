import { handleMcp } from '@/lib/mcp/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  // Experimental branch is disabled unless deliberately enabled in an isolated environment.
  if (process.env.MCP_ENABLED !== 'true') return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  try {
    const [{ createDependencies }, { db }] = await Promise.all([import('@/lib/mcp/dependencies'), import('@/db')]);
    return await handleMcp(request, createDependencies(db));
  } catch { return Response.json({ error: 'Request unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
export const GET = POST;
export const DELETE = POST;
