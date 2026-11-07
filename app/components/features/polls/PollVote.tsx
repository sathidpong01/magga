"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Radio,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PollHelp from "./PollHelp";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import {
  getPollState,
  pollStateLabels,
  type PublicPoll,
} from "@/lib/polls/types";
import { GuestVerification } from "@/app/components/features/comments/guest-client";
import PollResults from "./PollResults";

const date = (value: string) =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
function remaining(end: string, now: number) {
  const minutes = Math.max(0, Math.ceil((Date.parse(end) - now) / 60000));
  if (minutes >= 1440)
    return `เหลือ ${Math.floor(minutes / 1440)} วัน ${Math.floor((minutes % 1440) / 60)} ชั่วโมง`;
  if (minutes >= 60)
    return `เหลือ ${Math.floor(minutes / 60)} ชั่วโมง ${minutes % 60} นาที`;
  return minutes > 0 ? `เหลือ ${minutes} นาที` : "หมดเวลาโหวต";
}
export default function PollVote({
  initial,
  resultsOnly = false,
}: {
  initial: PublicPoll;
  resultsOnly?: boolean;
}) {
  const [poll, setPoll] = useState(initial);
  const [choices, setChoices] = useState(initial.selections);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [results, setResults] = useState(resultsOnly || initial.hasVoted);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [challenge, setChallenge] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.parse(initial.serverNow));
  const offset = useRef(Date.parse(initial.serverNow) - Date.now());
  const pending = useRef<{ key: string; payload: string } | null>(null);
  const sending = useRef(false);
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/polls/${initial.id}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || "โหลดโพลไม่ได้");
    const fresh: PublicPoll = value;
    offset.current = Date.parse(fresh.serverNow) - Date.now();
    setPoll(fresh);
    setNow(Date.parse(fresh.serverNow));
    return fresh;
  }, [initial.id]);
  const identify = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/polls/${initial.id}/identity`, {
        method: "POST",
        signal: AbortSignal.timeout(10000),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setSiteKey(value.siteKey);
      setReady(true);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ระบบยังไม่พร้อม");
    }
  }, [initial.id, refresh]);
  useEffect(() => {
    void identify();
  }, [identify]);
  useEffect(() => {
    const clock = window.setInterval(
      () => setNow(Date.now() + offset.current),
      1000,
    );
    let failures = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (
        !document.hidden &&
        (poll.state === "open" ||
          poll.state === "scheduled" ||
          poll.state === "paused")
      ) {
        try {
          await refresh();
          failures = 0;
        } catch {
          failures++;
        }
      }
      timeout = setTimeout(tick, failures ? 60000 : 15000);
    };
    timeout = setTimeout(tick, 15000);
    return () => {
      clearInterval(clock);
      clearTimeout(timeout);
    };
  }, [refresh, poll.state]);
  const state =
    poll.state === "open" || poll.state === "scheduled"
      ? getPollState(
          { status: "published", startsAt: poll.startsAt, endsAt: poll.endsAt },
          now,
        )
      : poll.state;
  const canVote = state === "open" && (!poll.hasVoted || poll.allowChange);
  function toggle(id: string) {
    setError("");
    setChoices((old) =>
      poll.maxChoices === 1
        ? [id]
        : old.includes(id)
          ? old.filter((value) => value !== id)
          : old.length < poll.maxChoices
            ? [...old, id]
            : old,
    );
  }
  async function submit() {
    if (sending.current) return;
    if (choices.length < poll.minChoices || choices.length > poll.maxChoices) {
      setError(
        `กรุณาเลือก ${poll.minChoices === poll.maxChoices ? poll.maxChoices : `${poll.minChoices}–${poll.maxChoices}`} ข้อ`,
      );
      return;
    }
    if (!token) {
      setError("กรุณายืนยันว่าคุณไม่ใช่บอตก่อนส่งโหวต");
      setChallenge((value) => value + 1);
      return;
    }
    sending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const payload = JSON.stringify([...choices].sort());
    if (pending.current?.payload !== payload)
      pending.current = { key: crypto.randomUUID(), payload };
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choices,
          requestId: pending.current.key,
          token,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      if (!response.ok) {
        const seconds = response.headers.get("Retry-After");
        throw new Error(
          body.error + (seconds ? ` (ลองใหม่ใน ${seconds} วินาที)` : ""),
        );
      }
      setNotice("บันทึกโหวตของคุณแล้ว");
      setResults(true);
      const fresh = await refresh();
      setChoices(fresh.selections);
      pending.current = null;
    } catch (cause) {
      try {
        const fresh = await refresh();
        if (
          fresh.hasVoted &&
          JSON.stringify([...fresh.selections].sort()) === payload
        ) {
          setNotice("ตรวจสอบแล้ว บันทึกโหวตของคุณเรียบร้อย");
          setResults(true);
          pending.current = null;
        } else
          setError(
            cause instanceof Error
              ? cause.message
              : "ยังยืนยันผลการส่งไม่ได้ กรุณาลองใหม่",
          );
      } catch {
        setError(
          "ยังยืนยันผลการส่งไม่ได้ กรุณาลองใหม่ ระบบจะตรวจคำขอเดิมก่อนเพิ่มคะแนน",
        );
      }
    } finally {
      setToken(null);
      setChallenge((value) => value + 1);
      sending.current = false;
      setBusy(false);
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/polls/${poll.id}`,
      );
      setNotice("คัดลอกลิงก์โพลแล้ว");
    } catch {
      setError("คัดลอกไม่ได้ กรุณาคัดลอกลิงก์จากแถบที่อยู่");
    }
  }
  return (
    <Box sx={{ py: { xs: 1.5, sm: 2 }, maxWidth: 960, mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 1, fontSize: "0.8rem" }}>
        <Link href="/" style={{ color: "inherit" }}>
          หน้าแรก
        </Link>
        <Link href="/polls" style={{ color: "inherit" }}>
          โพลชุมชน
        </Link>
        <Typography variant="body2">โหวต</Typography>
      </Breadcrumbs>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
        <Chip label={pollStateLabels[state]} size="small" variant="outlined" />
        <Typography variant="caption" color="text.secondary">
          {poll.maxChoices === 1
            ? "เลือกได้ 1 ข้อ"
            : `เลือกได้ ${poll.minChoices}–${poll.maxChoices} ข้อ`}
        </Typography>
      </Stack>
      <Typography
        component="h1"
        variant="h4"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.35rem", sm: "1.7rem" },
          overflowWrap: "anywhere",
        }}
      >
        {poll.title}
      </Typography>
      {poll.description && (
        <Box>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              color: maggaColors.textSecondary,
              mt: 0.5,
              maxWidth: "70ch",
              ...(!descriptionExpanded
                ? {
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }
                : {}),
            }}
          >
            {poll.description}
          </Typography>
          {poll.description.length > 120 && (
            <Button
              size="small"
              onClick={() => setDescriptionExpanded((value) => !value)}
            >
              {descriptionExpanded ? "ย่อรายละเอียด" : "อ่านรายละเอียด"}
            </Button>
          )}
        </Box>
      )}
      {poll.coverImageUrl && (
        <Box sx={{ position: "relative", height: { xs: 120, sm: 160 }, mt: 1 }}>
          <Image
            src={poll.coverImageUrl}
            alt="ภาพประกอบโพล"
            fill
            sizes="(max-width: 600px) 90vw, 960px"
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
        </Box>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: "block" }}
      >
        {state === "scheduled"
          ? `เปิด ${date(poll.startsAt)}`
          : `ปิด ${date(poll.endsAt)}`}
        <PollHelp
          text={`เปิด ${date(poll.startsAt)} · ปิด ${date(poll.endsAt)} ตามเวลาไทย (UTC+7)`}
        />
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mt: 0.5,
          mb: 1,
          minHeight: 24,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: maggaColors.archiveGoldHover }}
        >
          {state === "open"
            ? remaining(poll.endsAt, now)
            : pollStateLabels[state]}
        </Typography>
        {poll.total !== null && (!results || !poll.resultsAllowed) && (
          <Typography variant="body2" color="text.secondary">
            {poll.total.toLocaleString("th-TH")} บัตรโหวต
          </Typography>
        )}
      </Box>
      {poll.security === "ip" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          โพลนี้จำกัดหนึ่งบัตรต่อ IP ผู้ที่ใช้ Wi-Fi
          หรือเครือข่ายเดียวกันอาจใช้สิทธิ์ร่วมกัน
        </Alert>
      )}
      {poll.security === "members" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          โพลนี้รับเฉพาะสมาชิกที่เข้าสู่ระบบ{" "}
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(`/polls/${poll.id}`)}`}
          >
            เข้าสู่ระบบ
          </Link>
        </Alert>
      )}
      {notice && (
        <Alert severity="success" role="status" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {error}
          {!ready && <Button onClick={() => void identify()}>ลองใหม่</Button>}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          borderBottom: `1px solid ${maggaColors.border}`,
          mb: 1.5,
        }}
      >
        <Button
          onClick={() => setResults(false)}
          aria-pressed={!results}
          sx={{
            color: !results
              ? maggaColors.archiveGoldHover
              : maggaColors.textSecondary,
            minHeight: 44,
          }}
        >
          ร่วมโหวต
        </Button>
        <Button
          onClick={() => setResults(true)}
          aria-pressed={results}
          sx={{
            color: results
              ? maggaColors.archiveGoldHover
              : maggaColors.textSecondary,
            minHeight: 44,
          }}
        >
          ผลโหวต
        </Button>
        <Button
          onClick={() => void share()}
          startIcon={<ContentCopyIcon />}
          sx={{ ml: "auto", color: maggaColors.textSecondary }}
        >
          แชร์
        </Button>
      </Box>
      {results ? (
        <PollResults poll={poll} />
      ) : (
        <>
          {poll.hasVoted && (
            <Typography
              role="status"
              sx={{
                mb: 1,
                color: maggaColors.textSecondary,
                fontSize: "0.85rem",
              }}
            >
              {poll.allowChange
                ? "คุณโหวตแล้ว สามารถเปลี่ยนคำตอบก่อนปิดโพลได้"
                : "คุณโหวตในโพลนี้แล้ว"}
            </Typography>
          )}
          <Box
            component="fieldset"
            disabled={!canVote || busy}
            sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
          >
            <Box
              component="legend"
              sx={{
                position: "absolute",
                width: "1px",
                height: "1px",
                overflow: "hidden",
                clipPath: "inset(50%)",
              }}
            >
              {poll.maxChoices === 1
                ? "เลือกคำตอบของคุณ"
                : `เลือกคำตอบของคุณ (${choices.length}/${poll.maxChoices})`}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: poll.options.some((o) => o.imageUrl)
                  ? {
                      xs: "1fr",
                      sm: "repeat(3,minmax(0,1fr))",
                      md: "repeat(4,minmax(0,1fr))",
                      lg: "repeat(6,minmax(0,1fr))",
                    }
                  : "1fr",
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {poll.options.map((option) => (
                <Box key={option.id} sx={{ minWidth: 0, position: "relative" }}>
                  <Box
                    component="label"
                    sx={{
                      display: { xs: "flex", sm: "block" },
                      alignItems: "center",
                      cursor: canVote ? "pointer" : "default",
                      p: option.imageUrl ? 0 : 0.5,
                      border: `1px solid ${choices.includes(option.id) ? maggaColors.archiveGold : maggaColors.border}`,
                      borderRadius: `${maggaRadii.card}px`,
                      bgcolor: choices.includes(option.id)
                        ? maggaColors.archiveGoldSoft
                        : maggaColors.surface,
                      overflow: "hidden",
                      "&:focus-within": {
                        outline: `2px solid ${maggaColors.archiveGoldHover}`,
                        outlineOffset: 3,
                      },
                    }}
                  >
                    {option.imageUrl && (
                      <Box
                        sx={{
                          aspectRatio: "3 / 4",
                          width: { xs: 48, sm: "100%" },
                          height: { xs: 64, sm: "auto" },
                          flexShrink: 0,
                          position: "relative",
                          bgcolor: maggaColors.surfaceElevated,
                        }}
                      >
                        <Image
                          src={option.imageUrl}
                          alt={option.label}
                          fill
                          sizes="(max-width: 600px) 48px, (max-width: 900px) 28vw, 180px"
                          style={{ objectFit: "contain" }}
                        />
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        minHeight: 44,
                        flex: 1,
                        minWidth: 0,
                        pr: { xs: option.imageUrl ? 5 : 1, sm: 0.5 },
                      }}
                    >
                      {poll.maxChoices === 1 ? (
                        <Radio
                          name="poll-choice"
                          checked={choices.includes(option.id)}
                          onChange={() => toggle(option.id)}
                          value={option.id}
                          slotProps={{ input: { "aria-label": option.label } }}
                          sx={{
                            color: maggaColors.textSecondary,
                            "&.Mui-checked": {
                              color: maggaColors.archiveGoldHover,
                            },
                          }}
                        />
                      ) : (
                        <Checkbox
                          checked={choices.includes(option.id)}
                          onChange={() => toggle(option.id)}
                          value={option.id}
                          disabled={
                            !choices.includes(option.id) &&
                            choices.length >= poll.maxChoices
                          }
                          slotProps={{ input: { "aria-label": option.label } }}
                          sx={{
                            color: maggaColors.textSecondary,
                            "&.Mui-checked": {
                              color: maggaColors.archiveGoldHover,
                            },
                          }}
                        />
                      )}
                      <Typography
                        title={option.label}
                        sx={{
                          minWidth: 0,
                          fontSize: "0.85rem",
                          lineHeight: 1.75,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {option.label}
                      </Typography>
                    </Box>
                  </Box>
                  {option.imageUrl && (
                    <Tooltip title="ดูภาพใหญ่" enterTouchDelay={0}>
                      <IconButton
                        component="a"
                        href={option.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        aria-label={`ดูภาพใหญ่ ${option.label}`}
                        sx={{
                          color: maggaColors.textSecondary,
                          position: "absolute",
                          top: { xs: 10, sm: 4 },
                          right: 4,
                          bgcolor: maggaColors.surface,
                          width: { xs: 44, sm: 28 },
                          height: { xs: 44, sm: 28 },
                          "&:hover": { bgcolor: maggaColors.surfaceElevated },
                        }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          {canVote && (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  ไม่เปิดเผยชื่อผู้โหวต
                </Typography>
                <PollHelp text="ใช้ cookie เพื่อจดจำสิทธิ์โหวตและป้องกันสแปม การปฏิเสธ analytics ไม่ตัดสิทธิ์โหวต" />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                {ready && (
                  <GuestVerification
                    siteKey={siteKey}
                    onToken={setToken}
                    action="poll_vote"
                    requested={challenge}
                  />
                )}
                <Button
                  variant="contained"
                  onClick={() => void submit()}
                  disabled={busy || !ready || !choices.length}
                  sx={{
                    mt: 0.5,
                    minHeight: 44,
                    px: 3,
                    bgcolor: maggaColors.archiveGold,
                    color: maggaColors.background,
                    "&:hover": { bgcolor: maggaColors.archiveGoldHover },
                  }}
                >
                  {busy
                    ? "กำลังบันทึก…"
                    : poll.hasVoted
                      ? "บันทึกคำตอบใหม่"
                      : "ยืนยันการโหวต"}
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
      <Tooltip
        title="อัปเดตประมาณทุก 15 วินาทีขณะเปิดหน้านี้"
        enterTouchDelay={0}
      >
        <Typography
          tabIndex={0}
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5 }}
        >
          อัปเดต {date(poll.serverNow)}
        </Typography>
      </Tooltip>
    </Box>
  );
}
