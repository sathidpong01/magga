"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TuneIcon from "@mui/icons-material/Tune";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AdminRowMenu from "@/app/components/dashboard/AdminRowMenu";
import { mangaCompactRowSx } from "@/app/components/dashboard/manga-list-layout";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import type { ViewSummary } from "@/lib/view-history";

export type ManagedManga = {
  id: string;
  title: string;
  slug: string | null;
  coverImage: string;
  isHidden: boolean;
  scheduledPublishAt?: string | null;
  publicationTimeZone?: string | null;
  viewCount: number;
  viewHistory?: ViewSummary | null;
  category: { id?: string; name: string } | null;
  tags: { id: string; name: string }[];
  author: { id?: string; name: string } | null;
};

export function MangaStatus({ manga }: { manga: ManagedManga }) {
  const scheduled = manga.isHidden && manga.scheduledPublishAt;
  return (
    <Box
      sx={{
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Chip
        size="small"
        label={scheduled ? "ตั้งเวลาแล้ว" : manga.isHidden ? "ซ่อน" : "เผยแพร่"}
        sx={{
          height: "auto",
          minHeight: 24,
          "& .MuiChip-label": { lineHeight: 1.75, py: "1px" },
          fontSize: "0.75rem",
          fontWeight: 600,
          bgcolor: scheduled
            ? maggaColors.archiveGoldSoft
            : maggaColors.surfaceElevated,
          color: scheduled
            ? maggaColors.archiveGoldHover
            : manga.isHidden
              ? maggaColors.textSecondary
              : maggaColors.trustEmerald,
        }}
      />
      {scheduled && (
        <Typography
          sx={{
            color: maggaColors.textSecondary,
            fontSize: "0.75rem",
            mt: 0.5,
            overflowWrap: "anywhere",
          }}
        >
          {new Intl.DateTimeFormat("th-TH", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: manga.publicationTimeZone || "Asia/Bangkok",
          }).format(new Date(scheduled))}
          {` (${manga.publicationTimeZone === "Asia/Bangkok" || !manga.publicationTimeZone ? "เวลาไทย" : manga.publicationTimeZone})`}
        </Typography>
      )}
    </Box>
  );
}

export default function MangaCompactList({
  mangas,
  selecting,
  selected,
  busy,
  onSelect,
  onSettings,
  onDelete,
  onVisibility,
  onHistory,
}: {
  mangas: ManagedManga[];
  selecting: boolean;
  selected: string[];
  busy: boolean;
  onSelect: (id: string) => void;
  onSettings: (manga: ManagedManga) => void;
  onDelete: (manga: ManagedManga) => void;
  onVisibility: (manga: ManagedManga) => void;
  onHistory: (manga: ManagedManga) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  function toggle(id: string) {
    setExpanded((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }
  return (
    <Box
      component="ul"
      aria-label="รายการมังงะ"
      sx={{ listStyle: "none", p: 0, m: 0 }}
    >
      {mangas.map((manga) => {
        const open = expanded.includes(manga.id);
        const weekViews = manga.viewHistory?.points.reduce(
          (sum, point) => sum + (point.views ?? 0),
          0,
        );
        return (
          <Box
            component="li"
            key={manga.id}
            data-manga-item={manga.id}
            sx={{
              ...mangaCompactRowSx,
              bgcolor: selected.includes(manga.id)
                ? maggaColors.archiveGoldSoft
                : "transparent",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              {selecting && (
                <Checkbox
                  disabled={busy}
                  checked={selected.includes(manga.id)}
                  onChange={() => onSelect(manga.id)}
                  slotProps={{
                    input: { "aria-label": `เลือก ${manga.title}` },
                  }}
                  sx={{ p: 1, width: 44, height: 44, flexShrink: 0 }}
                />
              )}
              <Link
                href={`/${manga.slug || manga.id}`}
                prefetch={false}
                aria-label={`เปิดหน้าเรื่อง ${manga.title}`}
              >
                <Avatar
                  src={manga.coverImage || undefined}
                  alt=""
                  variant="rounded"
                  sx={{
                    width: 60,
                    height: 80,
                    borderRadius: `${maggaRadii.card}px`,
                    bgcolor: maggaColors.surfaceElevated,
                  }}
                />
              </Link>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    lineHeight: 1.75,
                    minHeight: "1.75rem",
                  }}
                >
                  {manga.title}
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    color: maggaColors.textSecondary,
                    fontSize: "0.875rem",
                    lineHeight: 1.75,
                    minHeight: "1.53rem",
                  }}
                >
                  {manga.author?.name || "ไม่ระบุผู้แต่ง"}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap", alignItems: "center", mt: 0.5 }}
                >
                  <MangaStatus manga={manga} />
                  {manga.category && (
                    <Typography
                      noWrap
                      sx={{
                        color: maggaColors.textSecondary,
                        fontSize: "0.75rem",
                        maxWidth: "100%",
                      }}
                    >
                      {manga.category.name}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
            <Stack
              direction="row"
              useFlexGap
              spacing={0.5}
              sx={{
                flexWrap: "wrap",
                alignItems: "center",
                minHeight: 44,
                mt: 0.5,
              }}
            >
              {manga.tags.slice(0, 2).map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    maxWidth: 100,
                    color: maggaColors.textSecondary,
                    bgcolor: maggaColors.surfaceElevated,
                    height: "auto",
                    minHeight: 24,
                    "& .MuiChip-label": { lineHeight: 1.75, py: "1px" },
                    fontSize: "0.75rem",
                  }}
                />
              ))}
              <Button
                onClick={() => toggle(manga.id)}
                aria-expanded={open}
                aria-controls={`manga-details-${manga.id}`}
                sx={{
                  minHeight: 44,
                  minWidth: 44,
                  fontSize: "0.75rem",
                  px: 1,
                  color: maggaColors.textSecondary,
                }}
              >
                {open
                  ? "ย่อรายละเอียด"
                  : manga.tags.length > 2
                    ? `+${manga.tags.length - 2} · รายละเอียด`
                    : "รายละเอียด"}
              </Button>
            </Stack>
            {open && (
              <Box
                id={`manga-details-${manga.id}`}
                sx={{ py: 1, overflowWrap: "anywhere" }}
              >
                <Typography sx={{ fontWeight: 600 }}>{manga.title}</Typography>
                <Typography
                  sx={{
                    color: maggaColors.textSecondary,
                    fontSize: "0.875rem",
                  }}
                >
                  ผู้แต่ง: {manga.author?.name || "ไม่ระบุ"}
                </Typography>
                <Typography
                  sx={{
                    color: maggaColors.textSecondary,
                    fontSize: "0.875rem",
                  }}
                >
                  หมวดหมู่: {manga.category?.name || "ไม่ระบุ"}
                </Typography>
                <Typography
                  sx={{
                    color: maggaColors.textSecondary,
                    fontSize: "0.875rem",
                  }}
                >
                  แท็ก:{" "}
                  {manga.tags.map((tag) => tag.name).join(", ") || "ไม่มีแท็ก"}
                </Typography>
              </Box>
            )}
            <Stack
              direction="row"
              useFlexGap
              spacing={0.5}
              sx={{
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 44,
              }}
            >
              <Box
                sx={{
                  color: maggaColors.textSecondary,
                  fontSize: "0.75rem",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Box component="span" sx={{ display: "block" }}>
                  ยอดอ่าน {manga.viewCount.toLocaleString()}
                </Box>
                <Box component="span">
                  {weekViews === undefined
                    ? "ยังไม่มีข้อมูล 7 วัน"
                    : `7 วัน ${weekViews.toLocaleString()}`}
                </Box>
              </Box>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  "& .MuiIconButton-root": { width: 44, height: 44 },
                }}
              >
                <Button
                  component={Link}
                  href={`/dashboard/admin/manga/${manga.id}/edit`}
                  prefetch={false}
                  startIcon={<EditIcon fontSize="small" />}
                  disabled={busy}
                  aria-label={`แก้ไข ${manga.title}`}
                  sx={{ minHeight: 44, px: 1 }}
                >
                  แก้ไข
                </Button>
                <AdminRowMenu
                  title={manga.title}
                  disabled={busy}
                  actions={[
                    {
                      label: "เปิดหน้าเรื่อง",
                      icon: <OpenInNewIcon fontSize="small" />,
                      href: `/${manga.slug || manga.id}`,
                      newTab: true,
                    },
                    {
                      label: "ตั้งค่าด่วน",
                      icon: <TuneIcon fontSize="small" />,
                      onClick: () => onSettings(manga),
                    },
                    {
                      label: "ดูสถิติ",
                      icon: <QueryStatsIcon fontSize="small" />,
                      onClick: () => onHistory(manga),
                    },
                    {
                      label: manga.isHidden ? "เผยแพร่เรื่อง" : "ซ่อนเรื่อง",
                      icon: manga.isHidden ? (
                        <VisibilityIcon fontSize="small" />
                      ) : (
                        <VisibilityOffIcon fontSize="small" />
                      ),
                      onClick: () => onVisibility(manga),
                    },
                    {
                      label: "ลบเรื่อง",
                      icon: <DeleteOutlinedIcon fontSize="small" />,
                      danger: true,
                      onClick: () => onDelete(manga),
                    },
                  ]}
                />
              </Stack>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
