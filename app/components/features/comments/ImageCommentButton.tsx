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

interface ImageCommentButtonProps {
  mangaId: string;
  imageIndex: number;
  pageLabel?: string;
}

export default function ImageCommentButton({ mangaId, imageIndex, pageLabel }: ImageCommentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        mangaId,
        imageIndex: String(imageIndex),
      });

      const res = await fetch(`/api/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setComments(data.comments || []);
      setCommentCount(data.comments?.length || 0);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mangaId, imageIndex]);

  // Fetch count on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const params = new URLSearchParams({
          mangaId,
          imageIndex: String(imageIndex),
        });

        const res = await fetch(`/api/comments?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCommentCount(data.comments?.length || 0);
        }
      } catch {
        // Silent fail for count
      }
    };

    fetchCount();
  }, [mangaId, imageIndex]);

  const handleOpen = () => {
    setIsOpen(true);
    fetchComments();
  };

  return (
    <>
      {/* Floating Button */}
      <IconButton
        onClick={handleOpen}
        sx={{
          position: "absolute",
          bottom: 16,
          right: 16,
          bgcolor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          "&:hover": {
            bgcolor: "rgba(0,0,0,0.85)",
            transform: "scale(1.05)",
          },
          transition: "all 0.2s ease",
        }}
      >
        <Badge
          badgeContent={commentCount}
          color="primary"
          max={99}
          sx={{
            "& .MuiBadge-badge": {
              bgcolor: "#38bdf8",
              color: "white",
            },
          }}
        >
          <ChatBubbleOutlineIcon />
        </Badge>
      </IconButton>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            bgcolor: "#0f0f0f",
            color: "white",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              ความคิดเห็น
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pageLabel || `หน้า ${imageIndex + 1}`} • {commentCount} ความคิดเห็น
            </Typography>
          </Box>
          <IconButton onClick={() => setIsOpen(false)} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2, overflowY: "auto", flex: 1 }}>
          {/* Comment Input */}
          <CommentBox mangaId={mangaId} imageIndex={imageIndex} onCommentCreated={fetchComments} />

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* Comments List */}
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <CommentList
              comments={comments}
              mangaId={mangaId}
              imageIndex={imageIndex}
              onRefresh={fetchComments}
            />
          )}
        </Box>
      </Drawer>
    </>
  );
}
