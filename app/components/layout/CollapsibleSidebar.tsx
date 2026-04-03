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
import { useSession, signOut } from "@/lib/auth-client";
import { isUserBanned } from "@/lib/session-utils";
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
}

const EXPANDED_WIDTH = 272;
const COLLAPSED_WIDTH = 64;

export default function CollapsibleSidebar({
  title,
  items,
  bottomItems = [],
  storageKey = "sidebar-collapsed",
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showSuccess } = useToast();
  const { data: session } = useSession();
  const banned = isUserBanned(session);
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
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    sessionStorage.setItem("intent_logout", "true");
    await signOut();
    showSuccess("ออกจากระบบสำเร็จ");
    router.push("/");
    router.refresh();
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
        bgcolor: "rgba(20,20,20,0.92)",
        border: isMobile ? "none" : `1px solid ${dashboardTokens.border}`,
        borderRadius: isMobile ? 0 : 1.5,
        boxShadow: isMobile ? "none" : "0 18px 48px rgba(0,0,0,0.28)",
        backdropFilter: "blur(18px)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease-in-out, min-width 0.2s ease-in-out",
        overflow: "hidden",
        p: 1.75,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: (isMobile || !isCollapsed) ? "space-between" : "center",
          mb: 1,
          minHeight: 56,
        }}
      >
        {(isMobile || !isCollapsed) && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: dashboardTokens.text,
              fontSize: "1.02rem",
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
              color: "#a3a3a3",
              bgcolor: "rgba(255,255,255,0.04)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
              width: 28,
              height: 28,
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
              color: "#a3a3a3",
              bgcolor: "rgba(255,255,255,0.04)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
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
        )}
      </Box>

      <Divider sx={{ borderColor: dashboardTokens.border }} />

      {/* Main Menu Items - scrollable */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          py: 1.5,
          px: (isMobile || !isCollapsed) ? 1.5 : 1,
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
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: showExpanded ? 1.5 : 0,
                py: 1,
                borderRadius: 0.75,
                textDecoration: "none",
                justifyContent: showExpanded ? "flex-start" : "center",
                bgcolor: active ? "rgba(251, 191, 36, 0.12)" : "transparent",
                borderLeft: !showExpanded
                  ? "none"
                  : active
                  ? `3px solid ${dashboardTokens.accent}`
                  : "3px solid transparent",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: active
                    ? "rgba(251, 191, 36, 0.16)"
                    : "rgba(255,255,255,0.05)",
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
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: showExpanded ? 1.5 : 0,
                  py: 1,
                  borderRadius: 0.75,
                  textDecoration: "none",
                  justifyContent: showExpanded ? "flex-start" : "center",
                  color: dashboardTokens.accent,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "rgba(251, 191, 36, 0.08)",
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
              mb: 1,
              px: (isMobile || !isCollapsed) ? 0.5 : 0,
              justifyContent: (isMobile || !isCollapsed) ? "flex-start" : "center",
            }}
          >
            <Avatar
              src={session.user.image || undefined}
              alt={session.user.name || "User"}
              sx={{ width: 32, height: 32, bgcolor: dashboardTokens.accent, color: "#000" }}
            >
              {session.user.name?.[0]?.toUpperCase()}
            </Avatar>
            {(isMobile || !isCollapsed) && (
              <Box sx={{ overflow: "hidden", flex: 1 }}>
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
                {banned && (
                  <Box
                    sx={{
                      mt: 0.5,
                      px: 1,
                      py: 0.25,
                      bgcolor: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.24)",
                      borderRadius: 0.75,
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
                borderRadius: 0.75,
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.14)" },
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
              borderRadius: 0.75,
              bgcolor: "rgba(239, 68, 68, 0.08)",
              color: dashboardTokens.danger,
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.14)" },
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
          PaperProps={{
            sx: {
              bgcolor: "#141414",
              width: EXPANDED_WIDTH,
              borderRight: `1px solid ${dashboardTokens.border}`,
            },
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
