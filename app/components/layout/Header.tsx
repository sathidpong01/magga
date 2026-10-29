"use client";

import { useState, useEffect, useId } from "react";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListSubheader,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOutAndSync } from "@/lib/auth-client";
import { isAdminRole, isUserBanned } from "@/lib/auth-client";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useToast } from "@/app/contexts/ToastContext";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
const AuthModal = dynamic(() => import("@/app/components/features/auth/AuthModal"), { ssr: false });

export default function Header() {
  const { data: session, isPending } = useSession();
  const { showError, showSuccess } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const menuId = useId();
  const theme = useTheme();
  const showSubmitInMenu = useMediaQuery(theme.breakpoints.up("lg"));

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    const trigger = anchorEl;
    setAnchorEl(null);
    requestAnimationFrame(() => {
      if (trigger?.isConnected && document.activeElement === document.body) trigger.focus({ preventScroll: true });
    });
  };

  const isAdmin = isAdminRole(session);
  const banned = isUserBanned(session);
  // Author and category filters also use the home route.
  const isCatalogPage = pathname === "/" || pathname.startsWith("/tag/") || pathname.startsWith("/category/");

  return (
    <>
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: isScrolled ? "rgba(20, 20, 22, 0.9)" : "transparent",
        backdropFilter: isScrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: isScrolled ? "blur(12px)" : "none",
        borderBottom: isScrolled ? "1px solid rgba(255, 255, 255, 0.07)" : "1px solid transparent",
        transition: "background-color 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease",
        top: 0,
        zIndex: 1100,
        boxShadow: "none",
      }}
    >
      {/* Ban Warning Banner - Show on ALL pages */}
      {banned && (
        <Box
          sx={{
            bgcolor: "#ef4444",
            color: "white",
            textAlign: "center",
            py: 0.5,
            fontSize: "0.875rem",
            fontWeight: 600,
            width: "100%",
          }}
        >
          บัญชีของคุณถูกระงับ:
          คุณสามารถดูเนื้อหาได้แต่ไม่สามารถแสดงความคิดเห็นหรือโพสต์ได้
        </Box>
      )}

      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 56, sm: 60 },
            height: { xs: 56, sm: 60 },
          }}
        >
          {/* Logo Section */}
          <Link
            href="/"
            prefetch={false}
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <Image
              src="/logo.svg"
              alt="Magga Logo"
              width={100}
              height={32}
              priority
              style={{
                width: "auto",
                height: "auto",
                maxHeight: "32px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                filter: "drop-shadow(0 0 0 rgba(255, 255, 255, 0))",
                transform: "translateX(0)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter =
                  "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.9)) drop-shadow(2px 2px 0 rgba(139, 69, 19, 0.9)) drop-shadow(3px 3px 0 rgba(139, 69, 19, 0.9))";
                target.style.transform = "translateX(-2px) translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter =
                  "drop-shadow(0 0 0 rgba(255, 255, 255, 0))";
                target.style.transform = "translateX(0) translateY(0)";
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter =
                  "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.8))";
                target.style.transform =
                  "translateX(1.5px) translateY(1.5px) scale(0.98)";
              }}
              onMouseUp={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter =
                  "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.9)) drop-shadow(2px 2px 0 rgba(139, 69, 19, 0.9)) drop-shadow(3px 3px 0 rgba(139, 69, 19, 0.9))";
                target.style.transform =
                  "translateX(-2px) translateY(-2px) scale(1)";
              }}
              onTouchStart={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter =
                  "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.8))";
                target.style.transform =
                  "translateX(1.5px) translateY(1.5px) scale(0.98)";
              }}
              onTouchEnd={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter =
                  "drop-shadow(0 0 0 rgba(255, 255, 255, 0))";
                target.style.transform = "translateX(0) translateY(0) scale(1)";
              }}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<span style="color:#fbbf24;font-weight:700;font-size:1.5rem;letter-spacing:-1px;">MAGGA</span>';
                }
              }}
            />
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            component={Link}
            href={session ? "/dashboard/submit" : "/auth/signin?callbackUrl=%2Fdashboard%2Fsubmit"}
            prefetch={false}
            variant="contained"
            startIcon={<CloudUploadIcon sx={{ fontSize: 18 }} />}
            sx={{
              display: { xs: isCatalogPage ? "inline-flex" : "none", lg: "inline-flex" },
              bgcolor: maggaColors.archiveGold,
              color: maggaColors.background,
              fontWeight: 600,
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              borderRadius: `${maggaRadii.md}px`,
              textTransform: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minHeight: { xs: 44, lg: 36 },
              mr: { xs: 0.5, md: 1.5 },
              px: { xs: 1.25, sm: 2 },
              py: 0.75,
              "&:hover": { bgcolor: maggaColors.archiveGoldHover },
              boxShadow:
                pathname === "/dashboard/submit"
                  ? "0 0 0 2px rgba(255,255,255,0.4)"
                  : "none",
              // Hide for admin but keep space
              visibility: isAdmin ? "hidden" : "visible",
              position: isAdmin ? "absolute" : "relative",
            }}
          >
            ฝากลงมังงะ
          </Button>

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
              minWidth: isAdmin ? 180 : 88,
              justifyContent: "flex-end",
            }}
          >
            {/* Admin Dashboard (Only for Admin) */}
            {isAdmin && (
              <Button
                component={Link}
                href="/dashboard"
                prefetch={false}
                variant="contained"
                startIcon={<DashboardIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: pathname?.startsWith("/dashboard")
                    ? "#991b1b"
                    : "#b91c1c",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  borderRadius: "8px",
                  textTransform: "none",
                  px: 2,
                  py: 0.75,
                  "&:hover": { bgcolor: "#991b1b" },
                  boxShadow: pathname?.startsWith("/dashboard")
                    ? "0 0 0 2px rgba(255,255,255,0.4)"
                    : "none",
                }}
              >
                Admin
              </Button>
            )}

            {/* Profile / Login area */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: session ? "auto" : 88,
              }}
            >
              {isPending ? (
                <Box
                  sx={{
                    width: 88,
                    height: 36,
                    borderRadius: "8px",
                    bgcolor: "rgba(255,255,255,0.06)",
                  }}
                />
              ) : session ? (
                <IconButton
                  id={`${menuId}-user-trigger`}
                  aria-haspopup="menu"
                  aria-expanded={Boolean(anchorEl)}
                  aria-controls={anchorEl ? menuId : undefined}
                  onClick={handleMenuOpen}
                  aria-label="Open user menu"
                  sx={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    p: 0.5,
                  }}
                >
                  <Avatar
                    src={session.user?.image || undefined}
                    alt={session.user?.name || "User"}
                    sx={{ width: 32, height: 32, borderRadius: "6px", bgcolor: "#262626" }}
                  >
                    {session.user?.name?.charAt(0) || <PersonIcon />}
                  </Avatar>
                </IconButton>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setAuthModalOpen(true)}
                  sx={{
                    color: "#fafafa",
                    borderColor: "rgba(255,255,255,0.15)",
                    bgcolor: "rgba(255,255,255,0.03)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    textTransform: "none",
                    px: 2,
                    py: 0.75,
                    "&:hover": {
                      borderColor: "#f59e0b",
                      color: "#f59e0b",
                      bgcolor: "rgba(245, 158, 11, 0.08)",
                    },
                  }}
                >
                  เข้าสู่ระบบ
                </Button>
              )}
            </Box>
          </Box>

          {/* Mobile Menu Icon */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              id={`${menuId}-mobile-trigger`}
              aria-haspopup="menu"
              aria-expanded={Boolean(anchorEl)}
              aria-controls={anchorEl ? menuId : undefined}
              size="large"
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="Open mobile menu"
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Dropdown Menu */}
          {anchorEl && <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            autoFocus={false}
            disableAutoFocus
            disableRestoreFocus
            slotProps={{
              list: { id: menuId, "aria-labelledby": anchorEl.id },
              transition: { onEntering: (element: HTMLElement) => queueMicrotask(() => {
                const item = Array.from(element.querySelectorAll<HTMLElement>('[role="menuitem"]')).find(item => item.offsetParent !== null && item.getAttribute("aria-disabled") !== "true");
                (item ?? element.querySelector<HTMLElement>('[role="menu"]'))?.focus({ preventScroll: true });
              }) },
              paper: {
                sx: {
                  mt: 1.5,
                  bgcolor: "#18181b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "#fafafa",
                  minWidth: 200,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {isPending ? (
              <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
                <Box>
                  <Box sx={{ width: 80, height: 12, borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", mb: 0.5 }} />
                  <Box sx={{ width: 50, height: 10, borderRadius: 1, bgcolor: "rgba(255,255,255,0.05)" }} />
                </Box>
              </Box>
            ) : session ? (
              [
                <ListSubheader key="identity" component="div" role="presentation" disableSticky sx={{ px: 2, py: 1.5, bgcolor: "transparent", color: "inherit", lineHeight: "normal" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {session.user?.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {isAdmin ? "Administrator" : "Member"}
                    </Typography>
                    {banned && (
                      <Chip
                        label="ระงับการใช้งาน"
                        size="small"
                        color="error"
                        sx={{
                          height: 20,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          bgcolor: "rgba(239, 68, 68, 0.1)", // translucent red
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                        }}
                      />
                    )}
                  </Box>
                </ListSubheader>,
                <Divider key="identity-divider" sx={{ borderColor: "rgba(255,255,255,0.1)" }} />,

                !isAdmin && showSubmitInMenu && (
                  <MenuItem
                    key="submit"
                    onClick={handleMenuClose}
                    component={Link}
                    href="/dashboard/submit"
                    prefetch={false}
                  >
                    <ListItemIcon>
                      <CloudUploadIcon sx={{ color: "#fbbf24" }} />
                    </ListItemIcon>
                    ฝากลงมังงะ
                  </MenuItem>
                ),

                !isAdmin && (
                  <MenuItem
                    key="submissions"
                    onClick={handleMenuClose}
                    component={Link}
                    href="/dashboard/submissions"
                    prefetch={false}
                  >
                    <ListItemIcon>
                      <ListAltIcon sx={{ color: "#f59e0b" }} />
                    </ListItemIcon>
                    รายการของฉัน
                  </MenuItem>
                ),

                isAdmin && (
                  <MenuItem
                    key="dashboard"
                    onClick={handleMenuClose}
                    component={Link}
                    href="/dashboard"
                    prefetch={false}
                  >
                    <ListItemIcon>
                      <DashboardIcon sx={{ color: "#ef4444" }} />
                    </ListItemIcon>
                    Admin Dashboard
                  </MenuItem>
                ),

                <MenuItem
                  key="profile"
                  onClick={handleMenuClose}
                  component={Link}
                  href={`/profile/${(session?.user as any)?.username || session?.user?.id || ""}`}
                  prefetch={false}
                >
                  <ListItemIcon>
                    <PersonIcon sx={{ color: "#5eead4" }} />
                  </ListItemIcon>
                  หน้าโปรไฟล์
                </MenuItem>,

                <MenuItem
                  key="settings"
                  onClick={handleMenuClose}
                  component={Link}
                  href="/settings"
                  prefetch={false}
                >
                  <ListItemIcon>
                    <SettingsIcon sx={{ color: "#fbbf24" }} />
                  </ListItemIcon>
                  ตั้งค่าบัญชี
                </MenuItem>,

                <MenuItem 
                  key="sign-out"
                  onClick={async () => {
                    handleMenuClose();
                    try {
                      await signOutAndSync();
                      showSuccess("ออกจากระบบสำเร็จ");
                      router.refresh();
                    } catch (error) {
                      showError(
                        error instanceof Error
                          ? error.message
                          : "ออกจากระบบไม่สำเร็จ"
                      );
                    }
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon sx={{ color: "#a3a3a3" }} />
                  </ListItemIcon>
                  ออกจากระบบ
                </MenuItem>
              ]
            ) : (
              [
                showSubmitInMenu && <MenuItem
                  key="submit"
                  onClick={handleMenuClose}
                  component={Link}
                  href="/auth/signin?callbackUrl=/dashboard/submit"
                  prefetch={false}
                >
                  <ListItemIcon>
                    <CloudUploadIcon sx={{ color: "#fbbf24" }} />
                  </ListItemIcon>
                  ฝากลงมังงะ
                </MenuItem>,
                showSubmitInMenu && <Divider key="submit-divider" sx={{ borderColor: "rgba(255,255,255,0.1)" }} />,
                <MenuItem
                  key="sign-in"
                  onClick={() => { handleMenuClose(); setAuthModalOpen(true); }}
                >
                  <ListItemIcon>
                    <PersonIcon sx={{ color: "#fbbf24" }} />
                  </ListItemIcon>
                  เข้าสู่ระบบ
                </MenuItem>
              ]
            )}
          </Menu>}
        </Toolbar>
      </Container>
    </AppBar>

    <AuthModal
      open={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      onNavigate={() => setAuthModalOpen(false)}
    />
    </>
  );
}
