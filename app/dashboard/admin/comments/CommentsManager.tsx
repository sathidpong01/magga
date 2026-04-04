"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

export interface AdminComment {
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

export interface AdminCommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CommentsManager({
  initialComments,
  initialPagination,
}: {
  initialComments: AdminComment[];
  initialPagination: AdminCommentsPagination;
}) {
  const { showSuccess, showError } = useToast();
  const [comments, setComments] = useState<AdminComment[]>(initialComments);
  const [pagination, setPagination] =
    useState<AdminCommentsPagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasMountedRef = useRef(false);

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
  }, [pagination.page, pagination.limit, search, showError]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

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
    setSelected([]);

    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }

    fetchComments();
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#fafafa",
            mb: 0.75,
          }}
        >
          จัดการความคิดเห็น
        </Typography>
        <Typography sx={{ color: "#a3a3a3", maxWidth: 720 }}>
          ตรวจสอบ ตอบกลับ และลบความคิดเห็นจากศูนย์กลางเดียว
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          backgroundImage: "none",
          boxShadow: "none",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ flex: 1, minWidth: 260 }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="ค้นหาจากเนื้อหา ผู้ใช้ หรือมังงะ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0B0B0B",
                borderRadius: 1,
                fontWeight: 600,
                fontSize: "0.9rem",
                "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                "&:hover fieldset": { borderColor: "rgba(250, 191, 6, 0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#FABF06" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#FABF06", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            size="medium"
          />
        </Box>

        <IconButton
          onClick={fetchComments}
          sx={{
            color: "#FABF06",
            bgcolor: "rgba(250, 191, 6, 0.08)",
            borderRadius: 1,
            width: 44,
            height: 44,
            "&:hover": { bgcolor: "rgba(250, 191, 6, 0.15)" },
          }}
        >
          <RefreshIcon />
        </IconButton>

        {selected.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              borderRadius: 1.25,
              fontWeight: 900,
              bgcolor: "#ef4444",
              "&:hover": { bgcolor: "#dc2626" },
              px: 3,
              height: 44,
            }}
          >
            ลบที่เลือก ({selected.length})
          </Button>
        )}
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "none",
          backgroundImage: "none",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
              <TableCell
                padding="checkbox"
                sx={{
                  borderColor: "rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <Checkbox
                  indeterminate={
                    selected.length > 0 && selected.length < comments.length
                  }
                  checked={
                    comments.length > 0 && selected.length === comments.length
                  }
                  onChange={handleSelectAll}
                  sx={{
                    color: "rgba(255,255,255,0.2)",
                    "&.Mui-checked": { color: "#FABF06" },
                    "&.MuiCheckbox-indeterminate": { color: "#FABF06" },
                  }}
                />
              </TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>ประเภท</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>ผู้ใช้</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>ความคิดเห็น</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>มังงะ</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>คะแนน</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>วันที่</TableCell>
              <TableCell sx={{ py: 2.5, borderColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 8, borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <CircularProgress size={36} sx={{ color: "#FABF06" }} />
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    py: 8,
                    color: "#737373",
                    borderColor: "rgba(255,255,255,0.06)",
                    fontWeight: 800,
                    textTransform: "none",
                    letterSpacing: "0",
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
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {comment.parent ? (
                      <Tooltip
                        title={`ตอบกลับถึง: ${
                          comment.parent.user.name ||
                          comment.parent.user.username
                        } - "${truncate(comment.parent.content, 50)}"`}
                      >
                        <Chip
                          icon={<ReplyIcon sx={{ fontSize: 14 }} />}
                          label="ตอบกลับ"
                          size="small"
                          sx={{
                            fontWeight: 900,
                            letterSpacing: "0",
                            borderRadius: 0.75,
                            bgcolor: "rgba(250, 191, 6, 0.15)",
                            color: "#FABF06",
                            fontSize: "0.65rem",
                            border: "1px solid rgba(250, 191, 6, 0.1)",
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        label="ต้นฉบับ"
                        size="small"
                        sx={{
                          fontWeight: 900,
                          letterSpacing: "0",
                          borderRadius: 0.75,
                          bgcolor: "rgba(139, 92, 246, 0.15)",
                          color: "#a78bfa",
                          fontSize: "0.65rem",
                          border: "1px solid rgba(139, 92, 246, 0.1)",
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
                            "ไม่ทราบชื่อ"}
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
                        label="รูปภาพ"
                        size="small"
                        sx={{
                          mt: 0.5,
                          fontWeight: 900,
                          letterSpacing: "0",
                          borderRadius: 0.5,
                          bgcolor: "rgba(59, 130, 246, 0.15)",
                          color: "#60a5fa",
                          fontSize: "0.6rem",
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <Link
                      href={`/${comment.manga.slug || comment.manga.id}`}
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
                        fontWeight: 900,
                        fontFamily: "monospace",
                        borderRadius: 1,
                        minWidth: 40,
                        bgcolor:
                          comment.voteScore > 0
                            ? "rgba(34, 197, 94, 0.15)"
                            : comment.voteScore < 0
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(255,255,255,0.05)",
                        color:
                          comment.voteScore > 0
                            ? "#4ade80"
                            : comment.voteScore < 0
                              ? "#f87171"
                              : "#a3a3a3",
                        fontSize: "0.75rem",
                        border: "1px solid rgba(255,255,255,0.03)",
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      borderColor: "rgba(255,255,255,0.06)",
                      color: "#737373",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {new Date(comment.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <IconButton
                      size="small"
                      component={Link}
                      href={`/${comment.manga.slug || comment.manga.id}`}
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
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0",
            textTransform: "none",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            "& .MuiTablePagination-selectIcon": { color: "#FABF06" },
          }}
        />
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#141414",
            color: "#fafafa",
            borderRadius: 1.25,
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.06)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, letterSpacing: "0", fontSize: "1rem" }}>
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 600, color: "#d4d4d4" }}>
            ต้องการลบความคิดเห็นที่เลือกทั้งหมด {selected.length} รายการใช่หรือไม่?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5, color: "#ef4444", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}>
            การกระทำนี้ยกเลิกไม่ได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ color: "#a3a3a3", fontWeight: 800 }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} /> : <DeleteIcon />
            }
            sx={{
              bgcolor: "#ef4444",
              color: "#fff",
              fontWeight: 900,
              "&:hover": { bgcolor: "#dc2626" },
              px: 3,
            }}
          >
            {deleting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
