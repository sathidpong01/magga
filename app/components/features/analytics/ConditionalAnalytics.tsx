"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function ConditionalAnalytics() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage for cookie consent
    const checkConsent = () => {
      const consent = localStorage.getItem("cookieConsent");
      setHasConsent(consent === "true");
    };

    // Initial check
    checkConsent();

    // Listen for storage changes (in case consent is given in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cookieConsent") {
        checkConsent();
      }
    };

    // Also listen for custom event when consent is given in same tab
    const handleConsentChange = () => checkConsent();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cookieConsentChanged", handleConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cookieConsentChanged", handleConsentChange);
    };
  }, []);

  // Don't render analytics if user hasn't consented or declined
  if (hasConsent !== true) {
    return null;
  }

  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
