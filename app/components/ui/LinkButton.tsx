"use client";

import { Button, ButtonProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import Link from "next/link";
import {
  dashboardGhostButtonSx,
  dashboardPrimaryButtonSx,
  dashboardSecondaryButtonSx,
} from "@/app/components/dashboard/system";

type LinkButtonProps = ButtonProps & { href: string; prefetch?: boolean };

export default function LinkButton({ href, sx, ...props }: LinkButtonProps) {
  const variantStyles =
    props.variant === "outlined"
      ? dashboardSecondaryButtonSx
      : props.variant === "text"
        ? dashboardGhostButtonSx
        : dashboardPrimaryButtonSx;

  return (
    <Button
      component={Link}
      href={href}
      prefetch={false}
      sx={[variantStyles, sx] as SxProps<Theme>}
      {...props}
    />
  );
}
