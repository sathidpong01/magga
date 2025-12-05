"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  IconButton,
  InputBase,
  Button,
  Tooltip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import LinkButton from "@/app/components/ui/LinkButton";
import MangaActions from "../MangaActions";
import { useRouter } from "next/navigation";

type Tag = { id: string; name: string };
type Category = { id: string; name: string };

type Manga = {
  id: string;
  title: string;
  slug: string;
  isHidden: boolean;
  _cover: string;
  category: Category | null;
  tags: Tag[];
};

type Props = {
  mangas: Manga[];
  allCategories: Category[];
  allTags: Tag[];
};

export default function AdminMangaTable({ mangas, allCategories, allTags }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  // Quick Edit Modal State
  const [editManga, setEditManga] = useState<Manga | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editTags, setEditTags] = useState<Tag[]>([]);

  // Real-time filtering
  const filteredMangas = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return mangas;
    const query = searchQuery.toLowerCase();
    return mangas.filter((manga) =>
      manga.title.toLowerCase().includes(query)
    );
  }, [mangas, searchQuery]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredMangas.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected =
    filteredMangas.length > 0 && selectedIds.size === filteredMangas.length;
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // Bulk actions
  const handleBulkAction = async (action: "delete" | "show" | "hide") => {
    if (selectedIds.size === 0) return;
    
    const confirmMsg = {
      delete: `ยืนยันการลบ ${selectedIds.size} รายการ?`,
      show: `ยืนยันการเผยแพร่ ${selectedIds.size} รายการ?`,
      hide: `ยืนยันการซ่อน ${selectedIds.size} รายการ?`,
    };

    if (!confirm(confirmMsg[action])) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/manga/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to perform bulk action");

      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error("Bulk action error:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Edit handlers
  const openQuickEdit = (manga: Manga) => {
    setEditManga(manga);
    setEditCategoryId(manga.category?.id || "");
    setEditTags(manga.tags || []);
  };

  const closeQuickEdit = () => {
    setEditManga(null);
    setEditCategoryId("");
    setEditTags([]);
  };

  const handleQuickSave = async () => {
    if (!editManga) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/manga/quick-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editManga.id,
          categoryId: editCategoryId || null,
          tagIds: editTags.map((t) => t.id),
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      closeQuickEdit();
      router.refresh();
    } catch (error) {
      console.error("Quick edit error:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Paper
        sx={{
          borderRadius: 1,
          boxShadow: "none",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          bgcolor: "#171717",
          overflow: "hidden",
        }}
      >
        {/* Header with Search and Actions */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#fafafa" }}>
              รายการมังงะ
            </Typography>
            <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
              {filteredMangas.length} รายการ
              {searchQuery && ` (ค้นหา: "${searchQuery}")`}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search Input */}
            <Paper
              sx={{
                p: "2px 8px",
                display: "flex",
                alignItems: "center",
                width: 250,
                borderRadius: 1,
                boxShadow: "none",
                bgcolor: "#0a0a0a",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <SearchIcon sx={{ color: "#a3a3a3", mr: 1 }} fontSize="small" />
              <InputBase
                sx={{ flex: 1, color: "#fafafa", fontSize: "0.875rem" }}
                placeholder="ค้นหามังงะ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Paper>

            <LinkButton
              href="/admin/manga/new"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                bgcolor: "#8b5cf6",
                "&:hover": { bgcolor: "#7c3aed" },
              }}
            >
              เพิ่มใหม่
            </LinkButton>
          </Box>
        </Box>

        {/* Bulk Actions Bar */}
        <Fade in={selectedIds.size > 0}>
          <Box
            sx={{
              p: 1.5,
              display: selectedIds.size > 0 ? "flex" : "none",
              alignItems: "center",
              gap: 2,
              bgcolor: "rgba(139, 92, 246, 0.1)",
              borderBottom: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#fafafa", fontWeight: 500 }}>
              เลือกแล้ว {selectedIds.size} รายการ
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="เผยแพร่">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleBulkAction("show")}
                  disabled={isLoading}
                  sx={{
                    color: "#4ade80",
                    borderColor: "#4ade80",
                    "&:hover": { bgcolor: "rgba(74, 222, 128, 0.1)" },
                  }}
                >
                  เผยแพร่
                </Button>
              </Tooltip>
              <Tooltip title="ซ่อน">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityOffIcon />}
                  onClick={() => handleBulkAction("hide")}
                  disabled={isLoading}
                  sx={{
                    color: "#fbbf24",
                    borderColor: "#fbbf24",
                    "&:hover": { bgcolor: "rgba(251, 191, 36, 0.1)" },
                  }}
                >
                  ซ่อน
                </Button>
              </Tooltip>
              <Tooltip title="ลบ">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleBulkAction("delete")}
                  disabled={isLoading}
                  sx={{
                    color: "#f87171",
                    borderColor: "#f87171",
                    "&:hover": { bgcolor: "rgba(248, 113, 113, 0.1)" },
                  }}
                >
                  ลบ
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Fade>

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 550 }} aria-label="manga table">
            <TableHead>
              <TableRow sx={{ bgcolor: "#0a0a0a" }}>
                <TableCell
                  padding="checkbox"
                  sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    sx={{
                      color: "#a3a3a3",
                      "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                        color: "#8b5cf6",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  ปก
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  ชื่อเรื่อง
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  หมวดหมู่
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  แท็ก
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  สถานะ
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "#a3a3a3", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMangas.map((manga) => (
                <TableRow
                  key={manga.id}
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.02)" },
                    bgcolor: selectedIds.has(manga.id) ? "rgba(139, 92, 246, 0.08)" : "transparent",
                  }}
                >
                  <TableCell padding="checkbox" sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <Checkbox
                      checked={selectedIds.has(manga.id)}
                      onChange={(e) => handleSelectOne(manga.id, e.target.checked)}
                      sx={{ color: "#a3a3a3", "&.Mui-checked": { color: "#8b5cf6" } }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <Box sx={{ width: 40, height: 56, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: "#262626" }}>
                      <Image
                        src={manga._cover}
                        alt={manga.title}
                        fill
                        sizes="40px"
                        style={{ objectFit: 'cover' }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500, color: "#fafafa", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", maxWidth: 200 }}>
                    <Typography noWrap>{manga.title}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: "#d4d4d4", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    {manga.category?.name || "ไม่มีหมวดหมู่"}
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", maxWidth: 150 }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {manga.tags.slice(0, 2).map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            bgcolor: "rgba(139, 92, 246, 0.2)",
                            color: "#c4b5fd",
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      ))}
                      {manga.tags.length > 2 && (
                        <Chip
                          label={`+${manga.tags.length - 2}`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                            color: "#a3a3a3",
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    {manga.isHidden ? (
                      <Chip label="ซ่อน" size="small" sx={{ bgcolor: "rgba(234, 179, 8, 0.2)", color: "#facc15", fontWeight: 600, borderRadius: 1, height: 24 }} />
                    ) : (
                      <Chip label="เผยแพร่" size="small" sx={{ bgcolor: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 600, borderRadius: 1, height: 24 }} />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                      <Tooltip title="ตั้งค่าด่วน">
                        <IconButton
                          size="small"
                          onClick={() => openQuickEdit(manga)}
                          sx={{ color: "#a78bfa", "&:hover": { bgcolor: "rgba(167, 139, 250, 0.1)" } }}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <MangaActions mangaId={manga.id} isHidden={manga.isHidden} slug={manga.slug} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMangas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? "ไม่พบมังงะที่ค้นหา" : "ยังไม่มีมังงะ"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Quick Edit Modal */}
      <Dialog
        open={!!editManga}
        onClose={closeQuickEdit}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#171717",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fafafa" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SettingsIcon sx={{ color: "#a78bfa" }} />
            ตั้งค่าด่วน
          </Box>
          <IconButton onClick={closeQuickEdit} sx={{ color: "#a3a3a3" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {editManga && (
            <Box sx={{ display: "flex", gap: 2, mb: 3, mt: 1 }}>
              <Box sx={{ width: 60, height: 84, position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
                <Image
                  src={editManga._cover}
                  alt={editManga.title}
                  fill
                  sizes="60px"
                  style={{ objectFit: 'cover' }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#fafafa" }}>
                  {editManga.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
                  {editManga.slug}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Category Select */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: "#a3a3a3" }}>หมวดหมู่</InputLabel>
            <Select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              label="หมวดหมู่"
              sx={{
                color: "#fafafa",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.3)" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#8b5cf6" },
              }}
            >
              <MenuItem value="">
                <em>ไม่มีหมวดหมู่</em>
              </MenuItem>
              {allCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tags Autocomplete */}
          <Autocomplete
            multiple
            options={allTags}
            getOptionLabel={(option) => option.name}
            value={editTags}
            onChange={(_, newValue) => setEditTags(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="แท็ก"
                placeholder="เลือกแท็ก..."
                sx={{
                  "& .MuiInputBase-root": { color: "#fafafa" },
                  "& .MuiInputLabel-root": { color: "#a3a3a3" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.2)" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.3)" },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  size="small"
                  sx={{
                    bgcolor: "rgba(139, 92, 246, 0.3)",
                    color: "#c4b5fd",
                  }}
                />
              ))
            }
            sx={{
              "& .MuiChip-deleteIcon": { color: "#a3a3a3" },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Button onClick={closeQuickEdit} sx={{ color: "#a3a3a3" }}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleQuickSave}
            variant="contained"
            disabled={isLoading}
            sx={{ bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" } }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
