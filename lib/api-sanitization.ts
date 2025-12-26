import { z } from "zod";

/**
 * API Response Sanitization Utilities
 * Ensures sensitive data is not exposed in API responses
 */

// Sensitive fields that should never be exposed
const SENSITIVE_FIELDS = [
  "password",
  "hashedPassword",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "privateKey",
];

/**
 * Recursively removes sensitive fields from an object
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeResponse<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === "object" && item !== null
        ? sanitizeResponse(item as Record<string, unknown>)
        : item
    ) as unknown as T;
  }

  const sanitized: Record<string, unknown> = { ...obj };

  for (const key of Object.keys(sanitized)) {
    // Remove sensitive fields
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      delete sanitized[key];
      continue;
    }

    // Recursively sanitize nested objects
    const value = sanitized[key];
    if (value && typeof value === "object") {
      sanitized[key] = sanitizeResponse(value as Record<string, unknown>);
    }
  }

  return sanitized as T;
}

/**
 * User response schema - only safe fields
 */
export const SafeUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string().nullable(), // Consider removing for public APIs
  image: z.string().nullable(),
  role: z.string(),
});

/**
 * Sanitize user object for API response
 */
export function sanitizeUser(user: Record<string, unknown>) {
  const { password, ...safeUser } = user as { password?: string } & Record<
    string,
    unknown
  >;
  return safeUser;
}

/**
 * Sanitize manga object - removes internal fields
 */
export function sanitizeManga(manga: Record<string, unknown>) {
  const safeFields = [
    "id",
    "slug",
    "title",
    "description",
    "coverImage",
    "pages",
    "authorCredits",
    "authorName",
    "createdAt",
    "updatedAt",
    "viewCount",
    "averageRating",
    "ratingCount",
    "category",
    "tags",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const field of safeFields) {
    if (field in manga) {
      sanitized[field] = manga[field];
    }
  }
  return sanitized;
}

/**
 * Create a safe JSON response
 */
export function safeJsonResponse(data: unknown, status: number = 200) {
  const sanitized =
    typeof data === "object" && data !== null
      ? sanitizeResponse(data as Record<string, unknown>)
      : data;

  return Response.json(sanitized, { status });
}
