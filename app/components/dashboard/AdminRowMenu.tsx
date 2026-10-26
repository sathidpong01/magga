"use client";
import { useState } from "react";
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
  return (
    <>
      <IconButton
        aria-label={`เพิ่มเติม ${title}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        disabled={disabled}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
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
              onClick={() => setAnchor(null)}
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
                setAnchor(null);
                action.onClick?.();
              }}
            >
              {action.label}
            </MenuItem>
          ),
        )}
      </Menu>
    </>
  );
}
