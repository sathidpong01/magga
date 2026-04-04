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
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let active = true;
    const MAX_SOCIAL_SYNC_RETRIES = 10;

    const runSync = async (force = false) => {
      if (syncingRef.current || (!force && !hasPendingSocialAuth())) {
        return;
      }

      syncingRef.current = true;

      try {
        const sessionData = await syncClientSession();
        if (!active) {
          return;
        }

        if (sessionData) {
          retryCountRef.current = 0;
          clearPendingSocialAuth();
          router.refresh();
          return;
        }

        // OAuth callbacks can land before the browser exposes the new cookie.
        if (
          hasPendingSocialAuth() &&
          retryCountRef.current < MAX_SOCIAL_SYNC_RETRIES
        ) {
          retryCountRef.current += 1;
          retryTimeoutRef.current = setTimeout(() => {
            void runSync(true);
          }, 1000);
        }
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(AUTH_SESSION_REFRESH_EVENT, handleForcedRefresh);
    };
  }, [router]);

  return null;
}
