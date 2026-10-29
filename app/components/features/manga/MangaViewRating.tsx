"use client";

import { hasStatisticsConsent } from "@/lib/privacy-consent";
import { useStatisticsConsent } from "@/lib/use-statistics-consent";
import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import { maggaColors } from "@/lib/design-tokens";

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
  const statisticsAllowed = useStatisticsConsent();
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submitLock = useRef(false);
  const viewTracked = useRef(false);
  const ratingRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const update = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          mangaId: string;
          averageRating: number;
          ratingCount: number;
          userRating: number;
        }>
      ).detail;
      if (detail?.mangaId !== mangaId) return;
      setAverageRating(detail.averageRating);
      setRatingCount(detail.ratingCount);
      setUserRating(detail.userRating);
    };
    window.addEventListener("magga-rating-updated", update);
    return () => window.removeEventListener("magga-rating-updated", update);
  }, [mangaId]);

  // Track a page view only from the designated instance and only once the tab is visible.
  useEffect(() => {
    if (!statisticsAllowed || !trackViewOnMount || viewTracked.current) return;

    const postView = () => {
      if (viewTracked.current || !hasStatisticsConsent()) return;
      viewTracked.current = true;
      fetch(`/api/manga/${mangaId}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    };

    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      postView();
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        postView();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mangaId, trackViewOnMount, statisticsAllowed]);

  // Load FingerprintJS and fetch existing rating
  useEffect(() => {
    if (hideInteractive || !active) return;
    let cancelled = false;
    setIdentityLoading(true);
    setError("");
    const loadRating = () => {
      void import("@fingerprintjs/fingerprintjs")
        .then((FingerprintJS) => {
          return FingerprintJS.load()
            .then((fp) => fp.get())
            .then((result) => {
              if (cancelled) return;
              const visitorId = result.visitorId;
              setFingerprint(visitorId);
              fetch(
                `/api/manga/${mangaId}/rating?fingerprint=${encodeURIComponent(visitorId)}`,
              )
                .then((r) => {
                  if (!r.ok) throw new Error("โหลดคะแนนไม่ได้");
                  return r.json();
                })
                .then((data) => {
                  if (cancelled) return;
                  setUserRating(data.userRating ?? null);
                  if (data.averageRating !== undefined)
                    setAverageRating(data.averageRating);
                  if (data.ratingCount !== undefined)
                    setRatingCount(data.ratingCount);
                })
                .catch(() => {
                  if (!cancelled)
                    setError("โหลดคะแนนเดิมไม่ได้ คุณยังให้คะแนนได้");
                });
            });
        })
        .catch(() => {
          if (!cancelled) setError("เตรียมการให้คะแนนไม่ได้ กรุณาลองใหม่");
        })
        .finally(() => {
          if (!cancelled) setIdentityLoading(false);
        });
    };
    loadRating();
    return () => {
      cancelled = true;
    };
  }, [mangaId, hideInteractive, active, attempt]);

  const handleRate = async (rating: number) => {
    if (!fingerprint || submitLock.current) return;
    submitLock.current = true;
    setError("");
    setNotice("");
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
        setNotice("บันทึกคะแนนแล้ว");
        window.dispatchEvent(
          new CustomEvent("magga-rating-updated", {
            detail: {
              mangaId,
              averageRating: data.averageRating,
              ratingCount: data.ratingCount,
              userRating: rating,
            },
          }),
        );
      } else
        setError(
          res.status === 429
            ? "ให้คะแนนถี่เกินไป กรุณาลองใหม่ภายหลัง"
            : "บันทึกคะแนนไม่ได้ กรุณาลองใหม่",
        );
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองให้คะแนนอีกครั้ง");
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating ?? userRating ?? 0;

  // Render a star icon based on position relative to a fractional value
  function AverageStar({
    position,
    value,
  }: {
    position: number;
    value: number;
  }) {
    const full = value >= position;
    const half = !full && value >= position - 0.5;
    const color =
      full || half ? maggaColors.archiveGold : "rgba(255,255,255,0.25)";
    if (full) return <StarIcon sx={{ fontSize: 20, color }} />;
    if (half)
      return (
        <StarHalfIcon sx={{ fontSize: 20, color: maggaColors.archiveGold }} />
      );
    return <StarBorderIcon sx={{ fontSize: 20, color }} />;
  }

  return (
    <Box
      ref={ratingRef}
      sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
    >
      {/* Average rating display (read-only, visual) */}
      {!hideAverage && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {[1, 2, 3, 4, 5].map((pos) => (
            <AverageStar key={pos} position={pos} value={averageRating} />
          ))}
          <Typography
            variant="body2"
            sx={{ color: maggaColors.archiveGold, fontWeight: 700, ml: 0.75 }}
          >
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", ml: 0.5 }}
          >
            ({ratingCount} คะแนน)
          </Typography>
        </Box>
      )}

      {/* Interactive user rating row */}
      {!hideInteractive && !active && (
        <Button
          onClick={() => setActive(true)}
          sx={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          ให้คะแนนเรื่องนี้
        </Button>
      )}
      {!hideInteractive && active && (
        <Box
          role="group"
          aria-label="คะแนนของคุณ"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            flexWrap: "wrap",
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Tooltip
              key={star}
              title={`ให้ ${star} ดาว`}
              placement="top"
              describeChild
            >
              <span>
                <IconButton
                  aria-label={`ให้ ${star} ดาว`}
                  aria-pressed={userRating === star}
                  size="small"
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  disabled={isSubmitting || identityLoading || !fingerprint}
                  sx={{
                    width: 44,
                    height: 44,
                    color:
                      displayRating >= star
                        ? maggaColors.archiveGold
                        : maggaColors.textSecondary,
                    transition: "color 0.15s",
                  }}
                >
                  {displayRating >= star ? (
                    <StarIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <StarBorderIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          ))}
          {isSubmitting && (
            <CircularProgress
              aria-label="กำลังบันทึกคะแนน"
              size={14}
              sx={{ ml: 0.5, color: maggaColors.archiveGold }}
            />
          )}
          {userRating && !isSubmitting && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", ml: 0.5 }}
            >
              คุณให้ {userRating} ดาว
            </Typography>
          )}
        </Box>
      )}
      {active && !hideInteractive && (
        <Typography variant="caption" color="text.secondary">
          ใช้ลายนิ้วมือเบราว์เซอร์เพื่อจำคะแนนและป้องกันการให้คะแนนซ้ำ ดูรายละเอียดในนโยบายความเป็นส่วนตัว
        </Typography>
      )}
      {identityLoading && (
        <Typography role="status" variant="body2" color="text.secondary">
          กำลังเตรียมการให้คะแนน...
        </Typography>
      )}
      {error && (
        <Alert
          severity="error"
          action={
            !fingerprint ? (
              <Button onClick={() => setAttempt((value) => value + 1)}>
                ลองใหม่
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}
      <Box aria-live="polite">
        {notice && (
          <Typography variant="body2" sx={{ color: maggaColors.trustEmerald }}>
            {notice}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
