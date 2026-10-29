"use client";

import { useRef, useEffect, useState, forwardRef, useMemo } from "react";
import Image from "next/image";
import { Box, Button, Typography } from "@mui/material";
import { readingEntries } from "@/lib/reader-storage";
import ReadingProgress from "@/app/components/ui/ReadingProgress";
import { maggaColors, maggaLayout } from "@/lib/design-tokens";

// Page data can be string (legacy) or object with dimensions (new)
interface PageData {
  url: string;
  width?: number;
  height?: number;
}

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  mangaSlug?: string;
  remember?: boolean;
  pages: string[] | PageData[]; // Support both legacy and new format
}

export default function MangaReader({
  mangaId,
  mangaTitle,
  mangaSlug = "",
  remember = true,
  pages,
}: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.location.hash !== "#reader-resume"
    )
      return;
    try {
      const saved = readingEntries(localStorage)[mangaId];
      const page = saved && saved.page < pages.length - 1 ? saved.page : 0;
      requestAnimationFrame(() =>
        pageRefs.current[page]?.scrollIntoView({
          block: "start",
          behavior: "instant",
        }),
      );
    } catch {
      /* Reading still works without storage. */
    }
  }, [mangaId, pages.length]);

  // Normalize pages to PageData format (support both legacy string[] and new object[])
  const normalizedPages: PageData[] = useMemo(() => {
    return pages.map((page) => {
      if (typeof page === "string") {
        // Legacy format: just URL string
        return { url: page, width: 0, height: 0 };
      }
      // New format: object with url, width, height
      return page;
    });
  }, [pages]);

  // Track current page with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = pageRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (index !== -1) {
              setCurrentPage(index);
            }
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [pages.length]);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Reading Progress Indicator */}
      <ReadingProgress
        mangaId={mangaId}
        mangaTitle={mangaTitle}
        mangaSlug={mangaSlug}
        remember={remember}
        currentPage={currentPage}
        totalPages={pages.length}
        pageRefs={pageRefs}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: maggaLayout.reader.gap,
        }}
      >
        {normalizedPages.map((pageData, index) => (
          <ReaderPage
            key={`${index}:${pageData.url}`}
            ref={(el: HTMLDivElement | null) => {
              pageRefs.current[index] = el;
            }}
            mangaTitle={mangaTitle}
            pageData={pageData}
            imageIndex={index}
          />
        ))}
      </Box>
    </Box>
  );
}

interface ReaderPageProps {
  mangaTitle: string;
  pageData: PageData;
  imageIndex: number;
}

const ReaderPage = forwardRef<HTMLDivElement, ReaderPageProps>(
  function ReaderPage({ mangaTitle, pageData, imageIndex }, ref) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageFailed, setImageFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const imageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setImageLoading(false);
      }
    }, [pageData.url, attempt]);

    return (
      <Box
        ref={ref}
        id={`reader-page-${imageIndex}`}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: maggaLayout.reader.maxWidth,
          lineHeight: 0,
          scrollMarginTop: "72px",
        }}
      >
        {/* Image with Skeleton Loading */}
        <Box
          sx={{
            position: "relative",
            ...(imageFailed && {
              aspectRatio: `${pageData.width || 900} / ${pageData.height || 1273}`,
            }),
          }}
        >
          {/* Skeleton Placeholder - stays behind until image loads */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: maggaColors.surface,
              overflow: "hidden",
              opacity: imageLoading ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
              pointerEvents: "none",
              zIndex: 0,
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${maggaColors.borderSubtle}, transparent)`,
                animation: "shimmer 1.5s infinite",
              },
              "@keyframes shimmer": {
                "0%": { transform: "translateX(-100%)" },
                "100%": { transform: "translateX(100%)" },
              },
            }}
          />
          <Image
            key={`${pageData.url}:${attempt}`}
            ref={imageRef}
            src={pageData.url}
            alt={`Page ${imageIndex + 1} of ${mangaTitle}`}
            // Use dimensions when available (prevents CLS), fallback to standard manga ratio for legacy data
            width={pageData.width || 900}
            height={pageData.height || 1273}
            sizes="(max-width: 1199px) 100vw, 1000px"
            unoptimized
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "auto",
              display: imageFailed ? "none" : "block",
            }}
            preload={imageIndex === 0}
            loading={imageIndex === 0 ? undefined : "lazy"}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageFailed(true);
            }}
          />
          {imageFailed && (
            <Box
              role="alert"
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: maggaColors.surface,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                lineHeight: 1.75,
                p: 2,
              }}
            >
              <Typography color="text.secondary">
                โหลดภาพหน้า {imageIndex + 1} ไม่สำเร็จ
              </Typography>
              <Button
                onClick={() => {
                  setImageFailed(false);
                  setImageLoading(true);
                  setAttempt((value) => value + 1);
                }}
                sx={{ minHeight: 44 }}
              >
                โหลดภาพนี้อีกครั้ง
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    );
  },
);
