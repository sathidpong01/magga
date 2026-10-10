"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Button, Skeleton } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";

const CommentSection = dynamic(() => import("./CommentSection"), {
  loading: () => <Skeleton variant="rectangular" height={240} aria-label="กำลังโหลดความคิดเห็น" />,
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
  return <Box ref={host} sx={{ minHeight: 240, color: maggaColors.textSecondary }}>
    {active ? <CommentSection {...props} /> : <Button onClick={() => setActive(true)} sx={{ minHeight: 44 }}>โหลดความคิดเห็น</Button>}
  </Box>;
}
export default function LazyCommentSection(props: { mangaId: string; imageIndex?: number | null; title?: string }) {
  return <CommentBoundary key={`${props.mangaId}:${props.imageIndex ?? "all"}`} {...props} />;
}
