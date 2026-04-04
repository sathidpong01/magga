"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import Link from "next/link";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import EditIcon from "@mui/icons-material/Edit";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import GoogleIcon from "@mui/icons-material/Google";
import { syncClientSession } from "@/lib/auth-client";
import { useToast } from "@/app/contexts/ToastContext";

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
  }

  if (diffMonths >= 1) {
    return `${dateStr} (${diffMonths} เดือนที่แล้ว)`;
  }

  return dateStr;
}

const rowSx = {
  display: "flex",
  alignItems: "center",
  p: 2.1,
  bgcolor: "#151515",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 3,
  textDecoration: "none",
  color: "inherit",
  transition: "border-color 0.2s, background-color 0.2s, transform 0.2s",
  "&:hover": {
    borderColor: "rgba(251,191,36,0.28)",
    bgcolor: "#1b1b1b",
    transform: "translateY(-1px)",
  },
};

export default function ProfileView({ profileUser, isOwnProfile }: Props) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const displayName = profileUser.name || profileUser.username || "ผู้ใช้";
  const joinDate = formatJoinDate(profileUser.createdAt);
  const profileSlug = profileUser.username || profileUser.id;

  const [avatarSrc, setAvatarSrc] = useState(profileUser.image || "");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }

    setUploadError("");
    setPreviewFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!previewFile) {
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const form = new FormData();
      form.append("file", previewFile);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "อัพโหลดไม่สำเร็จ");
      }

      setAvatarSrc(data.imageUrl);
      await syncClientSession();
      router.refresh();
      showSuccess("อัปเดตรูปโปรไฟล์แล้ว");
      setPreviewSrc(null);
      setPreviewFile(null);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }, [previewFile, router, showSuccess]);

  return (
    <Box>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: "#a3a3a3" }} />}
        sx={{ mb: 3, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", color: "#fbbf24", textDecoration: "none", fontSize: "0.875rem" }}
        >
          <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
          หน้าแรก
        </Link>
        <Typography sx={{ color: "#a3a3a3", fontSize: "0.875rem" }}>
          {isOwnProfile ? "ฉัน" : displayName}
        </Typography>
        <Typography sx={{ color: "#fafafa", fontSize: "0.875rem" }}>โปรไฟล์</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          mb: 3,
          borderRadius: 5,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 28%, rgba(255,255,255,0.02) 100%)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: { xs: 2.8, sm: 3.5 }, pb: { xs: 2.4, sm: 3 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2.5, alignItems: { xs: "flex-start", sm: "center" } }}>
            <Box
              sx={{ position: "relative", flexShrink: 0, cursor: isOwnProfile ? "pointer" : "default" }}
              onClick={() => isOwnProfile && fileInputRef.current?.click()}
            >
              <Avatar
                src={avatarSrc || undefined}
                alt={displayName}
                sx={{
                  width: 104,
                  height: 104,
                  bgcolor: "#262626",
                  border: "2px solid rgba(255,255,255,0.12)",
                  fontSize: "2.25rem",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              {isOwnProfile && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    bgcolor: "#fbbf24",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #0a0a0a",
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 15, color: "#000" }} />
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

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
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
                      height: 22,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>

              <Typography variant="body2" sx={{ color: "#9b9b9b", lineHeight: 1.8, maxWidth: 520 }}>
                {isOwnProfile
                  ? "จัดการตัวตน บัญชีที่เชื่อมต่อ และประวัติการใช้งานของคุณจากพื้นที่เดียว"
                  : "พื้นที่โปรไฟล์สาธารณะของสมาชิกคนนี้"}
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {profileUser.username && (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.3,
                      py: 0.75,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: "#fbbf24" }} />
                    <Typography variant="caption" sx={{ color: "#d4d4d4", fontWeight: 600 }}>
                      @{profileUser.username}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.3,
                    py: 0.75,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: "#5eead4" }} />
                  <Typography variant="caption" sx={{ color: "#d4d4d4", fontWeight: 600 }}>
                    สมาชิกตั้งแต่ {joinDate}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {isOwnProfile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box component={Link} href="/settings?section=name" sx={rowSx}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.2,
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
                โปรไฟล์
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ตั้งชื่อแสดงและรายละเอียดบัญชี
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "#a3a3a3" }} />
          </Box>

          <Box component={Link} href="/settings?section=linked" sx={rowSx}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.2,
                bgcolor: "rgba(251,191,36,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                flexShrink: 0,
              }}
            >
              <GoogleIcon sx={{ color: "#fbbf24", fontSize: 20 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: "#fbbf24", display: "block", lineHeight: 1.3 }}>
                การเข้าสู่ระบบ
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                จัดการ Google และความปลอดภัย
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ color: "#a3a3a3" }} />
          </Box>

          <Box component={Link} href={`/profile/${profileSlug}/comments`} sx={rowSx}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.2,
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
      ) : (
        <Box sx={{ mt: 2, px: 0.5 }}>
          <Typography variant="body2" sx={{ color: "#737373" }}>
            โปรไฟล์นี้แสดงข้อมูลสาธารณะของสมาชิกเท่านั้น
          </Typography>
        </Box>
      )}

      <Dialog
        open={Boolean(previewSrc)}
        onClose={() => !uploading && (setPreviewSrc(null), setPreviewFile(null))}
        PaperProps={{
          sx: {
            bgcolor: "#171717",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fafafa",
            maxWidth: 360,
            borderRadius: 4,
          },
        }}
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
                <Typography variant="body2" sx={{ color: "#f87171" }}>
                  {uploadError}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPreviewSrc(null);
              setPreviewFile(null);
            }}
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
