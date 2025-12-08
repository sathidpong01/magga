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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Image from "next/image";

interface Advertisement {
  id: string;
  type: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  content: string | null;
  placement: string;
  isActive: boolean;
}

const PLACEMENTS = [
  { value: "grid", label: "แทรกใน Grid" },
  { value: "header", label: "ใต้ Header" },
  { value: "footer", label: "เหนือ Footer" },
  { value: "manga-end", label: "ท้ายหน้าอ่าน" },
  { value: "floating", label: "มุมขวาล่าง" },
  { value: "modal", label: "Pop-up Modal" },
];

const TYPES = [
  { value: "affiliate", label: "Affiliate Link" },
  { value: "promptpay", label: "PromptPay QR" },
];

// Placement Preview Component - แสดงตัวอย่างตรงกับของจริง (ไม่แสดง title)
function PlacementPreview({ placement, imageUrl }: { placement: string; imageUrl?: string; title?: string }) {
  const previewImage = imageUrl || null;
  
  const renderPreview = () => {
    switch (placement) {
      // Grid: เหมือน MangaCard - รูปเต็มเฟรม height 400px
      case "grid":
        return (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Skeleton variant="rectangular" width={70} height={100} sx={{ borderRadius: 0.5 }} />
            <Card sx={{ 
              width: 70, 
              height: 100, 
              bgcolor: "#171717", 
              borderRadius: 0.5, 
              overflow: "hidden", 
              position: "relative",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              {previewImage ? (
                <Image src={previewImage} alt="" fill style={{ objectFit: "cover" }} />
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#262626" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 8 }}>AD</Typography>
                </Box>
              )}
            </Card>
            <Skeleton variant="rectangular" width={70} height={100} sx={{ borderRadius: 0.5 }} />
          </Box>
        );
      
      // Header: รูปแนวนอน auto-ratio max-height 150px ไม่มีกรอบ
      case "header":
        return (
          <Box sx={{ width: "100%" }}>
            <Skeleton variant="rectangular" height={30} sx={{ mb: 1, borderRadius: 0.5 }} />
            <Box sx={{ 
              bgcolor: "transparent", 
              display: "flex", 
              justifyContent: "center",
              mb: 1
            }}>
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
                    borderRadius: 0.5
                  }}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 0.5 }} />
              )}
            </Box>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 0.5 }} />
          </Box>
        );
      
      // Footer: เหมือน Header
      case "footer":
        return (
          <Box sx={{ width: "100%" }}>
            <Skeleton variant="rectangular" height={80} sx={{ mb: 1, borderRadius: 0.5 }} />
            <Box sx={{ 
              bgcolor: "transparent", 
              display: "flex", 
              justifyContent: "center",
              mb: 1
            }}>
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
                    borderRadius: 0.5
                  }}
                />
              ) : (
                <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 0.5 }} />
              )}
            </Box>
            <Skeleton variant="rectangular" height={25} sx={{ borderRadius: 0.5 }} />
          </Box>
        );
      
      // Manga-end: เหมือน Header/Footer
      case "manga-end":
        return (
          <Box sx={{ width: "100%" }}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 0.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mb: 1 }}>จบตอน</Typography>
            <Box sx={{ 
              bgcolor: "transparent", 
              display: "flex", 
              justifyContent: "center"
            }}>
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
                    borderRadius: 0.5
                  }}
                />
              ) : (
                <Skeleton variant="rectangular" width="80%" height={50} sx={{ borderRadius: 0.5 }} />
              )}
            </Box>
          </Box>
        );
      
      // Floating: รูปแนวตั้ง max-width 200px ไม่แสดง title
      case "floating":
        return (
          <Box sx={{ width: "100%", height: 160, position: "relative", bgcolor: "#1a1a1a", borderRadius: 0.5 }}>
            <Skeleton variant="rectangular" sx={{ position: "absolute", top: 8, left: 8, right: 8, height: 80, borderRadius: 0.5 }} />
            <Paper sx={{ 
              position: "absolute", 
              bottom: 8, 
              right: 8, 
              width: 80, 
              bgcolor: "#171717", 
              borderRadius: 1, 
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{ 
                    width: "100%", 
                    height: "auto",
                    display: "block"
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
          <Box sx={{ width: "100%", height: 160, position: "relative", bgcolor: "rgba(0,0,0,0.6)", borderRadius: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Paper sx={{ 
              maxWidth: 120, 
              bgcolor: "transparent", 
              borderRadius: 1, 
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }}>
              {previewImage ? (
                <Box
                  component="img"
                  src={previewImage}
                  alt=""
                  sx={{ 
                    width: "100%", 
                    height: "auto",
                    maxHeight: 120,
                    display: "block"
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
    <Box sx={{ p: 2, bgcolor: "#0a0a0a", borderRadius: 1, border: "1px solid rgba(255,255,255,0.1)" }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        ตัวอย่าง: {PLACEMENTS.find(p => p.value === placement)?.label || "เลือกตำแหน่ง"}
      </Typography>
      {renderPreview()}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", fontSize: 10 }}>
        * ชื่อโฆษณาจะไม่แสดงให้ผู้ใช้เห็น (ใช้สำหรับ admin เท่านั้น)
      </Typography>
    </Box>
  );
}


const ITEMS_PER_PAGE = 10;

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: "affiliate",
    title: "",
    imageUrl: "",
    linkUrl: "",
    content: "",
    placement: "grid",
  });

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch("/api/advertisements?all=true");
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

      const res = await fetch("/api/advertisements/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
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
      const url = editingAd ? `/api/advertisements/${editingAd.id}` : "/api/advertisements";
      const method = editingAd ? "PATCH" : "POST";

      const res = await fetch(url, {
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
      await fetch(`/api/advertisements/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (ad: Advertisement) => {
    if (!confirm(`ลบโฆษณา "${ad.title}" ?`)) return;
    try {
      await fetch(`/api/advertisements/${ad.id}`, { method: "DELETE" });
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          จัดการโฆษณา
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          เพิ่มโฆษณา
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: "#171717" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>รูป</TableCell>
              <TableCell>ชื่อ</TableCell>
              <TableCell>ประเภท</TableCell>
              <TableCell>ตำแหน่ง</TableCell>
              <TableCell>เปิดใช้งาน</TableCell>
              <TableCell align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAds.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell>
                  <Box sx={{ width: 60, height: 60, position: "relative", borderRadius: 0.5, overflow: "hidden" }}>
                    <Image src={ad.imageUrl} alt={ad.title} fill style={{ objectFit: "cover" }} />
                  </Box>
                </TableCell>
                <TableCell>{ad.title}</TableCell>
                <TableCell>
                  <Chip label={TYPES.find((t) => t.value === ad.type)?.label || ad.type} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={ad.isActive} onChange={() => handleToggleActive(ad)} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(ad)} aria-label="แก้ไข">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(ad)} color="error" aria-label="ลบ">
                    <DeleteIcon />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit Dialog - Split Layout */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAd ? "แก้ไขโฆษณา" : "เพิ่มโฆษณา"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
            {/* Left: Form */}
            <Box sx={{ flex: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>ประเภท</InputLabel>
                <Select
                  value={formData.type}
                  label="ประเภท"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{ mb: 2 }}
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
                  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{ py: 2 }}
                >
                  {uploading ? "กำลังอัพโหลด..." : formData.imageUrl ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}
                </Button>
                {formData.imageUrl && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block" }}>
                    ✓ อัพโหลดสำเร็จ
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                label="Affiliate Link"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="ข้อความเพิ่มเติม"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                sx={{ mb: 2 }}
                multiline
                rows={2}
                helperText="เช่น เลข PromptPay หรือคำอธิบาย"
              />

              <FormControl fullWidth>
                <InputLabel>ตำแหน่ง</InputLabel>
                <Select
                  value={formData.placement}
                  label="ตำแหน่ง"
                  onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                >
                  {PLACEMENTS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Right: Preview */}
            <Box sx={{ width: 280, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>ตัวอย่างการแสดงผล</Typography>
              <PlacementPreview 
                placement={formData.placement} 
                imageUrl={previewUrl || undefined} 
                title={formData.title || undefined}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={uploading}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
