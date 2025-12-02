"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconButton,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LaunchIcon from "@mui/icons-material/Launch";

type MangaActionsProps = {
  mangaId: string;
  isHidden: boolean;
  slug: string;
};

export default function MangaActions({ mangaId, isHidden, slug }: MangaActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [currentlyHidden, setCurrentlyHidden] = useState(isHidden);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/manga/${mangaId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(body.error || "Failed to delete manga");
      }
      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVisibility = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/manga/${mangaId}/toggle-visibility`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Failed to toggle visibility");
      }
      const updatedManga = await response.json();
      setCurrentlyHidden(updatedManga.isHidden);
      router.refresh();
    } catch (err) {

    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Tooltip title="View Page">
          <IconButton
            component={Link}
            href={`/${slug}`}
            target="_blank"
            aria-label="view"
            sx={{ color: "#a855f7" }} // Purple for view
          >
            <LaunchIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={currentlyHidden ? "Show Manga" : "Hide Manga"}>
          <IconButton
            aria-label="toggle visibility"
            onClick={handleToggleVisibility}
            disabled={isToggling}
            sx={{ color: currentlyHidden ? "#a3a3a3" : "#22c55e" }} // Neutral 400 / Green 500
          >
            {currentlyHidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Manga">
          <IconButton
            component={Link}
            href={`/admin/manga/edit/${mangaId}`}
            aria-label="edit"
            sx={{ color: "#a3a3a3" }} // Neutral 400
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Manga">
          <IconButton 
            aria-label="delete" 
            onClick={handleClickOpen}
            sx={{ color: "#ef4444" }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete this manga?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to permanently delete this manga? This action
            cannot be undone.
          </DialogContentText>
          {error && <DialogContentText color="error" sx={{ mt: 2 }}>Error: {error}</DialogContentText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
