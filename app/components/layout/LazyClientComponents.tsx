"use client";

import dynamic from "next/dynamic";

// Lazy load non-critical client components to reduce initial JS bundle
// ssr: false is allowed here because this is a Client Component
const CookieConsent = dynamic(() => import("../features/auth/CookieConsent"), { ssr: false });
const SessionExpiryWarning = dynamic(() => import("../features/auth/SessionExpiryWarning"), { ssr: false });
const SessionExpiredNotice = dynamic(() => import("../features/auth/SessionExpiredNotice"), { ssr: false });
const DevToolsProtection = dynamic(() => import("../security/DevToolsProtection"), { ssr: false });
const ConditionalAnalytics = dynamic(() => import("../features/analytics/ConditionalAnalytics"), { ssr: false });
const GlobalAds = dynamic(() => import("../features/ads/GlobalAds"), { ssr: false });

export default function LazyClientComponents() {
  return (
    <>
      <CookieConsent />
      <SessionExpiryWarning />
      <SessionExpiredNotice />
      <DevToolsProtection />
      <GlobalAds />
      <ConditionalAnalytics />
    </>
  );
}
