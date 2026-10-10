import { commentRequest } from "./request";
import type { CommentActor } from "./guest-client";
type Identity = { actor: CommentActor | null; turnstileSiteKey: string | null };
const pending = new Map<string, Promise<Identity>>();
/** Only coalesce concurrent private requests; never persist an identity response. */
export function requestCommentIdentity(actorKey: string) {
  const existing = pending.get(actorKey);
  if (existing) return existing;
  const request = commentRequest<Identity>("/api/comments/identity");
  pending.set(actorKey, request);
  void request.finally(() => { if (pending.get(actorKey) === request) pending.delete(actorKey); }).catch(() => {});
  return request;
}
export function invalidateCommentIdentity() { pending.clear(); }
if (typeof window !== "undefined") window.addEventListener("magga-comment-identity", invalidateCommentIdentity);
