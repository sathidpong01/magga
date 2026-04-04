"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";
import { getAuthBaseUrl } from "@/lib/site-url";

export const AUTH_PENDING_SOCIAL_KEY = "magga:auth-pending-social";
export const AUTH_SESSION_REFRESH_EVENT = "magga:auth-session-refresh";
export const AUTH_REAUTH_IN_PROGRESS_KEY = "magga:auth-reauth-in-progress";

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  plugins: [usernameClient(), adminClient()],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  updateUser,
  linkSocial,
} = authClient;

function setClientSessionState(sessionData: unknown, error: unknown = null) {
  const sessionAtom = authClient.$store.atoms.session as any;
  const currentState = sessionAtom.get();

  sessionAtom.set({
    ...currentState,
    data: sessionData,
    error,
    isPending: false,
    isRefetching: false,
    refetch: currentState.refetch,
  });

  authClient.$store.notify("$sessionSignal");
}

export function clearClientSession() {
  setClientSessionState(null, null);
}

export async function syncClientSession() {
  const sessionResult = await getSession({
    query: { disableCookieCache: true },
  });

  const sessionData =
    sessionResult?.data?.session && sessionResult?.data?.user
      ? sessionResult.data
      : null;

  setClientSessionState(sessionData, sessionResult?.error ?? null);

  if (sessionData && typeof window !== "undefined") {
    window.sessionStorage.removeItem(AUTH_REAUTH_IN_PROGRESS_KEY);
  }

  return sessionData;
}

export async function signOutAndSync() {
  try {
    await signOut();
  } finally {
    clearClientSession();
    clearPendingSocialAuth();
    clearReauthInProgress();
  }
}

export function markPendingSocialAuth(callbackURL?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    AUTH_PENDING_SOCIAL_KEY,
    JSON.stringify({
      callbackURL: callbackURL || "/",
      startedAt: Date.now(),
    })
  );
}

export function hasPendingSocialAuth() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.sessionStorage.getItem(AUTH_PENDING_SOCIAL_KEY));
}

export function clearPendingSocialAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_PENDING_SOCIAL_KEY);
}

export function markReauthInProgress() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(AUTH_REAUTH_IN_PROGRESS_KEY, "true");
}

export function clearReauthInProgress() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_REAUTH_IN_PROGRESS_KEY);
}

export function hasReauthInProgress() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(AUTH_REAUTH_IN_PROGRESS_KEY) === "true";
}

export function requestClientSessionRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_REFRESH_EVENT));
}
