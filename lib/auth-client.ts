"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";

export const AUTH_PENDING_SOCIAL_KEY = "magga:auth-pending-social";
export const AUTH_SESSION_REFRESH_EVENT = "magga:auth-session-refresh";
export const AUTH_REAUTH_IN_PROGRESS_KEY = "magga:auth-reauth-in-progress";
const AUTH_PENDING_SOCIAL_TTL_MS = 3 * 60 * 1000;

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [usernameClient(), adminClient()],
  sessionOptions: {
    refetchOnWindowFocus: true,
  },
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

function getSessionRefetch() {
  const sessionAtom = authClient.$store.atoms.session as any;
  const currentState = sessionAtom.get();
  return typeof currentState?.refetch === "function"
    ? currentState.refetch
    : null;
}

export async function syncClientSession() {
  const refetch = getSessionRefetch();
  if (refetch) {
    await refetch({
      query: { disableCookieCache: true },
    });
    const sessionAtom = authClient.$store.atoms.session as any;
    const sessionData = sessionAtom.get()?.data ?? null;

    if (sessionData && typeof window !== "undefined") {
      clearPendingSocialAuth();
      window.sessionStorage.removeItem(AUTH_REAUTH_IN_PROGRESS_KEY);
    }

    return sessionData;
  }

  const sessionResult = await getSession({
    query: { disableCookieCache: true },
  });
  const sessionData =
    sessionResult?.data?.session && sessionResult?.data?.user
      ? sessionResult.data
      : null;

  if (sessionData && typeof window !== "undefined") {
    clearPendingSocialAuth();
    window.sessionStorage.removeItem(AUTH_REAUTH_IN_PROGRESS_KEY);
  }

  return sessionData;
}

export async function signOutAndSync() {
  const result = await signOut();

  if (result?.error) {
    throw new Error(result.error.message || "ออกจากระบบไม่สำเร็จ");
  }

  clearPendingSocialAuth();
  clearReauthInProgress();
  await syncClientSession();
  return result;
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

  const rawState = window.sessionStorage.getItem(AUTH_PENDING_SOCIAL_KEY);
  if (!rawState) {
    return false;
  }

  try {
    const parsed = JSON.parse(rawState) as { startedAt?: number };
    if (
      typeof parsed.startedAt !== "number" ||
      Date.now() - parsed.startedAt > AUTH_PENDING_SOCIAL_TTL_MS
    ) {
      window.sessionStorage.removeItem(AUTH_PENDING_SOCIAL_KEY);
      return false;
    }

    return true;
  } catch {
    window.sessionStorage.removeItem(AUTH_PENDING_SOCIAL_KEY);
    return false;
  }
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
  void syncClientSession();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_REFRESH_EVENT));
  }
}
