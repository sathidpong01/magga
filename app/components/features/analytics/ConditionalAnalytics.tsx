"use client";

import dynamic from "next/dynamic";
import { hasStatisticsConsent } from "@/lib/privacy-consent";
import { useStatisticsConsent } from "@/lib/use-statistics-consent";

const Analytics = dynamic(() => import("@vercel/analytics/react").then(module => module.Analytics), { ssr: false });
const SpeedInsights = dynamic(() => import("@vercel/speed-insights/next").then(module => module.SpeedInsights), { ssr: false });

export default function ConditionalAnalytics() {
  const allowed = useStatisticsConsent();
  if (!allowed) return null;
  return <>
    <SpeedInsights sampleRate={0.1} beforeSend={event => hasStatisticsConsent() ? event : null} />
    <Analytics beforeSend={event => hasStatisticsConsent() ? event : null} />
  </>;
}
