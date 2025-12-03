"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Tag } from "@prisma/client";
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

type TagManagerProps = {
  initialTags: Tag[];
};

export default function TagManager({ initialTags }: TagManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
    const method = editingTag ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to save tag");
      }
      
      setName("");
      setEditingTag(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      router.refresh();
    } catch {
      alert("Error deleting tag.");
      setDeleteDialogOpen(false);
    }
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setName("");
    setError("");
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {editingTag ? "Edit Tag" : "Add New Tag"}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <TextField
              label="Tag Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              size="small"
            />
            <Button type="submit" variant="contained" disabled={isLoading} sx={{ minWidth: 100 }}>
              {isLoading ? <CircularProgress size={24} /> : (editingTag ? 'Update' : 'Add')}
            </Button>
            {editingTag && (
              <Button variant="outlined" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </Stack>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table aria-label="tags table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">{tag.name}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(tag)} aria-label="edit"><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteClick(tag)} color="error" aria-label="delete"><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Tag?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the tag &quot;{tagToDelete?.name}&quot;? This will remove it from all associated mangas.
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

