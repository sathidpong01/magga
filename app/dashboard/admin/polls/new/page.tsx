import { Box, Typography } from "@mui/material";
import { requireAdminPage } from "@/lib/auth-helpers";
import PollForm from "@/app/components/features/polls/PollForm";
import LinkButton from "@/app/components/ui/LinkButton";
export const metadata = { title: "สร้างโพล - MAGGA" };
export default async function NewPollPage() {
  await requireAdminPage();
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
      <PollForm />
    </Box>
  );
}
