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
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { signOutAndSync } from "@/lib/auth-client";
import { dashboardTokens } from "@/app/components/dashboard/system";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import { useToast } from "@/app/contexts/ToastContext";

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
  session?: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  } | null;
  banned?: boolean;
}

const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 64;

export default function CollapsibleSidebar({
  title,
  items,
  bottomItems = [],
  storageKey = "sidebar-collapsed",
  session = null,
  banned = false,
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, [storageKey]);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(storageKey, String(newState));
  };

  const isActive = (href: string) => {
    if (href === "/" || href === "/dashboard" || href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOutAndSync();
      showSuccess("ออกจากระบบสำเร็จ");
      router.push("/");
      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "ออกจากระบบไม่สำเร็จ"
      );
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Box
        sx={{
          width: { xs: 0, md: EXPANDED_WIDTH },
          minHeight: { xs: 0, md: "100vh" },
          bgcolor: dashboardTokens.bg,
        }}
      />
    );
  }

  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // Sidebar inner content (shared between desktop and mobile)
  const sidebarContent = (
    <Box
      component="aside"
      sx={{
        width: isMobile ? EXPANDED_WIDTH : sidebarWidth,
        minWidth: isMobile ? EXPANDED_WIDTH : sidebarWidth,
        height: isMobile ? "100%" : "calc(100vh - 24px)",
        bgcolor: "#16171a",
        border: isMobile ? "none" : `1px solid ${dashboardTokens.border}`,
        borderRadius: isMobile ? 0 : "12px",
        boxShadow: isMobile ? "none" : "0 8px 32px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        p: 1.5,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: (isMobile || !isCollapsed) ? "space-between" : "center",
          mb: 1,
          px: (isMobile || !isCollapsed) ? 0.75 : 0,
          minHeight: 52,
        }}
      >
        {(isMobile || !isCollapsed) && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: dashboardTokens.text,
              fontSize: "1.05rem",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {title}
          </Typography>
        )}
        {isMobile ? (
          <IconButton
            onClick={() => setMobileOpen(false)}
            size="small"
            sx={{
              color: "#a1a1aa",
              bgcolor: "rgba(255,255,255,0.04)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
              width: 32,
              height: 32,
              borderRadius: "8px",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : (
          <Tooltip title={isCollapsed ? "ขยาย" : "ย่อ"} placement="right">
            <IconButton
              onClick={toggleSidebar}
              size="small"
              sx={{
                color: "#a1a1aa",
                bgcolor: "rgba(255,255,255,0.04)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
                width: 32,
                height: 32,
                borderRadius: "8px",
              }}
            >
              {isCollapsed ? (
                <ChevronRightIcon fontSize="small" />
              ) : (
                <ChevronLeftIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ borderColor: dashboardTokens.border, mb: 1 }} />

      {/* Main Menu Items - scrollable */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          py: 0.5,
          px: 0.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          const showExpanded = isMobile || !isCollapsed;
          const content = (
            <Box
              component={Link}
              href={item.href}
              prefetch={false}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: showExpanded ? 1.75 : 0,
                py: 1.1,
                borderRadius: "10px",
                textDecoration: "none",
                justifyContent: showExpanded ? "flex-start" : "center",
                bgcolor: active ? "rgba(217, 119, 6, 0.12)" : "transparent",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: active
                    ? "rgba(217, 119, 6, 0.18)"
                    : "rgba(255,255,255,0.04)",
                },
              }}
            >
              <Box
                sx={{
                  color: active ? dashboardTokens.accent : dashboardTokens.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 24,
                  "& svg": { fontSize: 20 },
                }}
              >
                {item.icon}
              </Box>
              {showExpanded && (
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? dashboardTokens.text : "#d4d4d4",
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

          return (!isMobile && isCollapsed) ? (
            <Tooltip
              key={item.href}
              title={item.text}
              placement="right"
              arrow
            >
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
            px: (isMobile || !isCollapsed) ? 1.5 : 1,
            pb: 1,
            pt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            borderTop: `1px solid ${dashboardTokens.border}`,
            mt: "auto",
          }}
        >
          {bottomItems.map((item) => {
            const showExpanded = isMobile || !isCollapsed;
            const content = (
              <Box
                component={Link}
                href={item.href}
                prefetch={false}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: showExpanded ? 1.75 : 0,
                  py: 1,
                  borderRadius: "10px",
                  textDecoration: "none",
                  justifyContent: showExpanded ? "flex-start" : "center",
                  color: dashboardTokens.accent,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "rgba(217, 119, 6, 0.1)",
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
                {showExpanded && (
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

            return (!isMobile && isCollapsed) ? (
              <Tooltip
                key={item.href}
                title={item.text}
                placement="right"
                arrow
              >
                {content}
              </Tooltip>
            ) : (
              <Box key={item.href}>{content}</Box>
            );
          })}
        </Box>
      )}

      <Divider sx={{ borderColor: dashboardTokens.border }} />

      {/* User Section & Sign Out */}
      <Box sx={{ p: (isMobile || !isCollapsed) ? 1.5 : 1 }}>
        {session?.user && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1.25,
              px: (isMobile || !isCollapsed) ? 0.5 : 0,
              justifyContent: (isMobile || !isCollapsed) ? "flex-start" : "center",
            }}
          >
            <Avatar
              src={session.user.image || undefined}
              alt={session.user.name || "User"}
              sx={{ width: 34, height: 34, bgcolor: dashboardTokens.accent, color: "#000", fontWeight: 700, fontSize: "0.9rem" }}
            >
              {session.user.name?.[0]?.toUpperCase()}
            </Avatar>
            {(isMobile || !isCollapsed) && (
              <Box sx={{ overflow: "hidden", flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: dashboardTokens.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {session.user.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: dashboardTokens.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {session.user.email}
                </Typography>
                {banned && (
                  <Box
                    sx={{
                      mt: 0.5,
                      px: 1,
                      py: 0.25,
                      bgcolor: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.24)",
                      borderRadius: "6px",
                      display: "inline-block",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: "#ef4444",
                      }}
                    >
                      ระงับการใช้งาน
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
        {/* Sign Out Button */}
        {(!isMobile && isCollapsed) ? (
          <Tooltip title="ออกจากระบบ" placement="right" arrow>
            <IconButton
              onClick={handleSignOut}
              sx={{
                width: "100%",
                color: dashboardTokens.danger,
                bgcolor: "rgba(239, 68, 68, 0.08)",
                borderRadius: "10px",
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
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
              py: 1.1,
              border: "none",
              borderRadius: "10px",
              bgcolor: "rgba(239, 68, 68, 0.08)",
              color: dashboardTokens.danger,
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
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
  );

  // Mobile: Drawer + hamburger button
  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            bgcolor: "rgba(20,20,20,0.96)",
            borderBottom: `1px solid ${dashboardTokens.border}`,
            backdropFilter: "blur(18px)",
            display: "flex",
            alignItems: "center",
            px: 2,
            zIndex: 1200,
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ color: "#fafafa", mr: 1.5 }}
            aria-label="เปิดเมนู"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: dashboardTokens.text,
              fontSize: "1rem",
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#141414",
                width: EXPANDED_WIDTH,
                borderRight: `1px solid ${dashboardTokens.border}`,
              },
            }
          }}
        >
          {sidebarContent}
        </Drawer>
      </>
    );
  }

  // Desktop: sticky sidebar
  return (
    <Box
      sx={{
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 100,
        p: 1.5,
      }}
    >
      {sidebarContent}
    </Box>
  );
}
