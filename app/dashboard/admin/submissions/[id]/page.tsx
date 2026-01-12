"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  IconButton,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CategoryIcon from "@mui/icons-material/Category";
import { authFetch } from "@/lib/auth-fetch";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;

  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    tagIds: [] as string[],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Action State
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Approve Form
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [reviewNote, setReviewNote] = useState("");

  // Reject Form
  const [rejectionReason, setRejectionReason] = useState("");

  // Image Preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, catRes, tagRes] = await Promise.all([
          authFetch(`/api/admin/submissions/${submissionId}`),
          fetch("/api/categories"),
          fetch("/api/tags"),
        ]);

        if (!subRes.ok) throw new Error("Failed to fetch submission");

        const subData = await subRes.json();
        setSubmission(subData);

        // Init edit form
        setEditForm({
          title: subData.title,
          slug: subData.slug || "",
          description: subData.description || "",
          categoryId: subData.categoryId || "",
          tagIds: subData.tags.map((t: any) => t.tagId),
        });

        if (catRes.ok) setCategories(await catRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId]);

  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update");

      setIsEditing(false);
      const subRes = await authFetch(`/api/admin/submissions/${submissionId}`);
      if (subRes.ok) setSubmission(await subRes.json());
    } catch (err) {
      alert("Failed to save changes");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch(
        `/api/admin/submissions/${submissionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNote, publishImmediately }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      router.push(`/dashboard/admin/submissions?status=APPROVED`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error approving");
    } finally {
      setActionLoading(false);
      setApproveOpen(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    setActionLoading(true);
    try {
      const res = await authFetch(
        `/api/admin/submissions/${submissionId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason, reviewNote }),
        }
      );

      if (!res.ok) throw new Error("Failed to reject");

      router.push(`/dashboard/admin/submissions?status=REJECTED`);
      router.refresh();
    } catch (err) {
      alert("Error rejecting");
    } finally {
      setActionLoading(false);
      setRejectOpen(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          color: "success",
          label: "อนุมัติแล้ว",
          bg: "rgba(34, 197, 94, 0.1)",
        };
      case "REJECTED":
        return {
          color: "error",
          label: "ปฏิเสธ",
          bg: "rgba(239, 68, 68, 0.1)",
        };
      case "UNDER_REVIEW":
        return {
          color: "warning",
          label: "กำลังตรวจสอบ",
          bg: "rgba(234, 179, 8, 0.1)",
        };
      case "PENDING":
        return {
          color: "info",
          label: "รอตรวจสอบ",
          bg: "rgba(59, 130, 246, 0.1)",
        };
      default:
        return {
          color: "default",
          label: status,
          bg: "rgba(255,255,255,0.05)",
        };
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (error || !submission)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || "ไม่พบข้อมูล"}</Alert>
      </Box>
    );

  const statusInfo = getStatusInfo(submission.status);
  const pages = JSON.parse(submission.pages as string);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Header Card */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "#171717",
          borderRadius: 1,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2, color: "#a3a3a3" }}
        >
          กลับไปรายการ
        </Button>

        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* Cover Thumbnail */}
          <Box
            sx={{
              width: 120,
              height: 170,
              borderRadius: 1.5,
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <img
              src={submission.coverImage}
              alt={submission.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>

          {/* Title & Meta */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {submission.title}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Chip
                label={statusInfo.label}
                color={statusInfo.color as any}
                sx={{ fontWeight: 600 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "text.secondary",
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  {new Date(submission.submittedAt).toLocaleDateString(
                    "th-TH",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Typography>
              </Box>
            </Stack>

            {/* Quick Info Pills */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<ImageIcon />}
                label={`${pages.length} หน้า`}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
              />
              {submission.category && (
                <Chip
                  icon={<CategoryIcon />}
                  label={submission.category.name}
                  size="small"
                  sx={{ bgcolor: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}
                />
              )}
              {submission.tags.slice(0, 3).map((t: any) => (
                <Chip
                  key={t.tagId}
                  icon={<LocalOfferIcon />}
                  label={t.tag.name}
                  size="small"
                  sx={{ bgcolor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }}
                />
              ))}
              {submission.tags.length > 3 && (
                <Chip
                  label={`+${submission.tags.length - 3}`}
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                />
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          {submission.status !== "APPROVED" &&
            submission.status !== "REJECTED" && (
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setRejectOpen(true)}
                  sx={{ borderRadius: 1.5, px: 3 }}
                >
                  ปฏิเสธ
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setApproveOpen(true)}
                  sx={{ borderRadius: 1.5, px: 3 }}
                >
                  อนุมัติ
                </Button>
              </Stack>
            )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Description Card */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              bgcolor: "#171717",
              borderRadius: 1,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DescriptionIcon sx={{ color: "#8b5cf6" }} />
                <Typography variant="h6" fontWeight={600}>
                  รายละเอียด
                </Typography>
              </Box>
              {!isEditing &&
                (submission.status === "PENDING" ||
                  submission.status === "UNDER_REVIEW") && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    sx={{ color: "#fbbf24" }}
                  >
                    แก้ไข
                  </Button>
                )}
            </Box>

            {isEditing ? (
              <Stack spacing={2.5}>
                <TextField
                  label="ชื่อเรื่อง"
                  fullWidth
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  variant="filled"
                  InputProps={{
                    disableUnderline: true,
                    sx: { borderRadius: 1 },
                  }}
                />
                <TextField
                  label="Slug"
                  fullWidth
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm({ ...editForm, slug: e.target.value })
                  }
                  variant="filled"
                  InputProps={{
                    disableUnderline: true,
                    sx: { borderRadius: 1 },
                  }}
                />
                <TextField
                  label="คำอธิบาย"
                  fullWidth
                  multiline
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  variant="filled"
                  InputProps={{
                    disableUnderline: true,
                    sx: { borderRadius: 1 },
                  }}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="filled">
                      <InputLabel>หมวดหมู่</InputLabel>
                      <Select
                        value={editForm.categoryId}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            categoryId: e.target.value,
                          })
                        }
                        disableUnderline
                        sx={{ borderRadius: 1 }}
                      >
                        <MenuItem value="">
                          <em>ไม่ระบุ</em>
                        </MenuItem>
                        {categories.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      multiple
                      options={tags}
                      getOptionLabel={(option) => option.name}
                      value={tags.filter((t) => editForm.tagIds.includes(t.id))}
                      onChange={(e, newValue) =>
                        setEditForm({
                          ...editForm,
                          tagIds: newValue.map((v) => v.id),
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="แท็ก"
                          variant="filled"
                          InputProps={{
                            ...params.InputProps,
                            disableUnderline: true,
                            sx: { borderRadius: 1 },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                    pt: 1,
                  }}
                >
                  <Button
                    onClick={() => setIsEditing(false)}
                    sx={{ color: "#a3a3a3" }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveEdit}
                    disabled={actionLoading}
                    sx={{
                      bgcolor: "#fbbf24",
                      color: "#000",
                      "&:hover": { bgcolor: "#f59e0b" },
                    }}
                  >
                    บันทึก
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Box>
                <Typography
                  sx={{
                    color: submission.description
                      ? "text.primary"
                      : "text.secondary",
                    lineHeight: 1.8,
                  }}
                >
                  {submission.description || "ไม่มีคำอธิบาย"}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Pages Preview Card */}
          <Paper
            sx={{
              p: 3,
              bgcolor: "#171717",
              borderRadius: 1,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <ImageIcon sx={{ color: "#8b5cf6" }} />
              <Typography variant="h6" fontWeight={600}>
                ตัวอย่างหน้า
              </Typography>
              <Chip
                label={`${pages.length} หน้า`}
                size="small"
                sx={{ ml: 1, bgcolor: "rgba(255,255,255,0.05)" }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 2,
              }}
            >
              {pages.map((url: string, idx: number) => (
                <Box
                  key={idx}
                  onClick={() => setPreviewImage(url)}
                  sx={{
                    position: "relative",
                    paddingTop: "140%",
                    borderRadius: 1.5,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "scale(1.03)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    },
                  }}
                >
                  <img
                    src={url}
                    alt={`หน้า ${idx + 1}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      py: 0.5,
                      bgcolor: "rgba(0,0,0,0.7)",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" fontWeight={600}>
                      {idx + 1}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {pages.length === 0 && (
              <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                ไม่มีหน้าตัวอย่าง
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Submitter Card */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              bgcolor: "#171717",
              borderRadius: 1,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <PersonIcon sx={{ color: "#8b5cf6" }} />
              <Typography variant="h6" fontWeight={600}>
                ผู้ส่ง
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar
                src={submission.user.image}
                alt={submission.user.name || ""}
                sx={{
                  width: 56,
                  height: 56,
                  border: "2px solid rgba(255,255,255,0.1)",
                }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {submission.user.name ||
                    submission.user.username ||
                    "ไม่ระบุชื่อ"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {submission.user.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                สมาชิกตั้งแต่{" "}
                {new Date(submission.user.createdAt).toLocaleDateString(
                  "th-TH",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </Typography>
            </Box>
          </Paper>

          {/* Cover Card */}
          <Paper
            sx={{
              p: 3,
              bgcolor: "#171717",
              borderRadius: 1,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ImageIcon sx={{ color: "#8b5cf6" }} />
              <Typography variant="h6" fontWeight={600}>
                ภาพปก
              </Typography>
            </Box>
            <Box
              onClick={() => setPreviewImage(submission.coverImage)}
              sx={{
                borderRadius: 1.5,
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
              <img
                src={submission.coverImage}
                alt="Cover"
                style={{ width: "100%", display: "block" }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}
      >
        <Box onClick={() => setPreviewImage(null)} sx={{ cursor: "pointer" }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
            />
          )}
        </Box>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: "#171717", borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon color="success" />
            อนุมัติผลงาน
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
            การอนุมัติจะสร้างมังงะใหม่และอาจเผยแพร่ให้ผู้ใช้เห็นทันที
          </Alert>
          <FormControlLabel
            control={
              <Switch
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                color="success"
              />
            }
            label="เผยแพร่ทันที (ผู้ใช้จะมองเห็นได้)"
          />
          <TextField
            label="หมายเหตุภายใน (ไม่บังคับ)"
            fullWidth
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setApproveOpen(false)}
            sx={{ color: "#a3a3a3" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={actionLoading}
            startIcon={
              actionLoading ? (
                <CircularProgress size={16} />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{ px: 3 }}
          >
            ยืนยันอนุมัติ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: "#171717", borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CancelIcon color="error" />
            ปฏิเสธผลงาน
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 1 }}>
            ผู้ส่งจะเห็นเหตุผลในการปฏิเสธ โปรดระบุให้ชัดเจน
          </Alert>
          <TextField
            label="เหตุผลในการปฏิเสธ (บังคับ)"
            fullWidth
            multiline
            rows={3}
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
            placeholder="เช่น ภาพไม่ชัด, เนื้อหาไม่เหมาะสม..."
          />
          <TextField
            label="หมายเหตุภายใน (ไม่บังคับ)"
            fullWidth
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setRejectOpen(false)}
            sx={{ color: "#a3a3a3" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading || !rejectionReason}
            startIcon={
              actionLoading ? <CircularProgress size={16} /> : <CancelIcon />
            }
            sx={{ px: 3 }}
          >
            ยืนยันปฏิเสธ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
