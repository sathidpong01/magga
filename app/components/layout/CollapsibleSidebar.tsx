"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";

export interface SidebarItem {
  text: string;
  href: string;
  icon: ReactNode;
}

interface CollapsibleSidebarProps {
  title: string;
  items: SidebarItem[];
  bottomItems?: SidebarItem[];
  storageKey?: string; // For localStorage persistence
}

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

export default function CollapsibleSidebar({
  title,
  items,
  bottomItems = [],
  storageKey = "sidebar-collapsed",
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, [storageKey]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(storageKey, String(newState));
  };

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/submit") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Box
        sx={{
          width: EXPANDED_WIDTH,
          minHeight: "100vh",
          bgcolor: "#171717",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      />
    );
  }

  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <Box
      sx={{
        p: 1.5,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <Box
        component="aside"
        sx={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: "calc(100vh - 24px)",
          bgcolor: "#171717",
          borderRadius: 1,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease-in-out, min-width 0.2s ease-in-out",
          overflow: "hidden",
        }}
      >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          p: 2,
          minHeight: 56,
        }}
      >
        {!isCollapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#8b5cf6",
              fontSize: "1rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {title}
          </Typography>
        )}
        <Tooltip title={isCollapsed ? "ขยาย" : "ย่อ"} placement="right">
          <IconButton
            onClick={toggleSidebar}
            size="small"
            sx={{
              color: "#a3a3a3",
              bgcolor: "rgba(255,255,255,0.05)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              width: 28,
              height: 28,
            }}
          >
            {isCollapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ChevronLeftIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Main Menu Items - scrollable */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          py: 1.5,
          px: isCollapsed ? 1 : 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          const content = (
            <Box
              component={Link}
              href={item.href}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: isCollapsed ? 0 : 1.5,
                py: 1,
                borderRadius: 0.5,
                textDecoration: "none",
                justifyContent: isCollapsed ? "center" : "flex-start",
                bgcolor: active ? "rgba(139, 92, 246, 0.15)" : "transparent",
                borderLeft: isCollapsed
                  ? "none"
                  : active
                  ? "3px solid #8b5cf6"
                  : "3px solid transparent",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: active
                    ? "rgba(139, 92, 246, 0.2)"
                    : "rgba(255,255,255,0.05)",
                },
              }}
            >
              <Box
                sx={{
                  color: active ? "#8b5cf6" : "#a3a3a3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 24,
                  "& svg": { fontSize: 20 },
                }}
              >
                {item.icon}
              </Box>
              {!isCollapsed && (
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#fafafa" : "#d4d4d4",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.text}
                </Typography>
              )}
            </Box>
          );

          return isCollapsed ? (
            <Tooltip key={item.href} title={item.text} placement="right" arrow>
              {content}
            </Tooltip>
          ) : (
            <Box key={item.href}>{content}</Box>
          );
        })}
      </Box>

      {/* Bottom Items - sticky at bottom */}
      {bottomItems.length > 0 && (
        <Box
          sx={{
            px: isCollapsed ? 1 : 1.5,
            pb: 1,
            pt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            mt: "auto",
          }}
        >
          {bottomItems.map((item) => {
            const content = (
              <Box
                component={Link}
                href={item.href}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: isCollapsed ? 0 : 1.5,
                  py: 1,
                  borderRadius: 0.5,
                  textDecoration: "none",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  color: "#fbbf24",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "rgba(251, 191, 36, 0.1)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 24,
                    "& svg": { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </Box>
                {!isCollapsed && (
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.text}
                  </Typography>
                )}
              </Box>
            );

            return isCollapsed ? (
              <Tooltip key={item.href} title={item.text} placement="right" arrow>
                {content}
              </Tooltip>
            ) : (
              <Box key={item.href}>{content}</Box>
            );
          })}
        </Box>
      )}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* User Section & Sign Out */}
      <Box sx={{ p: isCollapsed ? 1 : 1.5 }}>
        {session?.user && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
              px: isCollapsed ? 0 : 0.5,
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
          >
            <Avatar
              src={session.user.image || undefined}
              alt={session.user.name || "User"}
              sx={{ width: 32, height: 32, bgcolor: "#8b5cf6" }}
            >
              {session.user.name?.[0]?.toUpperCase()}
            </Avatar>
            {!isCollapsed && (
              <Box sx={{ overflow: "hidden" }}>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#fafafa",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {session.user.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: "#a3a3a3",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {session.user.email}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Sign Out Button */}
        {isCollapsed ? (
          <Tooltip title="ออกจากระบบ" placement="right" arrow>
            <IconButton
              onClick={handleSignOut}
              sx={{
                width: "100%",
                color: "#ef4444",
                bgcolor: "rgba(239, 68, 68, 0.1)",
                borderRadius: 0.5,
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Box
            component="button"
            onClick={handleSignOut}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1,
              border: "none",
              borderRadius: 0.5,
              bgcolor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
            }}
          >
            <LogoutIcon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
              ออกจากระบบ
            </Typography>
          </Box>
        )}
      </Box>
      </Box>
    </Box>
  );
}
