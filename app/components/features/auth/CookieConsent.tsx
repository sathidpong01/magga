"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Alert, Box, Typography, Button, IconButton, Paper, Portal, Link } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
    const open = () => {
      consumePrivacySettingsRequest();
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setVisible(true);
      setError("");
      requestAnimationFrame(() => firstButton.current?.focus());
    };
    window.addEventListener(OPEN_PRIVACY_SETTINGS, open);
    if (consumePrivacySettingsRequest()) open();
    return () => {
      window.removeEventListener(OPEN_PRIVACY_SETTINGS, open);
    };
  }, []);

  const save = async (statistics: boolean) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const wasAccepted = consentFromCookies(document.cookie) === true;
      const response = await fetch("/api/privacy/consent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statistics }),
      });
      if (!response.ok) throw new Error("Consent request failed");
      if (consentFromCookies(document.cookie) !== statistics) {
        setError("บันทึกตัวเลือกไม่สำเร็จ กรุณาเปิดใช้งานคุกกี้ในเบราว์เซอร์แล้วลองใหม่อีกครั้ง");
        return;
      }
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
      setError("บันทึกตัวเลือกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: 1 }}>
          <Typography id="privacy-choice-title" component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>ความเป็นส่วนตัวของคุณ</Typography>
          <IconButton aria-label="ปิดการตั้งค่าความเป็นส่วนตัว" disabled={saving} onClick={() => {
            setVisible(false);
            setError("");
            opener.current?.focus();
          }} sx={{ width: 44, height: 44, color: maggaColors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography id="privacy-choice-description" variant="body2" sx={{ mt: 1, color: maggaColors.textSecondary, lineHeight: 1.75 }}>
          เว็บไซต์ใช้คุกกี้จำเป็นสำหรับเข้าสู่ระบบและคอมเมนต์ ยอดอ่านพื้นฐานนับได้โดยไม่ใช้คุกกี้ระบุตัวผู้อ่าน ส่วนการวิเคราะห์การใช้งานและสถิติโฆษณาเพิ่มเติมจะทำงานเมื่อคุณอนุญาตเท่านั้น
        </Typography>
        <Link component={NextLink} href="/privacy" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: maggaColors.archiveGoldHover }}>อ่านนโยบายความเป็นส่วนตัว</Link>
        <Typography variant="caption" component="p" sx={{ color: maggaColors.textSecondary, mb: 1.5 }}>เปลี่ยนการตั้งค่าได้ที่ “ตั้งค่าความเป็นส่วนตัว” ท้ายเว็บ (บันทึกไว้ 180 วัน)</Typography>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, "& button": { minHeight: 44, flex: "1 1 160px", borderRadius: `${maggaRadii.md}px`, color: maggaColors.textPrimary, borderColor: maggaColors.borderStrong } }}>
          <Button ref={firstButton} variant="outlined" disabled={saving} onClick={() => void save(false)}>ใช้เฉพาะที่จำเป็น</Button>
          <Button variant="outlined" disabled={saving} onClick={() => void save(true)}>อนุญาตคุกกี้วัดผล</Button>
        </Box>
      </Paper>
    </Portal>
  );
}
