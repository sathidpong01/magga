"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  TextField,
  type AutocompleteRenderInputParams,
} from "@mui/material";
type Option = { id: string; name: string };
export default function AdminOptionPicker({
  kind,
  label,
  values,
  onChange,
  multiple = false,
}: {
  kind: "authors" | "categories" | "tags";
  label: string;
  values: Option[];
  onChange: (options: Option[]) => void;
  multiple?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [options, setOptions] = useState<Option[]>([]),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(false);
  const ids = values.map((v) => v.id).join(",");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({ kind, search, selected: ids });
      void fetch(`/api/admin/catalog-options?${params}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (response) => {
          if (!response.ok) throw Error();
          const data = await response.json();
          if (!controller.signal.aborted) setOptions(data.items);
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, kind, search, ids, retry]);
  const common = {
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    options,
    loading,
    filterOptions: (items: Option[]) => items,
    getOptionLabel: (o: Option) => o.name,
    isOptionEqualToValue: (a: Option, b: Option) => a.id === b.id,
    onInputChange: (_: unknown, value: string, reason: string) => {
      if (reason === "input" || reason === "clear") setSearch(value);
    },
    noOptionsText: "ไม่พบรายการ",
    loadingText: "กำลังค้นหา…",
    renderInput: (params: AutocompleteRenderInputParams) => (
      <TextField {...params} label={label} size="small" />
    ),
  };
  return (
    <Box>
      {multiple ? (
        <Autocomplete
          {...common}
          multiple
          value={values}
          onChange={(_, next) => onChange(next)}
        />
      ) : (
        <Autocomplete
          {...common}
          value={values[0] ?? null}
          onChange={(_, next) => onChange(next ? [next] : [])}
        />
      )}
      {error && (
        <Alert severity="error">
          โหลดตัวเลือกไม่ได้{" "}
          <Button onClick={() => setRetry((v) => v + 1)}>ลองใหม่</Button>
        </Alert>
      )}
    </Box>
  );
}
