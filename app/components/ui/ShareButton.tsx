"use client";

import { useState, useCallback, useId } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import XIcon from "@mui/icons-material/X";
import FacebookIcon from "@mui/icons-material/Facebook";
import TelegramIcon from "@mui/icons-material/Telegram";

interface ShareButtonProps {
  title: string;
  slug: string;
}

export default function ShareButton({ title, slug }: ShareButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCopied, setShowCopied] = useState(false);
  const menuId = useId();

  const getShareUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${slug}`;
    }
    return `https://magga.vercel.app/${slug}`;
  }, [slug]);

  const handleShare = useCallback(
    async (event: React.MouseEvent<HTMLElement>) => {
      const trigger = event.currentTarget;
      const url = getShareUrl();

      // Use native share API on mobile if available
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          // A failed native API can still use the local share menu.
        }
      }

      setAnchorEl(trigger);
    },
    [title, getShareUrl]
  );

  const handleClose = useCallback(() => {
    const trigger = anchorEl;
    setAnchorEl(null);
    requestAnimationFrame(() => {
      if (trigger?.isConnected && document.activeElement === document.body) trigger.focus({ preventScroll: true });
    });
  }, [anchorEl]);

  const handleCopyLink = useCallback(async () => {
    handleClose();
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setShowCopied(true);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShowCopied(true);
    }
  }, [getShareUrl, handleClose]);

  const handleShareX = useCallback(() => {
    handleClose();
    const url = getShareUrl();
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [title, getShareUrl, handleClose]);

  const handleShareFacebook = useCallback(() => {
    handleClose();
    const url = getShareUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [getShareUrl, handleClose]);

  const handleShareTelegram = useCallback(() => {
    handleClose();
    const url = getShareUrl();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [title, getShareUrl, handleClose]);

  return (
    <>
      <Tooltip title="แชร์" arrow>
        <IconButton
          onClick={handleShare}
          aria-label="Share this manga"
          id={`${menuId}-trigger`}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          aria-controls={anchorEl ? menuId : undefined}
          sx={{
            minWidth: 44,
            minHeight: 44,
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            "&:hover": {
              color: "#fbbf24",
              borderColor: "rgba(251,191,36,0.3)",
              bgcolor: "rgba(251,191,36,0.06)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <ShareIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {anchorEl && <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        autoFocus={false}
        disableAutoFocus
        disableRestoreFocus
        slotProps={{
          list: { id: menuId, "aria-labelledby": `${menuId}-trigger` },
          transition: { onEntering: (element: HTMLElement) => queueMicrotask(() => element.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true })) },
          paper: {
            sx: {
              bgcolor: "#171717",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fafafa",
              minWidth: 180,
              "& .MuiMenuItem-root": { minHeight: 44 },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopyIcon sx={{ color: "#a3a3a3" }} fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">คัดลอกลิงก์</Typography>
        </MenuItem>
        <MenuItem onClick={handleShareX}>
          <ListItemIcon>
            <XIcon sx={{ color: "#a3a3a3" }} fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">แชร์ไป X</Typography>
        </MenuItem>
        <MenuItem onClick={handleShareFacebook}>
          <ListItemIcon>
            <FacebookIcon sx={{ color: "#1877f2" }} fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">แชร์ไป Facebook</Typography>
        </MenuItem>
        <MenuItem onClick={handleShareTelegram}>
          <ListItemIcon>
            <TelegramIcon sx={{ color: "#0088cc" }} fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">แชร์ไป Telegram</Typography>
        </MenuItem>
      </Menu>}

      <Snackbar
        open={showCopied}
        autoHideDuration={2000}
        onClose={() => setShowCopied(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{
            bgcolor: "#fbbf24",
            color: "#000",
            fontWeight: 600,
            "& .MuiAlert-icon": { color: "#000" },
          }}
        >
          คัดลอกลิงก์แล้ว!
        </Alert>
      </Snackbar>
    </>
  );
}
