"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";

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

interface CommentInteractionsProps {
  mangaId: string;
  imageIndex?: number | null;
  initialComments: Comment[];
  initialTotal: number;
  initialHasMore: boolean;
  title?: string;
  currentUserId?: string;
}

/**
 * Client Component for Comment Interactions
 * Handles interactive features: vote, reply, edit, delete, load more
 * Receives initial data from ServerCommentSection (no loading spinner on first load!)
 */
export default function CommentInteractions({
  mangaId,
  imageIndex = null,
  initialComments,
  initialTotal,
  initialHasMore,
  title = "ความคิดเห็น",
}: CommentInteractionsProps) {
  // Start with server-fetched data - no loading spinner needed!
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialComments.length > 0
      ? initialComments[initialComments.length - 1].id
      : null
  );

  const fetchMoreComments = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({ mangaId });
      if (imageIndex !== null) {
        params.append("imageIndex", String(imageIndex));
      }
      params.append("cursor", nextCursor);

      const res = await fetch(`/api/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      // Append new comments
      setComments((prev) => [...prev, ...(data.comments || [])]);
      setNextCursor(data.nextCursor || null);
      setHasMore(!!data.nextCursor);
      setTotalCount((prev) => prev + (data.comments?.length || 0));
    } catch (error) {
      console.error("Error fetching more comments:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [mangaId, imageIndex, nextCursor, isLoadingMore]);

  const handleRefresh = useCallback(async () => {
    // Refetch from beginning
    try {
      const params = new URLSearchParams({ mangaId });
      if (imageIndex !== null) {
        params.append("imageIndex", String(imageIndex));
      }

      const res = await fetch(`/api/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setComments(data.comments || []);
      setNextCursor(data.nextCursor || null);
      setHasMore(!!data.nextCursor);
      setTotalCount(data.comments?.length || 0);
    } catch (error) {
      console.error("Error refreshing comments:", error);
    }
  }, [mangaId, imageIndex]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <ChatBubbleOutlineIcon sx={{ color: "text.secondary" }} />
        <Typography variant="h5" fontWeight={600} sx={{ color: "white" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ({totalCount}
          {hasMore ? "+" : ""})
        </Typography>
      </Box>

      {/* Comment Input */}
      <CommentBox
        mangaId={mangaId}
        imageIndex={imageIndex}
        onCommentCreated={handleRefresh}
      />

      <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Comments List - No loading spinner for initial load! */}
      <CommentList
        comments={comments}
        mangaId={mangaId}
        imageIndex={imageIndex}
        onRefresh={handleRefresh}
      />

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="outlined"
            onClick={fetchMoreComments}
            disabled={isLoadingMore}
            startIcon={
              isLoadingMore ? (
                <CircularProgress size={16} />
              ) : (
                <ExpandMoreIcon />
              )
            }
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.4)",
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            {isLoadingMore ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
