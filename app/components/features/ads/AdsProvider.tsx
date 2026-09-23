"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

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

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      fetch("/api/advertisements", { cache: "no-store", signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch advertisements: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) setAds(data);
        })
        .catch((error) => {
          if (!controller.signal.aborted) console.error(error);
        })
        .finally(() => setIsLoading(false));
    };

    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

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
