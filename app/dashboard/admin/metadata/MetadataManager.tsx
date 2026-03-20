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
          showSuccess(`Category "${newItemName}" added successfully.`);
        } else {
          setTags([...tags, newItem]);
          showSuccess(`Tag "${newItemName}" added successfully.`);
        }
        setNewItemName("");
        setAddDialogOpen(false);
      } else {
        const data = await res.json();
        showError(data.error || "Failed to add item.");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      showError("An error occurred while adding the item.");
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
          showSuccess(`Category "${itemToDelete.name}" deleted successfully.`);
        } else {
          setTags(tags.filter((t) => t.id !== itemToDelete.id));
          showSuccess(`Tag "${itemToDelete.name}" deleted successfully.`);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        const data = await res.json();
        showError(data.error || "Failed to delete item.");
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      showError("An error occurred while deleting the item.");
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
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.02em", color: "#fafafa" }}>
          METADATA MANAGEMENT
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          sx={{
            bgcolor: "#FABF06",
            color: "#000",
            borderRadius: 1,
            px: 3,
            py: 1,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            "&:hover": { bgcolor: "#eab308" },
          }}
        >
          ADD {activeTab === 0 ? "CATEGORY" : "TAG"}
        </Button>
      </Box>

      {/* Container */}
      <Box
        sx={{
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
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
          TabIndicatorProps={{ sx: { bgcolor: "#FABF06" } }}
          sx={{
            mb: 3,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            "& .MuiTab-root": {
              color: "#a3a3a3",
              textTransform: "uppercase",
              fontSize: "0.875rem",
              fontWeight: 800,
              minHeight: 48,
              letterSpacing: "0.05em",
            },
            "& .Mui-selected": {
              color: "#FABF06 !important",
            },
          }}
        >
          <Tab
            icon={<CategoryIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`CATEGORIES (${categories.length})`}
          />
          <Tab
            icon={<LocalOfferIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`TAGS (${tags.length})`}
          />
        </Tabs>

        {/* Search */}
        <TextField
          fullWidth
          placeholder={activeTab === 0 ? "SEARCH CATEGORIES..." : "SEARCH TAGS..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              bgcolor: "#0B0B0B",
              borderRadius: 1,
              "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
              "&.Mui-focused fieldset": { borderColor: "#FABF06" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#a3a3a3", fontSize: 20 }} />
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
                    bgcolor: "rgba(99, 102, 241, 0.12)",
                    color: "#a5b4fc",
                    borderRadius: 0.75,
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    fontSize: "0.75rem",
                    height: 32,
                    px: 1,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    "& .MuiChip-deleteIcon": {
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 16,
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
                      sx={{ color: "inherit !important", p: 0 }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  }
                  sx={{
                    bgcolor: "rgba(250, 191, 6, 0.08)",
                    color: "#FABF06",
                    borderRadius: 0.75,
                    border: "1px solid rgba(250, 191, 6, 0.4)",
                    fontSize: "0.75rem",
                    height: 32,
                    px: 1,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    "& .MuiChip-deleteIcon": {
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 16,
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
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Typography variant="body2" sx={{ color: "#737373", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
            SHOWING{" "}
            <Box component="span" sx={{ color: "#fafafa" }}>
              {activeTab === 0 ? filteredCategories.length : filteredTags.length}
            </Box>{" "}
            OF{" "}
            <Box component="span" sx={{ color: "#fafafa" }}>
              {activeTab === 0 ? categories.length : tags.length}
            </Box>{" "}
            ITEMS
          </Typography>
          <Button
            size="small"
            onClick={() => setSearch("")}
            sx={{ color: "#a3a3a3", fontWeight: 800, textTransform: "uppercase", fontSize: "0.7rem", "&:hover": { color: "#FABF06", bgcolor: "transparent", textDecoration: "underline" } }}
          >
            CLEAR ALL FILTERS
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
            fontWeight: 900,
            fontSize: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            pb: 2,
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}
        >
          ADD NEW {activeTab === 0 ? "CATEGORY" : "TAG"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder={`ENTER ${activeTab === 0 ? "CATEGORY" : "TAG"} NAME...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0B0B0B",
                fontSize: "1rem",
                borderRadius: 1,
                "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                "&.Mui-focused fieldset": {
                  borderColor: "#FABF06",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: "rgba(0,0,0,0.2)", gap: 1 }}>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setNewItemName("");
            }}
            sx={{
              color: "#a3a3a3",
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em"
            }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!newItemName.trim()}
            sx={{
              bgcolor: "#FABF06",
              color: "#000",
              borderRadius: 1,
              px: 4,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              "&:hover": { bgcolor: "#eab308" },
              "&:disabled": { bgcolor: "#404040", color: "#737373" },
            }}
          >
            CREATE {activeTab === 0 ? "CATEGORY" : "TAG"}
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
              bgcolor: "rgba(239, 68, 68, 0.15)",
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
            sx={{ color: "#fafafa", fontWeight: 900, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            CONFIRM DELETION
          </Typography>
          <Typography sx={{ color: "#a3a3a3", mb: 2, fontWeight: 600 }}>
            Are you sure you want to delete {activeTab === 0 ? "category" : "tag"} &quot;{itemToDelete?.name}&quot;?
          </Typography>
          <Typography sx={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            This action cannot be undone.
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
              fontWeight: 800,
              px: 4,
              py: 1,
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              "&:hover": { color: "#fafafa" },
            }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              color: "#fff",
              borderRadius: 1,
              px: 4,
              py: 1,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
