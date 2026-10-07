import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";

type TurnstileAPI = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}
let scriptPromise: Promise<void> | undefined;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = undefined;
        script.remove();
        reject(new Error("โหลดการยืนยันไม่ได้ กรุณาลองใหม่"));
      };
      document.head.appendChild(script);
    });
  return scriptPromise;
}
export type CommentActor = {
  kind: "guest" | "member";
  name: string;
  image?: string | null;
  publicCode?: string;
  canVote: boolean;
  requiresVerification?: boolean;
};
export { commentRequest } from "./request";
export function GuestVerification({
  siteKey,
  onToken,
}: {
  siteKey: string | null;
  onToken: (token: string | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const tokenCallback = useRef(onToken);
  useEffect(() => {
    tokenCallback.current = onToken;
  }, [onToken]);
  useEffect(() => {
    if (!active || !siteKey) return;
    let cancelled = false;
    let widget: string | undefined;
    loadScript()
      .then(() => {
        if (cancelled || !host.current || !window.turnstile) return;
        widget = window.turnstile.render(host.current, {
          sitekey: siteKey,
          action: "comment",
          theme: "dark",
          size: "compact",
          callback: (token: string) => tokenCallback.current(token),
          "expired-callback": () => tokenCallback.current(null),
          "error-callback": () => {
            tokenCallback.current(null);
            setError("ยืนยันไม่สำเร็จ กรุณาลองใหม่");
          },
        });
      })
      .catch((cause: Error) => setError(cause.message));
    return () => {
      cancelled = true;
      if (widget) window.turnstile?.remove(widget);
    };
  }, [active, siteKey, attempt]);
  const start = useCallback(() => {
    setError("");
    setActive(true);
    setAttempt((value) => value + 1);
  }, []);
  return (
    <Box sx={{ minHeight: 44, mt: 1 }}>
      {!active && (
        <Button onClick={start} sx={{ minHeight: 44 }}>
          ยืนยันเพื่อใช้งาน
        </Button>
      )}
      {active && !siteKey && (
        <Typography color="error" role="alert">
          ระบบยืนยันยังไม่พร้อม ข้อความและรูปของคุณยังอยู่ กรุณาลองใหม่ภายหลัง
        </Typography>
      )}
      <Box ref={host} />
      {error && (
        <Box role="alert">
          <Typography color="error">{error}</Typography>
          <Button onClick={start}>ลองยืนยันอีกครั้ง</Button>
        </Box>
      )}
    </Box>
  );
}
