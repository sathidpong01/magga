# Security Audit Report

This document outlines the security vulnerabilities and areas for improvement identified in the current codebase.

## 🚨 Critical Priority

### 1. Unrestricted File Upload (Potential RCE/XSS)

- **Location**: `app/api/upload/route.ts`
- **Issue**: The upload handler iterates through files. If a file is an image, it compresses it. However, if a file is **NOT** an image, it is uploaded **as-is** to the R2 bucket.
- **Risk**: An attacker could upload a malicious file (e.g., `malware.html`, `.exe`, `.svg` with scripts) which could lead to Stored XSS or malware distribution if accessed via the public URL.
- **Recommendation**: Strictly whitelist allowed MIME types (e.g., `image/jpeg`, `image/png`, `image/webp`). Reject any file that does not match.

### 2. Missing Critical Dependency (`sharp`)

- **Location**: `package.json` vs `app/api/upload/route.ts`
- **Issue**: The `sharp` library is imported in the upload route but is **missing** from `package.json` dependencies.
- **Risk**: This will cause runtime errors or build failures. From a security perspective, manual installation might lead to version mismatches or confusion.
- **Recommendation**: Run `npm install sharp` immediately.

### 3. Hardcoded Credentials & Single Point of Failure

- **Location**: `app/api/auth/[...nextauth]/route.ts`
- **Issue**: Authentication relies on `process.env.ADMIN_USERNAME` and `process.env.ADMIN_PASSWORD`.
- **Risk**:
  - If environment variables are leaked, the entire admin panel is compromised.
  - No way to change password without redeploying.
  - No audit trail (who logged in?).
- **Recommendation**: Move to a database-backed session system (User table in Prisma) with hashed passwords (e.g., using `bcrypt`).

## ⚠️ High Priority

### 4. Lack of Rate Limiting

- **Location**: `app/api/auth/[...nextauth]/route.ts` (and other APIs)
- **Issue**: There is no mechanism to limit the number of login attempts.
- **Risk**: Vulnerable to brute-force attacks to guess the admin password.
- **Recommendation**: Implement `rate-limiter-flexible` or similar middleware to block IPs after failed login attempts.

### 5. Missing Security Headers

- **Location**: `next.config.mjs`
- **Issue**: The application does not configure standard HTTP security headers.
- **Risk**: Increases susceptibility to Clickjacking, XSS, and MIME-sniffing attacks.
- **Recommendation**: Configure `headers()` in `next.config.mjs` to include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (configured for your needs)

## 📝 Medium Priority

### 6. Weak Input Validation

- **Location**: `app/api/manga/route.ts`
- **Issue**: Validation is manual and minimal (e.g., `if (!title)`). Complex objects like `pages` (JSON string) are not validated for structure or content.
- **Risk**: Malformed data could cause frontend crashes or unexpected behavior.
- **Recommendation**: Use a schema validation library like **Zod** to strictly validate all incoming API request bodies.

### 7. JSON Parsing Risks

- **Location**: `app/api/manga/route.ts`
- **Issue**: `JSON.stringify(pages || [])` assumes `pages` is safe.
- **Recommendation**: Validate that `pages` is indeed an array of strings (URLs) before saving.

## ℹ️ Low Priority / Best Practices

### 8. Middleware Scope

- **Location**: `middleware.ts`
- **Observation**: Currently protects `/admin/:path*`.
- **Recommendation**: Ensure no other routes (e.g., `/api/upload` if used directly, though it has its own check) are left exposed. The current check in `upload/route.ts` (`getServerSession`) is good, but consistent middleware is better.

### 9. Error Handling

- **Observation**: Generic error messages are mostly used, which is good. Ensure `console.error` logs are monitored in production but not exposed to the client.
