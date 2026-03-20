"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Pagination,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth-fetch";

type Submission = {
  id: string;
  title: string;
  status: string;
  submittedAt: string;
  coverImage: string;
  user: {
    name: string | null;
    username: string | null;
    email: string | null;
  };
};

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter,
      });
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await authFetch(`/api/admin/submissions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data.submissions);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [page, statusFilter, debouncedSearch]);

  const handleStatusChange = (
    event: React.SyntheticEvent,
    newValue: string
  ) => {
    setStatusFilter(newValue);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "UNDER_REVIEW":
        return "warning";
      default:
        return "default";
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
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 900, 
            letterSpacing: "-0.02em",
            color: "#fafafa",
            textTransform: "uppercase"
          }}
        >
          Submissions Management
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchSubmissions}
          variant="contained"
          sx={{ 
            borderRadius: 1.25,
            bgcolor: "#FABF06",
            color: "#000",
            fontWeight: 900,
            px: 3,
            "&:hover": {
              bgcolor: "#e5af05",
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      <Paper 
        sx={{ 
          mb: 4, 
          bgcolor: "#141414", 
          borderRadius: 1.25, 
          border: "1px solid rgba(255,255,255,0.06)", 
          overflow: "hidden",
          backgroundImage: "none",
          boxShadow: "none"
        }}
      >
        <Tabs
          value={statusFilter}
          onChange={handleStatusChange}
          textColor="inherit"
          TabIndicatorProps={{ sx: { bgcolor: "#FABF06", height: 3, borderRadius: "3px 3px 0 0" } }}
          sx={{ 
            borderBottom: 1, 
            borderColor: "rgba(255,255,255,0.06)",
            minHeight: 56,
            "& .MuiTab-root": { 
              fontWeight: 800, 
              color: "#a3a3a3",
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              minHeight: 56,
              opacity: 0.7,
              "&.Mui-selected": { 
                color: "#FABF06 !important",
                opacity: 1
              }
            }
          }}
        >
          <Tab label="All" value="ALL" />
          <Tab label="Pending" value="PENDING" />
          <Tab label="Under Review" value="UNDER_REVIEW" />
          <Tab label="Approved" value="APPROVED" />
          <Tab label="Rejected" value="REJECTED" />
        </Tabs>

        <Box sx={{ p: 2.5, bgcolor: "rgba(0,0,0,0.2)" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="SEARCH BY TITLE OR SUBMITTER..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0B0B0B",
                borderRadius: 1,
                fontWeight: 600,
                fontSize: "0.9rem",
                "& fieldset": { borderColor: "rgba(255,255,255,0.06)" },
                "&:hover fieldset": { borderColor: "rgba(250, 191, 6, 0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#FABF06" },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#FABF06", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            size="medium"
          />
        </Box>
      </Paper>

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
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Cover</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Title</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Submitter</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Status</TableCell>
              <TableCell sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Submitted At</TableCell>
              <TableCell align="right" sx={{ py: 2.5, fontWeight: 900, color: "#a3a3a3", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress sx={{ color: "#FABF06" }} />
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography sx={{ color: "#a3a3a3", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    No submissions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <TableRow 
                  key={sub.id} 
                  hover 
                  sx={{ 
                    "&:hover": { bgcolor: "rgba(255,255,255,0.02) !important" },
                    "& td": { borderBottom: "1px solid rgba(255,255,255,0.04)" }
                  }}
                >
                  <TableCell sx={{ py: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 68,
                        position: "relative",
                        borderRadius: 1,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.04)"
                      }}
                    >
                      <Image
                        src={sub.coverImage}
                        alt={sub.title}
                        fill
                        sizes="48px"
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{sub.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: "#a3a3a3", fontSize: "0.85rem" }}>
                      {sub.user.username || sub.user.name || sub.user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sub.status}
                      size="small"
                      sx={{ 
                        fontWeight: 900, 
                        fontSize: "0.65rem",
                        letterSpacing: "0.05em",
                        borderRadius: 1,
                        bgcolor: sub.status === "APPROVED" 
                          ? "rgba(34, 197, 94, 0.15)" 
                          : sub.status === "REJECTED" 
                          ? "rgba(239, 68, 68, 0.15)"
                          : sub.status === "PENDING"
                          ? "rgba(250, 191, 6, 0.15)"
                          : "rgba(255,255,255,0.05)",
                        color: sub.status === "APPROVED" 
                          ? "#4ade80" 
                          : sub.status === "REJECTED" 
                          ? "#f87171"
                          : sub.status === "PENDING"
                          ? "#FABF06"
                          : "#a3a3a3",
                        border: "1px solid rgba(255,255,255,0.03)"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#a3a3a3", fontWeight: 600 }}>
                      {new Date(sub.submittedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }).toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="VIEW SUBMISSION">
                      <IconButton
                        component={Link}
                        href={`/dashboard/admin/submissions/${sub.id}`}
                        sx={{ 
                          color: "#FABF06",
                          bgcolor: "rgba(250, 191, 6, 0.08)",
                          borderRadius: 1,
                          width: 36,
                          height: 36,
                          "&:hover": { 
                            bgcolor: "rgba(250, 191, 6, 0.15)",
                            transform: "scale(1.05)"
                          },
                          transition: "all 0.2s"
                        }}
                        aria-label="View Details"
                      >
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, p) => setPage(p)}
          sx={{
            "& .MuiPaginationItem-root": { 
              color: "#a3a3a3", 
              fontWeight: 800,
              fontSize: "0.75rem",
              fontFamily: "monospace",
              borderRadius: 1,
              "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
            },
            "& .Mui-selected": { 
              bgcolor: "#FABF06 !important", 
              color: "#000 !important",
              boxShadow: "0 0 15px rgba(250, 191, 6, 0.3)"
            }
          }}
        />
      </Box>
    </Box>
  );
}
