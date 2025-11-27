"use client";

import { AppBar, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backdropFilter: "blur(12px)", 
        backgroundColor: "rgba(10, 10, 10, 0.95)", // Match body background
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
        top: 0, 
        zIndex: 1100 
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 1 }}>
            <img 
              src="/logo.svg" 
              alt="Logo" 
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
              onError={(e) => {
                // Fallback to text if logo.svg not found
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const textFallback = target.nextElementSibling as HTMLElement;
                if (textFallback) textFallback.style.display = 'inline';
              }}
            />
            <span style={{ display: "none" }}>Magga Reader</span>
          </Link>
        </Typography>
        {session && (
          <Link href="/admin" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography variant="button" sx={{ fontWeight: 600 }}>Admin</Typography>
          </Link>
        )}
      </Toolbar>
    </AppBar>
  );
}
