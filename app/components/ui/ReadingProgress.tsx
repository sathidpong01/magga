"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, LinearProgress, Button, Portal } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { readingEntries, saveReadingEntry } from "@/lib/reader-storage";
import { maggaColors } from "@/lib/design-tokens";

function getSavedProgress(mangaId: string) {
  try {
    return readingEntries(localStorage)[mangaId] || null;
  } catch {
    return null;
  }
}

interface ReadingProgressProps {
  mangaId: string;
  mangaTitle: string;
  mangaSlug: string;
  remember?: boolean;
  currentPage: number;
  totalPages: number;
  pageRefs?: React.RefObject<(HTMLDivElement | null)[]>;
}

export default function ReadingProgress({
  mangaId,
  mangaTitle,
  mangaSlug,
  remember = true,
  currentPage,
  totalPages,
  pageRefs,
}: ReadingProgressProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [savedPage, setSavedPage] = useState(0);
  const hasScrolledRef = useRef(false);
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  // Check for saved progress on mount
  useEffect(() => {
    if (!remember) return;
    const saved = getSavedProgress(mangaId);
    if (saved && saved.page > 0 && saved.page < totalPages - 1) {
      setSavedPage(saved.page);
      setShowResume(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => setShowResume(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [mangaId, totalPages, remember]);

  // Save progress as user reads
  useEffect(() => {
    if (remember && currentPage > 0) {
      try {
        saveReadingEntry(localStorage, mangaId, {
          page: currentPage,
          totalPages,
          timestamp: Date.now(),
          title: mangaTitle,
          slug: mangaSlug,
        });
        document.documentElement.dataset.maggaResume = Object.values(
          readingEntries(localStorage),
        ).some(
          (entry) =>
            entry.page > 0 && entry.page < entry.totalPages - 1 && entry.slug,
        )
          ? "true"
          : "false";
      } catch {
        /* Optional local history. */
      }
    }
  }, [mangaId, mangaTitle, mangaSlug, currentPage, totalPages, remember]);

  // Scroll visibility
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      hasScrolledRef.current = true;
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 2000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  const handleResume = useCallback(() => {
    setShowResume(false);
    if (pageRefs?.current?.[savedPage]) {
      pageRefs.current[savedPage]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      // Fallback: scroll by estimated position
      const estimatedPosition =
        (savedPage / totalPages) * document.documentElement.scrollHeight;
      window.scrollTo({ top: estimatedPosition, behavior: "smooth" });
    }
  }, [savedPage, totalPages, pageRefs]);

  return (
    <Portal>
      {/* Resume Reading Banner */}
      {showResume && (
        <Box
          sx={{
            position: "fixed",
            bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
            bgcolor: maggaColors.surface,
            backdropFilter: "blur(8px)",
            border: `1px solid ${maggaColors.archiveGoldBorder}`,
            borderRadius: 2,
            px: 2.5,
            py: 1.5,
            width: "max-content",
            maxWidth: "calc(100vw - 24px)",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "nowrap",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            animation: "slideUp 0.3s ease-out",
            "@keyframes slideUp": {
              from: {
                opacity: 0,
                transform: "translateX(-50%) translateY(20px)",
              },
              to: { opacity: 1, transform: "translateX(-50%) translateY(0)" },
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: maggaColors.textSecondary, flex: "1 1 auto", minWidth: 0, overflowWrap: "anywhere" }}
          >
            อ่านค้างไว้หน้า {savedPage + 1}/{totalPages}
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleResume}
            sx={{
              bgcolor: maggaColors.archiveGold,
              color: maggaColors.background,
              minHeight: 44,
              flexShrink: 0,
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: maggaColors.archiveGoldHover },
            }}
          >
            อ่านต่อ
          </Button>
          <Button
            size="small"
            onClick={() => setShowResume(false)}
            aria-label="ปิดการแจ้งเตือนอ่านต่อ"
            sx={{ color: maggaColors.textSecondary, minWidth: 44, minHeight: 44, flexShrink: 0, px: 1 }}
          >
            ✕
          </Button>
        </Box>
      )}

      {/* Bottom Progress Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: maggaColors.background,
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          transform: isVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease-in-out",
          pt: 0.75,
          pb: "max(6px, env(safe-area-inset-bottom, 0px))",
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1000,
            mx: "auto",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: maggaColors.archiveGoldHover, fontWeight: 600 }}
          >
            หน้า {currentPage + 1}/{totalPages}
          </Typography>
          <Box sx={{ flex: 1, mx: 2, maxWidth: 200 }}>
            <LinearProgress
              aria-label="ความคืบหน้าการอ่าน"
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.1)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: maggaColors.archiveGoldHover,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
            }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>
    </Portal>
  );
}
