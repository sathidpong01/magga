"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Card,
  Skeleton,
  Pagination,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "next/image";
import { authFetch } from "@/lib/auth-fetch";

interface Advertisement {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  content: string | null;
  placement: string;
  repeatCount: number;
  isActive: boolean;
}

const PLACEMENTS = [
  { value: "grid", label: "แทรกในกริด" },
  { value: "header", label: "ใต้หัวเว็บ" },
  { value: "footer", label: "เหนือท้ายเว็บ" },
  { value: "manga-end", label: "ท้ายตอน" },
  { value: "floating", label: "ปุ่มลอย" },
  { value: "modal", label: "โมดัล" },
];

const TYPES = [
  { value: "affiliate", label: "ลิงก์แนะนำ" },
  { value: "promptpay", label: "พร้อมเพย์" },
];

// Placement Preview Component - แสดงตัวอย่างตรงกับของจริง (ไม่แสดง title)
function PlacementPreview({
  placement,
  imageUrl,
}: {
  placement: string;
  imageUrl?: string;
  title?: string;
}) {
  const previewImage = imageUrl || null;

  const renderPreview = () => {
    switch (placement) {
      // Grid: เหมือน MangaCard - รูปเต็มเฟรม height 400px
      case "grid":
        return (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Skeleton
              variant="rectangular"
              width={70}
              height={100}
              sx={{ borderRadius: 0.5 }}
            />
            <Card
              sx={{
                width: 70,
                height: 100,
                bgcolor: "#171717",
                borderRadius: 0.5,
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt=""
                  fill
                  sizes="70px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#262626",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: 8 }}
                  >
                    AD
                  </Typography>
                </Box>
              )}
            </Card>
            <Skeleton
              variant="rectangular"
              width={70}
              height={100}
              sx={{ borderRadius: 0.5 }}
            />
          </Box>
        );

      // Header: รูปแนวนอน auto-ratio max-height 150px ไม่มีกรอบ
      case "header":
        return (
          <Box sx={{ width: "100%" }}>
            <Skeleton
              variant="rectangular"
              height={30}
              sx={{ mb: 1, borderRadius: 0.5 }}
            />
            <Box
              sx={{
                bgcolor: "transparent",
                display: "flex",
                justifyContent: "center",
                mb: 1,
              }}
            >
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 60,
                    objectFit: "contain",
                    borderRadius: 0.5,
                  }}
                />
              ) : (
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={50}
                  sx={{ borderRadius: 0.5 }}
                />
              )}
            </Box>
            <Skeleton
              variant="rectangular"
              height={80}
              sx={{ borderRadius: 0.5 }}
            />
          </Box>
        );

      // Footer: เหมือน Header
      case "footer":
        return (
          <Box sx={{ width: "100%" }}>
            <Skeleton
              variant="rectangular"
              height={80}
              sx={{ mb: 1, borderRadius: 0.5 }}
            />
            <Box
              sx={{
                bgcolor: "transparent",
                display: "flex",
                justifyContent: "center",
                mb: 1,
              }}
            >
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 60,
                    objectFit: "contain",
                    borderRadius: 0.5,
                  }}
                />
              ) : (
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={50}
                  sx={{ borderRadius: 0.5 }}
                />
              )}
            </Box>
            <Skeleton
              variant="rectangular"
              height={25}
              sx={{ borderRadius: 0.5 }}
            />
          </Box>
        );

      // Manga-end: เหมือน Header/Footer
      case "manga-end":
        return (
          <Box sx={{ width: "100%" }}>
            <Skeleton
              variant="rectangular"
              height={60}
              sx={{ mb: 1, borderRadius: 0.5 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", mb: 1 }}
            >
              จบตอน
            </Typography>
            <Box
              sx={{
                bgcolor: "transparent",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 60,
                    objectFit: "contain",
                    borderRadius: 0.5,
                  }}
                />
              ) : (
                <Skeleton
                  variant="rectangular"
                  width="80%"
                  height={50}
                  sx={{ borderRadius: 0.5 }}
                />
              )}
            </Box>
          </Box>
        );

      // Floating: รูปแนวตั้ง max-width 200px ไม่แสดง title
      case "floating":
        return (
          <Box
            sx={{
              width: "100%",
              height: 160,
              position: "relative",
              bgcolor: "#1a1a1a",
              borderRadius: 0.5,
            }}
          >
            <Skeleton
              variant="rectangular"
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                right: 8,
                height: 80,
                borderRadius: 0.5,
              }}
            />
            <Paper
              sx={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 80,
                bgcolor: "#171717",
                borderRadius: 1,
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height={100} />
              )}
            </Paper>
          </Box>
        );

      // Modal: รูป flexible ไม่แสดง title
      case "modal":
        return (
          <Box
            sx={{
              width: "100%",
              height: 160,
              position: "relative",
              bgcolor: "rgba(0,0,0,0.6)",
              borderRadius: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Paper
              sx={{
                maxWidth: 120,
                bgcolor: "transparent",
                borderRadius: 1,
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 120,
                    display: "block",
                  }}
                />
              ) : (
                <Skeleton variant="rectangular" width={120} height={90} />
              )}
            </Paper>
          </Box>
        );

      default:
        return <Typography color="text.secondary">เลือกตำแหน่ง</Typography>;
    }
  };

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: "#0B0B0B",
        borderRadius: 1.25,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Typography
        variant="caption"
        sx={{ 
          mb: 2, 
          display: "block", 
          fontWeight: 900, 
          textTransform: "none",
          letterSpacing: "0",
          color: "#FABF06"
        }}
      >
        ตัวอย่างสด:{" "}
        <Box component="span" sx={{ color: "#fafafa" }}>
          {PLACEMENTS.find((p) => p.value === placement)?.label || "เลือกตำแหน่ง"}
        </Box>
      </Typography>
      <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.02)", borderRadius: 1 }}>
        {renderPreview()}
      </Box>
      <Typography
        variant="caption"
        sx={{ 
          mt: 2, 
          display: "block", 
          fontSize: 10,
          fontWeight: 600,
          color: "#737373",
          textTransform: "none",
          letterSpacing: "0"
        }}
      >
        * ชื่อโฆษณาใช้สำหรับจัดการภายในเท่านั้น ผู้ใช้จะไม่เห็นข้อความนี้
      </Typography>
    </Box>
  );
}

const ITEMS_PER_PAGE = 10;

export default function AdvertisementsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAd, setDeletingAd] = useState<Advertisement | null>(null);

  const [formData, setFormData] = useState({
    type: "affiliate",
    title: "",
    imageUrl: "",
    linkUrl: "",
    content: "",
    placement: "grid",
    repeatCount: 1,
  });

  const fetchAds = useCallback(async () => {
    try {
      const res = await authFetch("/api/advertisements?all=true");
      const data = await res.json();
      setAds(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Pagination
  const totalPages = Math.ceil(ads.length / ITEMS_PER_PAGE);
  const paginatedAds = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return ads.slice(start, start + ITEMS_PER_PAGE);
  }, [ads, page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        type: ad.type,
        title: ad.title,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl || "",
        content: ad.content || "",
        placement: ad.placement,
        repeatCount: ad.repeatCount || 1,
      });
      setPreviewUrl(ad.imageUrl);
    } else {
      setEditingAd(null);
      setFormData({
        type: "affiliate",
        title: "",
        imageUrl: "",
        linkUrl: "",
        content: "",
        placement: "grid",
        repeatCount: 1,
      });
      setPreviewUrl(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAd(null);
    setError(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // Upload to R2
    setUploading(true);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await authFetch("/api/advertisements/upload", {
        method: "POST",
        body: formDataUpload,
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("เซสชันหมดอายุ กรุณารีเฟรชหน้าแล้วลองใหม่");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.debug || "Upload failed");
      }

      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setPreviewUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.imageUrl) {
      setError("กรุณาอัพโหลดรูปภาพ");
      return;
    }

    try {
      const url = editingAd
        ? `/api/advertisements/${editingAd.id}`
        : "/api/advertisements";
      const method = editingAd ? "PATCH" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");

      handleCloseDialog();
      fetchAds();
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึก");
      console.error(err);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      await authFetch(`/api/advertisements/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeleteDialog = (ad: Advertisement) => {
    setDeletingAd(ad);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingAd(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAd) return;
    try {
      await authFetch(`/api/advertisements/${deletingAd.id}`, {
        method: "DELETE",
      });
      fetchAds();
      handleCloseDeleteDialog();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 900, 
            letterSpacing: "-0.02em", 
            color: "#fafafa",
            textTransform: "none"
          }}
        >
          จัดการโฆษณา
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? "small" : "medium"}
          sx={{
            bgcolor: "#FABF06",
            color: "#000",
            fontWeight: 900,
            borderRadius: 1.25,
            px: 3,
            height: 44,
            textTransform: "none",
            letterSpacing: "0",
            "&:hover": { bgcolor: "#eab308" }
          }}
        >
          {isMobile ? "เพิ่ม" : "สร้างโฆษณา"}
        </Button>
      </Box>

      {/* Mobile: Card layout */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {paginatedAds.map((ad) => (
            <Paper
              key={ad.id}
              sx={{
                bgcolor: "#141414",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 1.25,
                overflow: "hidden",
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, p: 1.5 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    position: "relative",
                    borderRadius: 0.5,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    fill
                    sizes="64px"
                    style={{ objectFit: "cover" }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#fafafa",
                      mb: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ad.title}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                    <Chip
                      label={
                        TYPES.find((t) => t.value === ad.type)?.label || ad.type
                      }
                      size="small"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                    <Chip
                      label={
                        PLACEMENTS.find((p) => p.value === ad.placement)?.label ||
                        ad.placement
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Switch
                      checked={ad.isActive}
                      onChange={() => handleToggleActive(ad)}
                      size="small"
                    />
                    <Box>
                      <IconButton
                        onClick={() => handleOpenDialog(ad)}
                        size="small"
                        aria-label="แก้ไข"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpenDeleteDialog(ad)}
                        size="small"
                        color="error"
                        aria-label="ลบ"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
          {ads.length === 0 && (
            <Box sx={{ py: 8, textAlign: "center", bgcolor: "#141414", borderRadius: 1.25, border: "1px solid rgba(255,255,255,0.06)" }}>
              <Typography sx={{ fontWeight: 700, color: "#737373", textTransform: "none", letterSpacing: "0" }}>
                ยังไม่มีโฆษณา
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* Desktop: Table layout */
        <TableContainer 
          component={Paper} 
          sx={{ 
            bgcolor: "#141414",
            borderRadius: 1.25,
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "none",
            backgroundImage: "none",
            overflow: "hidden"
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>เฟรม</TableCell>
                <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>ชื่อ</TableCell>
                <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>ประเภท</TableCell>
                <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>ตำแหน่ง</TableCell>
                <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>เปิดใช้งาน</TableCell>
                <TableCell align="right" sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "none", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAds.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        position: "relative",
                        borderRadius: 0.5,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        sizes="60px"
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{ad.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        TYPES.find((t) => t.value === ad.type)?.label || ad.type
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        PLACEMENTS.find((p) => p.value === ad.placement)?.label ||
                        ad.placement
                      }
                      size="small"
                      sx={{ 
                        fontWeight: 900, 
                        fontSize: "0.65rem",
                        borderRadius: 0.75,
                        bgcolor: "rgba(250, 191, 6, 0.1)",
                        color: "#FABF06",
                        border: "1px solid rgba(250, 191, 6, 0.2)",
                        textTransform: "none"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={ad.isActive}
                      onChange={() => handleToggleActive(ad)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#FABF06" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#FABF06" }
                      }}
                    />
                 </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(ad)}
                      sx={{ color: "#a3a3a3", "&:hover": { color: "#FABF06" } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDeleteDialog(ad)}
                      sx={{ color: "#a3a3a3", "&:hover": { color: "#ef4444" } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {ads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">ยังไม่มีโฆษณา</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              "& .MuiPaginationItem-root": { color: "#a3a3a3", fontWeight: 700 },
              "& .Mui-selected": { bgcolor: "#FABF06 !important", color: "#000 !important" }
            }}
          />
        </Box>
      )}

      {/* Add/Edit Dialog - Split Layout */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            bgcolor: "#141414",
            color: "#fafafa",
            borderRadius: isMobile ? 0 : 1.25,
            border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
            backgroundImage: "none",
            boxShadow: "none"
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, textTransform: "none", letterSpacing: "0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {editingAd ? "แก้ไขโฆษณา" : "เพิ่มโฆษณาใหม่"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mt: 1 }}>
            {/* Left: Form */}
            <Box sx={{ flex: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: "#a3a3a3", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}>ประเภท</InputLabel>
                <Select
                  value={formData.type}
                  label="ประเภท"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  sx={{
                    bgcolor: "#0B0B0B",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.06)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#FABF06" },
                  }}
                >
                  {TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="ชื่อโฆษณา"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                sx={{ 
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0B0B0B",
                    borderRadius: 1,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                    "&.Mui-focused fieldset": { borderColor: "#FABF06" },
                  },
                  "& .MuiInputLabel-root": { color: "#a3a3a3", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }
                }}
              />

              {/* File Upload */}
              <Box sx={{ mb: 2 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={
                    uploading ? (
                      <CircularProgress size={20} sx={{ color: "#FABF06" }} />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{ 
                    py: 2, 
                    borderRadius: 1, 
                    border: "2px dashed rgba(255,255,255,0.1)",
                    color: "#a3a3a3",
                    fontWeight: 800,
                    textTransform: "none",
                    letterSpacing: "0",
                    "&:hover": { border: "2px dashed #FABF06", color: "#FABF06", bgcolor: "rgba(250, 191, 6, 0.05)" }
                  }}
                >
                  {uploading
                    ? "กำลังอัปโหลด..."
                    : formData.imageUrl
                    ? "เปลี่ยนรูป"
                    : "อัปโหลดรูป"}
                </Button>
                {formData.imageUrl && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block", color: "#4ade80", fontWeight: 800, textTransform: "none", fontSize: "0.65rem" }}
                  >
                    ✓ อัปโหลดรูปเรียบร้อย
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                label="ลิงก์ปลายทาง"
                value={formData.linkUrl}
                onChange={(e) =>
                  setFormData({ ...formData, linkUrl: e.target.value })
                }
                sx={{ 
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0B0B0B",
                    borderRadius: 1,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                    "&.Mui-focused fieldset": { borderColor: "#FABF06" },
                  },
                  "& .MuiInputLabel-root": { color: "#a3a3a3", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }
                }}
              />

              <TextField
                fullWidth
                label="เนื้อหาเพิ่มเติม / หมายเหตุ"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                sx={{ 
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0B0B0B",
                    borderRadius: 1,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                    "&.Mui-focused fieldset": { borderColor: "#FABF06" },
                  },
                  "& .MuiInputLabel-root": { color: "#a3a3a3", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }
                }}
                multiline
                rows={2}
                placeholder="เช่น เลขพร้อมเพย์ หรือคำอธิบาย"
              />

              <FormControl fullWidth>
                <InputLabel sx={{ color: "#a3a3a3", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}>ตำแหน่ง</InputLabel>
                <Select
                  value={formData.placement}
                  label="ตำแหน่ง"
                  onChange={(e) =>
                    setFormData({ ...formData, placement: e.target.value })
                  }
                  sx={{
                    bgcolor: "#0B0B0B",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.06)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#FABF06" },
                  }}
                >
                  {PLACEMENTS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Repeat Count - only for grid placement */}
              {formData.placement === "grid" && (
                <TextField
                  fullWidth
                  type="number"
                  label="ความถี่การแทรก"
                  value={formData.repeatCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      repeatCount: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ 
                    mt: 2,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#0B0B0B",
                      borderRadius: 1,
                      "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                      "&.Mui-focused fieldset": { borderColor: "#FABF06" },
                    },
                    "& .MuiInputLabel-root": { color: "#a3a3a3", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }
                  }}
                  helperText={<Typography variant="caption" sx={{ color: "#737373", fontSize: "0.65rem", fontWeight: 600 }}>จำนวนครั้งที่โฆษณานี้จะแทรกในกริดมังงะ (1-10)</Typography>}
                />
              )}
            </Box>

            {/* Right: Preview */}
            <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 900, textTransform: "none", fontSize: "0.75rem", color: "#a3a3a3", letterSpacing: "0" }}>
                ตัวอย่างตำแหน่ง
              </Typography>
              <PlacementPreview
                placement={formData.placement}
                imageUrl={previewUrl || undefined}
                title={formData.title || undefined}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ color: "#a3a3a3", fontWeight: 800, textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={uploading}
            sx={{
              bgcolor: "#FABF06",
              color: "#000",
              fontWeight: 900,
              px: 4,
              borderRadius: 1,
              "&:hover": { bgcolor: "#eab308" }
            }}
          >
            {editingAd ? "บันทึกการเปลี่ยนแปลง" : "สร้างโฆษณา"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#141414",
            borderRadius: 1.25,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundImage: "none"
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "none", letterSpacing: "0", fontSize: "1rem" }}>
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 600, color: "#d4d4d4" }}>
            ยืนยันว่าจะลบ &quot;{deletingAd?.title}&quot; ใช่หรือไม่
          </Typography>
          <Typography
            variant="caption"
            sx={{ mt: 2, display: "block", color: "#ef4444", fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}
          >
            การกระทำนี้ยกเลิกไม่ได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            sx={{ color: "#a3a3a3", fontWeight: 800, textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ 
              bgcolor: "#ef4444", 
              color: "#fff", 
              fontWeight: 900,
              "&:hover": { bgcolor: "#dc2626" },
              px: 3
            }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
