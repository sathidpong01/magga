import { describe, expect, it, vi } from 'vitest';
import { generateKey } from '@/lib/mcp/auth';
import { handleMcp, type Dependencies } from '@/lib/mcp/http';

function fixture(scopes = ['catalog:read']) {
  const secret = generateKey();
  const deps: Dependencies = {
    lookup: vi.fn(async () => ({ id: 'key', ownerUserId: 'owner', name: 'client', scopes, secretHash: secret.secretHash, expiresAt: new Date('2099-01-01'), revokedAt: null, role: 'admin', banned: false })),
    consume: vi.fn(async () => true), audit: vi.fn(async () => {}),
    catalog: { findManga: vi.fn(async () => [{ id: 'public' }]), mangaDetails: vi.fn(async () => null), findAuthor: vi.fn(async () => []), authorDetails: vi.fn(async () => null), taxonomy: vi.fn(async () => ({})), taggingContext: vi.fn(async () => null) },
  };
  const request = (body: unknown, headers = {}, method = 'POST') => new Request('http://localhost/api/mcp', { method, headers: { authorization: `Bearer ${secret.token}`, accept: 'application/json, text/event-stream', 'content-type': 'application/json', ...headers }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
  const call = (method: string, params = {}) => request({ jsonrpc: '2.0', id: 1, method, params });
  return { deps, request, call, secret };
}
describe('MCP stateless HTTP', () => {
  it('prevents caching of early rejection responses', async () => {
    const f = fixture();
    const requests = [
      f.request({}, { origin: 'https://foreign.example' }),
      f.request({}, {}, 'GET'),
      f.request({}, { 'content-type': 'text/plain' }),
      f.request({ data: 'a'.repeat(70000) }),
    ];
    for (const request of requests) {
      const response = await handleMcp(request, f.deps);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });
  it('accepts a same-origin HTTPS proxy request without a session cookie', async () => {
    const f = fixture();
    const original = f.call('tools/list');
    const response = await handleMcp(new Request('https://preview.example/api/mcp', {
      method: 'POST', headers: { ...Object.fromEntries(original.headers), origin: 'https://preview.example' },
      body: await original.text(),
    }), f.deps);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect((await response.json()).result.tools).toHaveLength(6);
  });
  it('exposes draft tools only with the required independent scopes', async () => {
    for (const scopes of [['catalog:read'], ['draft:write'], ['catalog:read','metadata:write'], ['catalog:read','draft:write']]) {
      const f = fixture(scopes);
      f.deps.drafts = { validateTags: vi.fn(async () => ({})), validateCategory: vi.fn(async () => ({})), create: vi.fn(async () => ({})) };
      const body = await (await handleMcp(f.call('tools/list'), f.deps)).json();
      const names = (body.result?.tools ?? []).map((t: { name: string }) => t.name);
      expect(names.includes('validate_tag_proposal')).toBe(scopes.includes('catalog:read'));
      expect(names.includes('validate_category_proposal')).toBe(scopes.includes('catalog:read'));
      expect(names.includes('create_metadata_draft')).toBe(scopes.includes('catalog:read') && scopes.includes('draft:write'));
    }
  });
  it('dispatches a validated draft with authenticated identity and audit request id', async () => {
    const f = fixture(['catalog:read','draft:write']);
    f.deps.drafts = { validateTags: vi.fn(async () => ({})), validateCategory: vi.fn(async () => ({})), create: vi.fn(async () => ({ status: 'pending' })) };
    const args = { request_id: '00000000-0000-4000-8000-000000000001', kind: 'manga_tags', target: { type: 'manga', id: '00000000-0000-4000-8000-000000000002' }, proposal: { tag_names: ['Adventure'] }, sources: [] };
    const result = await (await handleMcp(f.call('tools/call', { name: 'create_metadata_draft', arguments: args }), f.deps)).json();
    expect(result.result.structuredContent.data.status).toBe('pending');
    expect(f.deps.drafts.create).toHaveBeenCalledWith(args, expect.objectContaining({ id: 'key' }), expect.any(String));
    const result2 = await (await handleMcp(f.call('tools/call', { name: 'create_metadata_draft', arguments: { ...args, proposal: { ...args.proposal, status: 'approved' } } }), f.deps)).json();
    expect(result2.result.isError).toBe(true); expect(f.deps.drafts.create).toHaveBeenCalledTimes(1);
  });
  it('forwards a validated partial approval through the MCP apply tool', async () => {
    const f = fixture(['catalog:read','metadata:write']);
    const decide = vi.fn(async () => ({status:'applied'}));
    f.deps.review = {list:vi.fn(async()=>[]),get:vi.fn(async()=>({})),decide};
    const arguments_ = {draft_id:'00000000-0000-4000-8000-000000000001',review_token:'a'.repeat(64),confirm:true,selection:{tag_names:['First Time']}};
    const response = await handleMcp(f.call('tools/call',{name:'apply_metadata_draft',arguments:arguments_}),f.deps);
    expect((await response.json()).result.structuredContent.data.status).toBe('applied');
    expect(decide).toHaveBeenCalledWith(arguments_.draft_id,arguments_.review_token,'apply',expect.objectContaining({id:'key'}),expect.any(String),arguments_.selection);
    const invalid = await (await handleMcp(f.call('tools/call',{name:'apply_metadata_draft',arguments:{...arguments_,selection:{unknown:['x']}}}),f.deps)).json();
    expect(invalid.result?.isError || invalid.error).toBeTruthy(); expect(decide).toHaveBeenCalledTimes(1);
  });
  it('initializes without a session id', async () => {
    const f = fixture(); const response = await handleMcp(f.call('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } }), f.deps);
    expect(response.status).toBe(200); expect(response.headers.get('mcp-session-id')).toBeNull();
    expect((await response.json()).result.serverInfo.name).toBe('magga-metadata');
  });
  it('lists exactly six read tools and no write/SQL tools', async () => {
    const f = fixture(); const body = await (await handleMcp(f.call('tools/list'), f.deps)).json();
    expect(body.result.tools.map((t: { name: string }) => t.name)).toEqual(['find_manga','get_manga_details','find_author','get_author_details','list_categories_and_tags','get_tagging_context']);
  });
  it('does not inherit catalog permission from metadata:write', async () => {
    const f = fixture(['metadata:write']); const body = await (await handleMcp(f.call('tools/list'), f.deps)).json();
    expect(body.error.code).toBe(-32601);
  });
  it('audits success without query, results, or token', async () => {
    const f = fixture(); const response = await handleMcp(f.call('tools/call', { name: 'find_manga', arguments: { query: 'sensitive query' } }), f.deps);
    expect((await response.json()).result.structuredContent).toEqual({ data: [{ id: 'public' }] });
    expect(f.deps.audit).toHaveBeenCalledTimes(2);
    const log = JSON.stringify(vi.mocked(f.deps.audit).mock.calls);
    expect(log).not.toContain('sensitive query'); expect(log).not.toContain(f.secret.token); expect(log).not.toContain('public');
  });
  it('redacts service exceptions and audits failure', async () => {
    const f = fixture(); vi.mocked(f.deps.catalog.findManga).mockRejectedValue(new Error(f.secret.token));
    const body = await (await handleMcp(f.call('tools/call', { name: 'find_manga', arguments: { query: 'a' } }), f.deps)).json();
    expect(body.result.isError).toBe(true); expect(JSON.stringify(body)).not.toContain(f.secret.token);
    expect(f.deps.audit).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: 'failed' }));
  });
  it('fails closed when the audit store fails', async () => {
    const f = fixture(); vi.mocked(f.deps.audit).mockRejectedValue(new Error('offline'));
    const response = await handleMcp(f.call('tools/call', { name: 'find_manga', arguments: { query: 'a' } }), f.deps);
    expect(response.status).toBe(503); expect(f.deps.catalog.findManga).not.toHaveBeenCalled();
  });
  it('rejects invalid tool input before querying', async () => {
    const f = fixture(); const body = await (await handleMcp(f.call('tools/call', { name: 'get_manga_details', arguments: { manga_id: 'invalid' } }), f.deps)).json();
    expect(body.result?.isError || body.error).toBeTruthy(); expect(f.deps.catalog.mangaDetails).not.toHaveBeenCalled();
    expect(f.deps.audit).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: 'failed' }));
  });
  it('rejects foreign origins before key lookup', async () => {
    const f = fixture(); expect((await handleMcp(f.request({}, { origin: 'https://evil.example' }), f.deps)).status).toBe(403); expect(f.deps.lookup).not.toHaveBeenCalled();
  });
  it('redacts unknown tool names from protocol errors and audit', async () => {
    const f = fixture(); const body = await (await handleMcp(f.call('tools/call', { name: f.secret.token, arguments: {} }), f.deps)).json();
    expect(JSON.stringify(body)).not.toContain(f.secret.token);
    expect(JSON.stringify(vi.mocked(f.deps.audit).mock.calls)).not.toContain(f.secret.token);
    expect(f.deps.audit).toHaveBeenLastCalledWith(expect.objectContaining({ toolName: 'unknown', outcome: 'failed' }));
  });
  it('returns 429 with retry guidance', async () => {
    const f = fixture(); vi.mocked(f.deps.consume).mockResolvedValue(false);
    const response = await handleMcp(f.call('tools/list'), f.deps); expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('60');
  });
  it('bounds body size and disallows GET', async () => {
    const f = fixture(); expect((await handleMcp(f.request({ data: 'a'.repeat(70000) }), f.deps)).status).toBe(413);
    expect((await handleMcp(f.request({}, {}, 'GET'), f.deps)).status).toBe(405);
  });
});
