"use client";

import { Button, ButtonProps } from "@mui/material";
import Link from "next/link";



type LinkButtonProps = ButtonProps & { href: string };

export default function LinkButton({ href, ...props }: LinkButtonProps) {
  return (
    <Button component={Link} href={href} {...props} />
  );
}
