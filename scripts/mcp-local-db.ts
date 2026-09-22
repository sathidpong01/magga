import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const path = resolve('.local/mcp/db');
  if (!existsSync(path)) throw new Error('Run the local bootstrap first');
  const db = await PGlite.create(path);
  const server = new PGLiteSocketServer({db,host:'127.0.0.1',port:55432,maxConnections:32,idleTimeout:30000});
  try { await server.start(); } catch (error) { await db.close(); throw error; }
  console.log('Isolated local PostgreSQL protocol endpoint ready on 127.0.0.1:55432 (PGlite).');
  let closing=false;
  const close = async () => { if(closing)return;closing=true;await server.stop();await db.close(); };
  process.once('SIGINT',()=>void close());process.once('SIGTERM',()=>void close());
}
main().catch(()=>{console.error('Local database failed to start; check the local data directory and port.');process.exitCode=1;});
