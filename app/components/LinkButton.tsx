"use client";

import { Button, ButtonProps } from "@mui/material";
import Link from "next/link";



type LinkButtonProps = ButtonProps & { href: string };

export default function LinkButton({ href, ...props }: LinkButtonProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <Button {...props} />
    </Link>
  );
}
