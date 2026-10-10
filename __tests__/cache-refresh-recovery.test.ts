import { beforeEach, describe, expect, it, jest, mock } from "bun:test";
import type { ReactElement } from "react";

const authorize = jest.fn();
const invalidate = jest.fn();
const fetch = jest.fn();
mock.module("@/lib/comments/moderation", () => ({ requireModerationAdmin: authorize }));
mock.module("@/lib/comments", () => ({ handleCommentError: (error: { status: number }) => Response.json({ error: "Forbidden" }, { status: error.status }) }));
mock.module("@/lib/manga-invalidation", () => ({ invalidateMangaContent: invalidate }));
mock.module("@/lib/auth-fetch", () => ({ authFetch: fetch }));
const react = await import("react");
mock.module("react", () => ({ ...react, useRef: (current: unknown) => ({ current }), useState: (initial: unknown) => [initial, jest.fn()] }));
const { POST } = await import("@/app/api/admin/manga/cache-refresh/route");
const { default: CacheRefreshNotice } = await import("@/app/components/dashboard/CacheRefreshNotice");

beforeEach(() => { authorize.mockReset(); invalidate.mockReset(); fetch.mockReset(); authorize.mockResolvedValue({ role: "admin" }); invalidate.mockReturnValue(true); });

describe("cache-only recovery endpoint", () => {
  it("requires the fresh, same-origin, quota-bound admin mutation guard before invalidation", async () => {
    authorize.mockRejectedValue({ status: 403 });
    const request = new Request("http://localhost/api/admin/manga/cache-refresh", { method: "POST" });
    const result = await POST(request);
    expect(result.status).toBe(403);
    expect(authorize).toHaveBeenCalledWith(request, true);
    expect(invalidate).not.toHaveBeenCalled();
  });
  it("retains pending status on an outage and can retry without a content payload", async () => {
    const request = () => new Request("http://localhost/api/admin/manga/cache-refresh", { method: "POST" });
    invalidate.mockReturnValueOnce(false);
    const failed = await POST(request());
    expect(failed.status).toBe(503);
    expect(await failed.json()).toEqual({ success: false, cache_refresh_pending: true });
    const recovered = await POST(request());
    expect(recovered.status).toBe(200);
    expect(await recovered.json()).toEqual({ success: true, cache_refresh_pending: false });
    expect(recovered.headers.get("Cache-Control")).toBe("private, no-store");
    expect(invalidate.mock.calls).toEqual([[], []]);
  });
});

function retryHandler(onRefreshed: () => void) {
  const notice = CacheRefreshNotice({ onRefreshed }) as ReactElement<{ action: ReactElement<{ onClick: () => Promise<void> }> }>;
  return notice.props.action.props.onClick;
}
describe("cache recovery warning", () => {
  it("does not clear the warning for an HTTP failure or a still-pending response", async () => {
    const refreshed = jest.fn();
    const retry = retryHandler(refreshed);
    fetch.mockResolvedValueOnce(Response.json({ cache_refresh_pending: true }, { status: 503 }));
    await retry();
    fetch.mockResolvedValueOnce(Response.json({ success: true, cache_refresh_pending: true }));
    await retry();
    expect(refreshed).not.toHaveBeenCalled();
    expect(fetch.mock.calls.every(([url, options]) => url === "/api/admin/manga/cache-refresh" && options.method === "POST" && options.body === undefined)).toBe(true);
  });
  it("coalesces rapid retry clicks and clears only after acknowledgement", async () => {
    const refreshed = jest.fn();
    let acknowledge!: (response: Response) => void;
    fetch.mockImplementation(() => new Promise((resolve) => { acknowledge = resolve; }));
    const retry = retryHandler(refreshed);
    const first = retry();
    await retry();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(refreshed).not.toHaveBeenCalled();
    acknowledge(Response.json({ success: true, cache_refresh_pending: false }));
    await first;
    expect(refreshed).toHaveBeenCalledTimes(1);
  });
});
