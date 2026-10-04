"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface Ad {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
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
  const lastRefresh = useRef(0);
  const pending = useRef(false);
  const refreshRef = useRef(() => {});
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "hidden" || pending.current || Date.now() - lastRefresh.current < 30000) return;
      pending.current = true;
      fetch("/api/advertisements", { cache: "no-store", signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch advertisements: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (active && Array.isArray(data)) { setAds(data); lastRefresh.current = Date.now(); }
        })
        .catch((error) => {
          if (!controller.signal.aborted) console.error(error);
        })
        .finally(() => { if (active) { pending.current = false; setIsLoading(false); } });
    };
    refreshRef.current = refresh;
    if (initialAds) lastRefresh.current = Date.now();
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      pending.current = false;
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
    // Initial data is a server snapshot; subsequent refreshes own client state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refreshRef.current(); }, [pathname]);

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
