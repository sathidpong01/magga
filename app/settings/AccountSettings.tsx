"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  Breadcrumbs,
  Alert,
  IconButton,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import BlockIcon from "@mui/icons-material/Block";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeIcon from "@mui/icons-material/Home";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import WarningIcon from "@mui/icons-material/Warning";
import React from "react";
import Link from "next/link";
import { linkSocial, markPendingSocialAuth, syncClientSession, useSession } from "@/lib/auth-client";
import GoogleIcon from "@mui/icons-material/Google";
import LinkIcon from "@mui/icons-material/Link";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom";
import { validatePassword } from "@/lib/password-validation";
import { useToast } from "@/app/contexts/ToastContext";

interface UserData {
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  commentPreference: string | null;
}

interface Props {
  user: UserData;
  hasPassword: boolean;
  blockedUserCount: number;
  blockedTagCount: number;
  linkedProviders: string[];
}

const inputSx = {
  "& .MuiInputLabel-root": { color: "#a3a3a3" },
  "& .MuiOutlinedInput-root": {
    color: "#fafafa",
    bgcolor: "#202020",
    borderRadius: 3,
    "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
    "&:hover fieldset": { borderColor: "rgba(251,191,36,0.45)" },
    "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
  },
};

const accordionSx = {
  bgcolor: "#151515",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px !important",
  mb: 1.25,
  "&:before": { display: "none" },
  "&.Mui-expanded": { borderColor: "rgba(251,191,36,0.25)" },
  boxShadow: "none",
};

const summarySx = {
  px: 2.5,
  py: 0.75,
  minHeight: 72,
  "& .MuiAccordionSummary-content": { my: 1.5, alignItems: "center", gap: 2 },
};

function RowIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        bgcolor: "rgba(251,191,36,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#fbbf24",
      }}
    >
      {icon}
    </Box>
  );
}

export default function AccountSettings({ user, hasPassword, blockedUserCount, blockedTagCount, linkedProviders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [liveBlockedUserCount, setLiveBlockedUserCount] = useState(blockedUserCount);
  const [liveBlockedTagCount, setLiveBlockedTagCount] = useState(blockedTagCount);
  const [linkedProviderState, setLinkedProviderState] = useState(linkedProviders);
  const initialCommentPrefs = (): Set<string> => {
    const raw = user.commentPreference || 'sidebar';
    return new Set(raw === 'none' ? [] : raw === 'both' ? ['sidebar', 'bottom'] : [raw]);
  };
  const [commentPrefs, setCommentPrefs] = useState<Set<string>>(initialCommentPrefs);
  const [commentPrefSaving, setCommentPrefSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ panel: string; type: "success" | "error"; text: string } | null>(null);
  const [openEmailConfirm, setOpenEmailConfirm] = useState(false);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setExpanded(section);
    }
  }, [searchParams]);

  const syncAfterAccountChange = async (panel: string, text: string) => {
    await syncClientSession();
    router.refresh();
    setMessage({ panel, type: "success", text });
    showSuccess(text);
  };

  const handleAccordion = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
    setMessage(null);
  };

  const handleNameUpdate = async () => {
    setLoading("name");
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเดตไม่สำเร็จ");
      await syncAfterAccountChange("name", "อัปเดตชื่อแสดงสำเร็จ");
    } catch (err: any) {
      setMessage({ panel: "name", type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleUsernameUpdate = async () => {
    setLoading("username");
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเดตไม่สำเร็จ");
      await syncAfterAccountChange("username", "อัปเดตชื่อผู้ใช้สำเร็จ");
    } catch (err: any) {
      setMessage({ panel: "username", type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleEmailUpdate = async () => {
    setLoading("email");
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเดตไม่สำเร็จ");
      await syncAfterAccountChange("email", "อัปเดตอีเมลสำเร็จ");
    } catch (err: any) {
      setMessage({ panel: "email", type: "error", text: err.message });
    } finally {
      setLoading(null);
      setOpenEmailConfirm(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ panel: "password", type: "error", text: "รหัสผ่านไม่ตรงกัน" });
      return;
    }
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      setMessage({ panel: "password", type: "error", text: passwordValidation.errors[0] || "รหัสผ่านไม่ปลอดภัยพอ" });
      return;
    }
    setLoading("password");
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? passwordData.currentPassword : undefined,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเดตไม่สำเร็จ");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      await syncAfterAccountChange("password", hasPassword ? "เปลี่ยนรหัสผ่านสำเร็จ" : "ตั้งรหัสผ่านสำเร็จ");
    } catch (err: any) {
      setMessage({ panel: "password", type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleCommentPrefToggle = async (pref: 'sidebar' | 'bottom') => {
    const next = new Set(commentPrefs);
    if (next.has(pref)) next.delete(pref); else next.add(pref);
    setCommentPrefs(next);
    setCommentPrefSaving(true);
    const value = next.has('sidebar') && next.has('bottom') ? 'both'
      : next.has('sidebar') ? 'sidebar'
      : next.has('bottom') ? 'bottom'
      : 'none';
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentPreference: value }),
      });

      if (!res.ok) {
        throw new Error("บันทึกการตั้งค่าความคิดเห็นไม่สำเร็จ");
      }

      showSuccess("อัปเดตรูปแบบความคิดเห็นแล้ว");
    } catch (error: any) {
      setCommentPrefs(new Set(initialCommentPrefs()));
      showError(error.message || "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setCommentPrefSaving(false);
    }
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: "#a3a3a3" }} />}
        sx={{ mb: 3 }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", color: "#fbbf24", textDecoration: "none", fontSize: "0.875rem" }}>
          <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
          หน้าแรก
        </Link>
        {formData.username ? (
          <Link href={`/profile/${formData.username}`} style={{ color: "#fbbf24", textDecoration: "none", fontSize: "0.875rem" }}>
            ฉัน
          </Link>
        ) : (
          <Typography sx={{ color: "#a3a3a3", fontSize: "0.875rem" }}>ฉัน</Typography>
        )}
        <Typography sx={{ color: "#fafafa", fontSize: "0.875rem" }}>ตั้งค่าบัญชี</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          mb: 4,
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          px: { xs: 2.5, md: 3 },
          py: { xs: 2.5, md: 3 },
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={user.image || undefined}
          alt={formData.name || formData.username || "User"}
          sx={{ width: 56, height: 56, bgcolor: "#262626", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {(formData.name || formData.username || "U").charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.4, mb: 0.4 }}>
            ตั้งค่าบัญชี
          </Typography>
          <Typography variant="body2" sx={{ color: "#a3a3a3" }}>
            จัดการข้อมูลโปรไฟล์ ความปลอดภัย บัญชีที่เชื่อมต่อ และตัวกรองการใช้งานของคุณ
          </Typography>
        </Box>
      </Box>

      {/* ชื่อแสดง */}
      <Accordion expanded={expanded === "name"} onChange={handleAccordion("name")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<PersonIcon fontSize="small" />} />
          <Box>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>ชื่อแสดง</Typography>
            <Typography variant="body1" fontWeight={500}>{formData.name || "ยังไม่ได้ตั้งค่า"}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          {message?.panel === "name" && (
            <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
          )}
          <TextField
            fullWidth
            label="ชื่อแสดง"
            size="small"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            helperText="ชื่อนี้จะแสดงในโปรไฟล์และความคิดเห็น"
            sx={inputSx}
            FormHelperTextProps={{ sx: { color: "#737373" } }}
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleNameUpdate}
              disabled={loading === "name"}
              sx={{ bgcolor: "#fbbf24", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#f59e0b" } }}
            >
              {loading === "name" ? <CircularProgress size={20} sx={{ color: "#555" }} /> : "บันทึก"}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ชื่อผู้ใช้ */}
      <Accordion expanded={expanded === "username"} onChange={handleAccordion("username")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<PersonIcon fontSize="small" />} />
          <Box>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>ชื่อผู้ใช้</Typography>
            <Typography variant="body1" fontWeight={500}>{formData.username || "ยังไม่ได้ตั้งค่า"}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          {message?.panel === "username" && (
            <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
          )}
          <TextField
            fullWidth
            label="ชื่อผู้ใช้ใหม่"
            size="small"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            sx={inputSx}
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleUsernameUpdate}
              disabled={loading === "username"}
              sx={{ bgcolor: "#fbbf24", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#f59e0b" } }}
            >
              {loading === "username" ? <CircularProgress size={20} sx={{ color: "#555" }} /> : "บันทึก"}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* อีเมล */}
      <Accordion expanded={expanded === "email"} onChange={handleAccordion("email")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<EmailIcon fontSize="small" />} />
          <Box>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>อีเมล</Typography>
            <Typography variant="body1" fontWeight={500}>{formData.email || "ยังไม่ได้ตั้งค่า"}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          {message?.panel === "email" && (
            <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
          )}
          <TextField
            fullWidth
            label="อีเมลใหม่"
            type="email"
            size="small"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={inputSx}
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => formData.email !== user.email ? setOpenEmailConfirm(true) : setMessage({ panel: "email", type: "error", text: "อีเมลยังไม่มีการเปลี่ยนแปลง" })}
              disabled={loading === "email"}
              sx={{ bgcolor: "#fbbf24", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#f59e0b" } }}
            >
              เปลี่ยนอีเมล
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* รหัสผ่าน */}
      <Accordion expanded={expanded === "password"} onChange={handleAccordion("password")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<LockIcon fontSize="small" />} />
          <Box>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>รหัสผ่าน</Typography>
            <Typography variant="body1" fontWeight={500}>{hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          {message?.panel === "password" && (
            <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
          )}
          <Box component="form" onSubmit={handlePasswordUpdate} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {hasPassword && (
              <TextField
                fullWidth
                label="รหัสผ่านปัจจุบัน"
                type={showPwd ? "text" : "password"}
                size="small"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                autoComplete="current-password"
                sx={inputSx}
              />
            )}
            <TextField
              fullWidth
              label={hasPassword ? "รหัสผ่านใหม่" : "ตั้งรหัสผ่านใหม่"}
              type={showPwd ? "text" : "password"}
              size="small"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              autoComplete="new-password"
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" sx={{ color: "#a3a3a3" }}>
                      {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="ยืนยันรหัสผ่านใหม่"
              type={showPwd ? "text" : "password"}
              size="small"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              autoComplete="new-password"
              sx={inputSx}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {[
                { label: "8+ ตัวอักษร", ok: passwordData.newPassword.length >= 8 },
                { label: "ตัวพิมพ์ใหญ่", ok: /[A-Z]/.test(passwordData.newPassword) },
                { label: "ตัวพิมพ์เล็ก", ok: /[a-z]/.test(passwordData.newPassword) },
                { label: "ตัวเลข", ok: /[0-9]/.test(passwordData.newPassword) },
              ].map((req) => (
                <Chip
                  key={req.label}
                  label={req.label}
                  size="small"
                  variant={req.ok ? "filled" : "outlined"}
                  sx={{
                    fontSize: "0.7rem",
                    height: 22,
                    ...(req.ok
                      ? { bgcolor: "rgba(34, 197, 94, 0.15)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)" }
                      : { borderColor: "rgba(255,255,255,0.2)", color: "#737373" }),
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading === "password"}
                sx={{ bgcolor: "#fbbf24", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#f59e0b" } }}
              >
                {loading === "password" ? <CircularProgress size={20} sx={{ color: "#555" }} /> : hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* บัญชีที่เชื่อมต่อ */}
      <Accordion expanded={expanded === "linked"} onChange={handleAccordion("linked")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<LinkIcon fontSize="small" />} />
          <Box>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>บัญชีที่เชื่อมต่อ</Typography>
            <Typography variant="body1" fontWeight={500}>
              {linkedProviderState.includes("google") ? "เชื่อมต่อ Google แล้ว" : "เชื่อมต่อกับ Google"}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, bgcolor: "#262626", borderRadius: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <GoogleIcon sx={{ color: linkedProviderState.includes("google") ? "#4285F4" : "#a3a3a3", fontSize: 28 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>Google</Typography>
                <Typography variant="caption" sx={{ color: "#a3a3a3" }}>
                  {linkedProviderState.includes("google") ? "เชื่อมต่อแล้ว — สามารถใช้เข้าสู่ระบบได้" : "ยังไม่ได้เชื่อมต่อ"}
                </Typography>
              </Box>
            </Box>
            {linkedProviderState.includes("google") ? (
              <Chip label="เชื่อมต่อแล้ว" size="small" sx={{ bgcolor: "rgba(66,133,244,0.15)", color: "#4285F4", border: "1px solid rgba(66,133,244,0.3)" }} />
            ) : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkIcon fontSize="small" />}
                onClick={async () => {
                  try {
                    markPendingSocialAuth("/settings");
                    setLinkedProviderState((prev) => prev.includes("google") ? prev : [...prev, "google"]);
                    await linkSocial({ provider: "google", callbackURL: "/settings" });
                  } catch {
                    setLinkedProviderState((prev) => prev.filter((provider) => provider !== "google"));
                    showError("เชื่อมต่อ Google ไม่สำเร็จ");
                  }
                }}
                sx={{ color: "#fbbf24", borderColor: "rgba(251,191,36,0.4)", "&:hover": { borderColor: "#fbbf24", bgcolor: "rgba(251,191,36,0.06)" } }}
              >
                เชื่อมต่อ
              </Button>
            )}
          </Box>
          {linkedProviderState.includes("google") && (
            <Typography variant="caption" sx={{ color: "#a3a3a3", display: "block", mt: 1.5 }}>
              บัญชี Google เชื่อมต่ออยู่แล้ว การเข้าสู่ระบบครั้งต่อไปสามารถใช้ Google ได้โดยไม่ต้องใส่รหัสผ่าน
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ความคิดเห็น */}
      <Accordion expanded={expanded === "comments"} onChange={handleAccordion("comments")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<ChatBubbleIcon fontSize="small" />} />
          <Box>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>ความคิดเห็นการ์ตูน</Typography>
            <Typography variant="body1" fontWeight={500}>
              {commentPrefs.size === 0 ? "ซ่อนทั้งหมด"
                : commentPrefs.size === 2 ? "แสดงทั้งสองแบบ"
                : commentPrefs.has("sidebar") ? "แสดงข้างรูป (ทีละหน้า)"
                : "แสดงท้ายเรื่อง"}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          <Typography variant="body2" sx={{ color: "#a3a3a3", mb: 2 }}>
            เลือกว่าจะให้แสดงกล่องความคิดเห็นแบบใดบ้าง (กดซ้ำเพื่อซ่อน)
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {([
              { value: "sidebar", label: "ข้างรูป (ทีละหน้า)", desc: "แสดงความคิดเห็นข้างรูปแต่ละหน้า", Icon: ViewSidebarIcon },
              { value: "bottom", label: "ท้ายเรื่อง", desc: "แสดงความคิดเห็นรวมที่ท้ายบท", Icon: VerticalAlignBottomIcon },
            ] as const).map(({ value, label, desc, Icon }) => {
              const active = commentPrefs.has(value);
              return (
                <Box
                  key={value}
                  onClick={() => handleCommentPrefToggle(value)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 2, p: 1.5,
                    bgcolor: active ? "rgba(251,191,36,0.08)" : "#262626",
                    border: `1px solid ${active ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 1.5, cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(251,191,36,0.06)" },
                  }}
                >
                  <Icon sx={{ color: active ? "#fbbf24" : "#a3a3a3", fontSize: 22 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{label}</Typography>
                    <Typography variant="caption" sx={{ color: "#a3a3a3" }}>{desc}</Typography>
                  </Box>
                  {commentPrefSaving
                    ? <CircularProgress size={16} sx={{ color: "#fbbf24" }} />
                    : active
                      ? <Chip label="ใช้งานอยู่" size="small" sx={{ height: 20, fontSize: "0.7rem", bgcolor: "rgba(251,191,36,0.15)", color: "#fbbf24" }} />
                      : <Chip label="ซ่อน" size="small" sx={{ height: 20, fontSize: "0.7rem", bgcolor: "rgba(255,255,255,0.05)", color: "#737373" }} />
                  }
                </Box>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ผู้ใช้ที่บล็อก */}
      <Accordion expanded={expanded === "blocked-users"} onChange={handleAccordion("blocked-users")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<BlockIcon fontSize="small" />} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>ผู้ใช้ที่บล็อก</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body1" fontWeight={500}>จัดการผู้ใช้ที่บล็อก</Typography>
              {liveBlockedUserCount > 0 && (
                <Chip label={liveBlockedUserCount} size="small" sx={{ height: 20, fontSize: "0.7rem", bgcolor: "rgba(255,255,255,0.08)", color: "#a3a3a3" }} />
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          <BlockedUsersPanel onCountChange={setLiveBlockedUserCount} />
        </AccordionDetails>
      </Accordion>

      {/* แท็กที่บล็อก */}
      <Accordion expanded={expanded === "blocked-tags"} onChange={handleAccordion("blocked-tags")} sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#a3a3a3" }} />} sx={summarySx}>
          <RowIcon icon={<LocalOfferIcon fontSize="small" />} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: "#5eead4", display: "block", lineHeight: 1.3 }}>แท็กที่บล็อก</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body1" fontWeight={500}>จัดการแท็กที่บล็อก</Typography>
              {liveBlockedTagCount > 0 && (
                <Chip label={liveBlockedTagCount} size="small" sx={{ height: 20, fontSize: "0.7rem", bgcolor: "rgba(255,255,255,0.08)", color: "#a3a3a3" }} />
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
          <BlockedTagsPanel onCountChange={setLiveBlockedTagCount} />
        </AccordionDetails>
      </Accordion>

      {/* Email Confirmation Dialog */}
      <Dialog
        open={openEmailConfirm}
        onClose={() => setOpenEmailConfirm(false)}
        PaperProps={{ sx: { bgcolor: "#171717", border: "1px solid rgba(255,255,255,0.1)", color: "#fafafa" } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon sx={{ color: "#fbbf24" }} />
          ยืนยันการเปลี่ยนอีเมล
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3" }}>
            ต้องการเปลี่ยนอีเมลเป็น <strong style={{ color: "#fafafa" }}>{formData.email}</strong> ใช่หรือไม่?
            <br /><br />
            การเปลี่ยนอีเมลอาจส่งผลต่อการเข้าสู่ระบบด้วย Google หากใช้อีเมลเดิม
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailConfirm(false)} sx={{ color: "#a3a3a3" }}>ยกเลิก</Button>
          <Button
            onClick={handleEmailUpdate}
            variant="contained"
            disabled={loading === "email"}
            sx={{ bgcolor: "#fbbf24", color: "#000", fontWeight: 700, "&:hover": { bgcolor: "#f59e0b" } }}
          >
            {loading === "email" ? <CircularProgress size={18} sx={{ color: "#555" }} /> : "ยืนยัน"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function BlockedUsersPanel({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!session?.user?.id) {
      setBlockedList([]);
      onCountChange?.(0);
      setLoadingData(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/user/blocked-users");
        if (res.ok) {
          const data = await res.json();
          const list = data.blockedUsers || [];
          if (!cancelled) {
            setBlockedList(list);
            onCountChange?.(list.length);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSessionPending, onCountChange, session?.user?.id]);

  const handleUnblock = async (blockedUserId: string) => {
    setRemoving(blockedUserId);
    await fetch(`/api/user/blocked-users?blockedUserId=${blockedUserId}`, { method: "DELETE" });
    setBlockedList((prev) => {
      const next = prev.filter((u) => u.blockedUserId !== blockedUserId);
      onCountChange?.(next.length);
      return next;
    });
    setRemoving(null);
  };

  if (loadingData) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} sx={{ color: "#fbbf24" }} /></Box>;
  }

  if (blockedList.length === 0) {
    return <Typography variant="body2" sx={{ color: "#a3a3a3" }}>ยังไม่มีผู้ใช้ที่บล็อก</Typography>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {blockedList.map((item) => (
        <Box
          key={item.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            bgcolor: "#262626",
            borderRadius: 1.5,
          }}
        >
          <Avatar
            src={item.blockedUser?.image}
            alt={item.blockedUser?.name}
            sx={{ width: 32, height: 32, bgcolor: "#404040", fontSize: "0.875rem" }}
          >
            {(item.blockedUser?.name || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={500}>{item.blockedUser?.name || "ผู้ใช้"}</Typography>
            {item.blockedUser?.username && (
              <Typography variant="caption" sx={{ color: "#a3a3a3" }}>@{item.blockedUser.username}</Typography>
            )}
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleUnblock(item.blockedUserId)}
            disabled={removing === item.blockedUserId}
            sx={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239,68,68,0.08)" }, minWidth: 80 }}
          >
            {removing === item.blockedUserId ? <CircularProgress size={14} /> : "ยกเลิกบล็อก"}
          </Button>
        </Box>
      ))}
    </Box>
  );
}

function BlockedTagsPanel({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [allTags, setAllTags] = useState<any[]>([]);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!session?.user?.id) {
      setBlockedList([]);
      onCountChange?.(0);
      setLoadingData(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [tagsRes, blockedRes] = await Promise.all([
          fetch("/api/tags"),
          fetch("/api/user/blocked-tags"),
        ]);
        if (tagsRes.ok && !cancelled) {
          setAllTags(await tagsRes.json());
        }
        if (blockedRes.ok) {
          const data = await blockedRes.json();
          const list = data.blockedTags || [];
          if (!cancelled) {
            setBlockedList(list);
            onCountChange?.(list.length);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSessionPending, onCountChange, session?.user?.id]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    const blockedTagIds = new Set(blockedList.map((item) => item.tagId));
    setSearchResults(
      allTags.filter((t) => !blockedTagIds.has(t.id) && t.name.toLowerCase().includes(lower))
    );
  };

  const handleBlockTag = async (tagId: string, tagName: string) => {
    const res = await fetch("/api/user/blocked-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    if (res.ok) {
      setBlockedList((prev) => {
        if (prev.some((item) => item.tagId === tagId)) {
          return prev;
        }
        const next = [...prev, { id: Date.now().toString(), tagId, tag: { name: tagName } }];
        onCountChange?.(next.length);
        return next;
      });
      setSearch("");
      setSearchResults([]);
    }
  };

  const handleUnblock = async (tagId: string) => {
    setRemoving(tagId);
    await fetch(`/api/user/blocked-tags?tagId=${tagId}`, { method: "DELETE" });
    setBlockedList((prev) => {
      const next = prev.filter((t) => t.tagId !== tagId);
      onCountChange?.(next.length);
      return next;
    });
    setRemoving(null);
  };

  if (loadingData) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} sx={{ color: "#fbbf24" }} /></Box>;
  }

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label="ค้นหาแท็กที่ต้องการบล็อก"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        sx={{ ...inputSx, mb: 1.5 }}
      />
      {searchResults.length > 0 && (
        <Box sx={{ bgcolor: "#262626", borderRadius: 1.5, mb: 2, overflow: "hidden" }}>
          {searchResults.slice(0, 8).map((tag) => (
            <Box
              key={tag.id}
              onClick={() => handleBlockTag(tag.id, tag.name)}
              sx={{
                px: 2, py: 1,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                "&:hover": { bgcolor: "rgba(251,191,36,0.08)" },
              }}
            >
              <Typography variant="body2">{tag.name}</Typography>
              <Typography variant="caption" sx={{ color: "#5eead4" }}>+ บล็อก</Typography>
            </Box>
          ))}
        </Box>
      )}

      {blockedList.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#a3a3a3" }}>ยังไม่มีแท็กที่บล็อก</Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {blockedList.map((item) => (
            <Chip
              key={item.id}
              label={item.tag?.name || item.tagId}
              onDelete={() => handleUnblock(item.tagId)}
              deleteIcon={removing === item.tagId ? <CircularProgress size={14} /> : undefined}
              sx={{
                bgcolor: "rgba(255,255,255,0.06)",
                color: "#fafafa",
                border: "1px solid rgba(255,255,255,0.1)",
                "& .MuiChip-deleteIcon": { color: "#a3a3a3", "&:hover": { color: "#ef4444" } },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
