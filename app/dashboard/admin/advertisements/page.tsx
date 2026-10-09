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
  Tooltip,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import { adCtr, getAdvertisementLinks, maxAdvertisementLinks, normalizeAdvertisementLink } from "@/lib/advertisements";
import { maggaColors } from "@/lib/design-tokens";
import Image from "next/image";
import { authFetch } from "@/lib/auth-fetch";
import {
  dashboardTokens,
  dashboardRadii,
  dashboardPrimaryButtonSx,
} from "@/app/components/dashboard/system";

interface Advertisement {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  linkUrls?: string[] | null;
  content: string | null;
  placement: string;
  repeatCount: number;
  isActive: boolean;
  targetDevice: string;
  impressions: number;
  clicks: number;
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

const adDialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.025)",
    borderRadius: 1.25,
    color: "#fafafa",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.08)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.16)",
    },
    "&.Mui-focused fieldset": {
      borderColor: dashboardTokens.accent,
      boxShadow: `0 0 0 1px ${dashboardTokens.accentSoft}`,
    },
    "& .MuiSelect-icon": {
      color: "rgba(255,255,255,0.7)",
    },
    "& .MuiSelect-select": {
      color: "#fafafa !important",
      WebkitTextFillColor: "#fafafa",
      fontWeight: 700,
    },
    "& .MuiSelect-select.MuiSelect-outlined": {
      color: "#fafafa !important",
      WebkitTextFillColor: "#fafafa",
    },
    "& .MuiOutlinedInput-input": {
      color: "#fafafa !important",
      WebkitTextFillColor: "#fafafa",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#bcbcbc",
    fontWeight: 700,
    textTransform: "none",
    fontSize: "0.75rem",
    letterSpacing: "0.01em",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#f7d27a",
  },
  "& .MuiFormHelperText-root": {
    mx: 0.25,
    mt: 0.85,
    color: "#8c8c8c",
    fontWeight: 600,
    fontSize: "0.68rem",
  },
};

const adDialogPanelSx = {
  bgcolor: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 1.5,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025)",
};

const adDialogSelectMenuProps = {
  slotProps: {
    paper: {
      sx: {
        mt: 0.75,
        bgcolor: dashboardTokens.surfaceAlt,
        color: "#ececec",
        border: `1px solid ${dashboardTokens.border}`,
        borderRadius: 1.25,
        backgroundImage: "none",
        boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
        "& .MuiMenuItem-root": {
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "#d4d4d4",
          minHeight: 42,
          textTransform: "none",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.05)",
            color: "#fafafa",
          },
          "&.Mui-selected": {
            bgcolor: dashboardTokens.accentSoft,
            color: dashboardTokens.accent,
          },
          "&.Mui-selected:hover": {
            bgcolor: "rgba(217, 119, 6, 0.22)",
            color: dashboardTokens.accentStrong,
          },
        },
      },
    },
  },
};

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
                bgcolor: "#1e1e22",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.08)",
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
                    bgcolor: "#24242a",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: 8
                    }}>
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
              sx={{
                color: "text.secondary",
                display: "block",
                textAlign: "center",
                mb: 1
              }}>
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
              bgcolor: "#1e1e22",
              borderRadius: "10px",
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
                borderRadius: "8px",
              }}
            />
            <Paper
              sx={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 80,
                bgcolor: "#24242a",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
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
        return (
          <Typography sx={{
            color: "text.secondary"
          }}>เลือกตำแหน่ง</Typography>
        );
    }
  };

  return (
    <Box
      sx={{
        p: 2.25,
        bgcolor: "rgba(255,255,255,0.02)",
        borderRadius: 1.5,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.025)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 900,
            textTransform: "none",
            letterSpacing: "0",
            color: dashboardTokens.accent,
          }}
        >
          ตัวอย่างสด
        </Typography>
        <Chip
          size="small"
          label={PLACEMENTS.find((p) => p.value === placement)?.label || "เลือกตำแหน่ง"}
          sx={{
            height: 24,
            bgcolor: dashboardTokens.accentSoft,
            color: dashboardTokens.accent,
            border: `1px solid ${dashboardTokens.accentSoft}`,
            fontWeight: 700,
            borderRadius: 0.75,
          }}
        />
      </Box>
      <Box
        sx={{
          p: 1.25,
          bgcolor: "rgba(0,0,0,0.22)",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {renderPreview()}
      </Box>
      <Typography
        variant="caption"
        sx={{
          mt: 1.5,
          display: "block",
          fontSize: 10,
          fontWeight: 600,
          color: "#8c8c8c",
          textTransform: "none",
          letterSpacing: "0",
          lineHeight: 1.5,
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAd, setDeletingAd] = useState<Advertisement | null>(null);

  const [formData, setFormData] = useState({
    type: "affiliate",
    title: "",
    imageUrl: "",
    linkUrls: [""],
    content: "",
    placement: "grid",
    repeatCount: 1,
    isActive: false,
    targetDevice: "all",
  });

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/advertisements?all=true");
      if (!res.ok) throw new Error("โหลดโฆษณาไม่สำเร็จ");
      const data = await res.json();
      setAds(data);
    } catch (err) {
      console.error(err);
      setError("โหลดโฆษณาไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Pagination
  const filteredAds = useMemo(() => ads.filter((ad) =>
    ad.title.toLowerCase().includes(search.trim().toLowerCase()) &&
    (statusFilter === "all" || ad.isActive === (statusFilter === "active")) &&
    (placementFilter === "all" || ad.placement === placementFilter) &&
    (deviceFilter === "all" || ad.targetDevice === deviceFilter)
  ), [ads, search, statusFilter, placementFilter, deviceFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredAds.length / ITEMS_PER_PAGE));
  useEffect(() => { setPage(1); }, [search, statusFilter, placementFilter, deviceFilter]);
  useEffect(() => { setPage((current) => Math.min(current, totalPages)); }, [totalPages]);
  const paginatedAds = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredAds.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAds, page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleOpenDialog = (ad?: Advertisement) => {
    setLinkErrors({});
    setError(null);
    if (ad) {
      setEditingAd(ad);
      setFormData({
        type: ad.type,
        title: ad.title,
        imageUrl: ad.imageUrl,
        linkUrls: getAdvertisementLinks(ad).length ? getAdvertisementLinks(ad) : [""],
        content: ad.content || "",
        placement: ad.placement,
        repeatCount: ad.repeatCount || 1,
        isActive: ad.isActive,
        targetDevice: ad.targetDevice || "all",
      });
      setPreviewUrl(ad.imageUrl);
    } else {
      setEditingAd(null);
      setFormData({
        type: "affiliate",
        title: "",
        imageUrl: "",
        linkUrls: [""],
        content: "",
        placement: "grid",
        repeatCount: 1,
        isActive: false,
        targetDevice: "all",
      });
      setPreviewUrl(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving || uploading) return;
    setDialogOpen(false);
    setEditingAd(null);
    setError(null);
    setPreviewUrl(null);
  };

  const handleDuplicate = (ad: Advertisement) => {
    handleOpenDialog(ad);
    setEditingAd(null);
    setFormData((current) => ({ ...current, title: `${ad.title} (สำเนา)`, isActive: false }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setPreviewUrl(null);

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
    if (saving || uploading) return;
    if (!formData.imageUrl) {
      setError("กรุณาอัพโหลดรูปภาพ");
      return;
    }

    const linkUrls = formData.linkUrls.map((link) => link.trim()).filter(Boolean);
    const invalidLinks: Record<number, string> = {};
    formData.linkUrls.forEach((link, index) => {
      if (link.trim() && !normalizeAdvertisementLink(link)) invalidLinks[index] = "ใช้ URL ที่ขึ้นต้นด้วย https:// หรือ http:// และไม่มีช่องว่าง";
    });
    setLinkErrors(invalidLinks);
    if (Object.keys(invalidLinks).length) {
      setError("กรุณาตรวจสอบลิงก์ปลายทางก่อนบันทึก");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const url = editingAd
        ? `/api/advertisements/${editingAd.id}`
        : "/api/advertisements";
      const method = editingAd ? "PATCH" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, linkUrls }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "บันทึกโฆษณาไม่สำเร็จ");
      }
      setDialogOpen(false);
      setError(null);
      fetchAds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    setBusyId(ad.id);
    try {
      const res = await authFetch(`/api/advertisements/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      if (!res.ok) throw new Error("เปลี่ยนสถานะไม่สำเร็จ");
      fetchAds();
    } catch (err) {
      console.error(err);
      setError("เปลี่ยนสถานะโฆษณาไม่สำเร็จ");
    } finally {
      setBusyId(null);
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
    setBusyId(deletingAd.id);
    try {
      const res = await authFetch(`/api/advertisements/${deletingAd.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("ลบโฆษณาไม่สำเร็จ");
      fetchAds();
      handleCloseDeleteDialog();
    } catch (err) {
      console.error(err);
      setError("ลบโฆษณาไม่สำเร็จ");
    } finally {
      setBusyId(null);
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
            ...dashboardPrimaryButtonSx,
            borderRadius: dashboardRadii.button,
            px: 3,
            height: 44,
            textTransform: "none",
            letterSpacing: "0",
          }}
        >
          {isMobile ? "เพิ่ม" : "สร้างโฆษณา"}
        </Button>
      </Box>

      {error && !dialogOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, minHeight: 56 }}>
        <Tooltip title="รีเฟรชโฆษณาและสถิติ"><IconButton aria-label="รีเฟรชโฆษณาและสถิติ" onClick={fetchAds} disabled={loading}>{loading ? <CircularProgress size={20} /> : <RefreshIcon />}</IconButton></Tooltip>
        <TextField label="ค้นหาโฆษณา" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: "1 1 200px" }} />
        <FormControl size="small" sx={{ minWidth: 145 }}>
          <InputLabel>สถานะ</InputLabel>
          <Select label="สถานะ" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">ทุกสถานะ</MenuItem><MenuItem value="active">เปิดใช้งาน</MenuItem><MenuItem value="draft">ฉบับร่าง</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 145 }}>
          <InputLabel>ตำแหน่ง</InputLabel>
          <Select label="ตำแหน่ง" value={placementFilter} onChange={(e) => setPlacementFilter(e.target.value)}>
            <MenuItem value="all">ทุกตำแหน่ง</MenuItem>{PLACEMENTS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 145 }}>
          <InputLabel>อุปกรณ์</InputLabel>
          <Select label="อุปกรณ์" value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
            <MenuItem value="all">ทุกอุปกรณ์</MenuItem><MenuItem value="mobile">มือถือ</MenuItem><MenuItem value="desktop">Desktop</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {/* Mobile: Card layout */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {paginatedAds.map((ad) => (
            <Paper
              key={ad.id}
              sx={{
                bgcolor: dashboardTokens.surface,
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
                      disabled={busyId === ad.id}
                      onChange={() => handleToggleActive(ad)}
                      size="small"
                    />
                    <Box>
                      <Tooltip title="ทำสำเนา"><IconButton aria-label="ทำสำเนา" size="small" onClick={() => handleDuplicate(ad)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
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
                  <Typography variant="caption" sx={{ display: "block", color: maggaColors.textSecondary }}>
                    {ad.isActive ? "เปิดใช้งาน" : "ฉบับร่าง"} · {ad.targetDevice === "mobile" ? "มือถือ" : ad.targetDevice === "desktop" ? "Desktop" : "ทุกอุปกรณ์"}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: maggaColors.textSecondary }}>
                    เห็น {(ad.impressions || 0).toLocaleString()} · คลิก {(ad.clicks || 0).toLocaleString()} · CTR {adCtr(ad.impressions || 0, ad.clicks || 0)}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
          {filteredAds.length === 0 && (
            <Box sx={{ py: 8, textAlign: "center", bgcolor: dashboardTokens.surface, borderRadius: 1.25, border: "1px solid rgba(255,255,255,0.06)" }}>
              <Typography sx={{ fontWeight: 700, color: "#737373", textTransform: "none", letterSpacing: "0" }}>
                ไม่พบโฆษณา
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* Desktop: Table layout */
        <TableContainer 
          component={Paper} 
          sx={{ 
            bgcolor: dashboardTokens.surface,
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
                  <TableCell>
                    {ad.title}
                    <Typography variant="caption" sx={{ display: "block", color: maggaColors.textSecondary }}>
                      {ad.isActive ? "เปิดใช้งาน" : "ฉบับร่าง"} · {ad.targetDevice === "mobile" ? "มือถือ" : ad.targetDevice === "desktop" ? "Desktop" : "ทุกอุปกรณ์"}
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: maggaColors.textSecondary }}>
                      เห็น {(ad.impressions || 0).toLocaleString()} · คลิก {(ad.clicks || 0).toLocaleString()} · CTR {adCtr(ad.impressions || 0, ad.clicks || 0)}%
                    </Typography>
                  </TableCell>
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
                        fontSize: "0.7rem",
                        borderRadius: dashboardRadii.compact,
                        bgcolor: dashboardTokens.accentSoft,
                        color: dashboardTokens.accent,
                        border: `1px solid ${dashboardTokens.accentSoft}`,
                        textTransform: "none"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={ad.isActive}
                      disabled={busyId === ad.id}
                      onChange={() => handleToggleActive(ad)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: dashboardTokens.accent },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: dashboardTokens.accent }
                      }}
                    />
                 </TableCell>
                  <TableCell align="right">
                    <Tooltip title="ทำสำเนา"><IconButton aria-label="ทำสำเนา" onClick={() => handleDuplicate(ad)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <IconButton
                      onClick={() => handleOpenDialog(ad)}
                      sx={{ color: dashboardTokens.textMuted, "&:hover": { color: dashboardTokens.accent } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDeleteDialog(ad)}
                      sx={{ color: dashboardTokens.textMuted, "&:hover": { color: "#ef4444" } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography sx={{
                      color: "text.secondary"
                    }}>ไม่พบโฆษณา</Typography>
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
              "& .MuiPaginationItem-root": { color: dashboardTokens.textMuted, fontWeight: 700 },
              "& .Mui-selected": { bgcolor: `${dashboardTokens.accent} !important`, color: "#0f0f14 !important" }
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
        slotProps={{
          paper: {
            sx: {
              bgcolor: dashboardTokens.surface,
              color: "#fafafa",
              borderRadius: isMobile ? 0 : 1.25,
              border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
              backgroundImage: "none",
              boxShadow: "none"
            },
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, textTransform: "none", letterSpacing: "0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
            <Typography sx={{ color: dashboardTokens.accent, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Ad Workspace
            </Typography>
            <Typography component="span" sx={{ fontWeight: 900, fontSize: { xs: "1.2rem", md: "1.35rem" }, color: "#fafafa" }}>
              {editingAd ? "แก้ไขโฆษณา" : "เพิ่มโฆษณาใหม่"}
            </Typography>
            <Typography component="span" sx={{ color: "#8c8c8c", fontWeight: 600, fontSize: "0.78rem" }}>
              จัดรูปภาพ ลิงก์ และตำแหน่งให้พร้อมใช้งานจากฟอร์มเดียว
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.25, mt: 0.5 }}>
            {/* Left: Form */}
            <Box sx={{ flex: 1, minWidth: 0, ...adDialogPanelSx, p: { xs: 1.5, md: 2 } }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: "#fafafa", fontWeight: 800, fontSize: "0.95rem" }}>
                  รายละเอียดโฆษณา
                </Typography>
                <Typography sx={{ color: "#8c8c8c", fontWeight: 600, fontSize: "0.74rem", mt: 0.35 }}>
                  กำหนดชนิด ชื่อ ภาพปลายทาง และการวางตำแหน่งให้ชัดก่อนบันทึก
                </Typography>
              </Box>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1.25, bgcolor: "rgba(127,29,29,0.28)", color: "#fecaca", border: "1px solid rgba(239,68,68,0.22)" }}>
                  {error}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={adDialogFieldSx["& .MuiInputLabel-root"]}>ประเภท</InputLabel>
                <Select
                  value={formData.type}
                  label="ประเภท"
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  sx={adDialogFieldSx}
                  MenuProps={adDialogSelectMenuProps}
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
                sx={{ mb: 2, ...adDialogFieldSx }}
                helperText="ใช้สำหรับจัดการภายใน ผู้ใช้จะไม่เห็นข้อความนี้"
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
                      <CircularProgress size={20} sx={{ color: dashboardTokens.accent }} />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{
                    py: 1.8,
                    borderRadius: 1.25,
                    border: "1px dashed rgba(255,255,255,0.16)",
                    bgcolor: "rgba(255,255,255,0.02)",
                    color: formData.imageUrl ? "#f7d27a" : "#d4d4d4",
                    fontWeight: 800,
                    textTransform: "none",
                    letterSpacing: "0",
                    justifyContent: "flex-start",
                    px: 2,
                    gap: 1,
                    "&:hover": {
                      border: "1px dashed rgba(251,191,36,0.5)",
                      color: "#fbbf24",
                      bgcolor: "rgba(251,191,36,0.05)",
                    },
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
                    sx={{ mt: 1, display: "block", color: "#86efac", fontWeight: 800, textTransform: "none", fontSize: "0.66rem" }}
                  >
                    ✓ อัปโหลดรูปเรียบร้อย
                  </Typography>
                )}
              </Box>

              <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, mb: 2, minWidth: 0 }}>
                <Typography component="legend" sx={{ color: maggaColors.textPrimary, fontWeight: 700, fontSize: "0.875rem", mb: 1 }}>
                  ลิงก์ปลายทาง
                </Typography>
                <Typography id="ad-links-help" sx={{ color: maggaColors.textSecondary, fontSize: "0.75rem", mb: 2 }}>
                  สุ่มเปิด 1 ลิงก์ต่อคลิก โดยแต่ละลิงก์มีโอกาสเท่ากัน เพิ่มได้สูงสุด 20 ลิงก์ หรือเว้นว่างเพื่อแสดงภาพอย่างเดียว
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {formData.linkUrls.map((link, index) => (
                    <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: 1, minWidth: 0 }}>
                      <TextField
                        id={`ad-destination-${index + 1}`}
                        name={`linkUrls[${index}]`}
                        fullWidth
                        type="url"
                        label={`ลิงก์ปลายทาง ${index + 1}`}
                        value={link}
                        disabled={saving || uploading}
                        error={Boolean(linkErrors[index])}
                        helperText={linkErrors[index]}
                        slotProps={{ htmlInput: { "aria-describedby": linkErrors[index] ? `ad-destination-${index + 1}-helper-text ad-links-help` : "ad-links-help", maxLength: 2048, inputMode: "url" } }}
                        onBlur={() => setLinkErrors((current) => ({ ...current, [index]: link.trim() && !normalizeAdvertisementLink(link) ? "ใช้ URL ที่ขึ้นต้นด้วย https:// หรือ http:// และไม่มีช่องว่าง" : "" }))}
                        onChange={(e) => {
                          setFormData((current) => ({ ...current, linkUrls: current.linkUrls.map((value, position) => position === index ? e.target.value : value) }));
                          setLinkErrors((current) => ({ ...current, [index]: "" }));
                        }}
                        sx={adDialogFieldSx}
                      />
                      <IconButton
                        aria-label={`ลบลิงก์ปลายทาง ${index + 1}`}
                        disabled={saving || uploading}
                        onClick={() => {
                          setFormData((current) => ({ ...current, linkUrls: current.linkUrls.length === 1 ? [""] : current.linkUrls.filter((_, position) => position !== index) }));
                          setLinkErrors({});
                        }}
                        sx={{ width: 44, height: 44, mt: 0.75, flexShrink: 0, color: maggaColors.textSecondary, "&:hover": { color: maggaColors.archiveGoldHover }, "&:focus-visible": { outline: `2px solid ${maggaColors.archiveGoldHover}`, outlineOffset: 2 } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Button
                  startIcon={<AddIcon />}
                  disabled={saving || uploading || formData.linkUrls.length >= maxAdvertisementLinks}
                  onClick={() => setFormData((current) => ({ ...current, linkUrls: [...current.linkUrls, ""] }))}
                  sx={{ mt: 1, minHeight: 44, color: maggaColors.archiveGoldHover, textTransform: "none" }}
                >
                  เพิ่มลิงก์ ({formData.linkUrls.length}/{maxAdvertisementLinks})
                </Button>
              </Box>

              <TextField
                fullWidth
                label="เนื้อหาเพิ่มเติม / หมายเหตุ"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                sx={{ mb: 2, ...adDialogFieldSx }}
                multiline
                rows={2}
                placeholder="เช่น เลขพร้อมเพย์ หรือคำอธิบาย"
              />

              <FormControl fullWidth>
                <InputLabel sx={adDialogFieldSx["& .MuiInputLabel-root"]}>ตำแหน่ง</InputLabel>
                <Select
                  value={formData.placement}
                  label="ตำแหน่ง"
                  onChange={(e) =>
                    setFormData({ ...formData, placement: e.target.value })
                  }
                  sx={adDialogFieldSx}
                  MenuProps={adDialogSelectMenuProps}
                >
                  {PLACEMENTS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>อุปกรณ์</InputLabel>
                <Select label="อุปกรณ์" value={formData.targetDevice} sx={adDialogFieldSx} disabled={saving} onChange={(e) => setFormData((current) => ({ ...current, targetDevice: e.target.value }))}>
                  <MenuItem value="all">ทุกอุปกรณ์</MenuItem><MenuItem value="mobile">มือถือ</MenuItem><MenuItem value="desktop">Desktop</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel sx={{ mt: 1 }} label="เปิดใช้งาน" control={<Switch checked={formData.isActive} disabled={saving} onChange={(e) => setFormData((current) => ({ ...current, isActive: e.target.checked }))} />} />
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
                  sx={{ mt: 2, ...adDialogFieldSx }}
                  helperText="จำนวนครั้งที่โฆษณานี้จะแทรกในกริดมังงะ (1-10)"
                  slotProps={{
                    htmlInput: { min: 1, max: 10 }
                  }}
                />
              )}
            </Box>

            {/* Right: Preview */}
            <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0, ...adDialogPanelSx, p: { xs: 1.5, md: 2 } }}>
              <Typography sx={{ color: "#fafafa", fontWeight: 800, fontSize: "0.95rem", mb: 0.5 }}>
                ตัวอย่างตำแหน่ง
              </Typography>
              <Typography sx={{ color: "#8c8c8c", fontWeight: 600, fontSize: "0.74rem", mb: 1.75 }}>
                ดูจังหวะการวางคร่าวๆ ก่อนสร้างจริง เพื่อเช็กสัดส่วนและพื้นที่ใช้งาน
              </Typography>
              <PlacementPreview
                placement={formData.placement}
                imageUrl={previewUrl || undefined}
                title={formData.title || undefined}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.015)" }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              color: "#d4d4d4",
              fontWeight: 800,
              textTransform: "none",
              borderRadius: 1,
              px: 2.2,
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
            }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={uploading || saving}
            sx={{
              ...dashboardPrimaryButtonSx,
              px: 4,
              borderRadius: dashboardRadii.button,
            }}
          >
            {saving ? "กำลังบันทึก..." : formData.isActive ? "บันทึกและเปิดใช้งาน" : "บันทึกฉบับร่าง"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: dashboardTokens.surface,
              borderRadius: 1.25,
              border: `1px solid ${dashboardTokens.border}`,
              backgroundImage: "none"
            },
          }
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
