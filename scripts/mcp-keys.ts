import { parseArgs } from 'node:util';
import { config } from 'dotenv';
import { createKeyAdmin } from '../lib/mcp/keys';

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { owner: { type: 'string' }, name: { type: 'string' }, scopes: { type: 'string' }, expires: { type: 'string' }, id: { type: 'string' }, help: { type: 'boolean' } } });
  const command = positionals[0];
  if (values.help || !command) {
    console.log('Trusted database operator: npm run mcp:keys -- issue|list|revoke --owner <admin-id>\nissue: --name <label> --scopes catalog:read,draft:write --expires <ISO-date>\nrevoke: --id <key-id>\nThe issue command displays the token once. Store it securely; do not record/share terminal output.');
    return;
  }
  if (!values.owner || !['issue', 'list', 'revoke'].includes(command)) throw new Error('Invalid arguments');
  config({ path: '.env.local', quiet: true });
  const { db } = await import('../db');
  const admin = createKeyAdmin(db);
  if (command === 'issue') {
    // The service validates all CLI strings; no bearer tokens are accepted as arguments.
    const input = { owner: values.owner, name: values.name, scopes: values.scopes?.split(','), expires: values.expires };
    const { z } = await import('zod');
    const checked = z.object({ owner: z.string(), name: z.string(), scopes: z.array(z.enum(['catalog:read','draft:write','metadata:write'])), expires: z.string() }).parse(input);
    console.log(JSON.stringify(await admin.issue(checked), null, 2));
  } else if (command === 'list') console.log(JSON.stringify(await admin.list(values.owner), null, 2));
  else if (values.id) console.log(JSON.stringify(await admin.revoke(values.owner, values.id), null, 2));
  else throw new Error('Key ID required');
}
main().catch(() => { console.error('MCP key operation failed. Check arguments, administrator status and isolated database configuration.'); process.exitCode = 1; });
