"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, LinearProgress, Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const STORAGE_KEY = "magga_reading_progress";

interface SavedProgress {
  page: number;
  totalPages: number;
  timestamp: number;
}

function getSavedProgress(mangaId: string): SavedProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const all = JSON.parse(data) as Record<string, SavedProgress>;
    return all[mangaId] || null;
  } catch {
    return null;
  }
}

function saveProgress(mangaId: string, page: number, totalPages: number) {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, SavedProgress> = data ? JSON.parse(data) : {};
    all[mangaId] = { page, totalPages, timestamp: Date.now() };
    // Keep only last 100 entries to avoid bloating localStorage
    const keys = Object.keys(all);
    if (keys.length > 100) {
      const sorted = keys.sort((a, b) => all[a].timestamp - all[b].timestamp);
      sorted.slice(0, keys.length - 100).forEach((k) => delete all[k]);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage full or unavailable
  }
}

interface ReadingProgressProps {
  mangaId: string;
  currentPage: number;
  totalPages: number;
  pageRefs?: React.RefObject<(HTMLDivElement | null)[]>;
}

export default function ReadingProgress({
  mangaId,
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
    const saved = getSavedProgress(mangaId);
    if (saved && saved.page > 0 && saved.page < totalPages - 1) {
      setSavedPage(saved.page);
      setShowResume(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => setShowResume(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [mangaId, totalPages]);

  // Save progress as user reads
  useEffect(() => {
    if (currentPage > 0) {
      saveProgress(mangaId, currentPage, totalPages);
    }
  }, [mangaId, currentPage, totalPages]);

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
      pageRefs.current[savedPage]?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // Fallback: scroll by estimated position
      const estimatedPosition = (savedPage / totalPages) * document.documentElement.scrollHeight;
      window.scrollTo({ top: estimatedPosition, behavior: "smooth" });
    }
  }, [savedPage, totalPages, pageRefs]);

  return (
    <>
      {/* Resume Reading Banner */}
      {showResume && (
        <Box
          sx={{
            position: "fixed",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
            bgcolor: "rgba(23, 23, 23, 0.95)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            borderRadius: 2,
            px: 2.5,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            animation: "slideUp 0.3s ease-out",
            "@keyframes slideUp": {
              from: { opacity: 0, transform: "translateX(-50%) translateY(20px)" },
              to: { opacity: 1, transform: "translateX(-50%) translateY(0)" },
            },
          }}
        >
          <Typography variant="body2" sx={{ color: "#d4d4d4", whiteSpace: "nowrap" }}>
            อ่านค้างไว้หน้า {savedPage + 1}/{totalPages}
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleResume}
            sx={{
              bgcolor: "#fbbf24",
              color: "#000",
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#f59e0b" },
            }}
          >
            อ่านต่อ
          </Button>
          <Button
            size="small"
            onClick={() => setShowResume(false)}
            sx={{ color: "#737373", minWidth: "auto", px: 1 }}
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
          bgcolor: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          transform: isVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease-in-out",
          py: 0.75,
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
          <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 600 }}>
            หน้า {currentPage + 1}/{totalPages}
          </Typography>
          <Box sx={{ flex: 1, mx: 2, maxWidth: 200 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.1)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#fbbf24",
                  borderRadius: 1,
                },
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>
    </>
  );
}
