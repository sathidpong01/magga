import { sql } from "drizzle-orm";
import { db } from "../../db";

const deadline = setTimeout(() => { console.error("Concurrent database reads stalled"); process.exit(1); }, 6000);
try {
  const rows = await Promise.all(Array.from({ length: 12 }, (_, index) => db.execute(sql`select ${index}::integer as value`)));
  if (!rows.every(result => result[0]?.value === 1)) throw new Error("Unexpected database response");
  console.log(JSON.stringify({ completed: rows.length }));
  clearTimeout(deadline);
  await db.$client.end({ timeout: 1 });
} catch {
  console.error("Concurrent database reads failed");
  process.exit(1);
}
