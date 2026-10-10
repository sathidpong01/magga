"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { deliverAdEvent } from "@/lib/ad-event-transport";

export function useAdTracking(adId: string) {
  const imageRef = useRef<HTMLImageElement>(null);
  const eventId = useRef<string | null>(null);
  const sent = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();

  const send = (kind: "impression" | "click") => {
    if (sent.current.has(kind) || pending.current.has(kind) || !eventId.current || pathname.startsWith("/dashboard")) return;
    const currentEventId = eventId.current;
    pending.current.add(kind);
    const url = `/api/advertisements/${adId}/events`;
    void deliverAdEvent(url, { eventId: currentEventId, kind }, {
      isCurrent: () => eventId.current === currentEventId,
    }).then((acknowledged) => {
      if (eventId.current !== currentEventId) return;
      pending.current.delete(kind);
      if (acknowledged) sent.current.add(kind);
    });
  };

  useEffect(() => {
    eventId.current = crypto.randomUUID();
    sent.current.clear();
    pending.current.clear();
    setLoaded(false);
    return () => { eventId.current = null; };
  }, [adId, pathname]);

  useEffect(() => {
    const element = imageRef.current;
    if (!element || (!loaded && !element.complete) || !element.naturalWidth) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { clearTimeout(timer); timer = undefined; };
    const observer = new IntersectionObserver(([entry]) => {
      stop();
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && document.visibilityState === "visible") {
        timer = setTimeout(() => { send("impression"); observer.disconnect(); }, 1000);
      }
    }, { threshold: [0, 0.5] });
    const visibilityChange = () => {
      stop();
      observer.unobserve(element);
      observer.observe(element);
    };
    observer.observe(element);
    document.addEventListener("visibilitychange", visibilityChange);
    return () => { stop(); observer.disconnect(); document.removeEventListener("visibilitychange", visibilityChange); };
    // The observer owns this page visit; callback state lives in refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, pathname, loaded]);

  return { imageRef, onLoad: () => setLoaded(true), onClick: () => { send("impression"); send("click"); } };
}
