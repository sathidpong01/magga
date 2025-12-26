/**
 * Image URL Validation Utility
 * Validates image URLs against a whitelist of allowed domains
 */

// Allowed image domains
const ALLOWED_DOMAINS = [
  "pub-1f8d25d164134702943300ef6d01fc35.r2.dev", // R2 storage
  "localhost", // Development
  "lh3.googleusercontent.com", // Google profile images
  "avatars.githubusercontent.com", // GitHub avatars
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ["https:", "http:"];

/**
 * Validates if an image URL is from an allowed domain
 * @param url - The image URL to validate
 * @returns true if the URL is valid and from an allowed domain
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Allow data URLs (base64 images)
  if (url.startsWith("data:image/")) {
    return true;
  }

  // Allow relative URLs (local images)
  if (url.startsWith("/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }

    // Check if domain is in whitelist
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );

    return isAllowed;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitizes an image URL - returns a safe fallback if invalid
 * @param url - The image URL to sanitize
 * @param fallback - Fallback URL if invalid (default: empty placeholder)
 * @returns The original URL if valid, or the fallback
 */
export function sanitizeImageUrl(
  url: string,
  fallback: string = "/placeholder.png"
): string {
  if (isValidImageUrl(url)) {
    return url;
  }
  console.warn(`Invalid image URL blocked: ${url}`);
  return fallback;
}

/**
 * Validates image URL for user-submitted content (stricter)
 * Only allows R2 storage URLs for user uploads
 * @param url - The image URL to validate
 * @returns true if the URL is from the allowed upload domain
 */
export function isValidUploadUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "pub-1f8d25d164134702943300ef6d01fc35.r2.dev"
    );
  } catch {
    return false;
  }
}
