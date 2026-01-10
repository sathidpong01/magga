"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { authFetch } from "@/lib/auth-fetch";

type UserWithCounts = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: {
    comments: number;
    submissions: number;
  };
};

type UserManagerProps = {
  initialUsers: UserWithCounts[];
};

export default function UserManager({ initialUsers }: UserManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithCounts[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithCounts | null>(null);

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

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "อัปเดตไม่สำเร็จ");
      }

      setSuccess("อัปเดต role สำเร็จ");
      router.refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
      setSuccess("ลบผู้ใช้เรียบร้อย");
      router.refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้ได้");
      setDeleteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Filters Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "#171717",
          borderRadius: 1,
          border: "1px solid #262626",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, หรือ username..."
            size="small"
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#262626",
                borderRadius: 1,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#525252" }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: "#a3a3a3" }}>กรอง Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="กรอง Role"
              sx={{ bgcolor: "#262626", borderRadius: 1 }}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>

      {/* Users Table */}
      <Paper
        sx={{
          bgcolor: "#171717",
          borderRadius: 1,
          border: "1px solid #262626",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #262626" }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "#fafafa" }}
          >
            รายชื่อผู้ใช้ ({filteredUsers.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#0a0a0a" }}>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  ผู้ใช้
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  อีเมล
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  สถิติ
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#a3a3a3" }}>
                  วันที่สมัคร
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", color: "#a3a3a3", width: 80 }}
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
                        <Typography sx={{ fontWeight: 500, color: "#fafafa" }}>
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
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      size="small"
                      disabled={isLoading}
                      sx={{
                        minWidth: 100,
                        bgcolor:
                          user.role === "admin"
                            ? "rgba(124, 58, 237, 0.15)"
                            : "#262626",
                        borderRadius: 1,
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
                          <span>User</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="admin">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <AdminPanelSettingsIcon
                            sx={{ fontSize: 16, color: "#7c3aed" }}
                          />
                          <span>Admin</span>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="คอมเมนต์">
                        <Chip
                          icon={<CommentIcon sx={{ fontSize: 14 }} />}
                          label={user._count.comments}
                          size="small"
                          sx={{
                            bgcolor: "#262626",
                            color: "#a3a3a3",
                            borderRadius: 1,
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Submissions">
                        <Chip
                          icon={<UploadFileIcon sx={{ fontSize: 14 }} />}
                          label={user._count.submissions}
                          size="small"
                          sx={{
                            bgcolor: "#262626",
                            color: "#a3a3a3",
                            borderRadius: 1,
                          }}
                        />
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#737373" }}>
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
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
                      ? "ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข"
                      : "ยังไม่มีผู้ใช้ในระบบ"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: "#171717", color: "#fafafa", borderRadius: 1 },
        }}
      >
        <DialogTitle>ยืนยันการลบ?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3" }}>
            คุณต้องการลบผู้ใช้ &quot;{userToDelete?.name || userToDelete?.email}
            &quot; หรือไม่?
            <br />
            <Typography variant="caption" sx={{ color: "#ef4444" }}>
              การลบจะลบข้อมูลทั้งหมดของผู้ใช้รวมถึงคอมเมนต์และ submissions
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#a3a3a3" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
