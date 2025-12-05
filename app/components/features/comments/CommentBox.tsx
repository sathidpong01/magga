"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Avatar,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
  Paper,
  Popover,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import CloseIcon from "@mui/icons-material/Close";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import AuthModal from "@/app/components/features/auth/AuthModal";

interface CommentBoxProps {
  mangaId: string;
  imageIndex?: number | null;
  parentId?: string;
  onCommentCreated?: () => void;
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
}: CommentBoxProps) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("ไฟล์ต้องมีขนาดไม่เกิน 3MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      alert("รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imagePreview]);

  const handleEmojiSelect = useCallback((emoji: { native: string }) => {
    setContent((prev) => prev + emoji.native);
    setEmojiAnchor(null);
    textFieldRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !imageFile) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/comments/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Upload failed");
        }

        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId,
          content: content.trim(),
          imageIndex,
          imageUrl,
          parentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post comment");
      }

      setContent("");
      handleRemoveImage();
      onCommentCreated?.();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  }, [content, imageFile, mangaId, imageIndex, parentId, handleRemoveImage, onCommentCreated, isSubmitting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ลดความโค้งมน: 20% ของเดิม (จาก 2-3 เหลือ ~0.5)
  const borderRadius = 0.5;

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!session) {
    return (
      <>
        <Paper
          onClick={() => setAuthModalOpen(true)}
          sx={{
            p: 2,
            bgcolor: "rgba(255,255,255,0.05)",
            borderRadius: borderRadius,
            textAlign: "center",
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
          }}
        >
          <Typography color="text.secondary">
            กรุณา{" "}
            <Typography
              component="span"
              sx={{ color: "#38bdf8", fontWeight: 500 }}
            >
              เข้าสู่ระบบ
            </Typography>{" "}
            เพื่อแสดงความคิดเห็น
          </Typography>
        </Paper>
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <Avatar
        src={session.user?.image || undefined}
        alt={session.user?.name || "User"}
        sx={{ width: 40, height: 40 }}
      >
        {session.user?.name?.[0]?.toUpperCase() || "U"}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Paper
          sx={{
            bgcolor: "rgba(255,255,255,0.08)",
            borderRadius: borderRadius,
            overflow: "hidden",
          }}
        >
          <TextField
            inputRef={textFieldRef}
            fullWidth
            multiline
            maxRows={6}
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            disabled={isSubmitting}
            sx={{
              "& .MuiOutlinedInput-root": {
                border: "none",
                "& fieldset": { border: "none" },
              },
              "& .MuiInputBase-input": {
                p: 1.5,
                color: "white",
                "&::placeholder": { color: "rgba(255,255,255,0.5)" },
              },
            }}
          />

          {imagePreview && (
            <Box sx={{ position: "relative", mx: 1.5, mb: 1 }}>
              <Box
                component="img"
                src={imagePreview}
                alt="Preview"
                sx={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  borderRadius: borderRadius,
                  objectFit: "contain",
                }}
              />
              <IconButton
                size="small"
                onClick={handleRemoveImage}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: "white",
                  borderRadius: borderRadius,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              py: 0.5,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="แนบรูปภาพ">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  sx={{ color: "#4ade80" }}
                >
                  <ImageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleImageSelect}
              />

              <Tooltip title="เพิ่ม Emoji">
                <IconButton
                  size="small"
                  onClick={(e) => setEmojiAnchor(e.currentTarget)}
                  disabled={isSubmitting}
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  <EmojiEmotionsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Popover
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </Popover>
            </Box>

            <IconButton
              size="small"
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageFile)}
              sx={{
                color: content.trim() || imageFile ? "#38bdf8" : "rgba(255,255,255,0.3)",
                "&:disabled": { color: "rgba(255,255,255,0.2)" },
              }}
            >
              {isSubmitting ? <CircularProgress size={20} /> : <SendIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
