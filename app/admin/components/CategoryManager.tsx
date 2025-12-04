"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import {
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type CategoryManagerProps = {
  initialCategories: Category[];
};

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to save category");
      }
      
      setName("");
      setEditingCategory(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      router.refresh();
    } catch {
      alert("Error deleting category.");
      setDeleteDialogOpen(false);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setName("");
    setError("");
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {editingCategory ? "Edit Category" : "Add New Category"}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <TextField
              label="Category Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <Button type="submit" variant="contained" disabled={isLoading} sx={{ minWidth: 100 }}>
              {isLoading ? <CircularProgress size={24} /> : (editingCategory ? 'Update' : 'Add')}
            </Button>
            {editingCategory && (
              <Button variant="outlined" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </Stack>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table aria-label="categories table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">{category.name}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(category)} aria-label="edit"><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteClick(category)} color="error" aria-label="delete"><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-category-title"
        aria-describedby="delete-category-description"
      >
        <DialogTitle id="delete-category-title">Delete Category?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-category-description">
            Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;? This may affect mangas associated with it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
