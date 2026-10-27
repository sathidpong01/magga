"use client";
import { useEffect, useId, useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Link from "next/link";
export default function AdminRowMenu({
  title,
  actions,
  disabled = false,
}: {
  title: string;
  disabled?: boolean;
  actions: {
    label: string;
    href?: string;
    newTab?: boolean;
    onClick?: () => void;
    danger?: boolean;
  }[];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  function close() {
    const trigger = anchor;
    setAnchor(null);
    requestAnimationFrame(() => {
      if (trigger?.isConnected && document.activeElement === document.body) trigger.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    if (!anchor) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[role="menu"]')) return;
      setAnchor(null);
      anchor.focus({ preventScroll: true });
    };
    document.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => { document.removeEventListener("scroll", dismiss, true); window.removeEventListener("resize", dismiss); };
  }, [anchor]);
  return (
    <>
      <IconButton
        id={`${id}-trigger`}
        aria-label={`เพิ่มเติม ${title}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? `${id}-menu` : undefined}
        disabled={disabled}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreHorizIcon />
      </IconButton>
      {anchor && <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        autoFocus={false}
        disableAutoFocus
        disableRestoreFocus
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: { id: `${id}-menu`, "aria-labelledby": `${id}-trigger` },
          // Popover positions itself after onEntering; focus after that synchronous
          // work, without waiting for animation or letting focus scroll the page.
          transition: { onEntering: (element: HTMLElement) => queueMicrotask(() => {
            if (element.isConnected) element.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
          }) },
          paper: { sx: { maxHeight: "calc(100dvh - 32px)", "& .MuiMenuItem-root": { minHeight: 44 } } },
        }}
      >
        {actions.map((action) =>
          action.href ? (
            <MenuItem
              key={action.label}
              component={Link}
              prefetch={false}
              href={action.href}
              target={action.newTab ? "_blank" : undefined}
              rel={action.newTab ? "noopener noreferrer" : undefined}
              onClick={close}
            >
              {action.label}
            </MenuItem>
          ) : (
            <MenuItem
              key={action.label}
              sx={{
                color: action.danger ? "error.main" : undefined,
                minHeight: 44,
              }}
              onClick={() => {
                close();
                action.onClick?.();
              }}
            >
              {action.label}
            </MenuItem>
          ),
        )}
      </Menu>}
    </>
  );
}
