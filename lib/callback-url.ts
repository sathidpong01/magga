/** Match the URL the browser will navigate to, rather than its raw prefix. */
export function isValidCallbackUrl(value: string | null): string {
  if (!value?.startsWith("/") || /[\\\u0000-\u0020\u007f]/.test(value)) return "/";
  try {
    const base = "https://callback.invalid";
    const url = new URL(value, base);
    const callback = `${url.pathname}${url.search}${url.hash}`;
    // Dot-segment normalization can turn a local path into //host. Validate
    // the returned representation too, since the router parses it again.
    return url.origin === base && new URL(callback, base).origin === base ? callback : "/";
  } catch {
    return "/";
  }
}
