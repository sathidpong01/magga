import prisma from "@/lib/prisma";

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
    const attempt = await prisma.loginAttempt.findUnique({
      where: { identifier },
    });

    if (!attempt || now > attempt.expiresAt) {
      // Reset or create new attempt record
      await prisma.loginAttempt.upsert({
        where: { identifier },
        update: { count: 1, expiresAt: new Date(now.getTime() + duration) },
        create: { identifier, count: 1, expiresAt: new Date(now.getTime() + duration) },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    if (attempt.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: attempt.expiresAt.getTime() 
      };
    }

    // Increment count
    await prisma.loginAttempt.update({
      where: { identifier },
      data: { count: { increment: 1 } },
    });

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
    await prisma.loginAttempt.delete({
      where: { identifier },
    });
  } catch {
    // Ignore if not found
  }
}
