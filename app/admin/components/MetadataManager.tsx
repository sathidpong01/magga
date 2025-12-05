"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Category, Tag } from "@prisma/client";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tabs,
  Tab,
  Badge,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CloseIcon from "@mui/icons-material/Close";

type MetadataManagerProps = {
  initialCategories: Category[];
  initialTags: Tag[];
};

type ItemType = "category" | "tag";

export default function MetadataManager({ initialCategories, initialTags }: MetadataManagerProps) {
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<ItemType>("category");

  // Data State
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tags, setTags] = useState<Tag[]>(initialTags);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingItem, setEditingItem] = useState<Category | Tag | null>(null);
  const [itemName, setItemName] = useState("");

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Category | Tag | null>(null);

  // Loading/Error State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCategories(initialCategories);
    setTags(initialTags);
  }, [initialCategories, initialTags]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    const items = activeTab === "category" ? categories : tags;
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, categories, tags, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setDialogMode("add");
    setEditingItem(null);
    setItemName("");
    setError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Category | Tag) => {
    setDialogMode("edit");
    setEditingItem(item);
    setItemName(item.name);
    setError("");
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: Category | Tag) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      setError("กรุณาระบุชื่อ");
      return;
    }

    setIsLoading(true);
    setError("");

    const endpoint = activeTab === "category" ? "/api/categories" : "/api/tags";
    const url = dialogMode === "edit" && editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
    const method = dialogMode === "edit" ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemName.trim() }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "เกิดข้อผิดพลาด");
      }

      setDialogOpen(false);
      setItemName("");
      setEditingItem(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsLoading(true);
    const endpoint = activeTab === "category" ? "/api/categories" : "/api/tags";

    try {
      const response = await fetch(`${endpoint}/${itemToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("ลบไม่สำเร็จ");
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      router.refresh();
    } catch {
      alert("เกิดข้อผิดพลาดในการลบ");
      setDeleteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabLabel = (type: ItemType) => {
    const count = type === "category" ? categories.length : tags.length;
    return (
      <Badge badgeContent={count} color="primary" max={999}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2 }}>
          {type === "category" ? <CategoryIcon /> : <LocalOfferIcon />}
          {type === "category" ? "หมวดหมู่" : "แท็ก"}
        </Box>
      </Badge>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          จัดการหมวดหมู่และแท็ก
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ 
            bgcolor: '#fbbf24', 
            color: '#000', 
            '&:hover': { bgcolor: '#f59e0b' },
            borderRadius: 1.5,
            px: 3
          }}
        >
          เพิ่ม{activeTab === "category" ? "หมวดหมู่" : "แท็ก"}
        </Button>
      </Box>

      {/* Main Card */}
      <Paper sx={{ bgcolor: '#171717', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setSearchQuery(""); }}
            textColor="inherit"
            TabIndicatorProps={{ sx: { bgcolor: '#8b5cf6' } }}
          >
            <Tab value="category" label={getTabLabel("category")} sx={{ py: 2 }} />
            <Tab value="tag" label={getTabLabel("tag")} sx={{ py: 2 }} />
          </Tabs>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <TextField
            fullWidth
            placeholder={`ค้นหา${activeTab === "category" ? "หมวดหมู่" : "แท็ก"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 1.5, 
                bgcolor: 'rgba(255,255,255,0.03)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
              }
            }}
          />
        </Box>

        {/* Items Grid */}
        <Box sx={{ p: 3, maxHeight: 500, overflowY: 'auto' }}>
          {filteredItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Typography>
                {searchQuery ? `ไม่พบ "${searchQuery}"` : `ยังไม่มี${activeTab === "category" ? "หมวดหมู่" : "แท็ก"}`}
              </Typography>
              {!searchQuery && (
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleOpenAdd}
                  sx={{ mt: 2, color: '#fbbf24' }}
                >
                  เพิ่มรายการแรก
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {filteredItems.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  onDelete={() => handleOpenDelete(item)}
                  onClick={() => handleOpenEdit(item)}
                  deleteIcon={
                    <Tooltip title="ลบ">
                      <DeleteIcon fontSize="small" />
                    </Tooltip>
                  }
                  sx={{
                    px: 1,
                    py: 2.5,
                    fontSize: '0.9rem',
                    bgcolor: activeTab === "category" 
                      ? 'rgba(139, 92, 246, 0.15)' 
                      : 'rgba(251, 191, 36, 0.15)',
                    color: activeTab === "category" ? '#a78bfa' : '#fbbf24',
                    border: '1px solid',
                    borderColor: activeTab === "category" 
                      ? 'rgba(139, 92, 246, 0.3)' 
                      : 'rgba(251, 191, 36, 0.3)',
                    '&:hover': {
                      bgcolor: activeTab === "category" 
                        ? 'rgba(139, 92, 246, 0.25)' 
                        : 'rgba(251, 191, 36, 0.25)',
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'inherit',
                      opacity: 0.6,
                      '&:hover': { opacity: 1, color: '#ef4444' }
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Footer Stats */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          bgcolor: 'rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            แสดง {filteredItems.length} จาก {activeTab === "category" ? categories.length : tags.length} รายการ
          </Typography>
          <Typography variant="caption" color="text.secondary">
            คลิกที่รายการเพื่อแก้ไข
          </Typography>
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#171717', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeTab === "category" ? <CategoryIcon /> : <LocalOfferIcon />}
          {dialogMode === "add" ? "เพิ่ม" : "แก้ไข"}{activeTab === "category" ? "หมวดหมู่" : "แท็ก"}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="ชื่อ"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#a3a3a3' }}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isLoading || !itemName.trim()}
            startIcon={isLoading ? <CircularProgress size={16} /> : (dialogMode === "add" ? <AddIcon /> : <EditIcon />)}
            sx={{ 
              bgcolor: '#8b5cf6', 
              '&:hover': { bgcolor: '#7c3aed' },
              px: 3
            }}
          >
            {dialogMode === "add" ? "เพิ่ม" : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: '#171717', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบ <strong>"{itemToDelete?.name}"</strong> ใช่หรือไม่?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 1 }}>
            การลบ{activeTab === "category" ? "หมวดหมู่" : "แท็ก"}นี้อาจส่งผลต่อมังงะที่เกี่ยวข้อง
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#a3a3a3' }}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            color="error"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
