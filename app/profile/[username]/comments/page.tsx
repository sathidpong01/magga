"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Avatar,
  Breadcrumbs,
  CircularProgress,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useParams, useRouter } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface CommentWithManga {
  id: string;
  content: string;
  imageUrl: string | null;
  voteScore: number;
  createdAt: string;
  mangaId: string;
  imageIndex: number | null;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
  } | null;
}

function formatTime(dateStr: string) {
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
}

export default function MyCommentsPage() {
  const { data: session, isPending } = useSession();
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [comments, setComments] = useState<CommentWithManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const isOwnProfile = session?.user?.username === username || session?.user?.name === username;

  const fetchComments = useCallback(async (p: number) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/user/my-comments?page=${p}`);
      if (!res.ok) return;
      const data = await res.json();
      if (p === 1) {
        setComments(data.comments || []);
      } else {
        setComments((prev) => [...prev, ...(data.comments || [])]);
      }
      setHasMore(data.hasMore);
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
      return;
    }
    if (session) {
      if (!isOwnProfile) {
        router.push(`/profile/${username}`);
        return;
      }
      fetchComments(1);
    }
  }, [session, isPending, isOwnProfile]);

  if (isPending || loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#fbbf24" }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* Breadcrumb */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: "#a3a3a3" }} />}
        sx={{ mb: 3 }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", color: "#fbbf24", textDecoration: "none", fontSize: "0.875rem" }}>
          <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
          หน้าแรก
        </Link>
        <Link href={`/profile/${username}`} style={{ color: "#fbbf24", textDecoration: "none", fontSize: "0.875rem" }}>
          ฉัน
        </Link>
        <Typography sx={{ color: "#fafafa", fontSize: "0.875rem" }}>ความคิดเห็น</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <ChatBubbleOutlineIcon sx={{ color: "#fbbf24", fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>ความคิดเห็นของฉัน</Typography>
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>{comments.length} ความคิดเห็น{hasMore ? "+" : ""}</Typography>
        </Box>
      </Box>

      {comments.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <ChatBubbleOutlineIcon sx={{ color: "#404040", fontSize: 48, mb: 2 }} />
          <Typography sx={{ color: "#a3a3a3" }}>ยังไม่มีความคิดเห็น</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {comments.map((comment) => (
            <Box
              key={comment.id}
              component={Link}
              href={comment.manga ? `/${comment.manga.slug}` : "/"}
              sx={{
                display: "flex",
                gap: 2,
                p: 2,
                bgcolor: "#171717",
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.08)",
                textDecoration: "none",
                color: "inherit",
                "&:hover": { borderColor: "rgba(251,191,36,0.3)", bgcolor: "#1e1e1e" },
                transition: "border-color 0.2s, background-color 0.2s",
              }}
            >
              {/* Manga cover */}
              {comment.manga && (
                <Box sx={{ width: 48, height: 68, flexShrink: 0, borderRadius: 1, overflow: "hidden", position: "relative" }}>
                  <Image
                    src={comment.manga.coverImage}
                    alt={comment.manga.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="48px"
                  />
                </Box>
              )}

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {comment.manga && (
                  <Typography variant="caption" sx={{ color: "#5eead4", display: "block", mb: 0.25 }}>
                    {comment.manga.title}
                    {comment.imageIndex !== null && ` • หน้า ${comment.imageIndex + 1}`}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                    mb: 1,
                  }}
                >
                  {comment.content}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "#737373" }}>
                    {formatTime(comment.createdAt)}
                  </Typography>
                  {comment.voteScore !== 0 && (
                    <Chip
                      label={`${comment.voteScore > 0 ? "+" : ""}${comment.voteScore}`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        bgcolor: comment.voteScore > 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
                        color: comment.voteScore > 0 ? "#4ade80" : "#f87171",
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => fetchComments(page + 1)}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
            sx={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", "&:hover": { borderColor: "rgba(255,255,255,0.4)" } }}
          >
            {loadingMore ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
          </Button>
        </Box>
      )}
    </Container>
  );
}
