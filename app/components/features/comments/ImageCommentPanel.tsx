"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  IconButton,
  Badge,
  Drawer,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";

interface ImageCommentPanelProps {
  mangaId: string;
  imageIndex: number;
  totalPages: number;
  cachedComments?: any[] | null;
  onCommentsLoaded?: (comments: any[]) => void;
  onCommentCreated?: () => void;
}

export default function ImageCommentPanel({ 
  mangaId, 
  imageIndex, 
  totalPages,
  cachedComments,
  onCommentsLoaded,
  onCommentCreated,
}: ImageCommentPanelProps) {
  const [comments, setComments] = useState<any[]>(cachedComments || []);
  const [isLoading, setIsLoading] = useState(!cachedComments);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchComments = useCallback(async (forceRefresh = false) => {
    // ใช้ cache ถ้ามี และไม่ได้ force refresh
    if (cachedComments && !forceRefresh) {
      setComments(cachedComments);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        mangaId,
        imageIndex: String(imageIndex),
      });

      const res = await fetch(`/api/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const fetchedComments = data.comments || [];
      setComments(fetchedComments);
      onCommentsLoaded?.(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mangaId, imageIndex, cachedComments, onCommentsLoaded]);

  // Fetch when imageIndex changes (if no cache)
  useEffect(() => {
    if (cachedComments) {
      setComments(cachedComments);
      setIsLoading(false);
    } else {
      fetchComments();
    }
  }, [imageIndex, cachedComments, fetchComments]);

  const handleCommentCreated = useCallback(() => {
    onCommentCreated?.();
    fetchComments(true); // Force refresh after creating comment
  }, [fetchComments, onCommentCreated]);

  const commentCount = comments.length;
  const pageLabel = `หน้า ${imageIndex + 1}/${totalPages}`;

  return (
    <>
      {/* Desktop: Side Panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          position: "fixed",
          right: 0,
          top: 64,
          width: 320,
          height: "calc(100vh - 64px)",
          bgcolor: "transparent",
          color: "white",
          zIndex: 10,
        }}
      >
        {/* Header */}
        <Box sx={{ p: 1.5, flexShrink: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: "white" }}>
            {pageLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {commentCount} ความคิดเห็น
          </Typography>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 1.5,
            pb: 2,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
          }}
        >
          <CommentBox
            mangaId={mangaId}
            imageIndex={imageIndex}
            onCommentCreated={handleCommentCreated}
            placeholder="แสดงความคิดเห็น..."
          />

          {commentCount > 0 && (
            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />
          )}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <CommentList
              comments={comments}
              mangaId={mangaId}
              imageIndex={imageIndex}
              onRefresh={handleCommentCreated}
            />
          )}
        </Box>
      </Box>

      {/* Mobile: Floating Button + Drawer */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <IconButton
          onClick={() => {
            setIsMobileOpen(true);
            if (!cachedComments) fetchComments();
          }}
          sx={{
            position: "absolute",
            bottom: 12,
            right: 12,
            bgcolor: "rgba(0,0,0,0.75)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 0.5,
            "&:hover": { bgcolor: "rgba(0,0,0,0.9)" },
          }}
        >
          <Badge
            badgeContent={commentCount}
            color="primary"
            max={99}
            sx={{ "& .MuiBadge-badge": { bgcolor: "#38bdf8" } }}
          >
            <ChatBubbleOutlineIcon fontSize="small" />
          </Badge>
        </IconButton>

        <Drawer
          anchor="right"
          open={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: 380,
              bgcolor: "#0f0f0f",
              color: "white",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>ความคิดเห็น</Typography>
              <Typography variant="body2" color="text.secondary">
                {pageLabel} • {commentCount} ความคิดเห็น
              </Typography>
            </Box>
            <IconButton onClick={() => setIsMobileOpen(false)} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, overflowY: "auto", flex: 1 }}>
            <CommentBox mangaId={mangaId} imageIndex={imageIndex} onCommentCreated={handleCommentCreated} />
            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <CommentList comments={comments} mangaId={mangaId} imageIndex={imageIndex} onRefresh={handleCommentCreated} />
            )}
          </Box>
        </Drawer>
      </Box>
    </>
  );
}
