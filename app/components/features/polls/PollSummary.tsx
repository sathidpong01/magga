"use client";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import type { PublicPoll } from "@/lib/polls/types";

export default function PollSummary({
  poll,
  compact = false,
}: {
  poll: PublicPoll | null;
  compact?: boolean;
}) {
  if (!poll) return null;
  return (
    <Box
      component="section"
      aria-label="โพลชุมชน"
      sx={{
        mb: compact ? 2 : 0,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        bgcolor: maggaColors.surface,
        border: `1px solid ${maggaColors.border}`,
        borderRadius: `${maggaRadii.card}px`,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: { xs: "wrap", sm: "nowrap" },
      }}
    >
      <HowToVoteOutlinedIcon
        sx={{
          color: maggaColors.textSecondary,
          fontSize: 22,
          display: { xs: "none", sm: "block" },
        }}
      />
      <Box sx={{ flex: "1 1 220px", minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: maggaColors.textSecondary }}>
          โพลชุมชน
        </Typography>
        <Typography
          component="h2"
          variant="body1"
          sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
        >
          <Link
            href={`/polls/${poll.id}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {poll.title}
          </Link>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {poll.total !== null &&
            `${poll.total.toLocaleString("th-TH")} บัตรโหวต · `}
          ปิด{" "}
          {new Intl.DateTimeFormat("th-TH", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Bangkok",
          }).format(new Date(poll.endsAt))}{" "}
          น.
        </Typography>
      </Box>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}
      >
        {compact && (
          <Button
            component={Link}
            href="/polls"
            size="small"
            sx={{ color: maggaColors.textSecondary, minHeight: 44 }}
          >
            ดูโพลทั้งหมด
          </Button>
        )}
        <Button
          component={Link}
          href={`/polls/${poll.id}`}
          variant="outlined"
          size="small"
          sx={{
            minHeight: 44,
            color: maggaColors.archiveGoldHover,
            borderColor: maggaColors.archiveGoldBorder,
          }}
        >
          {poll.state === "open" ? "ร่วมโหวต" : "ดูโพล"}
        </Button>
      </Box>
    </Box>
  );
}
