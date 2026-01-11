"use client";

import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Checkbox,
  Tooltip,
  Stack,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/contexts/ToastContext";
import { authFetch } from "@/lib/auth-fetch";

type Manga = {
  id: string;
  title: string;
  slug: string | null;
  coverImage: string;
  isHidden: boolean;
  viewCount: number;
  category: { name: string } | null;
  tags: { id: string; name: string }[];
  author: { name: string } | null;
};

type MangaDataTableProps = {
  initialMangas: Manga[];
  allCategories: any[];
  allTags: any[];
  allAuthors: any[];
};

const TAG_COLORS: Record<string, string> = {
  tiger: "#f97316",
  human: "#8b5cf6",
  dog: "#06b6d4",
  wolf: "#6366f1",
  cat: "#ec4899",
  anal: "#ef4444",
  blowjob: "#f59e0b",
};

export default function MangaDataTable({
  initialMangas,
  allCategories,
  allTags,
  allAuthors,
}: MangaDataTableProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [mangas, setMangas] = useState(initialMangas);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mangaToDelete, setMangaToDelete] = useState<Manga | null>(null);

  const filteredMangas = mangas.filter((manga) =>
    manga.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredMangas.map((m) => m.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleVisibility = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/manga/${id}/toggle-visibility`, {
        method: "PATCH",
      });

      if (res.ok) {
        setMangas((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isHidden: !currentState } : m))
        );
        showSuccess(
          !currentState ? "ซ่อนมังงะเรียบร้อย" : "แสดงมังงะเรียบร้อย"
        );
      } else {
        showError("ไม่สามารถเปลี่ยนสถานะได้");
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      showError("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleOpenSettings = (manga: Manga) => {
    setEditingManga(manga);
    setSelectedCategory(manga.category?.name || "");
    setSelectedTags(manga.tags || []);
    setSelectedAuthor(manga.author?.name || "");
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editingManga) return;

    try {
      const res = await fetch(`/api/admin/manga/quick-edit`, {
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
              : m
          )
        );

        setSettingsOpen(false);
        showSuccess("อัปเดต Quick Settings เรียบร้อย");
      } else {
        showError("ไม่สามารถอัปเดตได้");
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      showError("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  const handleOpenDeleteDialog = (manga: Manga) => {
    setMangaToDelete(manga);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mangaToDelete) return;

    try {
      const res = await fetch(`/api/manga/${mangaToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMangas((prev) => prev.filter((m) => m.id !== mangaToDelete.id));
        setDeleteDialogOpen(false);
        setMangaToDelete(null);
        showSuccess(`ลบมังงะ "${mangaToDelete.title}" เรียบร้อย`);
      } else {
        showError("ไม่สามารถลบมังงะได้");
      }
    } catch (error) {
      console.error("Failed to delete manga:", error);
      showError("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = selected.map((id) =>
        fetch(`/api/manga/${id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.ok).length;

      setMangas((prev) => prev.filter((m) => !selected.includes(m.id)));
      setSelected([]);
      showSuccess(`ลบมังงะ ${successCount} เรื่องเรียบร้อย`);
    } catch (error) {
      console.error("Failed to bulk delete:", error);
      showError("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const handleBulkToggleVisibility = async (hidden: boolean) => {
    try {
      const togglePromises = selected.map((id) =>
        fetch(`/api/manga/${id}/toggle-visibility`, { method: "PATCH" })
      );

      await Promise.all(togglePromises);

      setMangas((prev) =>
        prev.map((m) =>
          selected.includes(m.id) ? { ...m, isHidden: hidden } : m
        )
      );

      setSelected([]);
      showSuccess(
        `${hidden ? "ซ่อน" : "แสดง"}มังงะ ${selected.length} เรื่องเรียบร้อย`
      );
    } catch (error) {
      console.error("Failed to bulk toggle:", error);
      showError("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const getTagColor = (tagName: string) => {
    const key = tagName.toLowerCase();
    return TAG_COLORS[key] || "#64748b";
  };

  return (
    <Box>
      {/* Bulk Actions Toolbar */}
      {selected.length > 0 && (
        <Toolbar
          sx={{
            mb: 2,
            bgcolor: "#8b5cf620",
            border: "1px solid #8b5cf640",
            borderRadius: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "#8b5cf6", fontWeight: 600 }}>
            เลือกแล้ว {selected.length} รายการ
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              startIcon={<VisibilityOffIcon />}
              onClick={() => handleBulkToggleVisibility(true)}
              sx={{ color: "#a3a3a3", borderRadius: 1 }}
            >
              ซ่อนทั้งหมด
            </Button>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => handleBulkToggleVisibility(false)}
              sx={{ color: "#10b981", borderRadius: 1 }}
            >
              แสดงทั้งหมด
            </Button>
            <Button
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              sx={{ color: "#ef4444", borderRadius: 1 }}
            >
              ลบทั้งหมด
            </Button>
          </Box>
        </Toolbar>
      )}

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="ค้นหามังงะ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ color: "#a3a3a3", fontSize: "0.875rem" }}>
          {filteredMangas.length} รายการ
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ bgcolor: "#0a0a0a", borderRadius: 1 }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                "& th": { borderBottom: "1px solid #262626", py: 2, px: 2 },
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selected.length > 0 &&
                    selected.length < filteredMangas.length
                  }
                  checked={
                    filteredMangas.length > 0 &&
                    selected.length === filteredMangas.length
                  }
                  onChange={handleSelectAll}
                  sx={{ color: "#525252" }}
                />
              </TableCell>
              <TableCell
                sx={{ color: "#a3a3a3", fontWeight: 600, width: "80px" }}
              >
                ปก
              </TableCell>
              <TableCell
                sx={{ color: "#a3a3a3", fontWeight: 600, minWidth: "200px" }}
              >
                ชื่อเรื่อง
              </TableCell>
              <TableCell
                sx={{ color: "#a3a3a3", fontWeight: 600, width: "120px" }}
              >
                หมวดหมู่
              </TableCell>
              <TableCell
                sx={{ color: "#a3a3a3", fontWeight: 600, minWidth: "200px" }}
              >
                แท็ก
              </TableCell>
              <TableCell
                sx={{ color: "#a3a3a3", fontWeight: 600, width: "100px" }}
              >
                สถานะ
              </TableCell>
              <TableCell
                sx={{ color: "#a3a3a3", fontWeight: 600, width: "80px" }}
              >
                ผู้ชม
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: "#a3a3a3", fontWeight: 600, width: "200px" }}
              >
                จัดการ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMangas.map((manga) => (
              <TableRow
                key={manga.id}
                hover
                sx={{
                  "&:hover": { bgcolor: "#171717" },
                  "& td": { borderBottom: "1px solid #262626", py: 2, px: 2 },
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(manga.id)}
                    onChange={() => handleSelect(manga.id)}
                    sx={{ color: "#525252" }}
                  />
                </TableCell>

                <TableCell>
                  <Avatar
                    src={manga.coverImage}
                    alt={manga.title}
                    variant="rounded"
                    sx={{ width: 40, height: 56 }}
                  />
                </TableCell>

                <TableCell>
                  <Link
                    href={`/${manga.slug || manga.id}`}
                    style={{
                      color: "#fafafa",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    {manga.title}
                  </Link>
                </TableCell>

                <TableCell>
                  {manga.category ? (
                    <Chip
                      label={manga.category.name}
                      size="small"
                      sx={{
                        bgcolor: "#1e293b",
                        color: "#94a3b8",
                        fontSize: "0.75rem",
                        height: 24,
                      }}
                    />
                  ) : (
                    <span style={{ color: "#525252" }}>-</span>
                  )}
                </TableCell>

                <TableCell>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    flexWrap="wrap"
                    gap={0.5}
                  >
                    {manga.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{
                          bgcolor: `${getTagColor(tag.name)}20`,
                          color: getTagColor(tag.name),
                          fontSize: "0.75rem",
                          height: 24,
                          fontWeight: 500,
                        }}
                      />
                    ))}
                    {manga.tags.length > 3 && (
                      <Chip
                        label={`+${manga.tags.length - 3}`}
                        size="small"
                        sx={{
                          bgcolor: "#27272a",
                          color: "#71717a",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    )}
                  </Stack>
                </TableCell>

                <TableCell>
                  <Chip
                    label={manga.isHidden ? "ซ่อน" : "เผยแพร่"}
                    size="small"
                    sx={{
                      bgcolor: manga.isHidden ? "#44403c20" : "#16a34a20",
                      color: manga.isHidden ? "#a8a29e" : "#22c55e",
                      fontSize: "0.75rem",
                      height: 24,
                      fontWeight: 600,
                    }}
                  />
                </TableCell>

                <TableCell sx={{ color: "#a3a3a3" }}>
                  {manga.viewCount.toLocaleString()}
                </TableCell>

                <TableCell align="right">
                  <Stack
                    direction="row"
                    spacing={0.5}
                    justifyContent="flex-end"
                  >
                    <Tooltip title="Settings">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSettings(manga)}
                        sx={{
                          color: "#8b5cf6",
                          "&:hover": { bgcolor: "#8b5cf620" },
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="View Page">
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/${manga.slug || manga.id}`}
                        target="_blank"
                        sx={{
                          color: "#3b82f6",
                          "&:hover": { bgcolor: "#3b82f620" },
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={manga.isHidden ? "แสดง" : "ซ่อน"}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleToggleVisibility(manga.id, manga.isHidden)
                        }
                        sx={{
                          color: "#10b981",
                          "&:hover": { bgcolor: "#10b98120" },
                        }}
                      >
                        {manga.isHidden ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="แก้ไข">
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/dashboard/admin/manga/${manga.id}/edit`}
                        sx={{
                          color: "#f59e0b",
                          "&:hover": { bgcolor: "#f59e0b20" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="ลบ">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDeleteDialog(manga)}
                        sx={{
                          color: "#ef4444",
                          "&:hover": { bgcolor: "#ef444420" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Quick Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Quick Settings - {editingManga?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>หมวดหมู่</InputLabel>
              <Select
                value={selectedCategory}
                label="หมวดหมู่"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {allCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              options={allTags}
              value={selectedTags}
              onChange={(_, newValue) => setSelectedTags(newValue)}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="แท็ก" size="small" />
              )}
            />

            <Autocomplete
              options={allAuthors}
              value={
                allAuthors.find((a: any) => a.name === selectedAuthor) || null
              }
              onChange={(_, newValue) =>
                setSelectedAuthor(newValue?.name || "")
              }
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="ผู้แต่ง" size="small" />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ยืนย��นการลบ</DialogTitle>
        <DialogContent>
          คุณต้องการลบมังงะ "{mangaToDelete?.title}" ใช่หรือไม่?
          <br />
          <span style={{ color: "#ef4444", fontWeight: 600 }}>
            การกระทำนี้ไม่สามารถยกเลิกได้
          </span>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
