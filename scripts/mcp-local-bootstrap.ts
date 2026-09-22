import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { z } from 'zod';
import { createKeyAdmin } from '../lib/mcp/keys';
import type { db as database } from '../db';

const root = resolve('.local/mcp');
const ident = z.string().regex(/^[a-z_][a-z0-9_]*$/);
const column = z.object({ name: ident, type: z.enum(['text','timestamp with time zone','uuid','integer','boolean','jsonb','bigint','double precision','tsvector']), not_null: z.boolean(), generated: z.enum(['','s']), default: z.string().nullable() });
const schema = z.object({ tables: z.array(z.object({ name: ident, columns: z.array(column), constraints: z.array(z.object({ name: ident, type: z.enum(['p','u','c','f']), definition: z.string() })) })), indexes: z.array(z.string()), triggers: z.array(z.object({ table: ident, name: ident })) });
const named = z.object({ id: z.string().uuid(), name: z.string() }).strict();
const sampleSchema = z.object({ manga: z.array(z.object({ id:z.string().uuid(), title:z.string(), slug:z.string(), author_id:z.string().uuid().nullable(), category_id:z.string().uuid().nullable() }).strict()).max(5), authors:z.array(named), categories:z.array(named), tags:z.array(named), manga_tags:z.array(z.object({manga_id:z.string().uuid(),tag_id:z.string().uuid()}).strict()) }).strict();
const quote = (name:string) => `"${ident.parse(name)}"`;
const fragment = (value:string) => { if (value.includes(';') || value.includes('--') || value.includes('/*')) throw new Error('Unexpected schema fragment'); return value; };

async function main() {
  // No network client and no DATABASE_URL: this script cannot target production.
  if (existsSync(resolve(root,'db')) || existsSync('.env.local')) throw new Error('Local database/environment already exists; refusing to overwrite');
  const snapshot = schema.parse(JSON.parse(readFileSync(resolve(root,'schema-reference.json'),'utf8').replace(/^\uFEFF/,'')));
  const sample = sampleSchema.parse(JSON.parse(readFileSync(resolve(root,'catalog-sample.json'),'utf8').replace(/^\uFEFF/,'')));
  const pg = await PGlite.create(resolve(root,'db'));
  try {
    await pg.transaction(async (tx) => {
      await tx.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
      for (const table of snapshot.tables) {
        const columns = table.columns.map((c) => `${quote(c.name)} ${c.type}${c.generated === 's' ? ` GENERATED ALWAYS AS (${fragment(c.default!)}) STORED` : c.default ? ` DEFAULT ${fragment(c.default)}` : ''}${c.not_null?' NOT NULL':''}`);
        await tx.exec(`CREATE TABLE public.${quote(table.name)} (${columns.join(',')})`);
      }
      // Primary/unique constraints must precede all foreign keys.
      for (const foreign of [false,true]) for (const table of snapshot.tables) for (const c of table.constraints.filter((c)=>(c.type==='f')===foreign)) await tx.exec(`ALTER TABLE public.${quote(table.name)} ADD CONSTRAINT ${quote(c.name)} ${fragment(c.definition)}`);
      for (const index of snapshot.indexes) {
        if (!/^CREATE (UNIQUE )?INDEX /.test(index)) throw new Error('Unexpected index definition');
        await tx.exec(fragment(index));
      }
      await tx.exec("CREATE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$; REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;");
      for (const trigger of snapshot.triggers) await tx.exec(`CREATE TRIGGER ${quote(trigger.name)} BEFORE UPDATE ON public.${quote(trigger.table)} FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()`);
      for (const table of snapshot.tables) await tx.exec(`ALTER TABLE public.${quote(table.name)} ENABLE ROW LEVEL SECURITY; REVOKE ALL ON public.${quote(table.name)} FROM PUBLIC,anon,authenticated;`);
      await tx.exec(readFileSync('db/migrations/0008_mcp_access_and_drafts.sql','utf8'));
      await tx.exec(readFileSync('db/migrations/0009_mcp_new_author_drafts.sql','utf8'));
      await tx.exec(readFileSync('db/migrations/0010_mcp_partial_approval.sql','utf8'));
      for (const table of ['authors','categories','tags'] as const) for (const row of sample[table]) await tx.query(`INSERT INTO ${quote(table)}(id,name) VALUES($1,$2)`,[row.id,row.name]);
      for (const row of sample.manga) await tx.query('INSERT INTO manga(id,title,slug,author_id,category_id,cover_image,pages) VALUES($1,$2,$3,$4,$5,$6,$7)',[row.id,row.title,row.slug,row.author_id,row.category_id,'/mcp-test-cover.svg',JSON.stringify([])]);
      for (const row of sample.manga_tags) await tx.query('INSERT INTO manga_tags(manga_id,tag_id) VALUES($1,$2)',[row.manga_id,row.tag_id]);
      // Synthetic local owner only: no login account/password/session is copied or created.
      await tx.query('INSERT INTO profiles(id,name,role,email_verified) VALUES($1,$2,$3,$4)',['mcp-local-admin','MCP Local Test Administrator','admin',false]);
    });
    const admin = createKeyAdmin(drizzle(pg) as unknown as typeof database);
    const expires = new Date(Date.now()+7*86400000);
    const writer = await admin.issue({owner:'mcp-local-admin',name:'local-mcp-writer',scopes:['catalog:read','draft:write','metadata:write'],expires});
    const reader = await admin.issue({owner:'mcp-local-admin',name:'local-mcp-reader',scopes:['catalog:read'],expires});
    const output = { owner:'mcp-local-admin',endpoint:'http://127.0.0.1:3100/api/mcp', writer, reader };
    writeFileSync(resolve(root,'client-credentials.json'),JSON.stringify(output,null,2),{flag:'wx',mode:0o600});
    const env = {
      DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:55432/postgres',
      MCP_ENABLED:'true', MCP_LOCAL_DATABASE:'true',
      BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),BETTER_AUTH_URL:'http://127.0.0.1:3100',
      NEXT_PUBLIC_APP_URL:'http://127.0.0.1:3100',NEXT_PUBLIC_DEV_APP_URL:'http://127.0.0.1:3100',
      R2_ACCOUNT_ID:'local-only',R2_ACCESS_KEY_ID:'local-only',R2_SECRET_ACCESS_KEY:'local-only',R2_BUCKET_NAME:'local-only',R2_PUBLIC_URL:'http://127.0.0.1:3100/local-assets',
    };
    writeFileSync('.env.local',Object.entries(env).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{flag:'wx',mode:0o600});
    writeFileSync(resolve(root,'bootstrap-report.json'),JSON.stringify({createdAt:new Date().toISOString(),engine:'PGlite',referenceProject:'magga-db',schemaTables:snapshot.tables.length,mcpTables:3,sampleCounts:Object.fromEntries(Object.entries(sample).map(([k,v])=>[k,v.length])),syntheticAdmin:1,productionUserRowsCopied:0,productionMediaCopied:0},null,2));
    console.log('Local database initialized. Credentials saved locally; no tokens printed.');
    console.log(JSON.stringify({schemaTables:snapshot.tables.length,sampleManga:sample.manga.length,owner:'mcp-local-admin'}));
  } finally { await pg.close(); }
}
main().catch((error:unknown)=>{ console.error(error instanceof Error ? error.message : 'Local bootstrap failed');process.exitCode=1; });
