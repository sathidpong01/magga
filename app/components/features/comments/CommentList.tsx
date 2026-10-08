"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { maggaColors } from "@/lib/design-tokens";
import {
  commentRequest,
  GuestVerification,
  type CommentActor,
} from "./guest-client";
import CommentBox from "./CommentBox";
export interface PublicComment {
  id: string;
  content: string;
  imageUrl: string | null;
  voteScore: number;
  createdAt: string;
  status?: string;
  parentId?: string | null;
  author: {
    kind: "guest" | "member";
    name: string | null;
    username?: string | null;
    image?: string | null;
    publicCode?: string;
  };
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  replies?: PublicComment[];
  repliesNextCursor?: string | null;
}
type Capability = {
  canEdit: boolean;
  canDelete: boolean;
  userVote: number | null;
};
function CommentItem({
  comment,
  mangaId,
  imageIndex,
  onRefresh,
  capability,
  capabilities,
  isReply = false,
}: {
  comment: PublicComment;
  mangaId: string;
  imageIndex?: number | null;
  onRefresh: () => void;
  capability?: Capability;
  capabilities: Record<string, Capability>;
  isReply?: boolean;
}) {
  const { data: session } = useSession();
  const [extraReplies, setExtraReplies] = useState<PublicComment[]>([]);
  const [replyCursor, setReplyCursor] = useState<string | null>(
    comment.repliesNextCursor || null,
  );
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [extraCapabilities, setExtraCapabilities] = useState<
    Record<string, Capability>
  >({});
  useEffect(() => {
    setExtraReplies([]);
    setReplyCursor(comment.repliesNextCursor || null);
  }, [comment.repliesNextCursor, comment.replies]);
  const loadReplies = async () => {
    if (!replyCursor || replyLoading) return;
    setReplyLoading(true);
    setReplyError("");
    try {
      const data = await commentRequest<{
        comments: PublicComment[];
        nextCursor: string | null;
      }>(
        `/api/comments/${comment.id}/replies?cursor=${encodeURIComponent(replyCursor)}`,
      );
      const ids = data.comments.map((reply) => reply.id).join(",");
      const personal = await commentRequest<{
        capabilities: Record<string, Capability>;
      }>(`/api/comments/me?ids=${encodeURIComponent(ids)}`);
      setExtraReplies((previous) => [
        ...previous,
        ...data.comments.filter(
          (reply) => !previous.some((existing) => existing.id === reply.id),
        ),
      ]);
      setExtraCapabilities((previous) => ({
        ...previous,
        ...personal.capabilities,
      }));
      setReplyCursor(data.nextCursor);
    } catch (cause) {
      setReplyError(cause instanceof Error ? cause.message : "โหลดคำตอบไม่ได้");
    } finally {
      setReplyLoading(false);
    }
  };
  const childCapabilities = { ...capabilities, ...extraCapabilities };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [reply, setReply] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [reportActor, setReportActor] = useState<CommentActor | null>(null);
  const [reportSiteKey, setReportSiteKey] = useState<string | null>(null);
  const [reportToken, setReportToken] = useState<string | null>(null);
  useEffect(() => {
    if (!report && !editing) return;
    commentRequest<{
      actor: CommentActor | null;
      turnstileSiteKey: string | null;
    }>("/api/comments/identity")
      .then((data) => {
        setReportActor(data.actor);
        setReportSiteKey(data.turnstileSiteKey);
      })
      .catch(() => setError("ตรวจตัวตนรายงานไม่ได้ กรุณาลองใหม่"));
  }, [report, editing]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const author = comment.author || {
    kind: "member",
    name: comment.user?.name,
    username: comment.user?.username,
    image: comment.user?.image,
  };
  const isDeleted = comment.status === "deleted";
  const mutate = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    setError("");
    try {
      if (method === "PATCH" && reportActor?.requiresVerification) {
        if (!reportToken)
          throw new Error("กรุณายืนยันก่อนบันทึก ข้อความที่แก้ยังอยู่");
        const identity = await commentRequest<{ actor: CommentActor }>(
          "/api/comments/identity",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeToken: reportToken }),
          },
        );
        setReportActor(identity.actor);
        setReportToken(null);
      }
      await commentRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      setEditing(false);
      setConfirmDelete(false);
      onRefresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ทำรายการไม่ได้");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        mb: 2,
        ml: isReply ? { xs: 1, sm: 4 } : 0,
      }}
    >
      <Avatar
        src={author.image || undefined}
        alt=""
        sx={{ width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}
      >
        {author.name?.[0] || "G"}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            minHeight: 28,
          }}
        >
          {author.kind === "member" && author.username ? (
            <Typography
              component={Link}
              href={`/profile/${encodeURIComponent(author.username)}`}
              variant="subtitle2"
              sx={{ color: maggaColors.textPrimary }}
            >
              {author.name}
            </Typography>
          ) : (
            <Typography
              variant="subtitle2"
              sx={{ color: maggaColors.textPrimary }}
            >
              {author.name || "ผู้เยี่ยมชม"}
            </Typography>
          )}
          {author.kind === "guest" && (
            <Typography
              variant="caption"
              sx={{ color: maggaColors.textSecondary }}
            >
              ผู้เยี่ยมชม #{author.publicCode}
            </Typography>
          )}
          <Typography
            component="time"
            dateTime={comment.createdAt}
            variant="caption"
            sx={{ color: maggaColors.textSecondary }}
          >
            {new Date(comment.createdAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Typography>
        </Box>
        {editing ? (
          <Box sx={{ mt: 1 }}>
            <TextField
              label="แก้ไขความคิดเห็น"
              fullWidth
              multiline
              value={draft}
              disabled={busy}
              onChange={(event) => setDraft(event.target.value)}
              helperText={`${draft.length}/500`}
            />
            {reportActor?.requiresVerification && (
              <GuestVerification
                siteKey={reportSiteKey}
                onToken={setReportToken}
              />
            )}
            <Button
              disabled={
                busy ||
                draft.length > 500 ||
                (!draft.trim() && !comment.imageUrl)
              }
              onClick={() =>
                void mutate(`/api/comments/${comment.id}`, "PATCH", {
                  content: draft,
                })
              }
              sx={{ minHeight: 44 }}
            >
              บันทึก
            </Button>
            <Button
              disabled={busy}
              onClick={() => setEditing(false)}
              sx={{ minHeight: 44 }}
            >
              ยกเลิก
            </Button>
          </Box>
        ) : (
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              color: maggaColors.textPrimary,
              lineHeight: 1.6,
            }}
          >
            {isDeleted ? "ความคิดเห็นนี้ถูกลบแล้ว" : comment.content}
          </Typography>
        )}
        {!isDeleted && comment.imageUrl && (
          <Box
            component="button"
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="ขยายรูปแนบ"
            sx={{
              border: 0,
              p: 0,
              background: "transparent",
              display: "block",
              maxWidth: "100%",
              mt: 1,
            }}
          >
            <Box
              component="img"
              loading="lazy"
              src={comment.imageUrl}
              alt="รูปแนบความคิดเห็น"
              sx={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain" }}
            />
          </Box>
        )}
        {!isDeleted && (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <IconButton
              aria-label={session ? "ถูกใจ" : "เข้าสู่ระบบเพื่อโหวต"}
              disabled={!session || busy}
              onClick={() =>
                void mutate(`/api/comments/${comment.id}/vote`, "POST", {
                  value: 1,
                })
              }
              sx={{
                width: 44,
                height: 44,
                color:
                  capability?.userVote === 1
                    ? maggaColors.archiveGold
                    : maggaColors.textSecondary,
              }}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="caption"
              sx={{ minWidth: 20, textAlign: "center" }}
            >
              {comment.voteScore}
            </Typography>
            <IconButton
              aria-label={session ? "ไม่ถูกใจ" : "เข้าสู่ระบบเพื่อโหวต"}
              disabled={!session || busy}
              onClick={() =>
                void mutate(`/api/comments/${comment.id}/vote`, "POST", {
                  value: -1,
                })
              }
              sx={{
                width: 44,
                height: 44,
                color:
                  capability?.userVote === -1
                    ? maggaColors.archiveGold
                    : maggaColors.textSecondary,
              }}
            >
              <ThumbDownIcon fontSize="small" />
            </IconButton>
            {!isReply && (
              <Button onClick={() => setReply(!reply)} sx={{ minHeight: 44 }}>
                ตอบกลับ
              </Button>
            )}
            {capability?.canEdit && (
              <Button
                disabled={busy}
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(true);
                }}
                sx={{ minHeight: 44 }}
              >
                แก้ไข
              </Button>
            )}
            {capability?.canDelete && (
              <Button
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
                sx={{ minHeight: 44 }}
              >
                ลบ
              </Button>
            )}
            <Button
              disabled={busy}
              onClick={() => setReport(!report)}
              sx={{ minHeight: 44, color: maggaColors.textSecondary }}
            >
              รายงาน
            </Button>
          </Box>
        )}
        {confirmDelete && (
          <Alert severity="warning" sx={{ my: 1 }}>
            ลบความคิดเห็นนี้ถาวรหรือไม่? ข้อความและรูปแนบจะถูกลบทันที
            และกู้คืนไม่ได้ การตอบกลับจะยังอยู่
            <Button
              color="error"
              disabled={busy}
              onClick={() =>
                void mutate(`/api/comments/${comment.id}`, "DELETE")
              }
            >
              ยืนยันลบ
            </Button>
            <Button disabled={busy} onClick={() => setConfirmDelete(false)}>
              ยกเลิก
            </Button>
          </Alert>
        )}
        {report && (
          <Box sx={{ my: 1 }}>
            <TextField
              select
              label="เหตุผลที่รายงาน"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              fullWidth
              size="small"
            >
              {[
                ["spam", "สแปม"],
                ["abuse", "คุกคามหรือไม่เหมาะสม"],
                ["image", "รูปภาพมีปัญหา"],
                ["other", "อื่น ๆ"],
              ].map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="รายละเอียด (ไม่จำเป็น)"
              fullWidth
              multiline
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 500 } }}
              sx={{ mt: 1 }}
            />
            {(!reportActor || reportActor.requiresVerification) && (
              <GuestVerification
                siteKey={reportSiteKey}
                onToken={setReportToken}
              />
            )}
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  if (!reportActor || reportActor.requiresVerification) {
                    if (!reportToken)
                      throw new Error("กรุณายืนยันก่อนส่งรายงานครั้งแรก");
                    const identity = await commentRequest<{
                      actor: CommentActor;
                    }>("/api/comments/identity", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ challengeToken: reportToken }),
                    });
                    setReportActor(identity.actor);
                    setReportToken(null);
                  }
                  await commentRequest(`/api/comments/${comment.id}/report`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason, details }),
                  });
                  setReport(false);
                  setNotice("ส่งรายงานแล้ว");
                } catch (cause) {
                  setError(
                    cause instanceof Error ? cause.message : "รายงานไม่ได้",
                  );
                  try {
                    const identity = await commentRequest<{
                      actor: CommentActor | null;
                      turnstileSiteKey: string | null;
                    }>("/api/comments/identity");
                    setReportActor(identity.actor);
                    setReportSiteKey(identity.turnstileSiteKey);
                  } catch {
                    /* Preserve the report draft and original error. */
                  }
                } finally {
                  setBusy(false);
                }
              }}
              sx={{ minHeight: 44 }}
            >
              ส่งรายงาน
            </Button>
            <Button onClick={() => setReport(false)}>ยกเลิก</Button>
          </Box>
        )}
        {session && comment.user?.id && comment.user.id !== session.user.id && (
          <Button
            disabled={busy}
            sx={{ minHeight: 44, color: maggaColors.textSecondary }}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await commentRequest("/api/user/blocked-users", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ blockedUserId: comment.user?.id }),
                });
                setNotice("บล็อกผู้ใช้นี้แล้ว");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "บล็อกไม่ได้",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            บล็อกผู้ใช้
          </Button>
        )}
        <Box aria-live="polite">
          {error && <Alert severity="error">{error}</Alert>}
          {notice && <Typography color="success.main">{notice}</Typography>}
        </Box>
        <Collapse in={reply}>
          <Box sx={{ mt: 2 }}>
            <CommentBox
              mangaId={mangaId}
              imageIndex={imageIndex}
              parentId={comment.id}
              placeholder="ตอบกลับ..."
              onCommentCreated={() => {
                setReply(false);
                onRefresh();
              }}
            />
          </Box>
        </Collapse>
        {[
          ...(comment.replies || []),
          ...extraReplies.filter(
            (item) =>
              !(comment.replies || []).some((reply) => reply.id === item.id),
          ),
        ].map((child) => (
          <CommentItem
            key={child.id}
            comment={child}
            mangaId={mangaId}
            imageIndex={imageIndex}
            onRefresh={onRefresh}
            capabilities={childCapabilities}
            capability={childCapabilities[child.id]}
            isReply
          />
        ))}
        {replyError && <Alert severity="error">{replyError}</Alert>}
        {replyCursor && (
          <Button
            disabled={replyLoading}
            onClick={() => void loadReplies()}
            sx={{ minHeight: 44 }}
          >
            {replyLoading
              ? "กำลังโหลดคำตอบ..."
              : replyError
                ? "ลองโหลดคำตอบอีกครั้ง"
                : "โหลดคำตอบเพิ่มเติม"}
          </Button>
        )}
        <Dialog
          open={lightbox}
          onClose={() => setLightbox(false)}
          maxWidth="lg"
        >
          <DialogContent sx={{ bgcolor: maggaColors.background }}>
            <IconButton
              aria-label="ปิดรูป"
              onClick={() => setLightbox(false)}
              sx={{ width: 44, height: 44 }}
            >
              <CloseIcon />
            </IconButton>
            {comment.imageUrl && (
              <Box
                component="img"
                src={comment.imageUrl}
                alt="รูปแนบความคิดเห็นขนาดใหญ่"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}
export default function CommentList({
  comments,
  mangaId,
  imageIndex,
  onRefresh,
}: {
  comments: PublicComment[];
  mangaId: string;
  imageIndex?: number | null;
  onRefresh: () => void;
}) {
  const { data: session } = useSession();
  const [capabilities, setCapabilities] = useState<Record<string, Capability>>(
    {},
  );
  const [personalComments, setPersonalComments] = useState<PublicComment[]>([]);
  const [error, setError] = useState("");
  const ids = comments
    .flatMap((comment) => [
      comment.id,
      ...(comment.replies || []).map((reply) => reply.id),
    ])
    .join(",");
  const load = useCallback(async () => {
    try {
      type PersonalComments = {
        capabilities: Record<string, Capability>;
        comments: PublicComment[];
      };
      const publicIds = ids ? ids.split(",") : [];
      const firstIds = publicIds.slice(0, 100);
      const data = await commentRequest<PersonalComments>(
        `/api/comments/me?ids=${encodeURIComponent(firstIds.join(","))}&mangaId=${encodeURIComponent(mangaId)}${imageIndex != null ? `&imageIndex=${imageIndex}` : ""}`,
      );
      const nextCapabilities = { ...data.capabilities };
      const remainingIds = [
        ...publicIds.slice(100),
        ...(data.comments || [])
          .map((comment) => comment.id)
          .filter((id) => !firstIds.includes(id)),
      ];
      for (let index = 0; index < remainingIds.length; index += 100) {
        const extra = await commentRequest<PersonalComments>(
          `/api/comments/me?ids=${encodeURIComponent(remainingIds.slice(index, index + 100).join(","))}`,
        );
        Object.assign(nextCapabilities, extra.capabilities);
      }
      setCapabilities(nextCapabilities);
      setPersonalComments(data.comments || []);
      setError("");
    } catch {
      setCapabilities({});
      setError("ตรวจสิทธิ์จัดการความคิดเห็นไม่ได้");
    }
  }, [ids, mangaId, imageIndex]);
  useEffect(() => {
    void load();
    window.addEventListener("magga-comment-identity", load);
    return () => window.removeEventListener("magga-comment-identity", load);
  }, [load, session?.user?.id]);
  const ownRoots = personalComments.filter(
    (item) =>
      !item.parentId && !comments.some((comment) => comment.id === item.id),
  );
  const all = [...ownRoots, ...comments].map((comment) => ({
    ...comment,
    replies: [
      ...(comment.replies || []),
      ...personalComments.filter(
        (item) =>
          item.parentId === comment.id &&
          !(comment.replies || []).some((reply) => reply.id === item.id),
      ),
    ],
  }));
  return (
    <Box>
      {error && (
        <Alert
          severity="warning"
          action={<Button onClick={() => void load()}>ลองใหม่</Button>}
        >
          {error}
        </Alert>
      )}
      {all.length === 0 && (
        <Typography
          sx={{ py: 4, textAlign: "center", color: maggaColors.textSecondary }}
        >
          ยังไม่มีความคิดเห็น ร่วมเริ่มบทสนทนาได้เลย
        </Typography>
      )}
      {all.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          mangaId={mangaId}
          imageIndex={imageIndex}
          onRefresh={onRefresh}
          capabilities={capabilities}
          capability={capabilities[comment.id]}
        />
      ))}
    </Box>
  );
}
