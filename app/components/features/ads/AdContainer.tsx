"use client";

import { Box, useMediaQuery } from "@mui/material";
import AdBanner from "./AdBanner";
import FloatingAd from "./FloatingAd";
import AdModal from "./AdModal";
import { useAds } from "./AdsProvider";
import { adDeviceDisplay } from "@/lib/advertisements";

interface AdContainerProps {
  placement: "header" | "footer" | "manga-end" | "floating" | "modal";
}

export default function AdContainer({ placement }: AdContainerProps) {
  const { getAdsByPlacement } = useAds();
  const mobile = useMediaQuery("(max-width:899px)");
  const placementAds = getAdsByPlacement(placement);
  const ads = placement === "floating" || placement === "modal"
    ? placementAds.filter((ad) => !ad.targetDevice || ad.targetDevice === "all" || ad.targetDevice === (mobile ? "mobile" : "desktop"))
    : placementAds;

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
    <>
      {ads.map((ad) => (
        <Box key={ad.id} sx={{ my: 2, display: adDeviceDisplay(ad.targetDevice) }}>
          <AdBanner ad={ad} priority={placement === "header"} fillArea={placement === "manga-end"} />
        </Box>
      ))}
    </>
  );
}
