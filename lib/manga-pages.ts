export type MangaPageRecord = {
  url: string;
  width?: number;
  height?: number;
};

function toPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

export function normalizeMangaPages(input: unknown): MangaPageRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((page) => {
    if (typeof page === "string") {
      const url = page.trim();
      return url ? [{ url }] : [];
    }

    if (page && typeof page === "object") {
      const rawUrl = (page as { url?: unknown }).url;
      if (typeof rawUrl !== "string") {
        return [];
      }

      const url = rawUrl.trim();
      if (!url) {
        return [];
      }

      return [
        {
          url,
          width: toPositiveNumber((page as { width?: unknown }).width),
          height: toPositiveNumber((page as { height?: unknown }).height),
        },
      ];
    }

    return [];
  });
}

export function extractMangaPageUrls(input: unknown): string[] {
  return normalizeMangaPages(input).map((page) => page.url);
}
