"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import type { AdminPageQuery } from "@/lib/admin-pagination";

/** The URL is the list state. Typing never triggers a server navigation. */
export default function AdminListControls({
  query,
  hasMore,
  count,
  sorts = [],
  statuses = [],
}: {
  query: AdminPageQuery;
  hasMore: boolean;
  count: number;
  sorts?: { value: string; label: string }[];
  statuses?: { value: string; label: string }[];
}) {
  const router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams();
  const [search, setSearch] = useState(query.search);
  const [pending, startTransition] = useTransition();
  useEffect(() => setSearch(query.search), [query.search]);
  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() =>
      router.push(`${pathname}?${next}`, { scroll: false }),
    );
  }
  return (
    <Box
      data-admin-list-ready
      aria-busy={pending}
      sx={{ my: 2, minHeight: 100 }}
    >
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ search, page: "1" });
        }}
        sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}
      >
        <TextField
          label="ค้นหารายการทั้งหมด"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: "1 1 220px" }}
          slotProps={{ htmlInput: { maxLength: 120 } }}
        />
        <Button type="submit" disabled={pending}>
          ค้นหา
        </Button>
        {query.search && (
          <Button
            disabled={pending}
            onClick={() => {
              setSearch("");
              navigate({ search: "", page: "1" });
            }}
          >
            ล้างค้นหา
          </Button>
        )}
        {statuses.length > 0 && (
          <TextField
            select
            label="สถานะ"
            value={query.status}
            onChange={(e) => navigate({ status: e.target.value, page: "1" })}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {statuses.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        {sorts.length > 0 && (
          <TextField
            select
            label="เรียงตาม"
            value={
              sorts.some((s) => s.value === query.sort)
                ? query.sort
                : sorts[0].value
            }
            onChange={(e) => navigate({ sort: e.target.value, page: "1" })}
            size="small"
            sx={{ minWidth: 150 }}
          >
            {sorts.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          select
          label="รายการต่อหน้า"
          value={query.limit}
          onChange={(e) => navigate({ limit: e.target.value, page: "1" })}
          size="small"
          sx={{ minWidth: 130 }}
        >
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </TextField>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexWrap: "wrap",
          mt: 1,
        }}
      >
        <Typography variant="body2" role="status" sx={{ flex: 1 }}>
          {pending
            ? "กำลังโหลด…"
            : `หน้า ${query.page} · ${count} รายการในหน้านี้`}
        </Typography>
        <Button
          disabled={pending || query.page <= 1}
          onClick={() => navigate({ page: String(query.page - 1) })}
        >
          ก่อนหน้า
        </Button>
        <Button
          disabled={pending || !hasMore}
          onClick={() => navigate({ page: String(query.page + 1) })}
        >
          ถัดไป
        </Button>
      </Box>
    </Box>
  );
}
