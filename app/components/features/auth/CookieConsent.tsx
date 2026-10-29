"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Alert, Box, Typography, Button, Paper, Portal, Link } from "@mui/material";
import { maggaColors, maggaRadii, maggaShadows } from "@/lib/design-tokens";
import { CONSENT_CHANGED, OPEN_PRIVACY_SETTINGS, consentFromCookies, consumePrivacySettingsRequest } from "@/lib/privacy-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      try {
        if (localStorage.getItem("isAgeVerified") && consentFromCookies(document.cookie) === null) {
          timer = setTimeout(() => setVisible(true), 1500);
        }
      } catch { /* Settings remain available from the footer. */ }
    };
    const open = () => {
      consumePrivacySettingsRequest();
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setVisible(true);
      setError("");
      requestAnimationFrame(() => firstButton.current?.focus());
    };
    check();
    window.addEventListener("magga-age-verified", check);
    window.addEventListener(OPEN_PRIVACY_SETTINGS, open);
    window.addEventListener("focus", check);
    if (consumePrivacySettingsRequest()) open();
    const interval = window.setInterval(check, 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("magga-age-verified", check);
      window.removeEventListener(OPEN_PRIVACY_SETTINGS, open);
      window.removeEventListener("focus", check);
    };
  }, []);

  const save = async (statistics: boolean) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    const wasAccepted = consentFromCookies(document.cookie) === true;
    try {
      const response = await fetch("/api/privacy/consent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statistics }),
      });
      if (!response.ok || consentFromCookies(document.cookie) !== statistics) throw new Error("Consent not saved");
      try {
        localStorage.removeItem("cookieConsent");
        localStorage.setItem("magga-consent-updated", String(Date.now()));
      } catch { /* The server cookie is the source of truth. */ }
      window.dispatchEvent(new Event(CONSENT_CHANGED));
      setVisible(false);
      opener.current?.focus();
      // Remove previously loaded analytics scripts and listeners after withdrawal.
      if (wasAccepted && !statistics) window.location.reload();
    } catch {
      setError("บันทึกตัวเลือกไม่ได้ กรุณาอนุญาตคุกกี้ของเว็บไซต์แล้วลองอีกครั้ง");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!visible) return null;
  return (
    <Portal>
      <Paper role="region" aria-labelledby="privacy-choice-title" aria-describedby="privacy-choice-description" aria-busy={saving}
        sx={{ position: "fixed", bottom: { xs: 12, md: 20 }, left: { xs: 12, md: 20 },
          width: "calc(100% - 24px)", maxWidth: 420, maxHeight: "calc(100dvh - 24px)", overflowY: "auto",
          boxSizing: "border-box", p: 2, borderRadius: `${maggaRadii.card}px`, bgcolor: maggaColors.surface,
          color: maggaColors.textPrimary, border: `1px solid ${maggaColors.border}`, zIndex: 1300, boxShadow: maggaShadows.authPanelDepth }}>
        <Typography id="privacy-choice-title" component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>ความเป็นส่วนตัวของคุณ</Typography>
        <Typography id="privacy-choice-description" variant="body2" sx={{ mt: 1, color: maggaColors.textSecondary, lineHeight: 1.75 }}>
          คุกกี้ที่จำเป็นใช้สำหรับล็อกอินและจำสิทธิ์คอมเมนต์ผู้เยี่ยมชม ส่วนการยืนยันอายุและอ่านต่อจะจำไว้ในเบราว์เซอร์
          คุณเลือกได้ว่าจะอนุญาตสถิติยอดอ่าน การแสดงและคลิกโฆษณา รวมถึงการวิเคราะห์ผู้เข้าชมและความเร็วเว็บของ Vercel หรือไม่ ปฏิเสธแล้วยังอ่านและใช้บัญชีได้
        </Typography>
        <Link component={NextLink} href="/privacy" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: maggaColors.archiveGoldHover }}>อ่านนโยบายความเป็นส่วนตัว</Link>
        <Typography variant="caption" component="p" sx={{ color: maggaColors.textSecondary, mb: 1.5 }}>เปลี่ยนตัวเลือกได้ที่ “ตั้งค่าความเป็นส่วนตัว” ท้ายเว็บ เราจำตัวเลือกไว้ 180 วัน</Typography>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, "& button": { minHeight: 44, flex: "1 1 160px", borderRadius: `${maggaRadii.md}px`, color: maggaColors.textPrimary, borderColor: maggaColors.borderStrong } }}>
          <Button ref={firstButton} variant="outlined" disabled={saving} onClick={() => void save(false)}>ใช้เฉพาะที่จำเป็น</Button>
          <Button variant="outlined" disabled={saving} onClick={() => void save(true)}>อนุญาตสถิติเพิ่มเติม</Button>
        </Box>
      </Paper>
    </Portal>
  );
}
