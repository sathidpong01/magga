import useSWR from "swr";

// Default fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  return res.json();
};

// SWR configuration defaults
export const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 3,
};

/**
 * Hook for fetching manga list with caching
 */
export function useMangaList(page: number = 1, limit: number = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/manga?page=${page}&limit=${limit}`,
    fetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    mangas: data?.mangas || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook for fetching single manga by slug
 */
export function useManga(slug: string | null) {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/manga/${slug}` : null,
    fetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
    }
  );

  return {
    manga: data,
    isLoading,
    isError: !!error,
  };
}

/**
 * Hook for fetching categories
 */
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/categories",
    fetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    categories: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook for fetching tags
 */
export function useTags() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/tags",
    fetcher,
    {
      ...swrConfig,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    tags: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook for admin statistics
 */
export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin/stats",
    fetcher,
    {
      ...swrConfig,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export { useSWR };
