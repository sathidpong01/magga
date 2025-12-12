"use client";

import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import Image from "next/image";
import { Box, Typography, Divider, CircularProgress } from "@mui/material";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";
import ReadingProgress from "@/app/components/ui/ReadingProgress";

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  pages: string[];
}

interface CommentsCache {
  [imageIndex: number]: {
    comments: any[];
    lastFetched: number;
  };
}

export default function MangaReader({ mangaId, mangaTitle, pages }: MangaReaderProps) {
  const commentsCacheRef = useRef<CommentsCache>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const CACHE_DURATION = 5 * 60 * 1000;

  // Track current page with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setCurrentPage(index);
            }
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [pages.length]);

  const fetchComments = useCallback(async (imageIndex: number, forceRefresh = false): Promise<any[]> => {
    const cached = commentsCacheRef.current[imageIndex];
    if (cached && !forceRefresh && Date.now() - cached.lastFetched < CACHE_DURATION) {
      return cached.comments;
    }

    setLoadingPages(prev => new Set(prev).add(imageIndex));

    try {
      const params = new URLSearchParams({
        mangaId,
        imageIndex: String(imageIndex),
      });

      const res = await fetch(`/api/comments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const comments = data.comments || [];

      commentsCacheRef.current[imageIndex] = { comments, lastFetched: Date.now() };
      setRefreshKey(k => k + 1);

      return comments;
    } catch (error) {
      console.error("Error fetching comments:", error);
      return cached?.comments || [];
    } finally {
      setLoadingPages(prev => {
        const next = new Set(prev);
        next.delete(imageIndex);
        return next;
      });
    }
  }, [mangaId]);

  const handleCommentCreated = useCallback((imageIndex: number) => {
    delete commentsCacheRef.current[imageIndex];
    fetchComments(imageIndex, true);
  }, [fetchComments]);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Reading Progress Indicator */}
      <ReadingProgress currentPage={currentPage} totalPages={pages.length} />

      <Box sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        gap: 0,
        mr: { xs: 0, md: "340px" }
      }}>
        {pages.map((pageUrl, index) => (
          <LazyPageWithComments
            key={index}
            ref={(el: HTMLDivElement | null) => { pageRefs.current[index] = el; }}
            refreshKey={refreshKey}
            mangaId={mangaId}
            mangaTitle={mangaTitle}
            pageUrl={pageUrl}
            imageIndex={index}
            totalPages={pages.length}
            getCachedComments={() => commentsCacheRef.current[index]?.comments}
            isLoading={loadingPages.has(index)}
            onFetchComments={() => fetchComments(index)}
            onCommentCreated={() => handleCommentCreated(index)}
          />
        ))}
      </Box>
    </Box>
  );
}

interface LazyPageProps {
  mangaId: string;
  mangaTitle: string;
  pageUrl: string;
  imageIndex: number;
  totalPages: number;
  refreshKey: number;
  getCachedComments: () => any[] | undefined;
  isLoading: boolean;
  onFetchComments: () => Promise<any[]>;
  onCommentCreated: () => void;
}

const LazyPageWithComments = forwardRef<HTMLDivElement, LazyPageProps>(function LazyPageWithComments({
  mangaId,
  mangaTitle,
  pageUrl,
  imageIndex,
  totalPages,
  refreshKey,
  getCachedComments,
  isLoading,
  onFetchComments,
  onCommentCreated,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const hasFetchedRef = useRef(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Lazy load: ตรวจจับเมื่อรูปเข้าสู่ viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        rootMargin: "200px", // โหลดล่วงหน้า 200px ก่อนเข้าจอ
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch comments เมื่อ visible และยังไม่เคย fetch
  useEffect(() => {
    if (isVisible && !hasFetchedRef.current) {
      const cached = getCachedComments();
      if (cached) {
        setComments(cached);
        hasFetchedRef.current = true;
      } else {
        hasFetchedRef.current = true;
        onFetchComments().then(setComments);
      }
    }
  }, [isVisible, getCachedComments, onFetchComments]);

  // Update from cache when refreshKey changes
  useEffect(() => {
    const cached = getCachedComments();
    if (cached) {
      setComments(cached);
    }
  }, [refreshKey, getCachedComments]);

  const handleCommentCreated = useCallback(() => {
    onCommentCreated();
    onFetchComments().then(setComments);
  }, [onCommentCreated, onFetchComments]);

  const pageLabel = `หน้า ${imageIndex + 1}/${totalPages}`;
  const commentCount = comments.length;

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "1000px",
        lineHeight: 0,
      }}
    >
      {/* Image with Skeleton Loading */}
      <Box sx={{ position: "relative", minHeight: imageLoading ? 600 : "auto" }}>
        {/* Skeleton Placeholder */}
        {imageLoading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255, 255, 255, 0.03)",
              borderRadius: "4px",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
                animation: "shimmer 1.5s infinite",
              },
              "@keyframes shimmer": {
                "0%": { transform: "translateX(-100%)" },
                "100%": { transform: "translateX(100%)" },
              },
            }}
          />
        )}
        <Image
          src={pageUrl}
          alt={`Page ${imageIndex + 1} of ${mangaTitle}`}
          width={0}
          height={0}
          sizes="100vw"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "4px",
            opacity: imageLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out",
          }}
          priority={imageIndex < 2}
          loading={imageIndex < 2 ? "eager" : "lazy"}
          onLoad={() => setImageLoading(false)}
        />
      </Box>

      {/* Desktop: Comment Panel - โหลดเฉพาะเมื่อ visible */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          top: 0,
          left: "100%",
          width: "calc(50vw - 500px + 340px)",
          height: "100%",
          pointerEvents: "none", // Outer container doesn't block clicks
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 80,
            width: 320,
            maxHeight: "calc(100vh - 100px)",
            display: "flex",
            flexDirection: "column",
            marginLeft: "auto",
            marginRight: 10,
            pointerEvents: "auto", // Inner panel is interactive
            bgcolor: "rgba(10, 10, 10, 0.85)",
            backdropFilter: "blur(8px)",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            zIndex: 100,
          }}
        >
          <Box sx={{ p: 1.5, flexShrink: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: "white" }}>
              {pageLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isVisible ? `${commentCount} ความคิดเห็น` : "กำลังโหลด..."}
            </Typography>
          </Box>

          {isVisible ? (
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                px: 1.5,
                pb: 2,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
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
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4, px: 1.5 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});

