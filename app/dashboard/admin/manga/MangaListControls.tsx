"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AdminPageQuery } from "@/lib/admin-pagination";
import {
  mangaSorts,
  mangaStatuses,
} from "@/app/components/dashboard/manga-list-layout";
import { maggaColors } from "@/lib/design-tokens";

export default function MangaListControls({
  query,
  hasMore,
  count,
  pagination = false,
  loading = false,
}: {
  query: AdminPageQuery;
  hasMore: boolean;
  count: number;
  pagination?: boolean;
  loading?: boolean;
}) {
  const router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams();
  const [search, setSearch] = useState(query.search);
  const [transitioning, startTransition] = useTransition();
  const pending = loading || transitioning;
  useEffect(() => setSearch(query.search), [query.search]);
  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Each new result set starts at the list heading. Edit/return scroll memory is separate.
    startTransition(() => router.push(`${pathname}?${next}`, { scroll: true }));
  }
  const fieldSx = { minWidth: 0, "& .MuiInputBase-root": { minHeight: 44 } };
  if (pagination)
    return (
      <Stack
        component="nav"
        aria-label="การแบ่งหน้ามังงะ"
        direction="row"
        useFlexGap
        spacing={1}
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 56,
        }}
        aria-busy={pending}
      >
        <TextField
          select
          size="small"
          label="รายการต่อหน้า"
          value={query.limit}
          disabled={pending}
          sx={{ ...fieldSx, width: 130 }}
          onChange={(event) =>
            navigate({ limit: event.target.value, page: "1" })
          }
        >
          {[20, 50].map((limit) => (
            <MenuItem key={limit} value={limit}>
              {limit}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Button
            disabled={pending || query.page <= 1}
            onClick={() => navigate({ page: String(query.page - 1) })}
            sx={{ minHeight: 44 }}
          >
            ก่อนหน้า
          </Button>
          <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
            หน้า {query.page}
          </Typography>
          <Button
            disabled={pending || !hasMore}
            onClick={() => navigate({ page: String(query.page + 1) })}
            sx={{ minHeight: 44 }}
          >
            ถัดไป
          </Button>
        </Stack>
      </Stack>
    );
  return (
    <Box data-admin-list-ready={loading ? undefined : true} aria-busy={pending}>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ search, page: "1" });
        }}
        sx={{ display: "flex", gap: 1 }}
      >
        <TextField
          label="ค้นหาชื่อเรื่องหรือผู้แต่ง"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          fullWidth
          sx={fieldSx}
          slotProps={{ htmlInput: { maxLength: 120 } }}
          disabled={pending}
        />
        <Button
          type="submit"
          variant="outlined"
          disabled={pending}
          sx={{ minWidth: 64, minHeight: 44 }}
        >
          ค้นหา
        </Button>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 1,
          mt: 1.5,
          maxWidth: { sm: 440 },
        }}
      >
        <TextField
          select
          label="สถานะ"
          size="small"
          value={
            mangaStatuses.some((item) => item.value === query.status)
              ? query.status
              : ""
          }
          disabled={pending}
          sx={fieldSx}
          slotProps={{
            inputLabel: { shrink: true },
            select: { displayEmpty: true },
          }}
          onChange={(event) =>
            navigate({ status: event.target.value, page: "1" })
          }
        >
          {mangaStatuses.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="เรียงตาม"
          size="small"
          value={
            mangaSorts.some((item) => item.value === query.sort)
              ? query.sort
              : ""
          }
          disabled={pending}
          sx={fieldSx}
          slotProps={{
            inputLabel: { shrink: true },
            select: { displayEmpty: true },
          }}
          onChange={(event) =>
            navigate({ sort: event.target.value, page: "1" })
          }
        >
          {mangaSorts.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      {(query.search || query.status || query.sort) && (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap", alignItems: "center", mt: 1 }}
        >
          {query.search && (
            <Chip label={`ค้นหา: ${query.search}`} sx={{ maxWidth: "100%" }} />
          )}
          {query.status && (
            <Chip
              label={
                mangaStatuses.find((item) => item.value === query.status)
                  ?.label ?? query.status
              }
            />
          )}
          {query.sort && (
            <Chip
              label={`เรียง: ${mangaSorts.find((item) => item.value === query.sort)?.label ?? query.sort}`}
            />
          )}
          <Button
            disabled={pending}
            onClick={() => {
              setSearch("");
              navigate({ search: "", status: "", sort: "", page: "1" });
            }}
            sx={{ minHeight: 44 }}
          >
            ล้างตัวกรอง
          </Button>
        </Stack>
      )}
      <Typography
        role="status"
        sx={{
          color: maggaColors.textSecondary,
          fontSize: "0.875rem",
          minHeight: 28,
          mt: 1,
        }}
      >
        {pending
          ? "กำลังโหลดรายการ…"
          : `${count} รายการในหน้านี้ · หน้า ${query.page}`}
      </Typography>
    </Box>
  );
}
