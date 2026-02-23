"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  content?: string | null;
  placement: string;
}

interface AdsContextType {
  getAdsByPlacement: (placement: string) => Ad[];
  isLoading: boolean;
}

const AdsContext = createContext<AdsContextType>({
  getAdsByPlacement: () => [],
  isLoading: true,
});

const ADS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchedRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastFetchedRef.current < ADS_CACHE_TTL && ads.length > 0) return;

    fetch("/api/advertisements")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAds(data);
          lastFetchedRef.current = Date.now();
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
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
