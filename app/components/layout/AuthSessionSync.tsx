"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_SESSION_REFRESH_EVENT,
  clearPendingSocialAuth,
  hasPendingSocialAuth,
  syncClientSession,
} from "@/lib/auth-client";

export default function AuthSessionSync() {
  const router = useRouter();
  const syncingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const runSync = async (force = false) => {
      if (syncingRef.current || (!force && !hasPendingSocialAuth())) {
        return;
      }

      syncingRef.current = true;

      try {
        await syncClientSession();
        if (!active) {
          return;
        }

        clearPendingSocialAuth();
        router.refresh();
      } catch {
        clearPendingSocialAuth();
      } finally {
        syncingRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runSync();
      }
    };

    const handleFocus = () => {
      void runSync();
    };

    const handlePageShow = () => {
      void runSync();
    };

    const handleForcedRefresh = () => {
      void runSync(true);
    };

    void runSync();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(AUTH_SESSION_REFRESH_EVENT, handleForcedRefresh);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(AUTH_SESSION_REFRESH_EVENT, handleForcedRefresh);
    };
  }, [router]);

  return null;
}
