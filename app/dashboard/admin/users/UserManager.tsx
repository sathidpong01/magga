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

export default function UserManager({ initialUsers }: UserManagerProps) {
  const router = useRouter();
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

      showSuccess("Role updated successfully.");
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
        throw new Error(res.error || "Delete failed.");
      }

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      showSuccess("User deleted successfully.");
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

      showSuccess(`Account ${userToBan.name} has been suspended.`);
      router.refresh();
      setBanDialogOpen(false);
      setUserToBan(null);
    } catch (err) {
      showError("An error occurred while suspending the account.");
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

      if (!response.ok) throw new Error("Failed to unban user.");

      showSuccess(`Suspension lifted for ${user.name}.`);
      router.refresh();
    } catch (err) {
      showError("An error occurred while lifting the suspension.");
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
      {/* Filters Section */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            id="search-users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH BY NAME, EMAIL, OR USERNAME..."
            size="small"
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0B0B0B",
                borderRadius: 1,
                "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                "&.Mui-focused fieldset": { borderColor: "#FABF06" },
              },
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
            <InputLabel id="role-filter-label" sx={{ color: "#a3a3a3", fontWeight: 800, fontSize: "0.75rem", transform: "translate(14px, 8px) scale(1)", "&.Mui-focused, &.MuiInputLabel-shrink": { transform: "translate(14px, -9px) scale(0.75)", color: "#FABF06" } }}>
              FILTER ROLE
            </InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="FILTER ROLE"
              sx={{ 
                bgcolor: "#0B0B0B", 
                borderRadius: 1,
                fontWeight: 800,
                fontSize: "0.875rem",
                "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&.Mui-focused fieldset": { borderColor: "#FABF06" },
              }}
            >
              <MenuItem value="all">ALL USERS</MenuItem>
              <MenuItem value="admin">ADMINS</MenuItem>
              <MenuItem value="user">REGULAR USERS</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Users Table */}
      <Paper
        sx={{
          bgcolor: "#141414",
          borderRadius: 1.25,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)" }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, color: "#fafafa", letterSpacing: "0.02em" }}
          >
            USER LIST ({filteredUsers.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  USER
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  EMAIL
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  ROLE
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  STATS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  JOINED
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, color: "#a3a3a3", fontSize: "0.75rem", letterSpacing: "0.05em", width: 80 }}
                >
                  ACTIONS
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
                          {user.name || "UNNAMED USER"}
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
                            label="SUSPENDED"
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
                              borderRadius: 0.5,
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
                          user.role === "ADMIN"
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
                          <Typography component="span">User</Typography>
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
                          <Typography component="span">Admin</Typography>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="COMMENTS">
                        <Chip
                          icon={<CommentIcon sx={{ fontSize: 14, color: "#FABF06 !important" }} />}
                          label={user._count.comments}
                          size="small"
                          sx={{
                            bgcolor: "rgba(250, 191, 6, 0.05)",
                            color: "#FABF06",
                            borderRadius: 0.75,
                            border: "1px solid rgba(250, 191, 6, 0.2)",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            "& .MuiChip-label": { px: 1 }
                          }}
                        />
                      </Tooltip>
                        <Tooltip title="Submissions">
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
                          title={`ยกเลิกการระงับ (เหตุผล: ${
                            user.banReason || "-"
                          })`}
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
                      ? "NO USERS FOUND MATCHING YOUR CRITERIA."
                      : "NO USERS FOUND IN THE SYSTEM."}
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
            bgcolor: "#141414", 
            color: "#fafafa", 
            borderRadius: 1.25,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundImage: "none"
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "1rem" }}>SUSPEND ACCOUNT?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3", mb: 2, fontWeight: 600 }}>
            PLEASE SPECIFY A REASON FOR SUSPENDING &quot;
            {userToBan?.name || userToBan?.email}&quot;.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="REASON"
            type="text"
            fullWidth
            variant="outlined"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fafafa",
                bgcolor: "#0B0B0B",
                borderRadius: 1,
                "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&.Mui-focused fieldset": { borderColor: "#ef4444" },
              },
              "& .MuiInputLabel-root": { color: "#a3a3a3", fontWeight: 700, fontSize: "0.8rem" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#ef4444" },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setBanDialogOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem" }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleBanConfirm}
            variant="contained"
            sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "#dc2626" }, px: 3 }}
            disabled={!banReason.trim()}
          >
            CONFIRM SUSPENSION
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { 
            bgcolor: "#141414", 
            color: "#fafafa", 
            borderRadius: 1.25,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundImage: "none"
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "1rem" }}>CONFIRM DELETION?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#a3a3a3", fontWeight: 600, mb: 1 }}>
            ARE YOU SURE YOU WANT TO DELETE USER &quot;{userToDelete?.name || userToDelete?.email}
            &quot;?
          </DialogContentText>
          <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            THIS ACTION WILL REMOVE ALL USER DATA INCLUDING COMMENTS AND SUBMISSIONS PERMANENTLY.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#a3a3a3", fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem" }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 900, "&:hover": { bgcolor: "#dc2626" }, px: 3 }}
          >
            DELETE USER
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
