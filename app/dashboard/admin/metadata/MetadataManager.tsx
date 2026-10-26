"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { authFetch } from "@/lib/auth-fetch";
import { dashboardTokens } from "@/app/components/dashboard/system";
type Item = { id: string; name: string };
export default function MetadataManager({
  initialCategories,
  initialTags,
  initialTab = 0,
}: {
  initialCategories: Item[];
  initialTags: Item[];
  initialTab?: number;
}) {
  const router = useRouter(),
    params = useSearchParams();
  const [items, setItems] = useState(
      initialTab === 0 ? initialCategories : initialTags,
    ),
    [adding, setAdding] = useState(false),
    [removing, setRemoving] = useState<Item | null>(null),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const kind = initialTab === 0 ? "categories" : "tags";
  useEffect(
    () => setItems(initialTab === 0 ? initialCategories : initialTags),
    [initialCategories, initialTags, initialTab],
  );
  async function save(remove?: Item) {
    if (lock.current || (!remove && !name.trim())) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await authFetch(
        `/api/${kind}${remove ? `/${remove.id}` : ""}`,
        {
          method: remove ? "DELETE" : "POST",
          ...(!remove
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
              }
            : {}),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw Error(data.error || "บันทึกไม่ได้");
      }
      setAdding(false);
      setRemoving(null);
      setName("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกไม่ได้");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Tabs
          value={initialTab}
          onChange={(_, value) => {
            const next = new URLSearchParams(params.toString());
            next.set("tab", value === 1 ? "tags" : "categories");
            next.delete("page");
            next.delete("search");
            router.push(`/dashboard/admin/metadata?${next}`, { scroll: false });
          }}
          aria-label="ประเภทเมตาดาต้า"
        >
          <Tab label="หมวดหมู่" />
          <Tab label="แท็ก" />
        </Tabs>
        <Button
          onClick={() => {
            setError("");
            setAdding(true);
          }}
        >
          เพิ่ม{initialTab === 0 ? "หมวดหมู่" : "แท็ก"}
        </Button>
      </Stack>
      {!items.length && (
        <Typography sx={{ py: 3 }}>ไม่พบรายการในตัวกรองนี้</Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" },
          gap: 1,
        }}
      >
        {items.map((item) => (
          <Stack
            key={item.id}
            direction="row"
            sx={{
              alignItems: "center",
              p: 1,
              bgcolor: dashboardTokens.surface,
              borderRadius: 1,
              gap: 1,
            }}
          >
            <Typography sx={{ flex: 1, overflowWrap: "anywhere" }}>
              {item.name}
            </Typography>
            <IconButton
              aria-label={`ลบ ${item.name}`}
              onClick={() => {
                setError("");
                setRemoving(item);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Box>
      <Dialog
        open={adding || Boolean(removing)}
        onClose={() => {
          if (!busy) {
            setAdding(false);
            setRemoving(null);
          }
        }}
        fullWidth
        maxWidth="sm"
        aria-labelledby="metadata-dialog-title"
      >
        <DialogTitle id="metadata-dialog-title">
          {removing ? `ลบ ${removing.name}` : "เพิ่มรายการ"}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error">{error}</Alert>}
          {removing ? (
            <Typography>ยืนยันลบรายการนี้และนำออกจากผลงานที่ใช้อยู่</Typography>
          ) : (
            <TextField
              autoFocus
              fullWidth
              label="ชื่อ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={busy}
            onClick={() => {
              setAdding(false);
              setRemoving(null);
            }}
          >
            ยกเลิก
          </Button>
          <Button
            disabled={busy || (!removing && !name.trim())}
            color={removing ? "error" : "primary"}
            onClick={() => void save(removing ?? undefined)}
          >
            {busy ? "กำลังบันทึก…" : removing ? "ยืนยันลบ" : "เพิ่ม"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
