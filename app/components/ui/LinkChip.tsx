"use client";

import { Chip, ChipProps } from "@mui/material";
import Link from "next/link";

type LinkChipProps = ChipProps & { href: string; prefetch?: boolean };

export default function LinkChip(props: LinkChipProps) {
  return <Chip component={Link} prefetch={false} {...props} clickable />;
}
