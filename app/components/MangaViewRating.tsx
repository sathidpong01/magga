"use client";

import { useEffect, useState, useRef } from "react";
import { Box, Typography, Rating, CircularProgress, Snackbar, Alert } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface MangaViewRatingProps {
  mangaId: string;
  initialViewCount: number;
  initialAverageRating: number;
  initialRatingCount: number;
}

export default function MangaViewRating({
  mangaId,
  initialViewCount,
  initialAverageRating,
  initialRatingCount,
}: MangaViewRatingProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Ref to prevent double API calls in React StrictMode (development)
  const hasIncrementedView = useRef(false);

  // Initialize fingerprint and load user's rating
  useEffect(() => {
    const init = async () => {
      try {
        // Check localStorage first (Tier 1 - instant)
        const localRatingKey = `manga_${mangaId}_rating`;
        const localRating = localStorage.getItem(localRatingKey);
        
        if (localRating) {
          setUserRating(parseInt(localRating, 10));
        }

        // Load FingerprintJS (Tier 2)
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;
        setFingerprint(visitorId);

        // Fetch user's existing rating from server
        const response = await fetch(
          `/api/manga/${mangaId}/rating?fingerprint=${visitorId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Update states with server data
          setAverageRating(data.averageRating);
          setRatingCount(data.ratingCount);
          
          if (data.userRating) {
            setUserRating(data.userRating);
            // Sync with localStorage
            localStorage.setItem(localRatingKey, data.userRating.toString());
          }
        }

        // Increment view count (fire-and-forget) - only once per mount
        if (!hasIncrementedView.current) {
          hasIncrementedView.current = true;
          
          fetch(`/api/manga/${mangaId}/view`, {
            method: "POST",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.viewCount) {
                setViewCount(data.viewCount);
              }
            })
            .catch((err) => console.error("Failed to increment view count:", err));
        }

      } catch (error) {
        console.error("Failed to initialize fingerprint:", error);
        setSnackbar({
          open: true,
          message: "ไม่สามารถโหลดระบบให้คะแนนได้",
          severity: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [mangaId]);

  // Handle rating change
  const handleRatingChange = async (
    event: React.SyntheticEvent,
    newValue: number | null
  ) => {
    if (!newValue || !fingerprint || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/manga/${mangaId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: newValue,
          fingerprint,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      const data = await response.json();

      // Update states
      setUserRating(newValue);
      setAverageRating(data.averageRating);
      setRatingCount(data.ratingCount);

      // Save to localStorage
      const localRatingKey = `manga_${mangaId}_rating`;
      localStorage.setItem(localRatingKey, newValue.toString());

      // Show success message
      setSnackbar({
        open: true,
        message: data.message === "Rating updated" 
          ? "อัพเดทคะแนนเรียบร้อย" 
          : "ขอบคุณสำหรับการให้คะแนน!",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to submit rating:", error);
      setSnackbar({
        open: true,
        message: "ไม่สามารถให้คะแนนได้ กรุณาลองใหม่อีกครั้ง",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* View Count */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <VisibilityIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">
          {viewCount.toLocaleString()} views
        </Typography>
      </Box>

      {/* Rating Section */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          คะแนนเฉลี่ย
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <StarIcon sx={{ color: "#fbbf24", fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {averageRating > 0 ? averageRating.toFixed(1) : "ยังไม่มีคะแนน"}
          </Typography>
          {ratingCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({ratingCount.toLocaleString()} ratings)
            </Typography>
          )}
        </Box>

        {/* Interactive Rating */}
        {isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              กำลังโหลด...
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              ให้คะแนนเรื่องนี้
            </Typography>
            <Rating
              name="manga-rating"
              value={userRating}
              onChange={handleRatingChange}
              disabled={isSubmitting}
              precision={1}
              size="large"
              sx={{
                "& .MuiRating-iconFilled": {
                  color: "#fbbf24",
                },
                "& .MuiRating-iconHover": {
                  color: "#fbbf24",
                },
              }}
            />
            {isSubmitting && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                กำลังบันทึก...
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
