"use client";

import { useState, useEffect } from "react";
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
  ListItemIcon
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";

export default function Header() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    setAnchorEl(null);
  };

  const isAdmin = session?.user?.role?.toUpperCase() === "ADMIN";

  return (
    <AppBar 
      position="sticky" 
      elevation={isScrolled ? 4 : 0}
      sx={{ 
        backgroundColor: isScrolled ? "#00000000" : "transparent",
        backgroundImage: "none",
        borderBottom: isScrolled ? "0px solid rgba(255,255,255,0.05)" : "none",
        transition: "all 0.3s ease-in-out",
        top: 0, 
        zIndex: 1100,
        backdropFilter: "none", // Explicitly ensure no blur
      }} 
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 70 }}>
          {/* Logo Section */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Image 
              src="/logo.svg" 
              alt="Magga Logo" 
              width={100}
              height={32}
              style={{ 
                height: "32px", 
                width: "auto",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                filter: "drop-shadow(0 0 0 rgba(255, 255, 255, 0))",
                transform: "translateX(0)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter = "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.9)) drop-shadow(2px 2px 0 rgba(139, 69, 19, 0.9)) drop-shadow(3px 3px 0 rgba(139, 69, 19, 0.9))";
                target.style.transform = "translateX(-2px) translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter = "drop-shadow(0 0 0 rgba(255, 255, 255, 0))";
                target.style.transform = "translateX(0) translateY(0)";
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter = "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.8))";
                target.style.transform = "translateX(1.5px) translateY(1.5px) scale(0.98)";
              }}
              onMouseUp={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter = "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.9)) drop-shadow(2px 2px 0 rgba(139, 69, 19, 0.9)) drop-shadow(3px 3px 0 rgba(139, 69, 19, 0.9))";
                target.style.transform = "translateX(-2px) translateY(-2px) scale(1)";
              }}
              onTouchStart={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter = "drop-shadow(1px 1px 0 rgba(139, 69, 19, 0.8))";
                target.style.transform = "translateX(1.5px) translateY(1.5px) scale(0.98)";
              }}
              onTouchEnd={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.filter = "drop-shadow(0 0 0 rgba(255, 255, 255, 0))";
                target.style.transform = "translateX(0) translateY(0) scale(1)";
              }}
              priority
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span style="color:#fbbf24;font-weight:800;font-size:1.5rem;letter-spacing:-1px;">MAGGA</span>';
                }
              }}
            />
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {/* Submit Manga Button - Hidden for Admin */}
            {!isAdmin && (
              <Button
                component={Link}
                href={session ? "/submit" : "/api/auth/signin"}
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ 
                  bgcolor: "#fbbf24", 
                  color: "black",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#f59e0b" }
                }}
              >
                ฝากลงมังงะ
              </Button>
            )}

            {/* Admin Dashboard (Only for Admin) */}
            {isAdmin && (
              <Button
                component={Link}
                href="/admin"
                variant="contained"
                startIcon={<DashboardIcon />}
                sx={{ 
                  bgcolor: "#ef4444", 
                  color: "white",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#dc2626" }
                }}
              >
                Admin
              </Button>
            )}

            {/* Profile / Menu (Only if logged in) */}
            {session && (
              <IconButton 
                onClick={handleMenuOpen}
                aria-label="Open user menu"
                sx={{ 
                  ml: 1,
                  border: "1px solid rgba(255,255,255,0.1)",
                  p: 0.5
                }}
              >
                <Avatar 
                  src={session.user?.image || undefined} 
                  alt={session.user?.name || "User"}
                  sx={{ width: 32, height: 32, bgcolor: "#262626" }}
                >
                  {session.user?.name?.charAt(0) || <PersonIcon />}
                </Avatar>
              </IconButton>
            )}
          </Box>

          {/* Mobile Menu Icon */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="Open mobile menu"
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                bgcolor: "#171717",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
                minWidth: 200
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {session ? (
              <Box>
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {session.user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {isAdmin ? "Administrator" : "Member"}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                
                {!isAdmin && (
                  <MenuItem onClick={handleMenuClose} component={Link} href="/submit">
                    <ListItemIcon><CloudUploadIcon sx={{ color: "#fbbf24" }} /></ListItemIcon>
                    ฝากลงมังงะ
                  </MenuItem>
                )}

                {isAdmin && (
                  <MenuItem onClick={handleMenuClose} component={Link} href="/admin">
                    <ListItemIcon><DashboardIcon sx={{ color: "#ef4444" }} /></ListItemIcon>
                    Admin Dashboard
                  </MenuItem>
                )}

                <MenuItem onClick={handleMenuClose} component={Link} href="/settings">
                  <ListItemIcon><SettingsIcon sx={{ color: "#fbbf24" }} /></ListItemIcon>
                  Settings
                </MenuItem>

                <MenuItem onClick={() => signOut()}>
                  <ListItemIcon><LogoutIcon sx={{ color: "#a3a3a3" }} /></ListItemIcon>
                  Sign Out
                </MenuItem>
              </Box>
            ) : (
              <Box>
                 <MenuItem onClick={handleMenuClose} component={Link} href="/submit">
                  <ListItemIcon><CloudUploadIcon sx={{ color: "#fbbf24" }} /></ListItemIcon>
                  ฝากลงมังงะ
                </MenuItem>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                <MenuItem onClick={handleMenuClose} component={Link} href="/api/auth/signin">
                  <ListItemIcon><PersonIcon sx={{ color: "#fbbf24" }} /></ListItemIcon>
                  Sign In
                </MenuItem>
              </Box>
            )}
          </Menu>

        </Toolbar>
      </Container>
    </AppBar>
  );
}
