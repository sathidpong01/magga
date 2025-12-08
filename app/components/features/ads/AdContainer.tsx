"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import AdBanner from "./AdBanner";
import FloatingAd from "./FloatingAd";
import AdModal from "./AdModal";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
  placement: string;
}

interface AdContainerProps {
  placement: "header" | "footer" | "manga-end" | "floating" | "modal";
}

export default function AdContainer({ placement }: AdContainerProps) {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetch(`/api/advertisements?placement=${placement}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch(console.error);
  }, [placement]);

  if (ads.length === 0) return null;

  // Floating ads
  if (placement === "floating") {
    return (
      <>
        {ads.map((ad) => (
          <FloatingAd key={ad.id} ad={ad} />
        ))}
      </>
    );
  }

  // Modal ads
  if (placement === "modal") {
    return (
      <>
        {ads.map((ad) => (
          <AdModal key={ad.id} ad={ad} />
        ))}
      </>
    );
  }

  // Banner placements (header, footer, manga-end)
  return (
    <Box sx={{ my: 2 }}>
      {ads.map((ad) => (
        <AdBanner key={ad.id} ad={ad} />
      ))}
    </Box>
  );
}
