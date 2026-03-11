import { db } from "@/db";
import { sql } from "drizzle-orm";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
}

/**
 * Check rate limit for a given identifier using a single DB query (upsert + RETURNING).
 * @param identifier - Unique identifier (e.g., "login:ip", "upload:userId")
 * @param limit - Maximum number of attempts allowed
 * @param duration - Duration in milliseconds before reset (default: 15 minutes)
 * @returns RateLimitResult with allowed status and remaining attempts
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  duration: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  try {
    const durationInterval = `${Math.floor(duration / 1000)} seconds`;
    const result = await db.execute(sql`
      INSERT INTO login_attempts (identifier, count, expires_at)
      VALUES (${identifier}, 1, NOW() + ${durationInterval}::interval)
      ON CONFLICT (identifier) DO UPDATE SET
        count = CASE 
          WHEN login_attempts.expires_at < NOW() THEN 1
          ELSE login_attempts.count + 1
        END,
        expires_at = CASE
          WHEN login_attempts.expires_at < NOW() THEN NOW() + ${durationInterval}::interval
          ELSE login_attempts.expires_at
        END
      RETURNING count, expires_at
    `);

    const row = result[0] as { count: number; expires_at: string } | undefined;
    if (!row) {
      return { allowed: true, remaining: limit };
    }

    const count = Number(row.count);
    const expiresAt = new Date(row.expires_at).getTime();

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetTime: count > limit ? expiresAt : undefined,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Allow on error to prevent blocking legitimate users
    return { allowed: true, remaining: limit };
  }
}

/**
 * Reset rate limit for a given identifier
 * @param identifier - Unique identifier to reset
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM login_attempts WHERE identifier = ${identifier}
    `);
  } catch {
    // Ignore if not found
  }
}
