/**
 * Content Sanitization Module
 * Unified text escaping, HTML scrubbing, path sanitization, and API response redaction.
 */

/**
 * Sanitize user input to prevent XSS attacks.
 * Safely escapes all standard HTML special characters: &, <, >, ", ', and /.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export const sanitizeInput = sanitizeText;
export const sanitizeContent = sanitizeText;

/**
 * Sanitize HTML content more aggressively
 * Removes script tags, iframes, and event handlers
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  return (
    html
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "")
  );
}

/**
 * Sanitize filename for safe storage
 * Removes special characters and path traversal attempts
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  return (
    filename
      .trim()
      .replace(/\.\./g, "")
      .replace(/[\/\\]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
  );
}

/**
 * Sanitize storage path/key segment
 */
export function sanitizePathSegment(value: string, fallback = "default"): string {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

export const sanitizeObjectKeySegment = sanitizePathSegment;

// Sensitive fields that should never be exposed in API responses
const SENSITIVE_FIELDS = [
  "password",
  "hashedpassword",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
  "privatekey",
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
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      delete sanitized[key];
      continue;
    }

    const value = sanitized[key];
    if (value && typeof value === "object") {
      sanitized[key] = sanitizeResponse(value as Record<string, unknown>);
    }
  }

  return sanitized as T;
}
