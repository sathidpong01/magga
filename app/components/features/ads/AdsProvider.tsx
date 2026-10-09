"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { chooseAdvertisementLink } from "@/lib/advertisements";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  linkUrls?: string[] | null;
  content?: string | null;
  placement: string;
  targetDevice?: string;
  repeatCount?: number;
}

interface AdsContextType {
  getAdsByPlacement: (placement: string) => Ad[];
  isLoading: boolean;
}

const AdsContext = createContext<AdsContextType>({
  getAdsByPlacement: () => [],
  isLoading: true,
});

export function AdsProvider({ children, initialAds }: { children: ReactNode; initialAds?: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds || []);
  const [isLoading, setIsLoading] = useState(!initialAds);

  useEffect(() => {
    const selectLinks = (data: Ad[]) => setAds(data.map((ad) => {
      const linkUrl = chooseAdvertisementLink(ad);
      return { ...ad, linkUrl, linkUrls: linkUrl ? [linkUrl] : [] };
    }));
    // Select after hydration and keep the same destinations until a full page reload.
    if (initialAds) {
      selectLinks(initialAds);
      return;
    }
    const controller = new AbortController();
    let active = true;
    fetch("/api/advertisements", { cache: "no-store", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch advertisements: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (active && Array.isArray(data)) selectLinks(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error(error);
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => {
      active = false;
      controller.abort();
    };
    // Keep the initial document's snapshot across client-side navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAdsByPlacement = (placement: string): Ad[] => {
    return ads.filter((ad) => ad.placement === placement);
  };

  return (
    <AdsContext.Provider value={{ getAdsByPlacement, isLoading }}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  return useContext(AdsContext);
}

export type { Ad };
