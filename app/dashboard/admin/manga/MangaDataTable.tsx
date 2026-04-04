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
import { getMetadataChipSx } from "@/lib/metadata-chip-tone";

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

const shellSx = {
  bgcolor: "#141414",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 1.5,
  backgroundImage: "none",
  boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
};

const surfaceSx = {
  bgcolor: "#171717",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 1.5,
  backgroundImage: "none",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#0B0B0B",
    borderRadius: 1.1,
    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.14)" },
    "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
  },
  "& .MuiInputLabel-root": { color: "#a3a3a3" },
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

  return (
    <Box
      sx={{
        ...shellSx,
        p: { xs: 2, md: 2.5 },
      }}
    >
      {selected.length > 0 && (
        <Toolbar
          sx={{
            mb: 2,
            bgcolor: "rgba(251, 191, 36, 0.08)",
            border: "1px solid rgba(251, 191, 36, 0.18)",
            borderRadius: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "#fbbf24", fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.02em" }}>
            เลือกแล้ว {selected.length} รายการ
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              startIcon={<VisibilityOffIcon />}
              onClick={() => handleBulkToggleVisibility(true)}
              sx={{ color: "#d4d4d4", borderRadius: 1.1, fontWeight: 700, textTransform: "none" }}
            >
              ซ่อนทั้งหมด
            </Button>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => handleBulkToggleVisibility(false)}
              sx={{ color: "#10b981", borderRadius: 1.1, fontWeight: 700, textTransform: "none" }}
            >
              แสดงทั้งหมด
            </Button>
            <Button
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              sx={{ color: "#ef4444", borderRadius: 1.1, fontWeight: 700, textTransform: "none" }}
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
          placeholder="ค้นหาชื่อมังงะ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ 
            width: 300,
            ...inputSx,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#a3a3a3", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ color: "#a3a3a3", fontSize: "0.875rem" }}>
          ผลลัพธ์ {filteredMangas.length} รายการ
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ 
          ...surfaceSx,
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 1120 }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                "& th": { borderBottom: "1px solid rgba(255,255,255,0.06)", py: 2, px: 2 },
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
                  sx={{ 
                    color: "#525252",
                    "&.Mui-checked": { color: "#FABF06" },
                    "&.MuiCheckbox-indeterminate": { color: "#FABF06" }
                  }}
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
                    sx={{ 
                      color: "#525252",
                      "&.Mui-checked": { color: "#FABF06" }
                    }}
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
                        bgcolor: "rgba(251,191,36,0.08)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.18)",
                        fontSize: "0.75rem",
                        height: 24,
                        fontWeight: 700,
                      }}
                    />
                  ) : (
                    <Box component="span" sx={{ color: "#525252" }}>-</Box>
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
                          ...getMetadataChipSx(tag.name),
                          fontSize: "0.75rem",
                          height: 24,
                          fontWeight: 600,
                          borderRadius: 0.75,
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
                      bgcolor: manga.isHidden ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                      color: manga.isHidden ? "#fca5a5" : "#4ade80",
                      border: manga.isHidden ? "1px solid rgba(239,68,68,0.16)" : "1px solid rgba(34,197,94,0.16)",
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
                    <Tooltip title="ตั้งค่า">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSettings(manga)}
                        sx={{
                          color: "#fbbf24",
                          bgcolor: "rgba(251, 191, 36, 0.08)",
                          borderRadius: 1.1,
                          "&:hover": { bgcolor: "rgba(251, 191, 36, 0.16)" },
                        }}
                      >
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="เปิดหน้าเรื่อง">
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/${manga.slug || manga.id}`}
                        target="_blank"
                        sx={{ color: "#3b82f6", "&:hover": { bgcolor: "#3b82f620" } }}
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
        PaperProps={{
          sx: {
            ...surfaceSx,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#fafafa", fontSize: "1.1rem", letterSpacing: "0.02em" }}>
          ตั้งค่าด่วน
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>หมวดหมู่</InputLabel>
              <Select
                value={selectedCategory}
                label="หมวดหมู่"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={inputSx}
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
                <TextField {...params} label="แท็ก" size="small" sx={inputSx} />
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
                <TextField {...params} label="ผู้แต่ง" size="small" sx={inputSx} />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setSettingsOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 700, textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSaveSettings} 
            variant="contained"
            sx={{ 
              bgcolor: "#fbbf24", 
              color: "#000", 
              fontWeight: 800,
              borderRadius: 1.1,
              px: 3,
              textTransform: "none",
              "&:hover": { bgcolor: "#f59e0b" }
            }}
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          คุณต้องการลบมังงะ "{mangaToDelete?.title}" ใช่หรือไม่?
          <br />
          <Box component="span" sx={{ color: "#ef4444", fontWeight: 600 }}>
            การกระทำนี้ไม่สามารถยกเลิกได้
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none" }}>ยกเลิก</Button>
          <Button
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
