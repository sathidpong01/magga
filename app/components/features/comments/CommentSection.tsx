"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Button,
  Alert,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CommentBox from "./CommentBox";
import CommentList, { type PublicComment } from "./CommentList";

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
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [failedCursor, setFailedCursor] = useState<string | undefined>();

  const fetchComments = useCallback(
    async (cursor?: string) => {
      setLoadError("");
      try {
        const loadingMore = !!cursor;
        if (loadingMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const params = new URLSearchParams({ mangaId });
        if (imageIndex !== null) {
          params.append("imageIndex", String(imageIndex));
        }
        if (cursor) {
          params.append("cursor", cursor);
        }

        const res = await fetch(`/api/comments?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();

        if (loadingMore) {
          // Append to existing comments
          setComments((prev) => [...prev, ...(data.comments || [])]);
        } else {
          // Replace comments
          setComments(data.comments || []);
        }
        setNextCursor(data.nextCursor || null);

        // Update total count (initial load only)
        if (!loadingMore) {
          setTotalCount(data.comments?.length || 0);
        } else {
          setTotalCount((prev) => prev + (data.comments?.length || 0));
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        setFailedCursor(cursor);
        setLoadError("โหลดความคิดเห็นไม่ได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [mangaId, imageIndex],
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchComments(nextCursor);
    }
  };

  const handleRefresh = () => {
    // Reset and reload from beginning
    setNextCursor(null);
    fetchComments();
  };

  return (
    <Box>
      {/* Header - seamless, no box */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <ChatBubbleOutlineIcon sx={{ color: "text.secondary" }} />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: "white",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          ({totalCount}
          {nextCursor ? "+" : ""})
        </Typography>
      </Box>

      {/* Comment Input */}
      <CommentBox
        mangaId={mangaId}
        imageIndex={imageIndex}
        onCommentCreated={(comment) => {
          if (comment)
            setComments((previous) => [
              comment,
              ...previous.filter((item) => item.id !== comment.id),
            ]);
          handleRefresh();
        }}
      />

      <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              disabled={isLoading || isLoadingMore}
              onClick={() => fetchComments(failedCursor)}
            >
              ลองใหม่
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {/* Comments List */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} aria-label="กำลังโหลดความคิดเห็น" />
        </Box>
      ) : (
        <>
          {(!loadError || comments.length > 0) && (
            <CommentList
              comments={comments}
              mangaId={mangaId}
              imageIndex={imageIndex}
              onRefresh={handleRefresh}
            />
          )}

          {/* Load More Button */}
          {nextCursor && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
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
        </>
      )}
    </Box>
  );
}
