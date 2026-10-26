"use client";
import { useEffect, useState } from "react";
export function useCatalogOptions<T extends { id: string }>(
  kind: string,
  selected: string[],
) {
  const [items, setItems] = useState<T[]>([]),
    [search, setSearch] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const ids = selected.filter(Boolean).join(",");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(
      () => {
        setError(false);
        const params = new URLSearchParams({
          limit: "20",
          search,
          selected: ids,
        });
        void fetch(`/api/${kind}?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        })
          .then(async (response) => {
            if (!response.ok) throw Error();
            const result = await response.json();
            if (!Array.isArray(result)) throw Error();
            if (!controller.signal.aborted) setItems(result);
          })
          .catch(() => {
            if (!controller.signal.aborted) setError(true);
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      search ? 400 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, search, ids, retry]);
  return {
    items,
    setItems,
    setSearch,
    loading,
    error,
    refresh: () => setRetry((v) => v + 1),
  };
}
