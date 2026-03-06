"use client";

import { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Breadcrumbs,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import EditIcon from "@mui/icons-material/Edit";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

interface ProfileUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  email: string | null;
  createdAt: Date;
  role: string;
}

interface Props {
  profileUser: ProfileUser;
  isOwnProfile: boolean;
}

function formatJoinDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));

  const dateStr = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (diffYears >= 1) {
    return `${dateStr} (${diffYears} ปีที่แล้ว)`;
  } else if (diffMonths >= 1) {
    return `${dateStr} (${diffMonths} เดือนที่แล้ว)`;
  }
  return `${dateStr}`;
}

const rowSx = {
  display: "flex",
  alignItems: "center",
  p: 2,
  bgcolor: "#171717",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 2,
  textDecoration: "none",
  color: "inherit",
  transition: "border-color 0.2s, background-color 0.2s",
  "&:hover": {
    borderColor: "rgba(251,191,36,0.3)",
    bgcolor: "#1e1e1e",
  },
};

export default function ProfileView({ profileUser, isOwnProfile }: Props) {
  const displayName = profileUser.name || profileUser.username || "ผู้ใช้";
  const joinDate = formatJoinDate(profileUser.createdAt);

  const [avatarSrc, setAvatarSrc] = useState(profileUser.image || "");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    setUploadError("");
    setPreviewFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!previewFile) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", previewFile);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัพโหลดไม่สำเร็จ");
      setAvatarSrc(data.imageUrl);
      setPreviewSrc(null);
      setPreviewFile(null);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }, [previewFile]);

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: "#a3a3a3" }} />}
        sx={{ mb: 3, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", color: "#fbbf24", textDecoration: "none", fontSize: "0.875rem" }}>
          <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
          หน้าแรก
        </Link>
        <Typography sx={{ color: "#a3a3a3", fontSize: "0.875rem" }}>ฉัน</Typography>
        <Typography sx={{ color: "#fafafa", fontSize: "0.875rem" }}>โปรไฟล์</Typography>
      </Breadcrumbs>

      {/* Profile Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4 }}>
        {/* Clickable avatar for own profile */}
        <Box
          sx={{ position: "relative", flexShrink: 0, cursor: isOwnProfile ? "pointer" : "default" }}
          onClick={() => isOwnProfile && fileInputRef.current?.click()}
        >
          <Avatar
            src={avatarSrc || undefined}
            alt={displayName}
            sx={{
              width: 88,
              height: 88,
              bgcolor: "#262626",
              border: "2px solid rgba(255,255,255,0.1)",
              fontSize: "2rem",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          {isOwnProfile && (
            <Box
              sx={{
                position: "absolute", bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: "50%",
                bgcolor: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #0a0a0a",
              }}
            >
              <CameraAltIcon sx={{ fontSize: 14, color: "#000" }} />
            </Box>
          )}
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="h5" fontWeight={700}>
              {displayName}
            </Typography>
            {profileUser.role === "admin" && (
              <Chip
                label="Admin"
                size="small"
                sx={{
                  bgcolor: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            สมาชิกตั้งแต่ {joinDate}
          </Typography>
          {profileUser.username && (
            <Typography variant="caption" sx={{ color: "#737373" }}>
              @{profileUser.username}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Action Rows - only for own profile */}
      {isOwnProfile && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            component={Link}
            href="/settings"
            sx={rowSx}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(251,191,36,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                flexShrink: 0,
              }}
            >
              <CameraAltIcon sx={{ color: "#fbbf24", fontSize: 20 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: "#fbbf24", display: "block", lineHeight: 1.3 }}>
                รูปโปรไฟล์
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ตั้งรูปโปรไฟล์
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "#a3a3a3" }} />
          </Box>

          <Box
            component={Link}
            href="/settings"
            sx={rowSx}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(251,191,36,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                flexShrink: 0,
              }}
            >
              <EditIcon sx={{ color: "#fbbf24", fontSize: 20 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: "#fbbf24", display: "block", lineHeight: 1.3 }}>
                ข้อมูลโปรไฟล์
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                แก้ไขโปรไฟล์
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "#a3a3a3" }} />
          </Box>

          <Box
            component={Link}
            href={`/profile/${profileUser.username}/comments`}
            sx={rowSx}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(94,234,212,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                flexShrink: 0,
              }}
            >
              <ChatBubbleOutlineIcon sx={{ color: "#5eead4", fontSize: 20 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>
                ประวัติ
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ความคิดเห็นทั้งหมด
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "#a3a3a3" }} />
          </Box>
        </Box>
      )}

      {/* Public view - show nothing extra for other users */}
      {!isOwnProfile && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: "#737373", fontStyle: "italic" }}>
            ดูข้อมูลสาธารณะของสมาชิกคนนี้
          </Typography>
        </Box>
      )}

      {/* Avatar Preview & Confirm Dialog */}
      <Dialog
        open={Boolean(previewSrc)}
        onClose={() => !uploading && (setPreviewSrc(null), setPreviewFile(null))}
        PaperProps={{ sx: { bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>ยืนยันการเปลี่ยนรูปโปรไฟล์</DialogTitle>
        <DialogContent>
          {previewSrc && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Avatar
                src={previewSrc}
                alt="preview"
                sx={{ width: 120, height: 120, border: "3px solid rgba(251,191,36,0.4)" }}
              />
              <Typography variant="body2" sx={{ color: "#a3a3a3", textAlign: "center" }}>
                หลังจากยืนยันแล้ว รูปโปรไฟล์จะถูกอัปเดตทันที
                <br />
                <Typography component="span" variant="caption" sx={{ color: "#f87171" }}>
                  (ไม่สามารถย้อนกลับได้ ต้องอัพโหลดใหม่เพื่อเปลี่ยน)
                </Typography>
              </Typography>
              {uploadError && (
                <Typography variant="body2" sx={{ color: "#f87171" }}>{uploadError}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => { setPreviewSrc(null); setPreviewFile(null); }}
            disabled={uploading}
            sx={{ color: "#a3a3a3" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmUpload}
            disabled={uploading}
            sx={{ bgcolor: "#fbbf24", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#f59e0b" } }}
          >
            {uploading ? <CircularProgress size={18} sx={{ color: "#555" }} /> : "ยืนยันเปลี่ยนรูป"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
