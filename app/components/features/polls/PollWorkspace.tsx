"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { authFetch } from "@/lib/auth-fetch";
import { maggaColors } from "@/lib/design-tokens";
import { pollStateLabels, type AdminPoll } from "@/lib/polls/types";
import { useToast } from "@/app/contexts/ToastContext";
import PollForm from "./PollForm";
import PollResults from "./PollResults";

type Activity = {
  ballots: {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[];
  history: {
    action: string;
    reason: string;
    actor_id: string;
    created_at: string;
  }[];
  timeline: { hour: string; votes: number }[];
  security: { reason: string; count: number }[];
};
const date = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
const actionLabels: Record<string, string> = {
  create: "สร้างฉบับร่าง",
  update: "แก้ไขการตั้งค่า",
  publish: "เผยแพร่",
  pause: "พักรับโหวต",
  resume: "เปิดรับต่อ",
  close: "ปิดโพล",
  archive: "จัดเก็บ",
  "exclude-ballot": "คัดออกบัตร",
  "restore-ballot": "คืนสถานะบัตร",
};
export default function PollWorkspace({ initial }: { initial: AdminPoll }) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [poll, setPoll] = useState(initial);
  const [tab, setTab] = useState(initial.status === "draft" ? 0 : 1);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [confirm, setConfirm] = useState<string | null>(null);
  const [ballot, setBallot] = useState("");
  const [reason, setReason] = useState("");
  const refresh = useCallback(async () => {
    const response = await authFetch(
      `/api/admin/polls/${initial.id}?page=${page}`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    );
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    setPoll(body.poll);
    setActivity(body);
  }, [initial.id, page]);
  useEffect(() => {
    void refresh().catch((cause) =>
      showError(cause instanceof Error ? cause.message : "โหลดข้อมูลไม่ได้"),
    );
  }, [refresh, showError]);
  useEffect(() => {
    if (tab === 0 || poll.state === "closed" || poll.state === "archived")
      return;
    const timer = setInterval(() => {
      if (!document.hidden) void refresh().catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, [refresh, tab, poll.state]);
  async function action(command: string) {
    setBusy(true);

    try {
      const response = await authFetch(`/api/admin/polls/${poll.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: command, version: poll.version }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setPoll(body);
      setConfirm(null);
      showSuccess("อัปเดตสถานะโพลแล้ว");
      await refresh();
    } catch (cause) {
      showError(
        cause instanceof Error ? cause.message : "เปลี่ยนสถานะไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }
  async function duplicate() {
    setBusy(true);

    try {
      const response = await authFetch(`/api/admin/polls/${poll.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      router.push(`/dashboard/admin/polls/${body.id}`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "ทำสำเนาไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  async function moderate() {
    const selected = activity?.ballots.find((item) => item.id === ballot);
    if (!selected) return;
    setBusy(true);

    try {
      const response = await authFetch(`/api/admin/polls/${poll.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: selected.status === "counted" ? "exclude" : "restore",
          ballotId: ballot,
          reason,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setReason("");
      setBallot("");
      showSuccess("บันทึกผลการตรวจสอบแล้ว");
      await refresh();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box>
      <Button
        component={Link}
        href="/dashboard/admin/polls"
        sx={{ mb: 1, color: maggaColors.textSecondary }}
      >
        ← กลับรายการโพล
      </Button>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "1.8rem" },
            flex: "1 1 260px",
            overflowWrap: "anywhere",
            height: { xs: 76, sm: 92 },
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {poll.title}
        </Typography>
        <Chip
          label={pollStateLabels[poll.state]}
          variant="outlined"
          size="small"
        />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {poll.status === "draft" && (
          <Button
            variant="contained"
            disabled={busy || dirty}
            onClick={() => setConfirm("publish")}
            sx={{
              bgcolor: maggaColors.archiveGold,
              color: maggaColors.background,
            }}
          >
            เผยแพร่โพล
          </Button>
        )}
        {(poll.state === "open" || poll.state === "scheduled") && (
          <Button
            disabled={busy || dirty}
            onClick={() => void action("pause")}
            variant="outlined"
          >
            พักรับโหวต
          </Button>
        )}
        {poll.state === "paused" && (
          <Button
            disabled={busy || dirty}
            onClick={() => void action("resume")}
            variant="outlined"
          >
            เปิดรับต่อ
          </Button>
        )}
        {(poll.status === "published" || poll.status === "paused") &&
          poll.state !== "closed" && (
            <Button
              disabled={busy || dirty}
              onClick={() => setConfirm("close")}
              color="error"
            >
              ปิดโพล
            </Button>
          )}
        {(poll.state === "closed" || poll.state === "draft") && (
          <Button
            disabled={busy || dirty}
            onClick={() => setConfirm("archive")}
          >
            จัดเก็บ
          </Button>
        )}
        {poll.status !== "draft" && poll.status !== "archived" && (
          <Button
            component={Link}
            href={`/polls/${poll.id}`}
            target="_blank"
            endIcon={<OpenInNewIcon />}
            sx={{ color: maggaColors.textSecondary }}
          >
            หน้าสาธารณะ
          </Button>
        )}
        <Button onClick={() => void duplicate()} disabled={busy || dirty}>
          ทำสำเนา
        </Button>
        <Button
          component="a"
          href={`/api/admin/polls/${poll.id}/export`}
          sx={{ ml: { md: "auto" } }}
        >
          ดาวน์โหลด CSV
        </Button>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        {dirty ? "บันทึกการแก้ไขก่อนเปลี่ยนสถานะโพล" : "\u00a0"}
      </Typography>
      {confirm && (
        <Alert
          severity={confirm === "close" ? "warning" : "info"}
          sx={{ mb: 2 }}
        >
          <Typography>
            {confirm === "publish"
              ? `เผยแพร่ “${poll.title}” ตามช่วงเวลาที่ตั้งไว้? ${poll.showOnHome && poll.visibility === "public" ? "โพลจะปรากฏบนหน้าหลักเมื่อเปิดรับโหวต" : ""}`
              : confirm === "close"
                ? "ปิดรับโหวตทันที? บัตรที่บันทึกแล้วจะยังอยู่ และไม่สามารถเปิดโพลที่ปิดแล้วซ้ำได้"
                : "จัดเก็บโพลและนำออกจากหน้าสาธารณะ? ประวัติและคะแนนจะยังอยู่"}
          </Typography>
          <Button onClick={() => void action(confirm)} disabled={busy || dirty}>
            ยืนยัน
          </Button>
          <Button onClick={() => setConfirm(null)} disabled={busy}>
            ยกเลิก
          </Button>
        </Alert>
      )}
      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="จัดการโพล"
        sx={{ borderBottom: `1px solid ${maggaColors.border}`, mb: 2 }}
      >
        <Tab label="การตั้งค่า" />
        <Tab label="ผลโหวต" />
        <Tab label="ตรวจสอบบัตร" />
        <Tab label="ประวัติ" />
      </Tabs>
      <Box hidden={tab !== 0}>
        <PollForm initial={poll} onSaved={setPoll} onDirtyChange={setDirty} />
      </Box>
      {tab === 1 && (
        <Box sx={{ maxWidth: 850 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              คัดออก {poll.excluded} บัตร · อัปเดต {date(poll.serverNow)}
            </Typography>
            <Button
              onClick={() =>
                void refresh().catch((cause) => showError(String(cause)))
              }
            >
              อัปเดตผล
            </Button>
          </Box>
          <PollResults poll={poll} />
          {Boolean(activity?.timeline.length) && (
            <Box sx={{ mt: 4 }}>
              <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                บัตรโหวตรายชั่วโมง (7 วันล่าสุด)
              </Typography>
              {activity?.timeline.map((item) => (
                <Box
                  key={item.hour}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ minWidth: 110 }}>
                    {date(item.hour)}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      bgcolor: maggaColors.surfaceElevated,
                      height: 6,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: maggaColors.archiveGold,
                        width: `${(item.votes / Math.max(1, ...activity.timeline.map((t) => t.votes))) * 100}%`,
                        height: "100%",
                      }}
                    />
                  </Box>
                  <Typography variant="caption">{item.votes}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
      {tab === 2 && (
        <Box>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            ตรวจสอบบัตรตามเวลาโดยไม่แสดง IP หรือตัวตนผู้โหวต
            การคัดออกและคืนสถานะต้องระบุเหตุผลทุกครั้ง
          </Typography>
          <Typography component="h2" variant="h6">
            คำขอที่ถูกปฏิเสธใน 7 วันล่าสุด
          </Typography>
          <Typography variant="caption" color="text.secondary">
            เป็นสัญญาณประกอบการตรวจสอบ
            การลองส่งซ้ำหรือยืนยันหมดอายุไม่ได้หมายถึงทุจริตเสมอไป
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, my: 2 }}>
            {activity?.security.length ? (
              activity.security.map((item) => (
                <Chip
                  key={item.reason}
                  variant="outlined"
                  label={`${{ verification: "การยืนยันไม่ผ่าน", rate: "ส่งถี่เกินไป", duplicate: "ใช้สิทธิ์แล้ว", closed: "นอกเวลาโหวต" }[item.reason] ?? item.reason}: ${item.count}`}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                ยังไม่มีคำขอที่ถูกปฏิเสธ
              </Typography>
            )}
          </Box>
          <Stack spacing={2} sx={{ maxWidth: 680, mb: 3 }}>
            <TextField
              select
              label="เลือกบัตรที่จะตรวจสอบ"
              value={ballot}
              onChange={(e) => setBallot(e.target.value)}
            >
              <MenuItem value="">ยังไม่เลือก</MenuItem>
              {activity?.ballots.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {date(item.created_at)} · {item.id.slice(0, 8)} ·{" "}
                  {item.status === "counted" ? "นับผล" : "คัดออก"}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="เหตุผลการคัดออกหรือคืนสถานะ"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              minRows={2}
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
            <Button
              variant="outlined"
              disabled={!ballot || !reason.trim() || busy}
              onClick={() => void moderate()}
              sx={{ alignSelf: "start" }}
            >
              {activity?.ballots.find((item) => item.id === ballot)?.status ===
              "excluded"
                ? "คืนสถานะบัตร"
                : "คัดออกจากผลโหวต"}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            หน้าละ 30 บัตร ไม่มีการแก้จำนวนคะแนนโดยตรง
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              disabled={page === 1}
              onClick={() => {
                setPage((value) => value - 1);
                setBallot("");
              }}
            >
              ก่อนหน้า
            </Button>
            <Button
              disabled={(activity?.ballots.length ?? 0) < 30}
              onClick={() => {
                setPage((value) => value + 1);
                setBallot("");
              }}
            >
              ถัดไป
            </Button>
          </Box>
        </Box>
      )}
      {tab === 3 && (
        <Box>
          {activity?.history.map((item, index) => (
            <Box
              key={`${item.created_at}-${index}`}
              sx={{ py: 1.5, borderBottom: `1px solid ${maggaColors.border}` }}
            >
              <Typography>
                {actionLabels[item.action] ?? item.action}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {date(item.created_at)} · ผู้ดำเนินการ {item.actor_id}
              </Typography>
              {item.reason && (
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {item.reason}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
