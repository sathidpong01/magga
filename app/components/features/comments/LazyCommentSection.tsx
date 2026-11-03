"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Button } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";
import CommentSectionPlaceholder, { commentSectionSx } from "./CommentSectionPlaceholder";

const CommentSection = dynamic(() => import("./CommentSection"), {
  loading: () => <CommentSectionPlaceholder />,
});
function CommentBoundary(props: { mangaId: string; imageIndex?: number | null; title?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (active || !host.current) return;
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setActive(true); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [active]);
  return <Box ref={host} sx={{ ...commentSectionSx, color: maggaColors.textSecondary }}>
    {active ? <CommentSection {...props} /> : <Box sx={{ position: "relative" }}>
      <Box aria-hidden="true"><CommentSectionPlaceholder /></Box>
      <Button onClick={() => setActive(true)} sx={{ position: "absolute", top: 0, left: 0, minHeight: 44, bgcolor: maggaColors.background }}>โหลดความคิดเห็น</Button>
    </Box>}
  </Box>;
}
export default function LazyCommentSection(props: { mangaId: string; imageIndex?: number | null; title?: string }) {
  return <CommentBoundary key={`${props.mangaId}:${props.imageIndex ?? "all"}`} {...props} />;
}
