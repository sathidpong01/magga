import { signOut } from "@/lib/auth-client";

/**
 * Wrapper for fetch that automatically signs out user on 401 (session expired)
 * Use this for authenticated API calls in admin/protected areas
 */
export async function authFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Handle relative URLs by converting to absolute
  const absoluteUrl = url.startsWith("http")
    ? url
    : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`;

  const res = await fetch(absoluteUrl, options);

  // Auto logout on 401 Unauthorized (session expired)
  if (res.status === 401) {
    await signOut();
    if (typeof window !== "undefined") {
      window.location.href = `/auth/signin`;
    }
  }

  return res;
}

/**
 * Convenient wrapper with JSON response
 */
export async function authFetchJSON<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await authFetch(url, options);

    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return { ok: false, error: "Invalid response format" };
    }

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || "Request failed" };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}
