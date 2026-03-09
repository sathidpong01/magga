"use client";

import { useState, useCallback } from "react";
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

  const getShareUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${slug}`;
    }
    return `https://magga.vercel.app/${slug}`;
  }, [slug]);

  const handleShare = useCallback(
    async (event: React.MouseEvent<HTMLElement>) => {
      const url = getShareUrl();

      // Use native share API on mobile if available
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch {
          // User cancelled or API failed, fall through to menu
        }
      }

      setAnchorEl(event.currentTarget);
    },
    [title, getShareUrl]
  );

  const handleClose = () => setAnchorEl(null);

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
  }, [getShareUrl]);

  const handleShareX = useCallback(() => {
    handleClose();
    const url = getShareUrl();
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [title, getShareUrl]);

  const handleShareFacebook = useCallback(() => {
    handleClose();
    const url = getShareUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [getShareUrl]);

  const handleShareTelegram = useCallback(() => {
    handleClose();
    const url = getShareUrl();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [title, getShareUrl]);

  return (
    <>
      <Tooltip title="แชร์" arrow>
        <IconButton
          onClick={handleShare}
          aria-label="Share this manga"
          sx={{
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: "#171717",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fafafa",
            minWidth: 180,
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
      </Menu>

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
