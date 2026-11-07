import { Box, Skeleton, Stack } from "@mui/material";
export default function PollLoading() {
  return (
    <Box>
      <Skeleton width={220} height={44} sx={{ mb: 3 }} />
      <Skeleton height={44} sx={{ mb: 2 }} />
      <Stack spacing={1}>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} variant="rounded" height={90} />
        ))}
      </Stack>
    </Box>
  );
}
