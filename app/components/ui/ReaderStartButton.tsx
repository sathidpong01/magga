"use client";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { readingEntries } from "@/lib/reader-storage";
export default function ReaderStartButton({
  mangaId,
  totalPages,
}: {
  mangaId: string;
  totalPages: number;
}) {
  const [savedPage, setSavedPage] = useState(0);
  useEffect(() => {
    try {
      const saved = readingEntries(localStorage)[mangaId];
      setSavedPage(saved && saved.page < totalPages - 1 ? saved.page : 0);
    } catch {
      /* Optional progress. */
    }
  }, [mangaId, totalPages]);
  return (
    <Button
      variant="contained"
      href="#reader-start"
      onClick={(event) => {
        event.preventDefault();
        const target =
          document.getElementById(`reader-page-${savedPage}`) ||
          document.getElementById("reader-start");
        target?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      }}
      sx={{ minHeight: 44, mt: 1, mb: 1 }}
    >
      {savedPage > 0 ? `อ่านต่อหน้า ${savedPage + 1}` : "เริ่มอ่าน"}
    </Button>
  );
}
