"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { authFetch } from "@/lib/auth-fetch";
import { maggaColors } from "@/lib/design-tokens";
import { pollStateLabels, type AdminPoll } from "@/lib/polls/types";
const date = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));

export default function PollManager() {
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await authFetch(
          `/api/admin/polls?search=${encodeURIComponent(query)}&page=${page}&state=${state}&sort=${sort}`,
          { signal: controller.signal },
        );
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setPolls(body);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "โหลดโพลไม่ได้");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [query, page, reload, state, sort]);
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.8rem" } }}
          >
            จัดการโพล
          </Typography>
          <Typography variant="body2" color="text.secondary">
            สร้างโพลชุมชน ตั้งเวลา และตรวจสอบผลโหวต
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/dashboard/admin/polls/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: maggaColors.archiveGold,
            color: maggaColors.background,
            minHeight: 44,
          }}
        >
          สร้างโพล
        </Button>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="ค้นหาโพล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
        <Button
          onClick={() => setReload((value) => value + 1)}
          aria-label="โหลดโพลใหม่"
          disabled={loading}
        >
          <RefreshIcon />
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <TextField
          select
          size="small"
          label="สถานะ"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">ทุกสถานะ</MenuItem>
          {Object.entries(pollStateLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="เรียงตาม"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="newest">ล่าสุด</MenuItem>
          <MenuItem value="ending">เวลาปิด</MenuItem>
          <MenuItem value="votes">จำนวนบัตรโหวต</MenuItem>
        </TextField>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} variant="rounded" height={90} />
          ))}
        </Stack>
      ) : (
        <>
          <Box sx={{ borderTop: `1px solid ${maggaColors.border}` }}>
            {polls.map((poll) => (
              <Box
                key={poll.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 2,
                  borderBottom: `1px solid ${maggaColors.border}`,
                  flexWrap: { xs: "wrap", md: "nowrap" },
                }}
              >
                <Box sx={{ flex: "1 1 260px", minWidth: 0 }}>
                  <Typography
                    component="h2"
                    variant="body1"
                    sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
                  >
                    <Link
                      href={`/dashboard/admin/polls/${poll.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {poll.title}
                    </Link>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ปิด {date(poll.endsAt)}
                    {poll.visibility === "unlisted" ? " · ไม่แสดงในรายการ" : ""}
                    {poll.pinned ? " · ลำดับก่อนบนหน้าหลัก" : ""}
                  </Typography>
                </Box>
                <Chip
                  label={pollStateLabels[poll.state]}
                  size="small"
                  variant="outlined"
                />
                <Typography
                  sx={{ minWidth: 94, fontVariantNumeric: "tabular-nums" }}
                >
                  {(poll.total ?? 0).toLocaleString("th-TH")} บัตร
                </Typography>
                <Button
                  component={Link}
                  href={`/dashboard/admin/polls/${poll.id}`}
                  variant="outlined"
                  size="small"
                  sx={{ minHeight: 44 }}
                >
                  จัดการ
                </Button>
              </Box>
            ))}
          </Box>
          {!polls.length && (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography>
                {query
                  ? "ไม่พบโพลที่ตรงกับคำค้น"
                  : page > 1
                    ? "ไม่มีโพลเพิ่มเติม"
                    : "ยังไม่มีโพล"}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {query
                  ? "ลองเปลี่ยนคำค้นหาหรือล้างช่องค้นหา"
                  : "เริ่มจากสร้างคำถาม เพิ่มตัวเลือก แล้วตรวจทานก่อนเผยแพร่"}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Button
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              ก่อนหน้า
            </Button>
            <Typography variant="caption" color="text.secondary">
              หน้า {page}
            </Typography>
            <Button
              disabled={polls.length < 20}
              onClick={() => setPage((value) => value + 1)}
            >
              ถัดไป
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
