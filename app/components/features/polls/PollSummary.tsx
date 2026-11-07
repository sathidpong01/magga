"use client";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import type { PublicPoll } from "@/lib/polls/types";

export default function PollSummary({ poll }: { poll: PublicPoll | null }) {
  if (!poll) return null;
  return (
    <Box
      component={Link}
      href={`/polls/${poll.id}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        height: 144,
        p: 1.5,
        minWidth: 0,
        color: maggaColors.textPrimary,
        textDecoration: "none",
        bgcolor: maggaColors.surface,
        border: `1px solid ${maggaColors.border}`,
        borderRadius: `${maggaRadii.card}px`,
        "&:hover": { borderColor: maggaColors.archiveGoldBorder },
        "&:focus-visible": {
          outline: `2px solid ${maggaColors.archiveGoldHover}`,
          outlineOffset: 2,
        },
      }}
    >
      <Typography
        component="h3"
        variant="body2"
        sx={{
          fontWeight: 600,
          lineHeight: 1.65,
          height: 46,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          overflowWrap: "anywhere",
        }}
      >
        {poll.title}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: maggaColors.textSecondary, whiteSpace: "nowrap" }}
      >
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mt: "auto",
          minHeight: 24,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: maggaColors.textMuted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {poll.total !== null
            ? `${poll.total.toLocaleString("th-TH")} บัตรโหวต`
            : "โพลชุมชน"}
        </Typography>
        <Box
          component="span"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: "0.8rem",
            color: maggaColors.archiveGoldHover,
          }}
        >
          {poll.state === "open" ? "ร่วมโหวต" : "ดูโพล"}
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Box>
  );
}
