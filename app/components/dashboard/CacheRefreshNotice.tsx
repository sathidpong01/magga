"use client";

import { useRef, useState } from "react";
import { Alert, Button } from "@mui/material";
import { authFetch } from "@/lib/auth-fetch";

export default function CacheRefreshNotice({ onRefreshed }: { onRefreshed: () => void }) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const refresh = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const response = await authFetch("/api/admin/manga/cache-refresh", {
        method: "POST", signal: AbortSignal.timeout(15_000), cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || result.cache_refresh_pending !== false || result.success !== true) throw new Error("Cache refresh pending");
      onRefreshed();
    } catch { setFailed(true); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Alert severity="warning" sx={{ mb: 2 }} action={
    <Button color="inherit" disabled={busy} onClick={refresh} sx={{ minHeight: 44 }}>
      {busy ? "กำลังอัปเดต..." : "อัปเดตแคชอีกครั้ง"}
    </Button>
  }>
    บันทึกข้อมูลแล้ว แต่หน้าเว็บสาธารณะยังอาจแสดงข้อมูลเดิม กดอัปเดตแคชโดยไม่ต้องบันทึกข้อมูลซ้ำ
    {failed && " — ยังอัปเดตไม่ได้ กรุณาลองใหม่อีกครั้ง"}
  </Alert>;
}
