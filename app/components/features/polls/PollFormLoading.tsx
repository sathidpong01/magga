import { Box, Skeleton } from "@mui/material";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";

export default function PollFormLoading() {
  return (
    <Box
      aria-label="กำลังโหลดแบบฟอร์มโพล"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1fr) 270px" },
        gap: 2,
      }}
    >
      <Box>
        <Box
          sx={{
            py: 1.5,
            height: 116,
            borderBottom: `1px solid ${maggaColors.border}`,
          }}
        >
          <Skeleton variant="rounded" height={43} />
          <Skeleton width={230} height={44} sx={{ mt: 0.5 }} />
        </Box>
        <Box
          sx={{
            py: 1.5,
            height: { xs: 327, md: 253 },
            borderBottom: `1px solid ${maggaColors.border}`,
          }}
        >
          <Skeleton width={120} height={32} sx={{ mb: 1 }} />
          <Skeleton
            variant="rounded"
            sx={{ height: { xs: 96, md: 58 }, mb: 1 }}
          />
          <Skeleton
            variant="rounded"
            sx={{ height: { xs: 96, md: 58 }, mb: 1 }}
          />
          <Skeleton width={250} height={36} />
        </Box>
        <Skeleton variant="rectangular" height={66} />
        <Box
          sx={{
            py: 1.5,
            height: { xs: 176, sm: 120 },
            borderBottom: `1px solid ${maggaColors.border}`,
          }}
        >
          <Skeleton width={200} height={32} sx={{ mb: 1 }} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <Skeleton variant="rounded" height={43} />
            <Skeleton variant="rounded" height={43} />
          </Box>
        </Box>
        <Box sx={{ height: { xs: 116, sm: 68 }, py: 1.5 }}><Skeleton width={156} height={44} variant="rounded" /></Box>
      </Box>
      <Skeleton
        variant="rounded"
        height={480}
        sx={{
          display: { xs: "none", lg: "block" },
          borderRadius: `${maggaRadii.card}px`,
        }}
      />
    </Box>
  );
}
