"use client";

import { ListItemButton, ListItemButtonProps } from "@mui/material";
import Link from "next/link";

type LinkListItemButtonProps = ListItemButtonProps & { href: string };

export default function LinkListItemButton(props: LinkListItemButtonProps) {
  return <ListItemButton component={Link} {...props} />;
}
