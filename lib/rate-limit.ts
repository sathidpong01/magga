import { db } from "@/db";
import { loginAttempts as loginAttemptsTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
}

/**
 * Check rate limit for a given identifier
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
  const now = new Date();

  try {
    const [attempt] = await db
      .select()
      .from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier))
      .limit(1);

    const expiresAt = attempt ? new Date(attempt.expiresAt) : null;

    if (!attempt || now > expiresAt!) {
      // Reset or create new attempt record
      await db
        .insert(loginAttemptsTable)
        .values({
          identifier,
          count: 1,
          expiresAt: new Date(now.getTime() + duration),
        })
        .onConflictDoUpdate({
          target: loginAttemptsTable.identifier,
          set: {
            count: 1,
            expiresAt: new Date(now.getTime() + duration),
          },
        });
      return { allowed: true, remaining: limit - 1 };
    }

    if (attempt.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: expiresAt!.getTime(),
      };
    }

    // Increment count
    await db
      .update(loginAttemptsTable)
      .set({ count: sql`${loginAttemptsTable.count} + 1` })
      .where(eq(loginAttemptsTable.identifier, identifier));

    return { allowed: true, remaining: limit - (attempt.count + 1) };
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
    await db
      .delete(loginAttemptsTable)
      .where(eq(loginAttemptsTable.identifier, identifier));
  } catch {
    // Ignore if not found
  }
}
