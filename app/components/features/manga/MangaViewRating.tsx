"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Tooltip, CircularProgress } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarHalfIcon from "@mui/icons-material/StarHalf";

interface MangaViewRatingProps {
  mangaId: string;
  initialViewCount: number;
  initialAverageRating: number;
  initialRatingCount: number;
  hideViewCount?: boolean;
  hideInteractive?: boolean;
  hideAverage?: boolean;
  trackViewOnMount?: boolean;
}

export default function MangaViewRating({
  mangaId,
  initialViewCount,
  initialAverageRating,
  initialRatingCount,
  hideViewCount = false,
  hideInteractive = false,
  hideAverage = false,
  trackViewOnMount = false,
}: MangaViewRatingProps) {
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const viewTracked = useRef(false);

  // Track a page view only from the designated instance and only once the tab is visible.
  useEffect(() => {
    if (!trackViewOnMount || viewTracked.current) return;

    const postView = () => {
      if (viewTracked.current) return;
      viewTracked.current = true;
      fetch(`/api/manga/${mangaId}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    };

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      postView();
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        postView();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mangaId, trackViewOnMount]);

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

  // Render a star icon based on position relative to a fractional value
  function AverageStar({ position, value }: { position: number; value: number }) {
    const full = value >= position;
    const half = !full && value >= position - 0.5;
    const color = full || half ? "#fbbf24" : "rgba(255,255,255,0.25)";
    if (full) return <StarIcon sx={{ fontSize: 20, color }} />;
    if (half) return <StarHalfIcon sx={{ fontSize: 20, color: "#fbbf24" }} />;
    return <StarBorderIcon sx={{ fontSize: 20, color }} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {/* Average rating display (read-only, visual) */}
      {!hideAverage && <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
        {[1, 2, 3, 4, 5].map((pos) => (
          <AverageStar key={pos} position={pos} value={averageRating} />
        ))}
        <Typography variant="body2" sx={{ color: "#fbbf24", fontWeight: 700, ml: 0.75 }}>
          {averageRating > 0 ? averageRating.toFixed(1) : "—"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>
          ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
        </Typography>
      </Box>}

      {/* Interactive user rating row */}
      {!hideInteractive && <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
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
                {displayRating >= star ? <StarIcon sx={{ fontSize: 18 }} /> : <StarBorderIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </span>
          </Tooltip>
        ))}
        {isSubmitting && <CircularProgress size={14} sx={{ ml: 0.5, color: "#fbbf24" }} />}
        {userRating && !isSubmitting && (
          <Typography variant="caption" sx={{ color: "#9a9a9a", ml: 0.5 }}>
            คุณให้ {userRating} ดาว
          </Typography>
        )}
      </Box>}
    </Box>
  );
}
