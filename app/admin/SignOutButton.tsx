"use client";

import { signOut } from "next-auth/react";
import { Button } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';

export default function SignOutButton() {
  return (
    <Button
      variant="contained"
      color="error"
      fullWidth
      startIcon={<LogoutIcon />}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign Out
    </Button>
  );
}

