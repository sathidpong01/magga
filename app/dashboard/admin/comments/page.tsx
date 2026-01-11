"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReplyIcon from "@mui/icons-material/Reply";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import { useToast } from "@/app/contexts/ToastContext";

interface Comment {
  id: string;
  content: string;
  imageUrl: string | null;
  voteScore: number;
  createdAt: string;
  parent: {
    id: string;
    content: string;
    user: {
      name: string | null;
      username: string | null;
    };
  } | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  manga: {
    id: string;
    title: string;
    slug: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCommentsPage() {
  const { showSuccess, showError } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) params.set("search", search);

      const res = await authFetch(`/api/admin/comments?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setComments(data.comments);
      setPagination(data.pagination);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Failed to fetch comments"
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(comments.map((c) => c.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      const res = await authFetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentIds: selected }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete");

      showSuccess(`ลบ ${data.deleted} ความคิดเห็นเรียบร้อย`);
      setSelected([]);
      setDeleteDialogOpen(false);
      fetchComments();
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Failed to delete comments"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchComments();
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ mb: 3, color: "#fafafa" }}
      >
        จัดการความคิดเห็น
      </Typography>

      {/* Toolbar */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ flex: 1, minWidth: 200 }}
        >
          <TextField
            size="small"
            placeholder="ค้นหาความคิดเห็น, ผู้ใช้, มังงะ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#737373" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: "100%",
              maxWidth: 400,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0a0a0a",
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
              },
              "& input": { color: "#fafafa" },
            }}
          />
        </Box>

        <IconButton onClick={fetchComments} sx={{ color: "#a3a3a3" }}>
          <RefreshIcon />
        </IconButton>

        {selected.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            ลบ ({selected.length})
          </Button>
        )}
      </Paper>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "#171717",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                <Checkbox
                  indeterminate={
                    selected.length > 0 && selected.length < comments.length
                  }
                  checked={
                    comments.length > 0 && selected.length === comments.length
                  }
                  onChange={handleSelectAll}
                  sx={{ color: "#737373" }}
                />
              </TableCell>
              <TableCell
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.1)",
                  width: 80,
                }}
              >
                ประเภท
              </TableCell>
              <TableCell
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                ผู้ใช้
              </TableCell>
              <TableCell
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                ความคิดเห็น
              </TableCell>
              <TableCell
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                มังงะ
              </TableCell>
              <TableCell
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                โหวต
              </TableCell>
              <TableCell
                sx={{
                  color: "#a3a3a3",
                  fontWeight: 600,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                วันที่
              </TableCell>
              <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 4, borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    py: 4,
                    color: "#737373",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  ไม่พบความคิดเห็น
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow
                  key={comment.id}
                  hover
                  selected={selected.includes(comment.id)}
                  sx={{
                    "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                    "&.Mui-selected": { bgcolor: "rgba(139, 92, 246, 0.1)" },
                  }}
                >
                  <TableCell
                    padding="checkbox"
                    sx={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <Checkbox
                      checked={selected.includes(comment.id)}
                      onChange={() => handleSelect(comment.id)}
                      sx={{ color: "#737373" }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    {comment.parent ? (
                      <Tooltip
                        title={`ตอบกลับ: ${
                          comment.parent.user.name ||
                          comment.parent.user.username
                        } - "${truncate(comment.parent.content, 50)}"`}
                      >
                        <Chip
                          icon={<ReplyIcon sx={{ fontSize: 14 }} />}
                          label="ตอบกลับ"
                          size="small"
                          sx={{
                            bgcolor: "rgba(251, 191, 36, 0.2)",
                            color: "#fbbf24",
                            fontSize: "0.7rem",
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        label="หลัก"
                        size="small"
                        sx={{
                          bgcolor: "rgba(139, 92, 246, 0.2)",
                          color: "#a78bfa",
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        src={comment.user.image || undefined}
                        sx={{ width: 28, height: 28, bgcolor: "#404040" }}
                      >
                        {comment.user.name?.[0] || "U"}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: "#fafafa", fontSize: "0.8rem" }}
                        >
                          {comment.user.name ||
                            comment.user.username ||
                            "Unknown"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ borderColor: "rgba(255,255,255,0.1)", maxWidth: 300 }}
                  >
                    <Tooltip title={comment.content}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#d4d4d4", fontSize: "0.8rem" }}
                      >
                        {truncate(comment.content, 80)}
                      </Typography>
                    </Tooltip>
                    {comment.imageUrl && (
                      <Chip
                        label="มีรูปภาพ"
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: "rgba(59, 130, 246, 0.2)",
                          color: "#60a5fa",
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <Link
                      href={`/manga/${comment.manga.slug || comment.manga.id}`}
                      target="_blank"
                      style={{
                        color: "#8b5cf6",
                        textDecoration: "none",
                        fontSize: "0.8rem",
                      }}
                    >
                      {truncate(comment.manga.title, 30)}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <Chip
                      label={comment.voteScore}
                      size="small"
                      sx={{
                        bgcolor:
                          comment.voteScore > 0
                            ? "rgba(34, 197, 94, 0.2)"
                            : comment.voteScore < 0
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(255,255,255,0.1)",
                        color:
                          comment.voteScore > 0
                            ? "#22c55e"
                            : comment.voteScore < 0
                            ? "#ef4444"
                            : "#a3a3a3",
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "#737373",
                      fontSize: "0.75rem",
                    }}
                  >
                    {new Date(comment.createdAt).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <IconButton
                      size="small"
                      component={Link}
                      href={`/manga/${comment.manga.slug || comment.manga.id}`}
                      target="_blank"
                      sx={{ color: "#737373" }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="แสดง:"
          sx={{
            color: "#a3a3a3",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            "& .MuiTablePagination-selectIcon": { color: "#737373" },
          }}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: "#171717", color: "#fafafa" } }}
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบความคิดเห็น {selected.length} รายการใช่หรือไม่?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#ef4444" }}>
            การลบนี้ไม่สามารถย้อนกลับได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} /> : <DeleteIcon />
            }
          >
            {deleting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
