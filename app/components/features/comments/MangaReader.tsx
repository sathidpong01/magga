"use client";

import { useRef, useEffect, useState, forwardRef, useMemo } from "react";
import Image from "next/image";
import { Box } from "@mui/material";
import ReadingProgress from "@/app/components/ui/ReadingProgress";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

// Page data can be string (legacy) or object with dimensions (new)
interface PageData {
  url: string;
  width?: number;
  height?: number;
}

interface MangaReaderProps {
  mangaId: string;
  mangaTitle: string;
  pages: string[] | PageData[]; // Support both legacy and new format
}

export default function MangaReader({
  mangaId,
  mangaTitle,
  pages,
}: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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
        currentPage={currentPage}
        totalPages={pages.length}
        pageRefs={pageRefs}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {normalizedPages.map((pageData, index) => (
          <ReaderPage
            key={index}
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
    const imageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setImageLoading(false);
      }
    }, [pageData.url]);

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
        <Box sx={{ position: "relative" }}>
          {/* Skeleton Placeholder - stays behind until image loads */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: maggaColors.surface,
              borderRadius: `${maggaRadii.sm}px`,
              overflow: "hidden",
              opacity: imageLoading ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
              minHeight: 400,
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
            ref={imageRef}
            src={pageData.url}
            alt={`Page ${imageIndex + 1} of ${mangaTitle}`}
            // Use dimensions when available (prevents CLS), fallback to standard manga ratio for legacy data
            width={pageData.width || 900}
            height={pageData.height || 1273}
            sizes="(max-width: 1000px) 100vw, 1000px"
            unoptimized
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: `${maggaRadii.sm}px`,
            }}
            preload={imageIndex === 0}
            loading={imageIndex === 0 ? undefined : "lazy"}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </Box>
      </Box>
    );
  },
);
