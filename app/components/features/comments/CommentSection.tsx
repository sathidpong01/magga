"use client";

import { useState, useCallback, useEffect } from "react";
import { Box, Typography, Divider, CircularProgress } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";

interface CommentSectionProps {
  mangaId: string;
  imageIndex?: number | null;
  title?: string;
}

export default function CommentSection({
  mangaId,
  imageIndex = null,
  title = "ความคิดเห็น",
}: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ mangaId });
      if (imageIndex !== null) {
        params.append("imageIndex", String(imageIndex));
      }

      const res = await fetch(`/api/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mangaId, imageIndex]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <Box>
      {/* Header - seamless, no box */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <ChatBubbleOutlineIcon sx={{ color: "text.secondary" }} />
        <Typography variant="h5" fontWeight={600} sx={{ color: "white" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({comments.length})
        </Typography>
      </Box>

      {/* Comment Input */}
      <CommentBox mangaId={mangaId} imageIndex={imageIndex} onCommentCreated={fetchComments} />

      <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

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
  );
}
