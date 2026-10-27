"use client";
import { useEffect, useId, useState } from "react";
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
  const gradientId = useId();
  const width = small ? 140 : 600, height = small ? 32 : 200;
  const bottom = small ? 28 : 190, plotHeight = small ? 23 : 170;
  const maximum = Math.max(1, ...points.map(point => point.views ?? 0));
  const segments: { line: string; start: number; end: number }[] = [];
  let segment: typeof segments[number] | null = null;
  let previousY = 0;
  const coordinates = points.map((point, index) => {
    const x = 10 + index / Math.max(1, points.length - 1) * (width - 20);
    return { ...point, x, y: bottom - (point.views ?? 0) / maximum * plotHeight };
  });
  for (const { views, x, y } of coordinates) {
    if (views === null) { segment = null; continue; }
    if (!segment) {
      segment = { line: `M${x},${y}`, start: x, end: x };
      segments.push(segment);
    } else {
      const middle = (segment.end + x) / 2;
      segment.line += ` C${middle},${previousY} ${middle},${y} ${x},${y}`;
      segment.end = x;
    }
    previousY = y;
  }
  return <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={small ? 28 : 200} style={{ display: "block", flexShrink: 0 }} preserveAspectRatio="none" role="img" aria-label={small ? "แนวโน้มยอดอ่าน 7 วัน" : `กราฟยอดอ่าน ค่าสูงสุดในช่วง ${maximum.toLocaleString()} ครั้ง`}>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={maggaColors.archiveGoldHover} stopOpacity="0.25" /><stop offset="100%" stopColor={maggaColors.archiveGoldHover} stopOpacity="0.02" /></linearGradient></defs>
    {[bottom - plotHeight, bottom - plotHeight / 2, bottom].map(y => <line key={y} x1="4" x2={width - 4} y1={y} y2={y} stroke={maggaColors.border} vectorEffect="non-scaling-stroke" />)}
    {segments.map(({ line, start, end }, index) => <g key={index}>
      <path d={`${line} L${end},${bottom} L${start},${bottom} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={maggaColors.archiveGoldHover} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </g>)}
    {coordinates.map(point => <g key={point.date}><title>{`${dateLabel(point.date, point.date.length > 10)} · ${point.views === null ? "ยังไม่มีข้อมูล" : `${point.views.toLocaleString()} ครั้ง`}`}</title>
      {point.views === null ? small && <line x1={point.x} x2={point.x} y1={bottom - 2} y2={bottom + 2} stroke={maggaColors.textMuted} vectorEffect="non-scaling-stroke" />
        : <circle cx={point.x} cy={point.y} r={small ? 2.5 : points.length < 32 ? 3 : 1} fill={maggaColors.archiveGoldHover} />}
    </g>)}
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
  const label = initial ? `7 วัน · ${initial.points.reduce((sum, point) => sum + (point.views ?? 0), 0).toLocaleString()} ครั้ง` : "ยังไม่เริ่มเก็บ · ดูสถิติ";
  return <>
    <Button onClick={() => setOpen(true)} title="กดกราฟเพื่อเลือกช่วงเวลาและดูรายละเอียด" aria-label={`ดูสถิติยอดอ่าน ${title} · ${label}`} sx={{ display: "flex", flexDirection: "column", gap: 0.25, height: 48, minWidth: 0, width: "100%", p: 0.25, borderRadius: 1, color: maggaColors.archiveGoldHover, "&:hover": { bgcolor: maggaColors.archiveGoldSoft }, "&.Mui-focusVisible": { outline: `2px solid ${maggaColors.archiveGoldHover}`, outlineOffset: 2 } }}>
      {initial ? <><Typography component="span" noWrap sx={{ fontSize: "0.75rem", lineHeight: "14px", width: "100%", textAlign: "left", fontVariantNumeric: "tabular-nums" }}>{label}</Typography><LineChart points={initial.points} small /></> : <Typography component="span" variant="caption">{label}</Typography>}
    </Button>
    {open && <HistoryDialog id={id} title={title} close={() => setOpen(false)} />}
  </>;
}
