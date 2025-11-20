"use client";

import { AppBar, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <AppBar position="static" sx={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(11, 15, 25, 0.8)" }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            Magga Reader
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
