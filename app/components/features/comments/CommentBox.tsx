"use client";
import { requestCommentIdentity } from "./identity-request";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Typography,
  Alert,
  Popover,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import dynamic from "next/dynamic";
import { Theme } from "emoji-picker-react";
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });
import CloseIcon from "@mui/icons-material/Close";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import {
  CommentActor,
  commentRequest,
  GuestVerification,
} from "./guest-client";
import { useSession } from "@/lib/auth-client";
import type { PublicComment } from "./CommentList";
interface Props {
  mangaId: string;
  imageIndex?: number | null;
  parentId?: string;
  onCommentCreated?: (comment?: PublicComment) => void;
  placeholder?: string;
  autoFocus?: boolean;
}
export default function CommentBox({
  mangaId,
  imageIndex = null,
  parentId,
  onCommentCreated,
  placeholder = "แสดงความคิดเห็น...",
  autoFocus = false,
}: Props) {
  const { data: session } = useSession();
  const [actor, setActor] = useState<CommentActor | null>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(
    null,
  );
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  const submitting = useRef(false);
  const identityGeneration = useRef(0);
  const loadIdentity = useCallback(async () => {
    const generation = ++identityGeneration.current;
    setIdentityLoaded(false);
    setActor(null);
    try {
      const result = await requestCommentIdentity(session?.user?.id || "guest");
      if (generation !== identityGeneration.current) return;
      setActor(result.actor);
      setSiteKey(result.turnstileSiteKey);
      setIdentityLoaded(true);
      setIdentityError("");
    } catch (cause) {
      if (generation !== identityGeneration.current) return;
      setIdentityError(
        cause instanceof Error ? cause.message : "ตรวจตัวตนไม่ได้",
      );
    }
  }, [session?.user?.id]);
  useEffect(() => {
    const generation = identityGeneration;
    void loadIdentity();
    const refreshIdentity = () => {
      void loadIdentity();
    };
    window.addEventListener("magga-comment-identity", refreshIdentity);
    return () => {
      ++generation.current;
      window.removeEventListener("magga-comment-identity", refreshIdentity);
    };
  }, [loadIdentity, session?.user?.id]);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const submit = async () => {
    if (
      submitting.current ||
      (!content.trim() && !file) ||
      content.length > 500
    )
      return;
    if (!identityLoaded) {
      await loadIdentity();
      return;
    }
    if ((!actor || actor.requiresVerification) && !token) {
      setError("กรุณายืนยันก่อนส่งครั้งแรก ข้อความและรูปของคุณยังอยู่");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!actor || actor.requiresVerification) {
        setPhase("กำลังยืนยัน...");
        const identity = await commentRequest<{ actor: CommentActor }>(
          "/api/comments/identity",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challengeToken: token,
              displayName: name.trim() || undefined,
            }),
          },
        );
        setActor(identity.actor);
        setToken(null);
      }
      let currentAsset = assetId;
      if (file && !currentAsset) {
        setPhase("กำลังอัปโหลดรูป...");
        const form = new FormData();
        form.append("file", file);
        const uploaded = await commentRequest<{ assetId: string }>(
          "/api/comments/upload",
          { method: "POST", body: form },
        );
        currentAsset = uploaded.assetId;
        setAssetId(currentAsset);
      }
      setPhase("กำลังส่ง...");
      const fingerprint = JSON.stringify([
        mangaId,
        imageIndex,
        parentId,
        content.trim(),
        currentAsset,
      ]);
      if (submission.current?.fingerprint !== fingerprint)
        submission.current = { fingerprint, key: crypto.randomUUID() };
      const result = await commentRequest<{ comment: PublicComment }>(
        "/api/comments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mangaId,
            imageIndex,
            parentId,
            content: content.trim(),
            assetId: currentAsset || undefined,
            idempotencyKey: submission.current.key,
          }),
        },
      );
      setContent("");
      setFile(null);
      setAssetId(null);
      submission.current = null;
      if (input.current) input.current.value = "";
      setNotice("เผยแพร่ความคิดเห็นแล้ว");
      onCommentCreated?.(result.comment);
      window.dispatchEvent(new Event("magga-comment-identity"));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "ส่งไม่ได้ กรุณาลองใหม่",
      );
      try {
        const identity = await commentRequest<{
          actor: CommentActor | null;
          turnstileSiteKey: string | null;
        }>("/api/comments/identity");
        setActor(identity.actor);
        setSiteKey(identity.turnstileSiteKey);
      } catch {
        /* Keep the original actionable error and draft. */
      }
    } finally {
      submitting.current = false;
      setBusy(false);
      setPhase("");
    }
  };
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Avatar
        src={actor?.image || undefined}
        sx={{
          display: { xs: "none", sm: "flex" },
          width: 40,
          height: 40,
          bgcolor: maggaColors.surfaceElevated,
        }}
      >
        {actor?.name?.[0] || "G"}
      </Avatar>
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <EmojiPicker
          theme={Theme.DARK}
          width={280}
          height={340}
          onEmojiClick={(data) => {
            setContent((previous) => previous + data.emoji);
            setEmojiAnchor(null);
          }}
        />
      </Popover>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ color: maggaColors.textSecondary, mb: 1 }}
        >
          {actor
            ? `${actor.name}${actor.kind === "guest" ? ` · ผู้เยี่ยมชม #${actor.publicCode || ""}` : ""}`
            : "คอมเมนต์และแนบรูปได้โดยไม่ต้องสมัครสมาชิก"}
        </Typography>
        {!actor && (
          <TextField
            label="ชื่อเล่น (ไม่จำเป็น)"
            size="small"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 40 } }}
            sx={{ mb: 1, width: "100%" }}
          />
        )}
        <Paper
          sx={{
            bgcolor: maggaColors.surface,
            borderRadius: `${maggaRadii.md}px`,
            p: 1.5,
            backgroundImage: "none",
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            label={placeholder}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={busy}
            autoFocus={autoFocus}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.ctrlKey || event.metaKey) &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void submit();
              }
            }}
          />
          {preview && (
            <Box sx={{ position: "relative", mt: 1, minHeight: 120 }}>
              <Box
                component="img"
                src={preview}
                alt="ตัวอย่างรูปแนบ"
                sx={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain" }}
              />
              <IconButton
                aria-label="นำรูปออก"
                disabled={busy}
                onClick={() => {
                  setFile(null);
                  setAssetId(null);
                  if (input.current) input.current.value = "";
                }}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 44,
                  height: 44,
                  bgcolor: maggaColors.surfaceElevated,
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 1,
              flexWrap: "wrap",
            }}
          >
            <input
              ref={input}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const next = event.target.files?.[0];
                if (!next) return;
                if (
                  next.size > 3 * 1024 * 1024 ||
                  ![
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif",
                  ].includes(next.type)
                ) {
                  setError("รองรับ JPEG, PNG, WebP, GIF ไม่เกิน 3 MB");
                  event.target.value = "";
                  return;
                }
                setError("");
                setFile(next);
                setAssetId(null);
              }}
            />
            <IconButton
              aria-label="แนบรูป"
              disabled={busy}
              onClick={() => input.current?.click()}
              sx={{ width: 44, height: 44, color: maggaColors.archiveGold }}
            >
              <ImageIcon />
            </IconButton>
            <IconButton
              aria-label="เลือกอีโมจิ"
              disabled={busy}
              onClick={(event) => setEmojiAnchor(event.currentTarget)}
              sx={{ width: 44, height: 44 }}
            >
              <EmojiEmotionsIcon />
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                color:
                  content.length > 500
                    ? "error.main"
                    : maggaColors.textSecondary,
              }}
            >
              {content.length}/500
            </Typography>
            <Button
              variant="contained"
              disabled={
                busy || (!content.trim() && !file) || content.length > 500
              }
              onClick={() => void submit()}
              sx={{
                ml: "auto",
                minHeight: 44,
                bgcolor: maggaColors.archiveGold,
                "&:hover": { bgcolor: maggaColors.archiveGoldHover },
              }}
            >
              {busy ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  {phase}
                </>
              ) : (
                "ส่งความคิดเห็น"
              )}
            </Button>
          </Box>
          {(!actor || actor.requiresVerification) && (
            <GuestVerification siteKey={siteKey} onToken={setToken} />
          )}
        </Paper>
        {(!actor || actor.kind === "guest") && (
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1, color: maggaColors.textSecondary }}
          >
            จำสิทธิ์ด้วยคุกกี้ในเบราว์เซอร์นี้ ล้างคุกกี้แล้วจะจัดการข้อความเดิมไม่ได้
          </Typography>
        )}
        <Box sx={{ minHeight: 28, mt: 1 }} aria-live="polite">
          {(error || identityError) && (
            <Alert
              severity="error"
              action={
                !identityLoaded ? (
                  <Button onClick={() => void loadIdentity()}>ลองใหม่</Button>
                ) : undefined
              }
            >
              {error || identityError}
            </Alert>
          )}
          {notice && <Typography color="success.main">{notice}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}
