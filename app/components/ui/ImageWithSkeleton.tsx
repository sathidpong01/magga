"use client";

import { useState } from "react";
import Image from "next/image";
import { Box, Skeleton } from "@mui/material";

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  priority?: boolean;
}

export default function ImageWithSkeleton({
  src,
  alt,
  width,
  height,
  aspectRatio = "auto",
  priority = false,
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        width: width || "100%",
        height: height || "auto",
        aspectRatio: aspectRatio,
        bgcolor: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      {/* Skeleton Placeholder */}
      {isLoading && !hasError && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(255, 255, 255, 0.05)",
            "&::after": {
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
            },
          }}
        />
      )}

      {/* Error State */}
      {hasError && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255, 255, 255, 0.02)",
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          ไม่สามารถโหลดรูปได้
        </Box>
      )}

      {/* Actual Image */}
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          fill={!width && !height}
          width={width}
          height={height}
          style={{
            objectFit: "contain",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out",
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </Box>
  );
}
