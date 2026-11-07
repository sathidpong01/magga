"use client";
import Image from "next/image";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import { resultsLabels, type PublicPoll } from "@/lib/polls/types";
import PollHelp from "./PollHelp";

export default function PollResults({ poll }: { poll: PublicPoll }) {
  if (!poll.resultsAllowed)
    return (
      <Typography sx={{ py: 3, color: maggaColors.textSecondary }}>
        ผลโหวตแสดงได้{resultsLabels[poll.resultsVisibility]}
        {poll.resultsVisibility === "after_vote" ? " กรุณาร่วมโหวตก่อน" : ""}
      </Typography>
    );
  const options = [...poll.options].sort(
    (a, b) => (b.votes ?? 0) - (a.votes ?? 0),
  );
  return (
    <Box component="section" aria-label="ผลโหวต">
      <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>
        ผลโหวต
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, display: "block" }}
      >
        {(poll.total ?? 0).toLocaleString("th-TH")} บัตรโหวต
        {poll.maxChoices > 1 && (
          <PollHelp text="เปอร์เซ็นต์คิดจากจำนวนบัตรโหวต โพลที่เลือกได้หลายข้ออาจมีผลรวมเกิน 100%" />
        )}
      </Typography>
      <Stack spacing={0}>
        {options.map((option, index) => {
          const percent = poll.total
            ? ((option.votes ?? 0) / poll.total) * 100
            : 0;
          return (
            <Box
              key={option.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
                py: 1,
                borderBottom: `1px solid ${maggaColors.border}`,
              }}
            >
              <Typography
                sx={{
                  width: 22,
                  flexShrink: 0,
                  color: maggaColors.textSecondary,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {index + 1}
              </Typography>
              {option.imageUrl && (
                <Box
                  sx={{
                    position: "relative",
                    width: 36,
                    height: 48,
                    flexShrink: 0,
                    bgcolor: maggaColors.surfaceElevated,
                    borderRadius: `${maggaRadii.sm}px`,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={option.imageUrl}
                    alt=""
                    fill
                    sizes="36px"
                    style={{ objectFit: "contain" }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    alignItems: "baseline",
                    mb: 0.75,
                  }}
                >
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {option.label}
                    {poll.selections.includes(option.id) && (
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          fontSize: "0.8rem",
                          color: maggaColors.archiveGoldHover,
                        }}
                      >
                        คุณเลือก
                      </Box>
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      flexShrink: 0,
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                    }}
                  >
                    {percent.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, percent)}
                  aria-label={`${option.label}: ${percent.toFixed(1)}%`}
                  sx={{
                    height: 5,
                    borderRadius: 1,
                    bgcolor: maggaColors.surfaceElevated,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: maggaColors.archiveGold,
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {(option.votes ?? 0).toLocaleString("th-TH")} คะแนน
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
