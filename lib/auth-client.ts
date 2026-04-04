"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";
import { getAuthBaseUrl } from "@/lib/site-url";

export const AUTH_PENDING_SOCIAL_KEY = "magga:auth-pending-social";
export const AUTH_SESSION_REFRESH_EVENT = "magga:auth-session-refresh";

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

export async function syncClientSession() {
  const sessionResult = await getSession({
    query: { disableCookieCache: true },
  });

  const sessionAtom = authClient.$store.atoms.session as any;
  const currentState = sessionAtom.get();
  const sessionData =
    sessionResult?.data?.session && sessionResult?.data?.user
      ? sessionResult.data
      : null;

  sessionAtom.set({
    ...currentState,
    data: sessionData,
    error: sessionResult?.error ?? null,
    isPending: false,
    isRefetching: false,
    refetch: currentState.refetch,
  });

  authClient.$store.notify("$sessionSignal");

  return sessionData;
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

export function requestClientSessionRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_REFRESH_EVENT));
}
