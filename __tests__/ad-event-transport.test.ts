import { describe, expect, it } from "bun:test";
import { deliverAdEvent } from "@/lib/ad-event-transport";
const event = { eventId: "11111111-1111-4111-8111-111111111111", kind: "click" as const };

describe("ad event acknowledgement", () => {
  it("retries lost acknowledgements, rate limits and server failures with the original UUID", async () => {
    const bodies: string[] = [], waits: number[] = [];
    let attempt = 0;
    const fetcher = async (_url: string, options: RequestInit) => {
      bodies.push(options!.body as string);
      attempt++;
      if (attempt === 1) throw new Error("offline");
      return new Response(null, { status: attempt === 2 ? 429 : 204, headers: { "Retry-After": "2" } });
    };
    expect(await deliverAdEvent("/events", event, { fetcher, wait: async (delay) => { waits.push(delay); } })).toBe(true);
    expect(bodies).toEqual([JSON.stringify(event), JSON.stringify(event), JSON.stringify(event)]);
    expect(waits).toEqual([500, 2000]);
  });
  it("does not retry client validation or authorization failures", async () => {
    for (const status of [400, 401, 403, 404]) {
      let calls = 0;
      const fetcher = async () => { calls++; return new Response(null, { status }); };
      expect(await deliverAdEvent("/events", event, { fetcher })).toBe(false);
      expect(calls).toBe(1);
    }
  });
  it("bounds transient failures to three attempts", async () => {
    let calls = 0;
    const waits: number[] = [];
    const fetcher = async () => { calls++; return new Response(null, { status: 503 }); };
    expect(await deliverAdEvent("/events", event, { fetcher, wait: async (delay) => { waits.push(delay); } })).toBe(false);
    expect(calls).toBe(3);
    expect(waits).toEqual([500, 1000]);
  });
  it("does not retry before a long server Retry-After expires", async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return new Response(null, { status: 429, headers: { "Retry-After": "3600" } }); };
    expect(await deliverAdEvent("/events", event, { fetcher })).toBe(false);
    expect(calls).toBe(1);
  });
  it("stops retries when the page visit changes", async () => {
    let active = true, calls = 0;
    const fetcher = async () => { calls++; return new Response(null, { status: 500 }); };
    expect(await deliverAdEvent("/events", event, { fetcher, isCurrent: () => active, wait: async () => { active = false; } })).toBe(false);
    expect(calls).toBe(1);
  });
});
