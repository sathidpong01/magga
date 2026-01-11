/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitize HTML content more aggressively
 * Removes script tags, iframes, and event handlers
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  return (
    html
      .trim()
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      // Remove event handlers (onclick, onload, etc.)
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/on\w+='[^']*'/gi, "")
      // Remove javascript: protocol
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
      // Remove path traversal attempts
      .replace(/\.\./g, "")
      // Remove directory separators
      .replace(/[\/\\]/g, "")
      // Keep only alphanumeric, dots, dashes, underscores
      .replace(/[^a-zA-Z0-9.-_]/g, "_")
  );
}
