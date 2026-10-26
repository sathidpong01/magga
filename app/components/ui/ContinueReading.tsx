"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";
import { readingEntries, type ReadingEntry } from "@/lib/reader-storage";

export default function ContinueReading() {
  const [entry, setEntry] = useState<ReadingEntry>();
  useEffect(() => {
    try {
      const latest = Object.values(readingEntries(localStorage))
        .filter(
          (value) =>
            value.page > 0 &&
            value.page < value.totalPages - 1 &&
            typeof value.title === "string" &&
            typeof value.slug === "string" &&
            /^[^/?#]+$/.test(value.slug),
        )
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      setEntry(latest);
      document.documentElement.dataset.maggaResume = latest ? "true" : "false";
    } catch {
      /* Optional device-local history. */
    }
  }, []);
  return (
    <Box className="magga-continue-slot">
      {entry && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            height: 72,
            borderBottom: `1px solid ${maggaColors.border}`,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              อ่านต่อ: {entry.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ค้างไว้หน้า {entry.page + 1}/{entry.totalPages}
            </Typography>
          </Box>
          <Button
            component={Link}
            href={`/${encodeURIComponent(entry.slug!)}#reader-resume`}
            prefetch={false}
            sx={{ minHeight: 44, flexShrink: 0 }}
          >
            อ่านต่อ
          </Button>
        </Box>
      )}
    </Box>
  );
}
