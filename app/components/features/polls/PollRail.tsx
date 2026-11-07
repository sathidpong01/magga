"use client";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";
import type { PublicPoll } from "@/lib/polls/types";
import PollSummary from "./PollSummary";

export default function PollRail({ polls }: { polls: PublicPoll[] }) {
  if (!polls.length) return null;
  return (
    <Box component="section" aria-label="โพลชุมชน" sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 36,
          mb: 0.5,
        }}
      >
        <Typography
          component="h2"
          variant="body2"
          sx={{ color: maggaColors.textSecondary, fontWeight: 600 }}
        >
          โพลชุมชน
        </Typography>
        <Box
          component={Link}
          href="/polls"
          sx={{
            color: maggaColors.textSecondary,
            fontSize: "0.75rem",
            textDecoration: "none",
            py: 1,
          }}
        >
          ดูทั้งหมด →
        </Box>
      </Box>
      <Box
        tabIndex={0}
        aria-label="รายการโพล เลื่อนแนวนอนเพื่อดูเพิ่มเติม"
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: { xs: "240px", sm: "260px" },
          gap: 1.25,
          overflowX: "auto",
          pb: 0.75,
          scrollSnapType: "x proximity",
          scrollbarWidth: "thin",
          scrollbarColor: `${maggaColors.border} transparent`,
          "& > *": { scrollSnapAlign: "start" },
          "&:focus-visible": {
            outline: `2px solid ${maggaColors.archiveGoldHover}`,
            outlineOffset: 2,
          },
        }}
      >
        {polls.map((poll) => (
          <PollSummary key={poll.id} poll={poll} />
        ))}
      </Box>
    </Box>
  );
}
