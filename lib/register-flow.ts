import { isValidCallbackUrl } from "@/lib/auth-helpers";

type SignInEmail = (input: {
  email: string;
  password: string;
}) => Promise<{ error?: { message?: string | null } | null } | null | undefined>;

type FinalizeEmailRegistrationOptions = {
  email: string;
  password: string;
  callbackUrl: string;
  signInEmail: SignInEmail;
  syncSession: () => Promise<unknown>;
  waitMs?: number;
};

export function buildPostRegistrationSignInUrl(callbackUrl: string): string {
  const safeCallbackUrl = isValidCallbackUrl(callbackUrl);
  return `/auth/signin?callbackUrl=${encodeURIComponent(
    safeCallbackUrl
  )}&registered=1`;
}

export async function finalizeEmailRegistration({
  email,
  password,
  callbackUrl,
  signInEmail,
  syncSession,
  waitMs = 300,
}: FinalizeEmailRegistrationOptions): Promise<{
  manualSignInRequired: boolean;
  redirectTo: string;
}> {
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const loginResult = await signInEmail({ email, password });
  if (loginResult?.error) {
    return {
      manualSignInRequired: true,
      redirectTo: buildPostRegistrationSignInUrl(callbackUrl),
    };
  }

  try {
    await syncSession();
  } catch {
    return {
      manualSignInRequired: true,
      redirectTo: buildPostRegistrationSignInUrl(callbackUrl),
    };
  }

  return {
    manualSignInRequired: false,
    redirectTo: isValidCallbackUrl(callbackUrl),
  };
}
