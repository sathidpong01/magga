import { afterEach, expect, it, jest } from "bun:test";
import { stubGlobal, restoreGlobals } from "./helpers/globals";
import { requestCommentIdentity, invalidateCommentIdentity } from "@/app/components/features/comments/identity-request";
afterEach(() => { invalidateCommentIdentity(); restoreGlobals(); });
it("shares concurrent identity requests per actor without persisting the private response", async () => {
  let resolve!: (response: Response) => void;
  const request = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) => new Promise<Response>(done => { resolve = done; }));
  stubGlobal("fetch", request);
  const first = requestCommentIdentity("actor-a");
  const second = requestCommentIdentity("actor-a");
  expect(first).toBe(second);
  expect(request).toHaveBeenCalledTimes(1);
  resolve(Response.json({ actor: null, turnstileSiteKey: null }));
  await first;
  request.mockResolvedValue(Response.json({ actor: null, turnstileSiteKey: null }));
  await requestCommentIdentity("actor-a");
  expect(request).toHaveBeenCalledTimes(2);
  expect(request.mock.calls[0]?.[1]?.cache).toBe("no-store");
});
it("identity changes start a new request while an older actor's request is pending", async () => {
  stubGlobal("fetch", jest.fn(() => new Promise<Response>(() => {})));
  const previous = requestCommentIdentity("guest");
  invalidateCommentIdentity();
  expect(requestCommentIdentity("guest")).not.toBe(previous);
});
