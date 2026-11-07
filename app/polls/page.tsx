import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Box, Container, Typography } from "@mui/material";
import { pollDatabase } from "@/lib/polls/database";
import { listPolls } from "@/lib/polls/service";
import PollSummary from "@/app/components/features/polls/PollSummary";
import LinkButton from "@/app/components/ui/LinkButton";
import { maggaColors } from "@/lib/design-tokens";
export const metadata: Metadata = {
  title: "โพลชุมชน - MAGGA",
  description: "ร่วมเลือกผลงานและแสดงความคิดเห็นผ่านโพลของชุมชน MAGGA",
};
export default async function PollsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await connection();
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number((await searchParams).page) || 1)),
  );
  const polls = await listPolls(pollDatabase, false, false, "", page);
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography
        component="h1"
        variant="h4"
        sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}
      >
        โพลชุมชน
      </Typography>
      <Typography sx={{ color: maggaColors.textSecondary, mb: 3, mt: 1 }}>
        ร่วมโหวตเลือกสิ่งที่อยากเห็นบน Magga
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,minmax(0,1fr))",
            md: "repeat(3,minmax(0,1fr))",
          },
          gap: 1.5,
        }}
      >
        {polls.map((poll) => (
          <PollSummary key={poll.id} poll={poll} />
        ))}
      </Box>
      {!polls.length && (
        <Typography sx={{ py: 4, color: maggaColors.textSecondary }}>
          ยังไม่มีโพลในหน้านี้ <Link href="/">กลับไปเลือกอ่านมังงะ</Link>
        </Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        {page > 1 && (
          <LinkButton variant="text" href={`/polls?page=${page - 1}`}>
            ก่อนหน้า
          </LinkButton>
        )}
        {polls.length === 20 && (
          <LinkButton
            variant="text"
            href={`/polls?page=${page + 1}`}
            sx={{ ml: "auto" }}
          >
            ถัดไป
          </LinkButton>
        )}
      </Box>
    </Container>
  );
}
