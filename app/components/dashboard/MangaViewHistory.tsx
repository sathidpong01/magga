"use client";
import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { maggaColors } from "@/lib/design-tokens";
import { authFetch } from "@/lib/auth-fetch";
import type { HistoryPeriod, ViewHistory, ViewPoint, ViewSummary } from "@/lib/view-history";

const periods: [HistoryPeriod, string][] = [["1", "วันนี้ (รายชั่วโมง)"], ["7", "7 วัน"], ["30", "30 วัน"], ["90", "90 วัน"], ["365", "1 ปี"], ["all", "ตั้งแต่โพสต์ / ข้อมูลทั้งหมด"]];
function dateLabel(value: string, hourly = false) {
  return new Intl.DateTimeFormat("th-TH", hourly ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" } : { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(value.length === 10 ? value + "T00:00:00+07:00" : value));
}
function LineChart({ points, small = false }: { points: ViewPoint[]; small?: boolean }) {
  const maximum = Math.max(1, ...points.map(point => point.views ?? 0));
  const segments: string[] = [];
  let segment: string[] = [];
  points.forEach((point, index) => {
    if (point.views === null) { if (segment.length) segments.push(segment.join(" ")); segment = []; return; }
    segment.push(`${10 + index / Math.max(1, points.length - 1) * 580},${190 - point.views / maximum * 170}`);
  });
  if (segment.length) segments.push(segment.join(" "));
  return <svg viewBox="0 0 600 200" width="100%" height={small ? 26 : 200} preserveAspectRatio="none" role="img" aria-label={small ? "แนวโน้มยอดอ่าน 7 วัน" : `กราฟยอดอ่าน ค่าสูงสุดในช่วง ${maximum.toLocaleString()} ครั้ง`}>
    {!small && [20, 105, 190].map(y => <line key={y} x1="10" x2="590" y1={y} y2={y} stroke={maggaColors.borderStrong} />)}
    {segments.map((value, index) => <polyline key={index} points={value} fill="none" stroke={maggaColors.archiveGoldHover} strokeWidth={small ? 3 : 2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />)}
    {points.map((point, index) => point.views === null ? null : <circle key={index} cx={10 + index / Math.max(1, points.length - 1) * 580} cy={190 - point.views / maximum * 170} r={small ? 2 : points.length < 32 ? 3 : 1} fill={maggaColors.archiveGoldHover} />)}
  </svg>;
}

function HistoryDialog({ id, title, close }: { id: string; title: string; close: () => void }) {
  const [period, setPeriod] = useState<HistoryPeriod>("7");
  const [data, setData] = useState<ViewHistory | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const fullScreen = useMediaQuery("(max-width:600px)");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    void authFetch(`/api/admin/manga/${id}/view-history?period=${period}`, { signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "โหลดสถิติไม่ได้"); return body as ViewHistory; })
      .then(body => { if (!controller.signal.aborted) setData(body); })
      .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, period, retry]);
  return <Dialog open onClose={close} maxWidth="md" fullWidth fullScreen={fullScreen} aria-labelledby="view-history-title">
    <DialogTitle id="view-history-title" sx={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 1 }}>
      <Box sx={{ minWidth: 0 }}><Typography component="span" sx={{ display: "block", fontWeight: 700 }}>สถิติยอดอ่าน</Typography><Typography component="span" variant="body2" sx={{ display: "block", color: maggaColors.textSecondary, overflowWrap: "anywhere" }}>{title}</Typography></Box>
      <IconButton onClick={close} aria-label="ปิดสถิติยอดอ่าน" sx={{ minWidth: 44, minHeight: 44 }}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent>
      <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}><InputLabel id="history-period-label">ช่วงเวลา</InputLabel><Select labelId="history-period-label" label="ช่วงเวลา" value={period} onChange={event => setPeriod(event.target.value as HistoryPeriod)}>{periods.map(([value, label]) => <MenuItem value={value} key={value}>{label}</MenuItem>)}</Select></FormControl>
      <Box sx={{ minHeight: 280 }} aria-live="polite" aria-busy={loading}>
        {loading && <Stack sx={{ minHeight: 280, alignItems: "center", justifyContent: "center" }}><CircularProgress size={28} /><Typography sx={{ mt: 2 }}>กำลังโหลดสถิติ</Typography></Stack>}
        {error && <Alert severity="warning" action={<Button onClick={() => setRetry(value => value + 1)}>ลองใหม่</Button>}>{error}</Alert>}
        {data && <>
          <Typography sx={{ fontWeight: 700 }}>{data.total.toLocaleString()} ครั้งที่มีข้อมูลในช่วงนี้</Typography>
          <Typography variant="body2" color="text.secondary">{dateLabel(data.from)} ถึง {dateLabel(data.to)} · เวลาไทย{data.hourly ? " · รายชั่วโมง" : data.bucketDays > 1 ? ` · รวมทุก ${data.bucketDays} วัน` : " · รายวัน"}</Typography>
          <Typography variant="caption" color="text.secondary">แกนตั้ง 0 ถึง {Math.max(1, ...data.points.map(point => point.views ?? 0)).toLocaleString()} ครั้ง</Typography>
          <LineChart points={data.points} />
          <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption">{dateLabel(data.points[0]?.date ?? data.from, data.hourly)}</Typography><Typography variant="caption">{dateLabel(data.points.at(-1)?.date ?? data.to, data.hourly)}</Typography></Stack>
          <Typography sx={{ mt: 1 }} variant="body2">{data.peak ? `วันที่ยอดอ่านสูงสุด: ${dateLabel(data.peak.date)} · ${data.peak.views.toLocaleString()} ครั้ง` : "ยังไม่มียอดอ่านในช่วงที่มีข้อมูล"}</Typography>
          <Alert severity="info" sx={{ mt: 2 }}>เริ่มเก็บกราฟ {dateLabel(data.startedAt)} ยอดเดิมก่อนเริ่มเก็บ {data.baselineViews.toLocaleString()} ครั้งไม่สามารถแยกย้อนหลังได้ ช่องว่างคือยังไม่มีข้อมูล ยอดวันนี้และวันเริ่มเก็บอาจยังไม่ครบวัน ยอดอ่านใช้กติกาเดิม ไม่นับซ้ำภายใน 10 นาที</Alert>
          <Box component="details" sx={{ mt: 2 }}><Box component="summary" sx={{ cursor: "pointer", minHeight: 44, py: 1 }}>ดูตารางข้อมูล</Box><Box sx={{ maxHeight: 280, overflow: "auto" }}><Box component="table" sx={{ width: "100%", textAlign: "left", "& th, & td": { p: 1, borderBottom: `1px solid ${maggaColors.border}` } }}><thead><tr><th scope="col">{data.hourly ? "เวลา" : data.bucketDays > 1 ? "วันเริ่มช่วง" : "วันที่"}</th><th scope="col">ยอดอ่าน</th></tr></thead><tbody>{data.points.map(point => <tr key={point.date}><td>{dateLabel(point.date, data.hourly)}</td><td>{point.views === null ? "ไม่มีข้อมูล" : point.views.toLocaleString()}</td></tr>)}</tbody></Box></Box></Box>
        </>}
      </Box>
    </DialogContent>
  </Dialog>;
}

export default function MangaViewHistory({ id, title, initial }: { id: string; title: string; initial?: ViewSummary | null }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)} aria-label={`ดูสถิติยอดอ่าน ${title}`} sx={{ display: "flex", flexDirection: "column", height: 48, minWidth: 0, width: "100%", p: 0.5, color: maggaColors.archiveGoldHover }}>
      {initial ? <><LineChart points={initial.points} small /><Typography component="span" sx={{ fontSize: "0.65rem", lineHeight: 1.2 }}>7 วัน · ดูสถิติ</Typography></> : <Typography component="span" variant="caption">ดูสถิติ</Typography>}
    </Button>
    {open && <HistoryDialog id={id} title={title} close={() => setOpen(false)} />}
  </>;
}
