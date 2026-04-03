"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";
import { getAuthBaseUrl } from "@/lib/site-url";

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
}
