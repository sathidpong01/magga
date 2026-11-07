import { Box, Typography } from "@mui/material";
import LinkButton from "@/app/components/ui/LinkButton";
import PollFormLoading from "@/app/components/features/polls/PollFormLoading";
export default function Loading() {
  return (
    <Box>
      <LinkButton variant="text" href="/dashboard/admin/polls">
        ← กลับรายการโพล
      </LinkButton>
      <Typography
        component="h1"
        variant="h4"
        sx={{
          fontWeight: 700,
          my: 1,
          fontSize: { xs: "1.5rem", sm: "1.8rem" },
        }}
      >
        สร้างโพล
      </Typography>
      <PollFormLoading />
    </Box>
  );
}
