import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:dev.db',
});

async function main() {
  try {
    const result = await client.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations'"
    );
    
    console.log('-- SQL Dump from dev.db');
    console.log(result.rows.map((r) => r.sql).join(';\n\n') + ';');
    
    // Also get indices
    const indices = await client.execute(
        "SELECT sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    );
    if (indices.rows.length > 0) {
        console.log('\n-- Indices');
        console.log(indices.rows.map((r) => r.sql).join(';\n\n') + ';');
    }

  } catch (e) {
    console.error(e);
  }
}

main();
