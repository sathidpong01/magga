"use client";
import AdminRowMenu from "@/app/components/dashboard/AdminRowMenu";
import AdminOptionPicker from "@/app/components/dashboard/AdminOptionPicker";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TuneIcon from "@mui/icons-material/Tune";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  Stack,
  Avatar,
} from "@mui/material";

import Link from "next/link";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/contexts/ToastContext";
import {
  dashboardTokens,
  dashboardPrimaryButtonSx,
} from "@/app/components/dashboard/system";
import { authFetch } from "@/lib/auth-fetch";
import { getMetadataChipSx } from "@/lib/metadata-chip-tone";
import CacheRefreshNotice from "@/app/components/dashboard/CacheRefreshNotice";
import MangaViewHistory, {
  HistoryDialog,
} from "@/app/components/dashboard/MangaViewHistory";
import MangaCompactList, {
  MangaStatus,
  type ManagedManga,
} from "./MangaCompactList";

import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import {
  mangaColumnWidths,
  mangaTableSx,
  mangaCollectionSx,
  mangaCompactSx,
  mangaWideSx,
} from "@/app/components/dashboard/manga-list-layout";

type Manga = ManagedManga;

type MangaDataTableProps = {
  initialMangas: Manga[];
};

const shellSx = {
  bgcolor: dashboardTokens.surface,
  border: `1px solid ${dashboardTokens.border}`,
  borderRadius: "12px",
  backgroundImage: "none",
  boxShadow: "0 8px 30px -4px rgba(0,0,0,0.4)",
};

const surfaceSx = {
  bgcolor: dashboardTokens.surfaceMuted,
  border: `1px solid ${dashboardTokens.border}`,
  borderRadius: "10px",
  backgroundImage: "none",
};

export default function MangaDataTable({ initialMangas }: MangaDataTableProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [mangas, setMangas] = useState(initialMangas);
  const mutationInFlight = useRef(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [cacheRefreshPending, setCacheRefreshPending] = useState(false);
  useEffect(() => {
    setMangas(initialMangas);
  }, [initialMangas]);
  useEffect(() => {
    if (!initialMangas.some(manga => manga.isHidden && manga.scheduledPublishAt)) return;
    const refreshScheduled = () => {
      if (document.visibilityState === "visible" && !mutationInFlight.current) router.refresh();
    };
    const timer = setInterval(refreshScheduled, 15000);
    document.addEventListener("visibilitychange", refreshScheduled);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshScheduled);
    };
  }, [initialMangas, router]);

  const [selected, setSelected] = useState<string[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [historyManga, setHistoryManga] = useState<Manga | null>(null);
  const [visibilityTarget, setVisibilityTarget] = useState<Manga | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<"delete" | "show" | null>(
    null,
  );
  function requestVisibility(manga: Manga) {
    if (manga.isHidden && manga.scheduledPublishAt) setVisibilityTarget(manga);
    else void handleToggleVisibility(manga.id, manga.isHidden);
  }
  function exitSelection() {
    setSelected([]);
    setSelecting(false);
  }

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [authorOption, setAuthorOption] = useState<
      { id: string; name: string }[]
    >([]),
    [categoryOption, setCategoryOption] = useState<
      { id: string; name: string }[]
    >([]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mangaToDelete, setMangaToDelete] = useState<Manga | null>(null);

  const filteredMangas = mangas;
  useEffect(() => {
    setSelected((previous) =>
      previous.filter((id) => initialMangas.some((manga) => manga.id === id)),
    );
  }, [initialMangas]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredMangas.map((m) => m.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleVisibility = async (id: string, currentState: boolean) => {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    setBulkBusy(true);
    try {
      const res = await authFetch(`/api/manga/${id}/toggle-visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !currentState }),
      });
      if (!res.ok) throw new Error("ไม่สามารถเปลี่ยนสถานะได้");
      const updated = (await res.json()) as {
        isHidden: boolean;
        cache_refresh_pending?: boolean;
      };
      if (updated.cache_refresh_pending) setCacheRefreshPending(true);
      setMangas((previous) =>
        previous.map((manga) =>
          manga.id === id
            ? {
                ...manga,
                isHidden: updated.isHidden,
                scheduledPublishAt: null,
                publicationTimeZone: null,
              }
            : manga,
        ),
      );
      showSuccess(
        updated.isHidden ? "ซ่อนมังงะเรียบร้อย" : "แสดงมังงะเรียบร้อย",
      );
      setVisibilityTarget(null);
      router.refresh();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
      );
    } finally {
      mutationInFlight.current = false;
      setBulkBusy(false);
    }
  };

  const handleOpenSettings = (manga: Manga) => {
    setEditingManga(manga);
    setSelectedCategory(manga.category?.name || "");
    setSelectedTags(manga.tags || []);
    setSelectedAuthor(manga.author?.name || "");
    setAuthorOption(
      manga.author
        ? [{ id: manga.author.id ?? "", name: manga.author.name }]
        : [],
    );
    setCategoryOption(
      manga.category
        ? [
            {
              id: manga.category.id ?? "",
              name: manga.category.name,
            },
          ]
        : [],
    );
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editingManga || mutationInFlight.current) return;
    mutationInFlight.current = true;
    setBulkBusy(true);
    try {
      const res = await authFetch(`/api/admin/manga/quick-edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingManga.id,
          categoryName: selectedCategory,
          tagNames: selectedTags.map((t) => t.name),
          authorName: selectedAuthor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cache_refresh_pending) setCacheRefreshPending(true);

        // Update local state immediately
        setMangas((prev) =>
          prev.map((m) =>
            m.id === editingManga.id
              ? {
                  ...m,
                  category: data.manga.category,
                  tags: data.manga.tags,
                  author: data.manga.author,
                }
              : m,
          ),
        );

        setSettingsOpen(false);
        showSuccess("อัปเดต Quick Settings เรียบร้อย");
      } else {
        showError("ไม่สามารถอัปเดตได้");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      showError("เกิดข้อผิดพลาดในการอัปเดต");
    } finally {
      mutationInFlight.current = false;
      setBulkBusy(false);
    }
  };

  const handleOpenDeleteDialog = (manga: Manga) => {
    setMangaToDelete(manga);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mangaToDelete || mutationInFlight.current) return;
    mutationInFlight.current = true;
    setBulkBusy(true);
    try {
      const res = await authFetch(`/api/manga/${mangaToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (res.headers.get("X-Magga-Cache-Refresh") === "pending")
          setCacheRefreshPending(true);
        setMangas((prev) => prev.filter((m) => m.id !== mangaToDelete.id));
        setDeleteDialogOpen(false);
        router.refresh();
        setMangaToDelete(null);
        showSuccess(`ลบมังงะ "${mangaToDelete.title}" เรียบร้อย`);
      } else {
        showError("ไม่สามารถลบมังงะได้");
      }
    } catch (error) {
      console.error("Failed to delete manga:", error);
      showError("เกิดข้อผิดพลาดในการลบ");
    } finally {
      mutationInFlight.current = false;
      setBulkBusy(false);
    }
  };

  const runBulkAction = async (action: "delete" | "hide" | "show") => {
    if (mutationInFlight.current || !selected.length) return;
    mutationInFlight.current = true;
    setBulkBusy(true);
    const requested = [...selected];
    try {
      const res = await authFetch("/api/admin/manga/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: requested, action }),
      });
      if (!res.ok) throw new Error("ไม่สามารถบันทึกการเปลี่ยนแปลงได้");
      const data = (await res.json()) as {
        ids: string[];
        cache_refresh_pending?: boolean;
      };
      if (data.cache_refresh_pending) setCacheRefreshPending(true);
      const changed = new Set(data.ids);
      setMangas((previous) =>
        action === "delete"
          ? previous.filter((manga) => !changed.has(manga.id))
          : previous.map((manga) =>
              changed.has(manga.id)
                ? {
                    ...manga,
                    isHidden: action === "hide",
                    scheduledPublishAt: null,
                    publicationTimeZone: null,
                  }
                : manga,
            ),
      );
      setSelected((previous) => previous.filter((id) => !changed.has(id)));
      setBulkConfirm(null);
      showSuccess(`บันทึกแล้ว ${changed.size} เรื่อง`);
      if (changed.size < requested.length)
        showError("บางรายการไม่พบแล้ว กรุณารีเฟรชและตรวจรายการที่ยังเลือกอยู่");
      router.refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      mutationInFlight.current = false;
      setBulkBusy(false);
    }
  };
  const selectedScheduled = mangas.filter(
    (manga) => selected.includes(manga.id) && manga.scheduledPublishAt,
  );
  return (
    <Box sx={{ ...shellSx, ...mangaCollectionSx, overflow: "visible" }}>
      {cacheRefreshPending && (
        <CacheRefreshNotice
          onRefreshed={() => {
            setCacheRefreshPending(false);
            router.refresh();
          }}
        />
      )}
      <Box
        sx={{
          position: selecting ? "sticky" : "static",
          top: { xs: 56, md: 8 },
          zIndex: selecting ? 10 : "auto",
          bgcolor: maggaColors.surface,
          borderRadius: "12px 12px 0 0",
        }}
      >
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1,
            minHeight: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography
            role="status"
            sx={{ color: maggaColors.textSecondary, fontSize: "0.875rem" }}
          >
            {selecting
              ? `เลือกแล้ว ${selected.length} เรื่อง · เฉพาะหน้านี้`
              : "รายการมังงะ"}
          </Typography>
          <Button
            disabled={bulkBusy || !mangas.length}
            onClick={() => (selecting ? exitSelection() : setSelecting(true))}
            sx={{ minHeight: 44 }}
          >
            {selecting ? "ยกเลิกการเลือก" : "เลือกรายการ"}
          </Button>
        </Box>
        {selecting && (
          <Box
            sx={{
              px: 1.5,
              py: 1,
              bgcolor: maggaColors.archiveGoldSoft,
              borderBottom: `1px solid ${maggaColors.border}`,
            }}
          >
            <Box
              component="label"
              sx={{
                display: "flex",
                alignItems: "center",
                width: "fit-content",
                fontSize: "0.875rem",
                minHeight: 44,
              }}
            >
              <Checkbox
                disabled={bulkBusy}
                checked={!!mangas.length && selected.length === mangas.length}
                indeterminate={
                  !!selected.length && selected.length < mangas.length
                }
                onChange={handleSelectAll}
                sx={{ width: 44, height: 44 }}
              />
              เลือกทั้งหมดในหน้านี้
            </Box>
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Button
                disabled={bulkBusy || !selected.length}
                onClick={() => void runBulkAction("hide")}
                sx={{ minHeight: 44 }}
              >
                ซ่อนที่เลือก
              </Button>
              <Button
                disabled={bulkBusy || !selected.length}
                onClick={() =>
                  selectedScheduled.length
                    ? setBulkConfirm("show")
                    : void runBulkAction("show")
                }
                sx={{ minHeight: 44 }}
              >
                เผยแพร่ที่เลือก
              </Button>
              <Button
                disabled={bulkBusy || !selected.length}
                onClick={() => setBulkConfirm("delete")}
                sx={{ minHeight: 44, color: maggaColors.dangerRedText }}
              >
                ลบที่เลือก
              </Button>
            </Stack>
            {bulkBusy && (
              <Typography role="status" sx={{ fontSize: "0.875rem" }}>
                กำลังบันทึก กรุณารอสักครู่…
              </Typography>
            )}
          </Box>
        )}
      </Box>
      {!mangas.length ? (
        <Box sx={{ p: 3, minHeight: 180, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 600 }}>ไม่พบมังงะในหน้านี้</Typography>
          <Typography sx={{ color: maggaColors.textSecondary, mt: 1 }}>
            ลองเปลี่ยนคำค้น ล้างตัวกรอง หรือกลับไปหน้าก่อนหน้า
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={mangaCompactSx}>
            <MangaCompactList
              mangas={mangas}
              selecting={selecting}
              selected={selected}
              busy={bulkBusy}
              onSelect={handleSelect}
              onSettings={handleOpenSettings}
              onDelete={handleOpenDeleteDialog}
              onVisibility={requestVisibility}
              onHistory={setHistoryManga}
            />
          </Box>
          <TableContainer
            sx={{
              ...mangaWideSx,
              borderTop: `1px solid ${maggaColors.border}`,
              "& .MuiIconButton-root": { width: 44, height: 44 },
            }}
          >
            <Table
              sx={{
                ...mangaTableSx,
                "& th, & td": {
                  px: 1,
                  py: 1.5,
                  borderBottom: `1px solid ${maggaColors.border}`,
                },
              }}
              aria-label="รายการมังงะ"
            >
              <colgroup>
                {mangaColumnWidths.map((width, index) => (
                  <col key={index} style={{ width }} />
                ))}
              </colgroup>
              <TableHead>
                <TableRow>
                  {[
                    "เลือก",
                    "ปก",
                    "ชื่อเรื่อง",
                    "หมวดหมู่",
                    "แท็ก",
                    "สถานะ",
                    "ยอดอ่าน",
                    "จัดการ",
                  ].map((label) => (
                    <TableCell
                      key={label}
                      sx={{ color: maggaColors.textSecondary, fontWeight: 600 }}
                    >
                      {label === "เลือก" ? (
                        selecting ? (
                          <Checkbox
                            disabled={bulkBusy}
                            checked={
                              !!mangas.length &&
                              selected.length === mangas.length
                            }
                            indeterminate={
                              !!selected.length &&
                              selected.length < mangas.length
                            }
                            onChange={handleSelectAll}
                            slotProps={{
                              input: {
                                "aria-label": "เลือกมังงะทั้งหมดในหน้านี้",
                              },
                            }}
                          />
                        ) : null
                      ) : (
                        label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mangas.map((manga) => (
                  <TableRow
                    key={manga.id}
                    hover
                    selected={selected.includes(manga.id)}
                  >
                    <TableCell>
                      {selecting && (
                        <Checkbox
                          disabled={bulkBusy}
                          checked={selected.includes(manga.id)}
                          onChange={() => handleSelect(manga.id)}
                          slotProps={{
                            input: { "aria-label": `เลือก ${manga.title}` },
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Avatar
                        src={manga.coverImage || undefined}
                        alt=""
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 64,
                          borderRadius: `${maggaRadii.card}px`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/${manga.slug || manga.id}`}
                        prefetch={false}
                        title={manga.title}
                        style={{
                          color: maggaColors.textPrimary,
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        {manga.title}
                      </Link>
                      <Typography
                        noWrap
                        sx={{
                          color: maggaColors.textSecondary,
                          fontSize: "0.75rem",
                        }}
                      >
                        {manga.author?.name || "ไม่ระบุผู้แต่ง"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ overflowWrap: "anywhere", fontSize: "0.875rem" }}
                      >
                        {manga.category?.name || "ไม่ระบุ"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        useFlexGap
                        spacing={0.5}
                        sx={{ flexWrap: "wrap" }}
                      >
                        {manga.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{
                              ...getMetadataChipSx(tag.name),
                              maxWidth: "100%",
                              height: "auto",
                              minHeight: 24,
                              fontSize: "0.75rem",
                              "& .MuiChip-label": {
                                lineHeight: 1.75,
                                py: "1px",
                              },
                            }}
                          />
                        ))}
                        {manga.tags.length > 3 && (
                          <Button
                            onClick={() => handleOpenSettings(manga)}
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            +{manga.tags.length - 3}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <MangaStatus manga={manga} />
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          color: maggaColors.textSecondary,
                          fontSize: "0.75rem",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        สะสม {manga.viewCount.toLocaleString()}
                      </Typography>
                      <MangaViewHistory
                        id={manga.id}
                        title={manga.title}
                        initial={manga.viewHistory}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: "center" }}>
                        <Button
                          component={Link}
                          href={`/dashboard/admin/manga/${manga.id}/edit`}
                          prefetch={false}
                          disabled={bulkBusy}
                          aria-label={`แก้ไข ${manga.title}`}
                          sx={{ minHeight: 44 }}
                        >
                          แก้ไข
                        </Button>
                        <AdminRowMenu
                          title={manga.title}
                          disabled={bulkBusy}
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
                              onClick: () => handleOpenSettings(manga),
                            },
                            {
                              label: "ดูสถิติ",
                              icon: <QueryStatsIcon fontSize="small" />,
                              onClick: () => setHistoryManga(manga),
                            },
                            {
                              label: manga.isHidden
                                ? "เผยแพร่เรื่อง"
                                : "ซ่อนเรื่อง",
                              icon: manga.isHidden ? (
                                <VisibilityIcon fontSize="small" />
                              ) : (
                                <VisibilityOffIcon fontSize="small" />
                              ),
                              onClick: () => requestVisibility(manga),
                            },
                            {
                              label: "ลบเรื่อง",
                              icon: <DeleteOutlinedIcon fontSize="small" />,
                              danger: true,
                              onClick: () => handleOpenDeleteDialog(manga),
                            },
                          ]}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {historyManga && (
        <HistoryDialog
          id={historyManga.id}
          title={historyManga.title}
          close={() => setHistoryManga(null)}
        />
      )}
      <Dialog
        open={!!visibilityTarget}
        onClose={() => {
          if (!bulkBusy) setVisibilityTarget(null);
        }}
        aria-labelledby="publish-now-title"
      >
        <DialogTitle id="publish-now-title">เผยแพร่ทันที?</DialogTitle>
        <DialogContent sx={{ overflowWrap: "anywhere" }}>
          <Typography sx={{ overflowWrap: "anywhere" }}>
            {visibilityTarget?.title}
          </Typography>
          <Typography sx={{ mt: 1 }}>
            เรื่องนี้ตั้งเวลาเผยแพร่ไว้
            การยืนยันจะยกเลิกกำหนดเวลาและเผยแพร่ทันที
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ flexWrap: "wrap", "& .MuiButton-root": { minHeight: 44 } }}
        >
          <Button disabled={bulkBusy} onClick={() => setVisibilityTarget(null)}>
            ยกเลิก
          </Button>
          <Button
            disabled={bulkBusy}
            onClick={() => {
              if (visibilityTarget)
                void handleToggleVisibility(
                  visibilityTarget.id,
                  visibilityTarget.isHidden,
                );
            }}
          >
            เผยแพร่ทันที
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!bulkConfirm}
        onClose={() => {
          if (!bulkBusy) setBulkConfirm(null);
        }}
        aria-labelledby="bulk-confirm-title"
      >
        <DialogTitle id="bulk-confirm-title">
          {bulkConfirm === "delete"
            ? `ลบมังงะ ${selected.length} เรื่อง?`
            : `เผยแพร่ทันที ${selected.length} เรื่อง?`}
        </DialogTitle>
        <DialogContent sx={{ overflowWrap: "anywhere" }}>
          <Typography>
            {bulkConfirm === "delete"
              ? "การลบไม่สามารถยกเลิกได้ ตรวจสอบรายการก่อนยืนยัน"
              : `จะยกเลิกกำหนดเวลาของ ${selectedScheduled.length} เรื่อง และเผยแพร่รายการที่เลือกทันที`}
          </Typography>
          <Box
            component="ul"
            sx={{
              pl: 2.5,
              maxHeight: 240,
              overflow: "auto",
              overflowWrap: "anywhere",
            }}
          >
            {mangas
              .filter((manga) => selected.includes(manga.id))
              .map((manga) => (
                <li key={manga.id}>{manga.title}</li>
              ))}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ flexWrap: "wrap", "& .MuiButton-root": { minHeight: 44 } }}
        >
          <Button disabled={bulkBusy} onClick={() => setBulkConfirm(null)}>
            ยกเลิก
          </Button>
          <Button
            disabled={bulkBusy}
            color={bulkConfirm === "delete" ? "error" : "primary"}
            onClick={() => {
              if (bulkConfirm) void runBulkAction(bulkConfirm);
            }}
          >
            {bulkBusy
              ? "กำลังบันทึก…"
              : bulkConfirm === "delete"
                ? "ยืนยันการลบ"
                : "เผยแพร่ทันที"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Quick Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => {
          if (!bulkBusy) setSettingsOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...surfaceSx,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#fafafa",
            fontSize: "1.1rem",
            letterSpacing: "0.02em",
          }}
        >
          ตั้งค่าด่วน
          <Typography
            component="span"
            sx={{
              display: "block",
              overflowWrap: "anywhere",
              color: maggaColors.textSecondary,
              fontSize: "0.875rem",
            }}
          >
            {editingManga?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ overflowWrap: "anywhere" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <AdminOptionPicker
              kind="categories"
              label="หมวดหมู่"
              values={categoryOption}
              onChange={(values) => {
                setCategoryOption(values);
                setSelectedCategory(values[0]?.name ?? "");
              }}
            />
            <AdminOptionPicker
              kind="tags"
              label="แท็ก"
              multiple
              values={selectedTags}
              onChange={setSelectedTags}
            />
            <AdminOptionPicker
              kind="authors"
              label="ผู้แต่ง"
              values={authorOption}
              onChange={(values) => {
                setAuthorOption(values);
                setSelectedAuthor(values[0]?.name ?? "");
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            pt: 1,
            flexWrap: "wrap",
            "& .MuiButton-root": { minHeight: 44 },
          }}
        >
          <Button
            disabled={bulkBusy}
            onClick={() => setSettingsOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 500, textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            disabled={bulkBusy}
            onClick={handleSaveSettings}
            variant="contained"
            sx={{
              ...dashboardPrimaryButtonSx,
              borderRadius: 1.1,
              px: 3,
              textTransform: "none",
            }}
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!bulkBusy) setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent sx={{ overflowWrap: "anywhere" }}>
          คุณต้องการลบมังงะ "{mangaToDelete?.title}" ใช่หรือไม่?
          <br />
          <Box component="span" sx={{ color: "#ef4444", fontWeight: 600 }}>
            การกระทำนี้ไม่สามารถยกเลิกได้
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ flexWrap: "wrap", "& .MuiButton-root": { minHeight: 44 } }}
        >
          <Button
            disabled={bulkBusy}
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            disabled={bulkBusy}
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
