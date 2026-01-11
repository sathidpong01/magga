"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  InputAdornment,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { authFetch } from "@/lib/auth-fetch";
import { useToast } from "@/app/contexts/ToastContext";

type Category = {
  id: string;
  name: string;
};

type Tag = {
  id: string;
  name: string;
};

type MetadataManagerProps = {
  initialCategories: Category[];
  initialTags: Tag[];
};

export default function MetadataManager({
  initialCategories,
  initialTags,
}: MetadataManagerProps) {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [tags, setTags] = useState(initialTags);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const endpoint = activeTab === 0 ? "/api/categories" : "/api/tags";
      const res = await authFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName }),
      });

      if (res.ok) {
        const newItem = await res.json();
        if (activeTab === 0) {
          setCategories([...categories, newItem]);
          showSuccess(`เพิ่มหมวดหมู่ "${newItemName}" เรียบร้อย`);
        } else {
          setTags([...tags, newItem]);
          showSuccess(`เพิ่มแท็ก "${newItemName}" เรียบร้อย`);
        }
        setNewItemName("");
        setAddDialogOpen(false);
      } else {
        const data = await res.json();
        showError(data.error || "ไม่สามารถเพิ่มได้");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      showError("เกิดข้อผิดพลาดในการเพิ่ม");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const endpoint =
        activeTab === 0
          ? `/api/categories/${itemToDelete.id}`
          : `/api/tags/${itemToDelete.id}`;

      const res = await authFetch(endpoint, {
        method: "DELETE",
      });

      if (res.ok) {
        if (activeTab === 0) {
          setCategories(categories.filter((c) => c.id !== itemToDelete.id));
          showSuccess(`ลบหมวดหมู่ "${itemToDelete.name}" เรียบร้อย`);
        } else {
          setTags(tags.filter((t) => t.id !== itemToDelete.id));
          showSuccess(`ลบแท็ก "${itemToDelete.name}" เรียบร้อย`);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        const data = await res.json();
        showError(data.error || "ไม่สามารถลบได้");
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      showError("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const openDeleteDialog = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          จัดการหมวดหมู่และแท็ก
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={{
            bgcolor: "#fbbf24",
            color: "#000",
            borderRadius: "50px",
            px: 3,
            py: 1,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { bgcolor: "#f59e0b" },
          }}
        >
          เพิ่ม{activeTab === 0 ? "หมวดหมู่" : "แท็ก"}
        </Button>
      </Box>

      {/* Container */}
      <Box
        sx={{
          bgcolor: "#171717",
          borderRadius: 1,
          p: 3,
        }}
      >
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setSearch("");
          }}
          sx={{
            mb: 3,
            borderBottom: "1px solid #262626",
            "& .MuiTab-root": {
              color: "#a3a3a3",
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 500,
              minHeight: 48,
            },
            "& .Mui-selected": {
              color: "#fbbf24 !important",
            },
            "& .MuiTabs-indicator": {
              bgcolor: "#fbbf24",
              height: 3,
            },
          }}
        >
          <Tab
            icon={<CategoryIcon />}
            iconPosition="start"
            label={`หมวดหมู่ (${categories.length})`}
          />
          <Tab
            icon={<LocalOfferIcon />}
            iconPosition="start"
            label={`แท็ก (${tags.length})`}
          />
        </Tabs>

        {/* Search */}
        <TextField
          fullWidth
          placeholder={activeTab === 0 ? "ค้นหาหมวดหมู่..." : "ค้นหาแท็ก..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              bgcolor: "#0a0a0a",
              "& fieldset": { borderColor: "#262626" },
              "&:hover fieldset": { borderColor: "#404040" },
              "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#525252" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Items Display */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 2 }}
        >
          {activeTab === 0
            ? filteredCategories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  onDelete={() => openDeleteDialog(cat.id, cat.name)}
                  deleteIcon={
                    <IconButton
                      size="small"
                      sx={{ color: "#a3a3a3 !important" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: "#6366f120",
                    color: "#a78bfa",
                    borderColor: "#6366f1",
                    border: "1px solid",
                    fontSize: "0.875rem",
                    height: 36,
                    px: 1,
                    fontWeight: 500,
                    "& .MuiChip-deleteIcon": {
                      color: "#a3a3a3",
                      "&:hover": { color: "#ef4444" },
                    },
                  }}
                />
              ))
            : filteredTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onDelete={() => openDeleteDialog(tag.id, tag.name)}
                  deleteIcon={
                    <IconButton
                      size="small"
                      sx={{ color: "#a3a3a3 !important" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: "#f59e0b20",
                    color: "#fbbf24",
                    borderColor: "#f59e0b",
                    border: "1px solid",
                    fontSize: "0.875rem",
                    height: 36,
                    px: 1,
                    fontWeight: 500,
                    "& .MuiChip-deleteIcon": {
                      color: "#a3a3a3",
                      "&:hover": { color: "#ef4444" },
                    },
                  }}
                />
              ))}
        </Stack>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 2,
            borderTop: "1px solid #262626",
          }}
        >
          <Typography variant="body2" sx={{ color: "#71717a" }}>
            แสดง{" "}
            {activeTab === 0 ? filteredCategories.length : filteredTags.length}{" "}
            จาก {activeTab === 0 ? categories.length : tags.length} รายการ
          </Typography>
          <Button
            size="small"
            onClick={() => setSearch("")}
            sx={{ color: "#a3a3a3", textDecoration: "underline" }}
          >
            ล้างการกรองการค้นหาทั้งหมด
          </Button>
        </Box>
      </Box>

      {/* Add Dialog - Enhanced */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setNewItemName("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0a0a0a",
            borderRadius: 1,
            border: "1px solid #262626",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#fafafa",
            fontWeight: 600,
            fontSize: "1.25rem",
            borderBottom: "1px solid #262626",
            pb: 2,
          }}
        >
          เพิ่ม{activeTab === 0 ? "หมวดหมู่" : "แท็ก"}ใหม่
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder={`กรอกชื่อ${activeTab === 0 ? "หมวดหมู่" : "แท็ก"}...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#171717",
                fontSize: "1rem",
                "& fieldset": { borderColor: "#404040" },
                "&:hover fieldset": { borderColor: "#525252" },
                "&.Mui-focused fieldset": {
                  borderColor: "#fbbf24",
                  borderWidth: 2,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setNewItemName("");
            }}
            sx={{
              color: "#a3a3a3",
              borderRadius: "8px",
              px: 3,
              textTransform: "none",
              "&:hover": { bgcolor: "#171717" },
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!newItemName.trim()}
            sx={{
              bgcolor: "#fbbf24",
              color: "#000",
              borderRadius: "8px",
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#f59e0b" },
              "&:disabled": { bgcolor: "#404040", color: "#737373" },
            }}
          >
            เพิ่ม
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0a0a0a",
            borderRadius: 1,
            border: "1px solid #262626",
          },
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#ef444420",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 32, color: "#ef4444" }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ color: "#fafafa", fontWeight: 600, mb: 1 }}
          >
            ยืนยันการลบ
          </Typography>
          <Typography sx={{ color: "#a3a3a3", mb: 2 }}>
            คุณแน่ใจหรือไม่ว่าต้องการลบ
            {activeTab === 0 ? "หมวดหมู่" : "แท็ก"} "{itemToDelete?.name}"?
          </Typography>
          <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: "center" }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setItemToDelete(null);
            }}
            sx={{
              color: "#a3a3a3",
              borderRadius: "8px",
              px: 4,
              py: 1,
              textTransform: "none",
              border: "1px solid #404040",
              "&:hover": { bgcolor: "#171717", borderColor: "#525252" },
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              color: "#fff",
              borderRadius: "8px",
              px: 4,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
