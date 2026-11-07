import type { PollDatabase } from "./database";
import type { StorageAdapter } from "@/lib/storage/types";

export async function cleanupPolls(
  database: PollDatabase,
  storage: StorageAdapter,
) {
  const assets = await database.transaction(async (tx) => {
    const candidates = await tx.query<{
      id: string;
      object_key: string;
    }>(`SELECT id,object_key FROM private.poll_assets a WHERE expires_at<clock_timestamp()
      AND NOT EXISTS(SELECT 1 FROM private.poll_options o WHERE o.asset_id=a.id)
      AND NOT EXISTS(SELECT 1 FROM private.polls p WHERE p.cover_asset_id=a.id)
      ORDER BY expires_at LIMIT 50 FOR UPDATE SKIP LOCKED`);
    const retired: typeof candidates = [];
    for (const asset of candidates) {
      const refs = await tx.query(
        "SELECT id FROM private.poll_options WHERE asset_id=$1 UNION ALL SELECT id FROM private.polls WHERE cover_asset_id=$1 LIMIT 1",
        [asset.id],
      );
      if (!refs.length) {
        await tx.query(
          "UPDATE private.poll_assets SET state='retired' WHERE id=$1",
          [asset.id],
        );
        retired.push(asset);
      }
    }
    return retired;
  });
  let deleted = 0;
  for (const asset of assets) {
    await storage.delete([asset.object_key]);
    await database.query(
      "DELETE FROM private.poll_assets WHERE id=$1 AND state='retired'",
      [asset.id],
    );
    deleted++;
  }
  await database.query(
    "DELETE FROM private.poll_sessions WHERE expires_at<clock_timestamp()",
  );
  await database.query(
    "DELETE FROM private.poll_limits WHERE expires_at<clock_timestamp()-interval '1 day'",
  );
  await database.query(
    "DELETE FROM private.poll_security_counts WHERE hour<clock_timestamp()-interval '90 days'",
  );
  // Keep anonymous ballots and choices for exact historical totals, remove identity links after 90 days.
  await database.query(
    "DELETE FROM private.poll_requests r USING private.polls p WHERE r.poll_id=p.id AND GREATEST(p.ends_at,p.updated_at)<clock_timestamp()-interval '90 days'",
  );
  await database.query(
    "DELETE FROM private.poll_claims c USING private.polls p WHERE c.poll_id=p.id AND GREATEST(p.ends_at,p.updated_at)<clock_timestamp()-interval '90 days'",
  );
  return deleted;
}
