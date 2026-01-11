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
      showError("ไม่สามารถดึงข้อมูลจาก URL ได้");
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
        throw new Error(res.error || "บันทึกไม่สำเร็จ");
      }

      showSuccess(
        editingAuthor ? "อัปเดตผู้แต่งเรียบร้อย" : "เพิ่มผู้แต่งเรียบร้อย"
      );
      resetForm();
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
      if (!response.ok) throw new Error("ลบไม่สำเร็จ");
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
      showSuccess("ลบผู้แต่งเรียบร้อย");
      router.refresh();
    } catch {
      showError("ไม่สามารถลบผู้แต่งได้");
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
          p: 3,
          mb: 3,
          bgcolor: "#171717",
          borderRadius: 1,
          border: "1px solid #262626",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#fafafa" }}>
            {editingAuthor ? "แก้ไขผู้แต่ง" : "เพิ่มผู้แต่งใหม่"}
          </Typography>
          <Stack direction="row" spacing={1}>
            {editingAuthor && (
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{
                  borderColor: "#404040",
                  color: "#a3a3a3",
                  "&:hover": { borderColor: "#737373" },
                }}
              >
                ยกเลิก
              </Button>
            )}
            <Button
              type="submit"
              form="author-form"
              variant="contained"
              disabled={isLoading || !name}
              startIcon={
                isLoading ? (
                  <CircularProgress size={18} />
                ) : editingAuthor ? (
                  <EditIcon />
                ) : (
                  <AddIcon />
                )
              }
              sx={{
                minWidth: 100,
                bgcolor: "#7c3aed",
                "&:hover": { bgcolor: "#6d28d9" },
              }}
            >
              {editingAuthor ? "อัปเดต" : "เพิ่ม"}
            </Button>
          </Stack>
        </Stack>

        <form id="author-form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {/* Author Name only - icons come from social links */}
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#a3a3a3", mb: 0.5, display: "block" }}
              >
                ชื่อผู้แต่ง *
              </Typography>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                size="small"
                placeholder="ชื่อผู้แต่ง หรือ Pen Name"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#262626",
                    borderRadius: 0.75,
                  },
                }}
              />
            </Box>

            {/* Social Links Section */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#a3a3a3", mb: 1.5, fontWeight: 600 }}
              >
                ช่องทาง Social Media
              </Typography>

              <Stack spacing={2}>
                {socialLinks.map((link, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: "#1a1a1a",
                      borderRadius: 1,
                      border: "1px solid #333333",
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
                          <span>
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
                          </span>
                        </Tooltip>
                        {socialLinks.length > 1 && (
                          <Tooltip title="ลบช่องทางนี้">
                            <IconButton
                              onClick={() => removeSocialLink(index)}
                              size="small"
                              sx={{
                                bgcolor: "#262626",
                                "&:hover": {
                                  bgcolor: "#7f1d1d",
                                  color: "#fca5a5",
                                },
                                color: "#737373",
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
                  borderColor: "#404040",
                  color: "#a3a3a3",
                  "&:hover": {
                    borderColor: "#737373",
                    bgcolor: "rgba(255,255,255,0.05)",
                  },
                }}
              >
                เพิ่มช่องทาง Social
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Authors List */}
      <Paper
        sx={{
          bgcolor: "#171717",
          borderRadius: 1,
          border: "1px solid #262626",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #262626" }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#fafafa" }}
          >
            รายชื่อผู้แต่ง ({authors.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#0a0a0a" }}>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  ชื่อ
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  ช่องทาง Social
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", color: "#a3a3a3", width: 120 }}
                >
                  จัดการ
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
                      <Tooltip title="ลบ">
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
        PaperProps={{ sx: { bgcolor: "#171717", color: "#fafafa" } }}
      >
        <DialogTitle>ยืนยันการลบ?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3" }}>
            คุณต้องการลบผู้แต่ง &quot;{authorToDelete?.name}&quot; หรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#a3a3a3" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
