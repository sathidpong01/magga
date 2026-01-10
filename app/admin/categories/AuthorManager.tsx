"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Author } from "@prisma/client";
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
  Box,
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";

type AuthorManagerProps = {
  initialAuthors: Author[];
};

export default function AuthorManager({ initialAuthors }: AuthorManagerProps) {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [name, setName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  useEffect(() => {
    setAuthors(initialAuthors);
  }, [initialAuthors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : "/api/authors";
    const method = editingAuthor ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profileUrl, iconUrl }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to save author");
      }
      
      setName("");
      setProfileUrl("");
      setIconUrl("");
      setEditingAuthor(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setName(author.name);
    setProfileUrl(author.profileUrl || "");
    setIconUrl(author.iconUrl || "");
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (author: Author) => {
    setAuthorToDelete(author);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!authorToDelete) return;
    try {
      const response = await fetch(`/api/authors/${authorToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
      router.refresh();
    } catch {
      alert("Error deleting author.");
      setDeleteDialogOpen(false);
    }
  };

  const cancelEdit = () => {
    setEditingAuthor(null);
    setName("");
    setProfileUrl("");
    setIconUrl("");
    setError("");
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {editingAuthor ? "Edit Author" : "Add New Author"}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <TextField
                label="Author Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                size="small"
              />
              <TextField
                label="Profile URL"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                fullWidth
                size="small"
                placeholder="https://twitter.com/..."
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <TextField
                label="Icon URL"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />
              {iconUrl && (
                <Avatar src={iconUrl} sx={{ width: 40, height: 40 }} />
              )}
              <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                <Button type="submit" variant="contained" disabled={isLoading} sx={{ minWidth: 100 }}>
                  {isLoading ? <CircularProgress size={24} /> : (editingAuthor ? 'Update' : 'Add')}
                </Button>
                {editingAuthor && (
                  <Button variant="outlined" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </Box>
            </Stack>
          </Stack>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table aria-label="authors table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Icon</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Profile URL</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell>
                  {author.iconUrl ? (
                    <Avatar src={author.iconUrl} sx={{ width: 32, height: 32 }} />
                  ) : (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "grey.700" }}>
                      {author.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </TableCell>
                <TableCell component="th" scope="row">{author.name}</TableCell>
                <TableCell>
                  {author.profileUrl && (
                    <Tooltip title={author.profileUrl}>
                      <IconButton
                        size="small"
                        href={author.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEdit(author)} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteClick(author)} color="error" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {authors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                  No authors yet. Add your first author above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Author?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the author &quot;{authorToDelete?.name}&quot;? 
            This will remove the author association from all mangas.
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
