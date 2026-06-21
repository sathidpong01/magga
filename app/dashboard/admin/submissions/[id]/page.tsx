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
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ViewStreamIcon from "@mui/icons-material/ViewStream";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { authFetch } from "@/lib/auth-fetch";
import Image from "next/image";

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

  // Web Reader State
  const [readMode, setReadMode] = useState<"scroll" | "page">("scroll");
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readMode !== "page") return;
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }
      const pagesCount = submission && Array.isArray(submission.pages) ? submission.pages.length : 0;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setCurrentPage((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setCurrentPage((prev) => Math.min(pagesCount - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readMode, submission]);

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
  const pages = Array.isArray(submission.pages) ? submission.pages : [];

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto", height: { xs: "auto", md: "calc(100vh - 120px)" }, display: "flex", flexDirection: "column" }}>
      {/* Top breadcrumb/header bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexShrink: 0 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ 
            color: "#a3a3a3",
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            "&:hover": { color: "#FABF06" }
          }}
        >
          BACK TO LIST
        </Button>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 900, 
            color: "#fbbf24", 
            fontSize: "0.85rem",
            fontFamily: "monospace",
            letterSpacing: "0.1em"
          }}
        >
          SUBMISSION REVIEW #{submissionId.substring(0, 8).toUpperCase()}
        </Typography>
      </Box>

      {/* Split Layout Container */}
      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden", flexDirection: { xs: "column", md: "row" } }}>
        
        {/* Left Column - Metadata & Controls (35%) */}
        <Grid size={{ xs: 12, md: 4.5, lg: 4 }} sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", pr: { md: 1 } }}>
          
          {/* Cover & Title Info */}
          <Paper
            sx={{
              p: 2.5,
              bgcolor: "#141414",
              borderRadius: 1.25,
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "none",
              backgroundImage: "none"
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 80,
                  height: 110,
                  borderRadius: 1,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  position: "relative"
                }}
              >
                <Image
                  src={submission.coverImage}
                  alt={submission.title}
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 900, 
                    letterSpacing: "-0.01em",
                    color: "#fafafa",
                    lineHeight: 1.2,
                    mb: 1,
                    wordBreak: "break-word"
                  }}
                >
                  {submission.title}
                </Typography>
                
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{ 
                      fontWeight: 900, 
                      fontSize: "0.65rem",
                      letterSpacing: "0.05em",
                      borderRadius: 0.5,
                      bgcolor: statusInfo.bg,
                      color: statusInfo.color === "success" ? "#4ade80" : 
                             statusInfo.color === "error" ? "#f87171" :
                             statusInfo.color === "warning" ? "#FABF06" : "#a3a3a3",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: "monospace", 
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#a3a3a3"
                    }}
                  >
                    {new Date(submission.submittedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }).toUpperCase()}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Paper>

          {/* Submitter Details */}
          <Paper
            sx={{
              p: 2.5,
              bgcolor: "#141414",
              borderRadius: 1.25,
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "none",
              backgroundImage: "none"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <PersonIcon sx={{ color: "#FABF06", fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, letterSpacing: "0.05em", color: "#fafafa" }}>
                SUBMITTER (ผู้ส่งผลงาน)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={submission.user.image}
                alt={submission.user.name || ""}
                sx={{
                  width: 44,
                  height: 44,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: "#fafafa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {submission.user.name || submission.user.username || "ไม่ระบุชื่อ"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {submission.user.email}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Metadata Card (Editable) */}
          <Paper
            sx={{
              p: 2.5,
              bgcolor: "#141414",
              borderRadius: 1.25,
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "none",
              backgroundImage: "none"
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DescriptionIcon sx={{ color: "#FABF06", fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, letterSpacing: "0.05em", color: "#fafafa" }}>
                  MANGA METADATA
                </Typography>
              </Box>
              {!isEditing && (submission.status === "PENDING" || submission.status === "UNDER_REVIEW") && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  sx={{ fontWeight: 800, color: "#FABF06", fontSize: "0.7rem", minWidth: 0, p: 0.5 }}
                >
                  EDIT
                </Button>
              )}
            </Box>

            {isEditing ? (
              <Stack spacing={2}>
                <TextField
                  label="ชื่อเรื่อง"
                  fullWidth
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  variant="filled"
                  size="small"
                  InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                />
                <TextField
                  label="Slug"
                  fullWidth
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  variant="filled"
                  size="small"
                  InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                />
                <TextField
                  label="คำอธิบาย"
                  fullWidth
                  multiline
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  variant="filled"
                  size="small"
                  InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                />
                <FormControl fullWidth variant="filled" size="small">
                  <InputLabel>หมวดหมู่</InputLabel>
                  <Select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    disableUnderline
                    sx={{ borderRadius: 1 }}
                  >
                    <MenuItem value=""><em>ไม่ระบุ</em></MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Autocomplete
                  multiple
                  options={tags}
                  getOptionLabel={(option) => option.name}
                  value={tags.filter((t) => editForm.tagIds.includes(t.id))}
                  onChange={(e, newValue) => setEditForm({ ...editForm, tagIds: newValue.map((v) => v.id) })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="แท็ก"
                      variant="filled"
                      size="small"
                      InputProps={{ ...params.InputProps, disableUnderline: true, sx: { borderRadius: 1 } }}
                    />
                  )}
                />
                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", pt: 1 }}>
                  <Button onClick={() => setIsEditing(false)} sx={{ color: "#a3a3a3", fontSize: "0.75rem" }}>
                    ยกเลิก
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveEdit}
                    disabled={actionLoading}
                    sx={{ bgcolor: "#fbbf24", color: "#000", "&:hover": { bgcolor: "#f59e0b" }, fontWeight: 700, fontSize: "0.75rem" }}
                  >
                    บันทึก
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">คำอธิบาย</Typography>
                  <Typography variant="body2" sx={{ color: submission.description ? "#fafafa" : "#737373", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {submission.description || "ไม่มีคำอธิบาย"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">หมวดหมู่:</Typography>
                  {submission.category ? (
                    <Chip label={submission.category.name} size="small" sx={{ bgcolor: "rgba(139, 92, 246, 0.15)", color: "#a78bfa", fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                  ) : (
                    <Typography variant="caption" color="text.muted">ไม่มี</Typography>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">แท็ก:</Typography>
                  {submission.tags.length > 0 ? (
                    submission.tags.map((t: any) => (
                      <Chip key={t.tagId} label={t.tag.name} size="small" sx={{ bgcolor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", fontWeight: 700, fontSize: "0.7rem", height: 22 }} />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.muted">ไม่มี</Typography>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>

          {/* Action Approval Card */}
          <Paper
            sx={{
              p: 2.5,
              mt: "auto",
              bgcolor: "#171717",
              borderRadius: 1.25,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
              backgroundImage: "none",
              position: "sticky",
              bottom: 0,
              zIndex: 2
            }}
          >
            {submission.status !== "APPROVED" && submission.status !== "REJECTED" ? (
              <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={() => setRejectOpen(true)}
                  sx={{ 
                    borderRadius: 1, 
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    py: 1,
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.05)" }
                  }}
                >
                  REJECT
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setApproveOpen(true)}
                  sx={{ 
                    borderRadius: 1, 
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    py: 1,
                    bgcolor: "#FABF06",
                    color: "#000",
                    "&:hover": { bgcolor: "#e5af05" }
                  }}
                >
                  APPROVE
                </Button>
              </Stack>
            ) : (
              <Box sx={{ textAlign: "center" }}>
                {submission.status === "APPROVED" ? (
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ bgcolor: "rgba(34, 197, 94, 0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <Typography variant="body2" fontWeight={800}>คำขอได้รับอนุมัติแล้ว</Typography>
                    {submission.reviewNote && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: "italic" }}>
                        โน้ต: {submission.reviewNote}
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  <Alert severity="error" icon={<CancelIcon />} sx={{ bgcolor: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <Typography variant="body2" fontWeight={800}>คำขอนี้ถูกปฏิเสธ</Typography>
                    {submission.rejectionReason && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: "italic" }}>
                        เหตุผล: {submission.rejectionReason}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Web Reader (65%) */}
        <Grid size={{ xs: 12, md: 7.5, lg: 8 }} sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#050505", borderRadius: 1.5, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          
          {/* Reader Toolbar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1.5,
              bgcolor: "#171717",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
              gap: 2,
              flexWrap: { xs: "wrap", sm: "nowrap" }
            }}
          >
            {/* Title & Page count */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ImageIcon sx={{ color: "#FABF06", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, letterSpacing: "0.05em", color: "#fafafa" }}>
                READER PREVIEW
              </Typography>
              <Chip
                label={`${pages.length} หน้า`}
                size="small"
                sx={{ 
                  bgcolor: "rgba(255,255,255,0.05)",
                  fontWeight: 800,
                  fontSize: "0.65rem",
                  borderRadius: 0.5,
                  fontFamily: "monospace",
                  height: 20
                }}
              />
            </Box>

            {/* Pagination Controls (Visible only in single page mode) */}
            {readMode === "page" && pages.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton 
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  size="small"
                  sx={{ color: "#fafafa", "&:disabled": { color: "rgba(255,255,255,0.15)" } }}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#fafafa" }}>
                  หน้า {currentPage + 1} / {pages.length}
                </Typography>
                <IconButton 
                  onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
                  disabled={currentPage === pages.length - 1}
                  size="small"
                  sx={{ color: "#fafafa", "&:disabled": { color: "rgba(255,255,255,0.15)" } }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </Box>
            )}

            {/* Read Mode & Zoom Controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Mode Selector */}
              <Box sx={{ display: "flex", bgcolor: "#0a0a0a", p: 0.5, borderRadius: 1, border: "1px solid rgba(255,255,255,0.05)", mr: 1 }}>
                <Tooltip title="เลื่อนอ่านต่อเนื่อง (Continuous Scroll)">
                  <IconButton
                    size="small"
                    onClick={() => setReadMode("scroll")}
                    sx={{ 
                      borderRadius: 0.5,
                      color: readMode === "scroll" ? "#FABF06" : "#a3a3a3",
                      bgcolor: readMode === "scroll" ? "rgba(250,191,6,0.1)" : "transparent",
                      "&:hover": { bgcolor: readMode === "scroll" ? "rgba(250,191,6,0.15)" : "rgba(255,255,255,0.05)" }
                    }}
                  >
                    <ViewStreamIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="อ่านทีละหน้า (Single Page)">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setReadMode("page");
                      setCurrentPage(0);
                    }}
                    sx={{ 
                      borderRadius: 0.5,
                      color: readMode === "page" ? "#FABF06" : "#a3a3a3",
                      bgcolor: readMode === "page" ? "rgba(250,191,6,0.1)" : "transparent",
                      "&:hover": { bgcolor: readMode === "page" ? "rgba(250,191,6,0.15)" : "rgba(255,255,255,0.05)" }
                    }}
                  >
                    <MenuBookIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Zoom controls */}
              <Tooltip title="ลดขนาด">
                <IconButton 
                  size="small" 
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  disabled={zoom <= 50}
                  sx={{ color: "#a3a3a3" }}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" sx={{ minWidth: 40, textAlign: "center", fontFamily: "monospace", fontWeight: 700, color: "#fafafa" }}>
                {zoom}%
              </Typography>
              <Tooltip title="ขยายขนาด">
                <IconButton 
                  size="small" 
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  disabled={zoom >= 150}
                  sx={{ color: "#a3a3a3" }}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="คืนค่าเดิม (Fit Width)">
                <IconButton 
                  size="small" 
                  onClick={() => setZoom(100)}
                  disabled={zoom === 100}
                  sx={{ color: "#a3a3a3" }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Reader Area */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              p: 3,
              bgcolor: "#030303",
              position: "relative",
              outline: "none"
            }}
            tabIndex={0} // Allows keyboard navigation focus
          >
            {pages.length === 0 ? (
              <Box sx={{ m: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "text.secondary" }}>
                <MenuBookIcon sx={{ fontSize: 64, color: "#404040" }} />
                <Typography variant="body2" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ไม่มีหน้ามังงะตัวอย่าง
                </Typography>
              </Box>
            ) : readMode === "scroll" ? (
              <Stack spacing={2} sx={{ width: "100%", alignItems: "center" }}>
                {pages.map((url: string, idx: number) => (
                  <Box 
                    key={idx}
                    onClick={() => setPreviewImage(url)}
                    sx={{
                      width: `${zoom}%`,
                      maxWidth: "100%",
                      position: "relative",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 1,
                      overflow: "hidden",
                      transition: "width 0.2s, transform 0.2s",
                      cursor: "zoom-in",
                      "&:hover": {
                        transform: "scale(1.01)"
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`หน้า ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block"
                      }}
                      loading="lazy"
                    />
                    <Box sx={{ position: "absolute", bottom: 12, right: 12, bgcolor: "rgba(0,0,0,0.7)", color: "#fff", px: 1.5, py: 0.5, borderRadius: 0.5, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem" }}>
                        หน้า {idx + 1}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  position: "relative",
                  width: `${zoom}%`,
                  maxWidth: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 1,
                  overflow: "hidden",
                  transition: "width 0.2s",
                  bgcolor: "#000"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[currentPage]}
                  alt={`หน้า ${currentPage + 1}`}
                  onClick={() => setPreviewImage(pages[currentPage])}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    cursor: "zoom-in"
                  }}
                />
                
                {/* Floating Navigation Areas */}
                {currentPage > 0 && (
                  <Box
                    onClick={() => setCurrentPage((p) => p - 1)}
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "15%",
                      cursor: "w-resize",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      pl: 2,
                      opacity: 0,
                      background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent)",
                      transition: "opacity 0.2s",
                      "&:hover": { opacity: 1 }
                    }}
                  >
                    <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}>
                      <NavigateBeforeIcon />
                    </IconButton>
                  </Box>
                )}
                {currentPage < pages.length - 1 && (
                  <Box
                    onClick={() => setCurrentPage((p) => p + 1)}
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: "15%",
                      cursor: "e-resize",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      pr: 2,
                      opacity: 0,
                      background: "linear-gradient(to left, rgba(0,0,0,0.5), transparent)",
                      transition: "opacity 0.2s",
                      "&:hover": { opacity: 1 }
                    }}
                  >
                    <IconButton size="small" sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}>
                      <NavigateNextIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}
      >
        <Box onClick={() => setPreviewImage(null)} sx={{ cursor: "pointer", position: "relative" }}>
          {previewImage && (
            <Box sx={{ position: "relative", width: "95vw", height: "95vh", maxWidth: "1600px", maxHeight: "1600px" }}>
              <Image
                src={previewImage}
                alt="Preview"
                fill
                style={{ objectFit: "contain", borderRadius: 8 }}
              />
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            bgcolor: "#141414", 
            borderRadius: 1.25,
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.06)"
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "1rem", color: "#fafafa" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CheckCircleIcon sx={{ color: "#FABF06" }} />
            Approve Submission
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 1, bgcolor: "rgba(2, 136, 209, 0.1)", color: "#29b6f6", "& .MuiAlert-icon": { color: "#29b6f6" } }}>
            การอนุมัติโพสต์ฝากส่งนี้ จะสร้างเรื่องมังงะ One-shot ใหม่ในคลังระบบโดยอัตโนมัติ
          </Alert>
          <FormControlLabel
            control={
              <Switch
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#FABF06" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#FABF06" }
                }}
              />
            }
            label={<Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#a3a3a3" }}>เผยแพร่ทันที (PUBLISH IMMEDIATELY)</Typography>}
          />
          <TextField
            label="โน้ตภายในแอดมิน (INTERNAL NOTE - OPTIONAL)"
            fullWidth
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1, bgcolor: "#0B0B0B", fontWeight: 600 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setApproveOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 800, fontSize: "0.75rem" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            disabled={actionLoading}
            startIcon={
              actionLoading ? (
                <CircularProgress size={16} />
              ) : (
                <CheckCircleIcon />
              )
            }
            sx={{ 
              px: 3, 
              bgcolor: "#FABF06", 
              color: "#000", 
              fontWeight: 900,
              "&:hover": { bgcolor: "#e5af05" }
            }}
          >
            ยืนยันการอนุมัติ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            bgcolor: "#141414", 
            borderRadius: 1.25,
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.06)"
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "1rem", color: "#fafafa" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CancelIcon sx={{ color: "#f87171" }} />
            Reject Submission
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 1, bgcolor: "rgba(234, 179, 8, 0.1)", color: "#fbbf24", "& .MuiAlert-icon": { color: "#fbbf24" } }}>
            ผู้ฝากส่งผลงานจะมองเห็นเหตุผลที่ผลงานถูกปฏิเสธ กรุณาระบุรายละเอียดให้ชัดเจน
          </Alert>
          <TextField
            label="เหตุผลการปฏิเสธ (REJECTION REASON - REQUIRED)"
            fullWidth
            multiline
            rows={3}
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1, bgcolor: "#0B0B0B", fontWeight: 600 } }}
            placeholder="เช่น ภาพไม่ชัด, เนื้อหาไม่เหมาะสม, การแปลไม่ผ่านเกณฑ์..."
          />
          <TextField
            label="โน้ตภายในแอดมิน (INTERNAL NOTE - OPTIONAL)"
            fullWidth
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
            variant="filled"
            InputProps={{ disableUnderline: true, sx: { borderRadius: 1, bgcolor: "#0B0B0B", fontWeight: 600 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setRejectOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 800, fontSize: "0.75rem" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            disabled={actionLoading || !rejectionReason}
            startIcon={
              actionLoading ? <CircularProgress size={16} /> : <CancelIcon />
            }
            sx={{ 
              px: 3, 
              bgcolor: "#ef4444", 
              color: "#fff", 
              fontWeight: 900,
              "&:hover": { bgcolor: "#dc2626" }
            }}
          >
            ยืนยันการปฏิเสธ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
