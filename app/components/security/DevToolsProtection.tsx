"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, isAdminRole } from "@/lib/auth-client";
import { Box, Button, Paper, Portal, Typography } from "@mui/material";
import { maggaColors, maggaRadii, maggaShadows } from "@/lib/design-tokens";
import { installReaderProtection } from "@/lib/reader-protection";

export default function DevToolsProtection() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [windowSizeHint, setWindowSizeHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const disabled =
    isAdminRole(session) || process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_LIGHTHOUSE_TESTING === "true";

  useEffect(() => {
    if (disabled) return;
    return installReaderProtection(active => {
      setWindowSizeHint(active);
      setDismissed(false);
    });
  }, [disabled, pathname]);

  if (disabled || !windowSizeHint || dismissed) return null;

  // Window dimensions cannot prove inspection. Never lock or cover the reader.
  return (
    <Portal>
      <Box
        className="magga-reader-notice"
        sx={{ position: "fixed", bottom: 24, right: 16, left: { xs: 16, sm: "auto" }, zIndex: 1400, maxWidth: 360 }}
      >
        <Paper
          role="status"
          sx={{
            p: 2, bgcolor: maggaColors.surfaceElevated, color: maggaColors.textPrimary,
            border: `1px solid ${maggaColors.archiveGoldBorder}`,
            borderRadius: `${maggaRadii.md}px`, boxShadow: maggaShadows.authPanelDepth,
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>โปรดเคารพผลงานผู้แปล</Typography>
          <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>
            อ่านบน MAGGA และหลีกเลี่ยงการคัดลอกภาพไปเผยแพร่ต่อโดยไม่ได้รับอนุญาต
          </Typography>
          <Button onClick={() => setDismissed(true)} sx={{ mt: 1, minHeight: 44, color: maggaColors.archiveGoldHover }}>
            ปิดข้อความ
          </Button>
        </Paper>
      </Box>
    </Portal>
  );
}
