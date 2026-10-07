import type { CommentActor } from "./identity";
import { CommentError } from "./types";

export function assertGuestCommentsEnabled(actor: CommentActor, upload = false) {
  if (actor.kind !== "guest") return;
  if (process.env.GUEST_COMMENTS_ENABLED === "false" || upload && process.env.GUEST_COMMENT_UPLOADS_ENABLED === "false") throw new CommentError("ปิดรับความคิดเห็นหรือรูปจากผู้เยี่ยมชมชั่วคราว กรุณาลองภายหลัง",503,"GUEST_DISABLED");
}
