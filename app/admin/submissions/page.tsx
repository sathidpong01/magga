"use client";

import { useState, useEffect } from "react";
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

      const res = await fetch(`/api/admin/submissions?${params}`);
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

  const handleStatusChange = (event: React.SyntheticEvent, newValue: string) => {
    setStatusFilter(newValue);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "REJECTED": return "error";
      case "UNDER_REVIEW": return "warning";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Manga Submissions
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={fetchSubmissions}
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          Refresh
        </Button>
      </Box>

      <Paper sx={{ mb: 3, bgcolor: '#171717', borderRadius: 1 }}>
        <Tabs 
          value={statusFilter} 
          onChange={handleStatusChange} 
          textColor="inherit"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" value="ALL" />
          <Tab label="Pending" value="PENDING" />
          <Tab label="Under Review" value="UNDER_REVIEW" />
          <Tab label="Approved" value="APPROVED" />
          <Tab label="Rejected" value="REJECTED" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by title or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 1, bgcolor: 'background.paper' }
            }}
            size="small"
          />
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ bgcolor: '#171717', borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cover</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Submitter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No submissions found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Box 
                      component="img" 
                      src={sub.coverImage} 
                      alt={sub.title} 
                      sx={{ width: 40, height: 60, objectFit: "cover", borderRadius: 0.5 }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{sub.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{sub.user.username || sub.user.name || sub.user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={sub.status} 
                      color={getStatusColor(sub.status) as any} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton 
                        component={Link} 
                        href={`/admin/submissions/${sub.id}`}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={(e, p) => setPage(p)} 
          color="primary" 
        />
      </Box>
    </Box>
  );
}
