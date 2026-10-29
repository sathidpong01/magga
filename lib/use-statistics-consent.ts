"use client";
import { useSyncExternalStore } from "react";
import { CONSENT_CHANGED, hasStatisticsConsent } from "./privacy-consent";

const listeners = new Set<() => void>();
let timer: number | undefined;
function notify() { for (const listener of listeners) listener(); }
function subscribe(update: () => void) {
  listeners.add(update);
  if (listeners.size === 1) {
    window.addEventListener(CONSENT_CHANGED, notify);
    window.addEventListener("storage", notify);
    window.addEventListener("focus", notify);
    timer = window.setInterval(notify, 60_000);
  }
  return () => {
    listeners.delete(update);
    if (listeners.size === 0) {
      window.removeEventListener(CONSENT_CHANGED, notify);
      window.removeEventListener("storage", notify);
      window.removeEventListener("focus", notify);
      window.clearInterval(timer);
    }
  };
}
export function useStatisticsConsent() {
  return useSyncExternalStore(subscribe, hasStatisticsConsent, () => false);
}
