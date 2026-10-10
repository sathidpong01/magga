/** Retry only transient failures; every attempt carries the same idempotency key. */
export async function deliverAdEvent(
  url: string,
  event: { eventId: string; kind: "impression" | "click" },
  options: {
    fetcher?: (input: string, init: RequestInit) => Promise<Response>;
    wait?: (milliseconds: number) => Promise<void>;
    isCurrent?: () => boolean;
  } = {},
): Promise<boolean> {
  const fetcher = options.fetcher ?? fetch;
  const wait = options.wait ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const body = JSON.stringify(event);
  for (let attempt = 0; attempt < 3; attempt++) {
    if (options.isCurrent && !options.isCurrent()) return false;
    let delay = 500 * 2 ** attempt;
    try {
      const response = await fetcher(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return true;
      if (response.status !== 429 && response.status < 500) return false;
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        const seconds = Number(retryAfter);
        const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
        if (Number.isFinite(milliseconds)) {
          // Do not retry sooner than the server allows or keep a background task for minutes.
          if (milliseconds > 10_000) return false;
          delay = Math.max(delay, milliseconds);
        }
      }
    } catch {
      // A lost acknowledgement is safe to retry because the server deduplicates the event.
    }
    if (attempt < 2) await wait(Math.min(10_000, Math.max(0, delay)));
  }
  return false;
}
