"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { authors } from "@/db/schema";

type Author = InferSelectModel<typeof authors>;
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
  Chip,
  InputAdornment,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useToast } from "@/app/contexts/ToastContext";

type SocialLink = {
  url: string;
  label: string;
  icon: string;
};

type AuthorManagerProps = {
  initialAuthors: Author[];
};

export default function AuthorManager({ initialAuthors }: AuthorManagerProps) {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>(initialAuthors);
  const { showSuccess, showError } = useToast();
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [name, setName] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { url: "", label: "", icon: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  useEffect(() => {
    setAuthors(initialAuthors);
  }, [initialAuthors]);

  // Auto-fetch metadata from URL
  const handleAutoFetch = async (index: number) => {
    const link = socialLinks[index];
    if (!link.url) return;

    setIsFetching(index);

    try {
      const res = await fetch(
        `/api/metadata?url=${encodeURIComponent(link.url)}`
      );
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data = await res.json();

      const newLinks = [...socialLinks];
      if (data.title) {
        newLinks[index].label = data.title;
      }
      if (data.icon) {
        newLinks[index].icon = data.icon;
      }
      setSocialLinks(newLinks);
    } catch {
      showError("Failed to fetch metadata from URL.");
    } finally {
      setIsFetching(null);
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { url: "", label: "", icon: "" }]);
  };

  const removeSocialLink = (index: number) => {
    if (socialLinks.length > 1) {
      setSocialLinks(socialLinks.filter((_, i) => i !== index));
    }
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Filter out empty links and prepare data
    const validLinks = socialLinks.filter((link) => link.url.trim() !== "");
    const profileUrl = validLinks.length > 0 ? validLinks[0].url : null;

    const url = editingAuthor
      ? `/api/authors/${editingAuthor.id}`
      : "/api/authors";
    const method = editingAuthor ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          profileUrl,
          socialLinks:
            validLinks.length > 0 ? JSON.stringify(validLinks) : null,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Save failed.");
      }

      showSuccess(
        editingAuthor ? "Author updated successfully." : "Author added successfully."
      );
      resetForm();
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSocialLinks([{ url: "", label: "", icon: "" }]);
    setEditingAuthor(null);
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setName(author.name);

    // Parse social links
    if (author.socialLinks) {
      try {
        const links = JSON.parse(author.socialLinks);
        setSocialLinks(
          links.length > 0
            ? links
            : [{ url: author.profileUrl || "", label: "", icon: "" }]
        );
      } catch {
        setSocialLinks([{ url: author.profileUrl || "", label: "", icon: "" }]);
      }
    } else if (author.profileUrl) {
      setSocialLinks([{ url: author.profileUrl, label: "", icon: "" }]);
    } else {
      setSocialLinks([{ url: "", label: "", icon: "" }]);
    }

    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (author: Author) => {
    setAuthorToDelete(author);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!authorToDelete) return;
    try {
      const response = await fetch(`/api/authors/${authorToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed.");
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
      showSuccess("Author deleted successfully.");
      router.refresh();
    } catch {
      showError("Failed to delete author.");
      setDeleteDialogOpen(false);
    }
  };

  const parseSocialLinks = (author: Author): SocialLink[] => {
    if (author.socialLinks) {
      try {
        return JSON.parse(author.socialLinks);
      } catch {
        return [];
      }
    }
    return author.profileUrl
      ? [{ url: author.profileUrl, label: "", icon: "" }]
      : [];
  };

  return (
    <>
      {/* Form Section */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#fafafa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {editingAuthor ? "EDIT AUTHOR" : "ADD NEW AUTHOR"}
          </Typography>
          <Stack direction="row" spacing={1}>
            {editingAuthor && (
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#a3a3a3",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  "&:hover": { borderColor: "rgba(255,255,255,0.2)", bgcolor: "rgba(255,255,255,0.02)" },
                }}
              >
                CANCEL
              </Button>
            )}
            <Button
              type="submit"
              form="author-form"
              variant="contained"
              disabled={isLoading || !name}
              startIcon={
                isLoading ? (
                  <CircularProgress size={18} sx={{ color: "#000" }} />
                ) : editingAuthor ? (
                  <EditIcon />
                ) : (
                  <AddIcon />
                )
              }
              sx={{
                minWidth: 100,
                bgcolor: "#FABF06",
                color: "#000",
                fontWeight: 800,
                borderRadius: 1,
                "&:hover": { bgcolor: "#eab308" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }
              }}
            >
              {editingAuthor ? "UPDATE" : "ADD"}
            </Button>
          </Stack>
        </Stack>

        <form id="author-form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* Author Name only - icons come from social links */}
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#a3a3a3", mb: 0.5, display: "block", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem" }}
              >
                AUTHOR NAME *
              </Typography>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                size="small"
                placeholder="AUTHOR NAME OR PEN NAME..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0B0B0B",
                    borderRadius: 1,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                    "&.Mui-focused fieldset": { borderColor: "#FABF06" },
                  },
                }}
              />
            </Box>

            {/* Social Links Section */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#a3a3a3", mb: 1.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}
              >
                SOCIAL MEDIA CHANNELS
              </Typography>

              <Stack spacing={2}>
                {socialLinks.map((link, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2.5,
                      bgcolor: "rgba(255,255,255,0.01)",
                      borderRadius: 1.25,
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                      alignItems="flex-end"
                    >
                      <Box sx={{ flex: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: "#737373", mb: 0.5, display: "block" }}
                        >
                          URL
                        </Typography>
                        <TextField
                          value={link.url}
                          onChange={(e) =>
                            updateSocialLink(index, "url", e.target.value)
                          }
                          fullWidth
                          size="small"
                          placeholder="https://twitter.com/... หรือ pixiv.net/..."
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LinkIcon
                                  sx={{ color: "#525252", fontSize: 18 }}
                                />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "#262626",
                              borderRadius: 0.75,
                            },
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: "#737373", mb: 0.5, display: "block" }}
                        >
                          Label
                        </Typography>
                        <TextField
                          value={link.label}
                          onChange={(e) =>
                            updateSocialLink(index, "label", e.target.value)
                          }
                          fullWidth
                          size="small"
                          placeholder="ชื่อแสดง (เช่น Twitter)"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: "#262626",
                              borderRadius: 0.75,
                            },
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: "#737373", mb: 0.5, display: "block" }}
                        >
                          Icon URL
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            value={link.icon}
                            onChange={(e) =>
                              updateSocialLink(index, "icon", e.target.value)
                            }
                            fullWidth
                            size="small"
                            placeholder="URL ไอคอน"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "#262626",
                                borderRadius: 0.75,
                              },
                            }}
                          />
                          {link.icon && (
                            <Avatar
                              src={link.icon}
                              sx={{ width: 28, height: 28 }}
                            />
                          )}
                        </Stack>
                      </Box>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ flexShrink: 0, pb: 0.5 }}
                      >
                        <Tooltip title="Auto-fetch Title & Icon">
                          <Box component="span">
                            <IconButton
                              onClick={() => handleAutoFetch(index)}
                              disabled={!link.url || isFetching === index}
                              size="small"
                              sx={{
                                bgcolor: "#262626",
                                "&:hover": { bgcolor: "#404040" },
                                color: "#a3a3a3",
                              }}
                            >
                              {isFetching === index ? (
                                <CircularProgress size={18} />
                              ) : (
                                <AutoFixHighIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        </Tooltip>
                        {socialLinks.length > 1 && (
                          <Tooltip title="REMOVE CHANNEL">
                            <IconButton
                              onClick={() => removeSocialLink(index)}
                              size="small"
                              sx={{
                                bgcolor: "rgba(239, 68, 68, 0.1)",
                                "&:hover": {
                                  bgcolor: "#ef4444",
                                  color: "#fff",
                                },
                                color: "#ef4444",
                                borderRadius: 1
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              <Button
                onClick={addSocialLink}
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                sx={{
                  mt: 2,
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#FABF06",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  "&:hover": {
                    borderColor: "#FABF06",
                    bgcolor: "rgba(250, 191, 6, 0.05)",
                  },
                }}
              >
                ADD SOCIAL CHANNEL
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Authors List */}
      <Paper
        sx={{
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)" }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 900, color: "#fafafa", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.1em" }}
          >
            AUTHOR LIST ({authors.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  NAME
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  SOCIAL LINKS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em", width: 120 }}
                >
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {authors.map((author) => {
                const links = parseSocialLinks(author);
                return (
                  <TableRow
                    key={author.id}
                    sx={{
                      "&:last-child td": { border: 0 },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, color: "#fafafa" }}>
                        {author.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        gap={0.5}
                      >
                        {links.length > 0 ? (
                          links.map((link, i) => (
                            <Chip
                              key={i}
                              icon={
                                link.icon ? (
                                  <Avatar
                                    src={link.icon}
                                    sx={{ width: 16, height: 16 }}
                                  />
                                ) : (
                                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                                )
                              }
                              label={
                                link.label ||
                                new URL(link.url).hostname.replace("www.", "")
                              }
                              size="small"
                              component="a"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              sx={{
                                bgcolor: "#333333",
                                color: "#e5e5e5",
                                "&:hover": { bgcolor: "#525252" },
                                borderRadius: 0.75,
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: "#525252" }}>
                            ไม่มี
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="แก้ไข">
                        <IconButton
                          onClick={() => handleEdit(author)}
                          size="small"
                          sx={{
                            color: "#737373",
                            "&:hover": { color: "#fafafa" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="DELETE AUTHOR">
                        <IconButton
                          onClick={() => handleDeleteClick(author)}
                          size="small"
                          sx={{
                            color: "#737373",
                            "&:hover": { color: "#ef4444" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {authors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{ textAlign: "center", py: 6, color: "#525252" }}
                  >
                    ยังไม่มีผู้แต่ง กรุณาเพิ่มผู้แต่งแรกด้านบน
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#141414",
            color: "#fafafa",
            borderRadius: 1.25,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundImage: "none",
            boxShadow: "none"
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "1rem" }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#d4d4d4", fontWeight: 600 }}>
            Are you sure you want to delete author &quot;{authorToDelete?.name}&quot;?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem" }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "#dc2626" }, px: 3 }}
          >
            DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
