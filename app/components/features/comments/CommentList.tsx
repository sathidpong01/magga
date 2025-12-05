"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  Button,
  Collapse,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplyIcon from "@mui/icons-material/Reply";
import CommentBox from "./CommentBox";

interface CommentUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface CommentVote {
  userId: string;
  value: number;
}

interface Comment {
  id: string;
  content: string;
  imageUrl: string | null;
  voteScore: number;
  createdAt: string;
  user: CommentUser;
  votes: CommentVote[];
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  mangaId: string;
  imageIndex?: number | null;
  onRefresh: () => void;
  isReply?: boolean;
}

function CommentItem({ comment, mangaId, imageIndex, onRefresh, isReply = false }: CommentItemProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);
  const [voteScore, setVoteScore] = useState(comment.voteScore);
  const [userVote, setUserVote] = useState<number | null>(() => {
    if (!session?.user?.id) return null;
    return comment.votes.find((v) => v.userId === session.user.id)?.value ?? null;
  });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = session?.user?.id === comment.user.id;
  const isAdmin = (session?.user as { role?: string })?.role === "admin";

  const handleVote = useCallback(
    async (value: 1 | -1) => {
      if (!session) {
        alert("กรุณาเข้าสู่ระบบก่อนโหวต");
        return;
      }

      try {
        const res = await fetch(`/api/comments/${comment.id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });

        if (!res.ok) throw new Error("Vote failed");

        const data = await res.json();
        setVoteScore(data.voteScore);
        setUserVote(data.userVote);
      } catch {
        console.error("Vote error");
      }
    },
    [comment.id, session]
  );

  const handleEdit = useCallback(async () => {
    if (!editContent.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) throw new Error("Edit failed");

      setIsEditing(false);
      onRefresh();
    } catch {
      alert("แก้ไขไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  }, [comment.id, editContent, onRefresh]);

  const handleDelete = useCallback(async () => {
    if (!confirm("ยืนยันการลบความคิดเห็นนี้?")) return;

    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onRefresh();
    } catch {
      alert("ลบไม่สำเร็จ");
    }

    setMenuAnchor(null);
  }, [comment.id, onRefresh]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 1, pl: isReply ? 5 : 0 }}>
      {/* Avatar */}
      <Avatar
        src={comment.user.image || undefined}
        alt={comment.user.name || "User"}
        sx={{ width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}
      >
        {(comment.user.name || comment.user.username)?.[0]?.toUpperCase() || "U"}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: "white" }}>
            {comment.user.name || comment.user.username || "ผู้ใช้"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatTime(comment.createdAt)}
          </Typography>

          {/* Menu for owner/admin */}
          {(isOwner || isAdmin) && (
            <>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ ml: "auto", color: "text.secondary" }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                {isOwner && (
                  <MenuItem
                    onClick={() => {
                      setIsEditing(true);
                      setMenuAnchor(null);
                    }}
                  >
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> แก้ไข
                  </MenuItem>
                )}
                <MenuItem onClick={handleDelete}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> ลบ
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        {/* Content */}
        {isEditing ? (
          <Box sx={{ mb: 1 }}>
            <TextField
              fullWidth
              multiline
              size="small"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSubmitting}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "white",
                },
              }}
            />
            <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleEdit} disabled={isSubmitting}>
                บันทึก
              </Button>
              <Button size="small" onClick={() => setIsEditing(false)}>
                ยกเลิก
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {comment.content}
            </Typography>

            {/* Image */}
            {comment.imageUrl && (
              <Box
                component="a"
                href={comment.imageUrl}
                target="_blank"
                rel="noopener"
                sx={{ display: "block", mt: 1 }}
              >
                <Box
                  component="img"
                  src={comment.imageUrl}
                  alt="Attached"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 0.5,
                    objectFit: "contain",
                    cursor: "pointer",
                  }}
                />
              </Box>
            )}
          </>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
          {/* Voting */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="ถูกใจ">
              <IconButton
                size="small"
                onClick={() => handleVote(1)}
                sx={{ color: userVote === 1 ? "#38bdf8" : "text.secondary" }}
              >
                <ThumbUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                minWidth: 20,
                textAlign: "center",
                color: voteScore > 0 ? "#4ade80" : voteScore < 0 ? "#f87171" : "text.secondary",
                fontWeight: 600,
              }}
            >
              {voteScore}
            </Typography>
            <Tooltip title="ไม่ถูกใจ">
              <IconButton
                size="small"
                onClick={() => handleVote(-1)}
                sx={{ color: userVote === -1 ? "#f87171" : "text.secondary" }}
              >
                <ThumbDownIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Reply button (only for top-level comments) */}
          {!isReply && session && (
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => setShowReply(!showReply)}
              sx={{ color: "text.secondary", textTransform: "none" }}
            >
              ตอบกลับ
            </Button>
          )}
        </Box>

        {/* Reply Box */}
        <Collapse in={showReply}>
          <Box sx={{ mt: 2 }}>
            <CommentBox
              mangaId={mangaId}
              imageIndex={imageIndex}
              parentId={comment.id}
              placeholder="ตอบกลับ..."
              onCommentCreated={() => {
                setShowReply(false);
                onRefresh();
              }}
            />
          </Box>
        </Collapse>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                mangaId={mangaId}
                imageIndex={imageIndex}
                onRefresh={onRefresh}
                isReply
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface CommentListProps {
  comments: Comment[];
  mangaId: string;
  imageIndex?: number | null;
  onRefresh: () => void;
}

export default function CommentList({ comments, mangaId, imageIndex, onRefresh }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary">ยังไม่มีความคิดเห็น</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          mangaId={mangaId}
          imageIndex={imageIndex}
          onRefresh={onRefresh}
        />
      ))}
    </Box>
  );
}
