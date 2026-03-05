"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Tooltip, CircularProgress } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

interface MangaViewRatingProps {
  mangaId: string;
  initialViewCount: number;
  initialAverageRating: number;
  initialRatingCount: number;
  hideViewCount?: boolean;
}

export default function MangaViewRating({
  mangaId,
  initialViewCount,
  initialAverageRating,
  initialRatingCount,
  hideViewCount = false,
}: MangaViewRatingProps) {
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const viewTracked = useRef(false);

  // Track view on mount (once)
  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    fetch(`/api/manga/${mangaId}/view`, { method: "POST" }).catch(() => {});
  }, [mangaId]);

  // Load FingerprintJS and fetch existing rating
  useEffect(() => {
    let cancelled = false;
    import("@fingerprintjs/fingerprintjs").then((FingerprintJS) => {
      FingerprintJS.load().then((fp) => fp.get()).then((result) => {
        if (cancelled) return;
        const visitorId = result.visitorId;
        setFingerprint(visitorId);
        fetch(`/api/manga/${mangaId}/rating?fingerprint=${encodeURIComponent(visitorId)}`)
          .then((r) => r.json())
          .then((data) => {
            if (cancelled) return;
            if (data.userRating) setUserRating(data.userRating);
            if (data.averageRating !== undefined) setAverageRating(data.averageRating);
            if (data.ratingCount !== undefined) setRatingCount(data.ratingCount);
          })
          .catch(() => {});
      });
    });
    return () => { cancelled = true; };
  }, [mangaId]);

  const handleRate = async (rating: number) => {
    if (!fingerprint || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/manga/${mangaId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, fingerprint }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserRating(rating);
        setAverageRating(data.averageRating);
        setRatingCount(data.ratingCount);
      }
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating ?? userRating ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Star rating row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Tooltip key={star} title={`ให้ ${star} ดาว`} placement="top">
            <span>
              <IconButton
                size="small"
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                disabled={isSubmitting || !fingerprint}
                sx={{ p: 0.25, color: displayRating >= star ? "#fbbf24" : "rgba(255,255,255,0.3)", transition: "color 0.15s" }}
              >
                {displayRating >= star ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        ))}
        {isSubmitting && <CircularProgress size={14} sx={{ ml: 0.5, color: "#fbbf24" }} />}
      </Box>

      {/* Stats row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ color: "#fbbf24", fontWeight: 600 }}>
          {averageRating > 0 ? averageRating.toFixed(1) : "—"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
        </Typography>
        {userRating && (
          <Typography variant="caption" sx={{ color: "#9a9a9a" }}>
            · คุณให้ {userRating} ดาว
          </Typography>
        )}
      </Box>
    </Box>
  );
}
