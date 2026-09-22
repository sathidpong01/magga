import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import postgres from 'postgres';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const endpoint = new URL('http://127.0.0.1:3100/api/mcp');
const credentials = z.object({ writer:z.object({token:z.string()}),reader:z.object({token:z.string()}) }).parse(JSON.parse(readFileSync('.local/mcp/client-credentials.json','utf8')));
const sql = postgres('postgresql://postgres:postgres@127.0.0.1:55432/postgres',{max:1,prepare:false,connect_timeout:5});
const report:Record<string,unknown>={at:new Date().toISOString(),endpoint:endpoint.href};
async function main() {
  const clients:Client[]=[];
  async function client(token:string) {
    const value=new Client({name:'magga-local-smoke',version:'1.0.0'});clients.push(value);
    await value.connect(new StreamableHTTPClientTransport(endpoint,{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));return value;
  }
  try {
    const [isolation] = await sql`SELECT (SELECT count(*)::int FROM profiles) profiles, (SELECT count(*)::int FROM accounts) accounts, (SELECT count(*)::int FROM sessions) sessions, (SELECT count(*)::int FROM manga) manga, (SELECT count(*)::int FROM authors) authors, (SELECT count(*)::int FROM tags) tags`;
    assert.equal(isolation.profiles,1);assert.equal(isolation.accounts,0);assert.equal(isolation.sessions,0);report.isolation=isolation;
    const unauthenticated=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(unauthenticated.status,401);report.missingBearer=401;
    const reader=await client(credentials.reader.token);const writer=await client(credentials.writer.token);
    const readTools=(await reader.listTools()).tools.map(t=>t.name);const writeTools=(await writer.listTools()).tools.map(t=>t.name);
    assert(!readTools.includes('apply_metadata_draft'));assert(writeTools.includes('apply_metadata_draft'));report.toolCounts={reader:readTools.length,writer:writeTools.length};
    const [candidate]=await sql`SELECT m.id,t.name FROM manga m CROSS JOIN tags t WHERE NOT m.is_hidden AND NOT EXISTS(SELECT 1 FROM manga_tags mt WHERE mt.manga_id=m.id AND mt.tag_id=t.id) ORDER BY m.id,t.id LIMIT 1`;
    assert(candidate,'No unused sample tag available');
    const before=await sql`SELECT tag_id FROM manga_tags WHERE manga_id=${candidate.id} ORDER BY tag_id`;
    const draftId=randomUUID();
    const proposed=await writer.callTool({name:'create_metadata_draft',arguments:{request_id:draftId,kind:'manga_tags',target:{type:'manga',id:candidate.id},proposal:{tag_names:[candidate.name]},sources:[]}});
    assert(!proposed.isError);assert.deepEqual(await sql`SELECT tag_id FROM manga_tags WHERE manga_id=${candidate.id} ORDER BY tag_id`,before);
    const reviewed=await writer.callTool({name:'get_metadata_draft',arguments:{draft_id:draftId}});
    const view=z.object({data:z.object({review_token:z.string(),status:z.literal('pending')})}).parse(reviewed.structuredContent);
    const denied=await reader.callTool({name:'apply_metadata_draft',arguments:{draft_id:draftId,review_token:view.data.review_token,confirm:true}});assert(denied.isError);
    const applied=await writer.callTool({name:'apply_metadata_draft',arguments:{draft_id:draftId,review_token:view.data.review_token,confirm:true}});
    assert(!applied.isError);assert.equal((applied.structuredContent as {data:{status:string}}).data.status,'applied');
    const after=await sql`SELECT tag_id FROM manga_tags WHERE manga_id=${candidate.id} ORDER BY tag_id`;
    assert.equal(after.length,before.length+1);for(const row of before) assert(after.some(v=>v.tag_id===row.tag_id));
    const retry=await writer.callTool({name:'apply_metadata_draft',arguments:{draft_id:draftId,review_token:view.data.review_token,confirm:true}});assert(!retry.isError);
    assert.deepEqual(await sql`SELECT tag_id FROM manga_tags WHERE manga_id=${candidate.id} ORDER BY tag_id`,after);
    const [audit]=await sql`SELECT count(*)::int AS count FROM mcp_audit_events WHERE tool_name='apply_metadata_draft' AND outcome='success'`;assert(audit.count>0);
    const home=await fetch('http://127.0.0.1:3100/');assert.equal(home.status,200);
    const html=await home.text();assert(html.includes('mcp-test-cover'));
    report.flow={draftOnly:true,readerWriteDenied:true,apply:'passed',existingTagsPreserved:true,idempotentRetry:true,audit:true,homepage:200,draftId};
    writeFileSync('.local/mcp/smoke-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  } finally { await Promise.allSettled(clients.map(c=>c.close()));await sql.end({timeout:5}); }
}
main().catch(()=>{console.error('Local MCP smoke failed; inspect local service logs (credentials are never printed).');process.exitCode=1;});
