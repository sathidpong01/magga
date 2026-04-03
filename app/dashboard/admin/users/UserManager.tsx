"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Box,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CommentIcon from "@mui/icons-material/Comment";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { authFetch } from "@/lib/auth-fetch";
import { useToast } from "@/app/contexts/ToastContext";

type UserWithCounts = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string;
  banned: boolean;
  banReason?: string | null;
  bannedAt?: Date | null;
  createdAt: Date;
  _count: {
    comments: number;
    submissions: number;
  };
};

type UserManagerProps = {
  initialUsers: UserWithCounts[];
};

const shellSx = {
  bgcolor: "#141414",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 1.5,
  backgroundImage: "none",
  boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
};

const surfaceSx = {
  bgcolor: "#171717",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 1.5,
  backgroundImage: "none",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#0B0B0B",
    borderRadius: 1.1,
    "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.14)" },
    "&.Mui-focused fieldset": { borderColor: "#fbbf24" },
  },
  "& .MuiInputLabel-root": { color: "#a3a3a3" },
};

const primaryButtonSx = {
  bgcolor: "#fbbf24",
  color: "#000",
  fontWeight: 800,
  borderRadius: 1.1,
  textTransform: "none" as const,
  "&:hover": { bgcolor: "#f59e0b" },
};

const neutralButtonSx = {
  borderColor: "rgba(255,255,255,0.1)",
  color: "#d4d4d4",
  fontWeight: 700,
  borderRadius: 1.1,
  textTransform: "none" as const,
};

const dangerButtonSx = {
  bgcolor: "#ef4444",
  color: "#fff",
  fontWeight: 800,
  borderRadius: 1.1,
  textTransform: "none" as const,
  "&:hover": { bgcolor: "#dc2626" },
};

export default function UserManager({ initialUsers }: UserManagerProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<UserWithCounts[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithCounts | null>(null);

  // Ban State
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<UserWithCounts | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalAdmins = users.filter((user) => user.role === "admin").length;
  const suspendedUsers = users.filter((user) => user.banned).length;
  const totalComments = users.reduce(
    (sum, user) => sum + user._count.comments,
    0
  );
  const totalSubmissions = users.reduce(
    (sum, user) => sum + user._count.submissions,
    0
  );

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsLoading(true);

    try {
      const response = await authFetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Update failed.");
      }

      showSuccess("อัปเดตบทบาทเรียบร้อย");
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (user: UserWithCounts) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "ลบไม่สำเร็จ");
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      showSuccess("ลบผู้ใช้เรียบร้อย");
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete user.");
      setDeleteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Ban
  const handleBanClick = (user: UserWithCounts) => {
    setUserToBan(user);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const handleBanConfirm = async () => {
    if (!userToBan) return;
    setIsLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${userToBan.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banReason }),
      });

      if (!response.ok) throw new Error("Failed to ban user.");

      showSuccess(`ระงับบัญชี ${userToBan.name} เรียบร้อย`);
      router.refresh();
      setBanDialogOpen(false);
      setUserToBan(null);
    } catch (err) {
      showError("เกิดข้อผิดพลาดขณะระงับบัญชี");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async (user: UserWithCounts) => {
    if (!confirm(`ต้องการยกเลิกการระงับ ${user.name} หรือไม่?`)) return;

    setIsLoading(true);
    try {
      const response = await authFetch(`/api/admin/users/${user.id}/ban`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("ยกเลิกการระงับไม่สำเร็จ");

      showSuccess(`ยกเลิกการระงับ ${user.name} เรียบร้อย`);
      router.refresh();
    } catch (err) {
      showError("เกิดข้อผิดพลาดขณะยกเลิกการระงับ");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Paper
        sx={{ ...shellSx, p: { xs: 2, md: 2.5 }, mb: 2.5 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <TextField
            id="search-users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ อีเมล หรือชื่อผู้ใช้..."
            size="small"
            sx={{
              flex: 1,
              ...inputSx,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#a3a3a3", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel
              id="role-filter-label"
              sx={{
                color: "#a3a3a3",
                fontWeight: 700,
                fontSize: "0.8rem",
                "&.Mui-focused, &.MuiInputLabel-shrink": {
                  color: "#fbbf24",
                },
              }}
            >
              บทบาท
            </InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="บทบาท"
              sx={{ 
                minWidth: 150,
                ...inputSx,
              }}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="admin">แอดมิน</MenuItem>
              <MenuItem value="user">ผู้ใช้</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label={`แอดมิน ${totalAdmins}`}
          sx={{
            bgcolor: "rgba(251,191,36,0.08)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.16)",
            fontWeight: 700,
          }}
        />
        <Chip
          label={`ระงับ ${suspendedUsers}`}
          sx={{
            bgcolor: "rgba(239,68,68,0.08)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.16)",
            fontWeight: 700,
          }}
        />
        <Chip
          label={`คอมเมนต์ ${totalComments.toLocaleString()}`}
          sx={{
            bgcolor: "rgba(96,165,250,0.08)",
            color: "#93c5fd",
            border: "1px solid rgba(96,165,250,0.16)",
            fontWeight: 700,
          }}
        />
        <Chip
          label={`การฝากลง ${totalSubmissions.toLocaleString()}`}
          sx={{
            bgcolor: "rgba(139,92,246,0.08)",
            color: "#c4b5fd",
            border: "1px solid rgba(139,92,246,0.16)",
            fontWeight: 700,
          }}
        />
      </Stack>

      <Paper
        sx={{
          ...surfaceSx,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            bgcolor: "rgba(255,255,255,0.02)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "0.02em",
            }}
          >
            รายชื่อผู้ใช้ ({filteredUsers.length})
          </Typography>
        </Box>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: isMobile ? 880 : 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  ผู้ใช้
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  อีเมล
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  บทบาท
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  สถิติ
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  เข้าร่วมเมื่อ
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em", width: 80 }}
                >
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    "&:last-child td": { border: 0 },
                    "& td": { borderBottom: "1px solid rgba(255,255,255,0.04)" },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={user.image || undefined}
                        sx={{ width: 36, height: 36, bgcolor: "#404040" }}
                      >
                        {user.name?.[0] || user.email?.[0] || "?"}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: "#fafafa", fontSize: "0.95rem", letterSpacing: "0.01em" }}>
                          {user.name || "ไม่ระบุชื่อ"}
                        </Typography>
                        {user.username && (
                          <Typography
                            variant="caption"
                            sx={{ color: "#737373" }}
                          >
                            @{user.username}
                          </Typography>
                        )}
                        {user.banned && (
                          <Chip
                            label="ระงับ"
                            size="small"
                            variant="outlined"
                            sx={{
                              ml: 1,
                              height: 18,
                              fontSize: "0.6rem",
                              fontWeight: 900,
                              borderColor: "#ef4444",
                              color: "#ef4444",
                              bgcolor: "rgba(239, 68, 68, 0.05)",
                              borderRadius: 0.75,
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                      <Typography sx={{ color: "#a3a3a3" }}>
                        {user.email || "-"}
                      </Typography>
                    </TableCell>
                  <TableCell>
                    <Select
                      id={`user-role-${user.id}`}
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      size="small"
                      disabled={isLoading}
                        sx={{
                          minWidth: 100,
                          bgcolor:
                          user.role?.toLowerCase() === "admin"
                            ? "rgba(251, 191, 36, 0.12)"
                            : "#262626",
                          borderRadius: 1.1,
                        "& .MuiSelect-select": { py: 0.5 },
                      }}
                    >
                      <MenuItem value="user">
                          <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <PersonIcon sx={{ fontSize: 16, color: "#a3a3a3" }} />
                          <Typography component="span">ผู้ใช้</Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="admin">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <AdminPanelSettingsIcon
                            sx={{ fontSize: 16, color: "#fbbf24" }}
                          />
                          <Typography component="span">แอดมิน</Typography>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="ความคิดเห็น">
                        <Chip
                          icon={<CommentIcon sx={{ fontSize: 14, color: "#fbbf24 !important" }} />}
                          label={user._count.comments}
                          size="small"
                          sx={{
                            bgcolor: "rgba(251, 191, 36, 0.05)",
                            color: "#fbbf24",
                            borderRadius: 0.75,
                            border: "1px solid rgba(251, 191, 36, 0.2)",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            "& .MuiChip-label": { px: 1 }
                          }}
                        />
                      </Tooltip>
                        <Tooltip title="การฝากลง">
                          <Chip
                            icon={<UploadFileIcon sx={{ fontSize: 14, color: "#a5b4fc !important" }} />}
                            label={user._count.submissions}
                            size="small"
                            sx={{
                              bgcolor: "rgba(99, 102, 241, 0.05)",
                              color: "#a5b4fc",
                              borderRadius: 0.75,
                              border: "1px solid rgba(99, 102, 241, 0.2)",
                              fontWeight: 700,
                              fontFamily: "monospace",
                              "& .MuiChip-label": { px: 1 }
                            }}
                          />
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#737373", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600 }}>
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      {user.banned ? (
                        <Tooltip
                          title={`ยกเลิกการระงับ (เหตุผล: ${user.banReason || "-"})`}
                        >
                          <IconButton
                            onClick={() => handleUnban(user)}
                            size="small"
                            disabled={isLoading}
                            sx={{ color: "#22c55e" }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="ระงับการใช้งาน">
                          <IconButton
                            onClick={() => handleBanClick(user)}
                            size="small"
                            disabled={isLoading}
                            sx={{
                              color: "#737373",
                              "&:hover": { color: "#ef4444" },
                            }}
                          >
                            <BlockIcon
                              fontSize="small"
                              sx={{
                                color: "#737373",
                                "&:hover": { color: "#ef4444" },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="ลบผู้ใช้">
                        <IconButton
                          onClick={() => handleDeleteClick(user)}
                          size="small"
                          disabled={isLoading}
                          sx={{
                            color: "#737373",
                            "&:hover": { color: "#ef4444" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ textAlign: "center", py: 6, color: "#525252" }}
                  >
                    {searchQuery || roleFilter !== "all"
                      ? "ไม่พบผู้ใช้ตามเงื่อนไขที่เลือก"
                      : "ยังไม่มีผู้ใช้ในระบบ"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Ban Dialog */}
      <Dialog
        open={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        PaperProps={{
          sx: { 
            ...surfaceSx,
            color: "#fafafa", 
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, letterSpacing: "0.02em", fontSize: "1rem" }}>
          ระงับบัญชีผู้ใช้นี้?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3", mb: 2, fontWeight: 500, lineHeight: 1.7 }}>
            ระบุเหตุผลสำหรับการระงับบัญชีของ
            &quot;{userToBan?.name || userToBan?.email}&quot; เพื่อให้ตรวจสอบย้อนหลังได้
            ชัดเจน
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="เหตุผล"
            type="text"
            fullWidth
            variant="outlined"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            sx={{
              ...inputSx,
              "& .MuiOutlinedInput-root": {
                ...inputSx["& .MuiOutlinedInput-root"],
                color: "#fafafa",
              },
              "& .MuiInputLabel-root": {
                ...inputSx["& .MuiInputLabel-root"],
                fontWeight: 700,
                fontSize: "0.8rem",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setBanDialogOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 700, textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleBanConfirm}
            variant="contained"
            sx={{ ...dangerButtonSx, px: 3 }}
            disabled={!banReason.trim()}
          >
            ยืนยันการระงับ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { 
            ...surfaceSx,
            color: "#fafafa", 
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, letterSpacing: "0.02em", fontSize: "1rem" }}>
          ยืนยันการลบ?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3", fontWeight: 500, mb: 1, lineHeight: 1.7 }}>
            คุณต้องการลบผู้ใช้ &quot;{userToDelete?.name || userToDelete?.email}
            &quot; ใช่หรือไม่
          </DialogContentText>
          <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 800, letterSpacing: "0.02em" }}>
            การกระทำนี้จะลบข้อมูลที่เกี่ยวข้องทั้งหมดถาวร
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 700, textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ ...dangerButtonSx, px: 3 }}
          >
            ลบผู้ใช้
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
