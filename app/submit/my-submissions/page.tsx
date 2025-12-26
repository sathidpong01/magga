"use client";

import { useState, useEffect, useMemo } from "react";
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
  CircularProgress,
  Alert,
  IconButton,
  Pagination,
} from "@mui/material";
import { useSession } from "next-auth/react";
import EditIcon from "@mui/icons-material/Edit";
import Image from "next/image";
import Link from "next/link";

interface Submission {
  id: string;
  title: string;
  coverImage: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  createdAt: string;
  slug: string | null;
}

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  PENDING: { label: "รออนุมัติ", color: "warning" as const },
  UNDER_REVIEW: { label: "กำลังตรวจสอบ", color: "info" as const },
  APPROVED: { label: "อนุมัติแล้ว", color: "success" as const },
  REJECTED: { label: "ถูกปฏิเสธ", color: "error" as const },
};

export default function MySubmissionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.id) {
      fetchSubmissions();
    }
  }, [session, sessionStatus]);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/submissions/my");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(submissions.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return submissions.slice(start, start + ITEMS_PER_PAGE);
  }, [submissions, page]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
          รายการฝากลงของฉัน
        </Typography>
        <Alert severity="warning">กรุณาเข้าสู่ระบบเพื่อดูรายการฝากลงของคุณ</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          รายการฝากลงของฉัน
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ทั้งหมด {submissions.length} รายการ
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ bgcolor: "#171717" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ปก</TableCell>
              <TableCell>ชื่อเรื่อง</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>วันที่ฝากลง</TableCell>
              <TableCell align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSubmissions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <Box sx={{ width: 50, height: 70, position: "relative", borderRadius: 0.5, overflow: "hidden" }}>
                    <Image src={sub.coverImage} alt={sub.title} fill sizes="50px" style={{ objectFit: "cover" }} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500}>{sub.title}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig[sub.status].label}
                    color={statusConfig[sub.status].color}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(sub.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell align="right">
                  {sub.status === "PENDING" && (
                    <IconButton
                      component={Link}
                      href={`/submit/edit/${sub.id}`}
                      size="small"
                      sx={{ color: "#a3a3a3" }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && !error && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">ยังไม่มีรายการฝากลง</Typography>
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
    </Box>
  );
}

