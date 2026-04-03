"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { isUserBanned } from "@/lib/session-utils";
import {
  Box,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkButton from "@/app/components/ui/LinkButton";
import Image from "next/image";
import BanNoticeModal from "@/app/components/modals/BanNoticeModal";
import {
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardStatusBadge,
  DashboardSurface,
  dashboardDialogPaperSx,
  dashboardGhostButtonSx,
  dashboardInsetSurfaceSx,
  dashboardSecondaryButtonSx,
  dashboardTokens,
} from "@/app/components/dashboard/system";

type Submission = {
  id: string;
  title: string;
  slug: string | null;
  coverImage: string;
  status: string;
  submittedAt: string;
  rejectionReason: string | null;
  approvedMangaId: string | null;
};

export default function MySubmissionsPage() {
  const router = useRouter();
  const { data: session, isPending: authLoading } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);

  const banned = isUserBanned(session);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/user/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/auth/signin?callbackUrl=/dashboard/submissions");
    } else if (!authLoading && session && banned) {
      setBanModalOpen(true);
    } else if (!authLoading && session) {
      fetchSubmissions();
    }
  }, [authLoading, session, banned, router, fetchSubmissions]);

  const handleDeleteClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubmission) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubmissions((prev) =>
          prev.filter((s) => s.id !== selectedSubmission.id)
        );
        setDeleteDialogOpen(false);
        setSelectedSubmission(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete submission");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete submission");
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = (status: string) =>
    status === "PENDING" || status === "REJECTED";

  const canDelete = (status: string) =>
    status === "PENDING" || status === "REJECTED";

  if (authLoading || (!authLoading && session && !banned && loading)) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: dashboardTokens.accent }} />
      </Box>
    );
  }

  if (banned) {
    return (
      <>
        <DashboardPageHeader
          eyebrow="MY SUBMISSIONS"
          title="รายการฝากลงของฉัน"
          description="กำลังตรวจสอบสถานะบัญชีของคุณ"
        />
        <BanNoticeModal
          open={banModalOpen}
          redirectToHome={true}
          onClose={() => {
            setBanModalOpen(false);
            router.push("/");
          }}
        />
      </>
    );
  }

  return (
    <Box>
      <DashboardPageHeader
        eyebrow="MY SUBMISSIONS"
        title="รายการฝากลงของฉัน"
        description="ติดตามสถานะเรื่องที่ส่งเข้ามา แก้ไขรายการที่ยังไม่ผ่าน และเปิดดูเรื่องที่เผยแพร่แล้วได้จากที่เดียว"
      >
        <LinkButton
          variant="contained"
          startIcon={<AddIcon />}
          href="/dashboard/submit"
        >
          ฝากลงเรื่องใหม่
        </LinkButton>
      </DashboardPageHeader>

      {submissions.length === 0 ? (
        <DashboardEmptyState
          title="ยังไม่มีรายการฝากลง"
          description="เมื่อคุณส่งมังงะเข้ามา รายการทั้งหมดจะปรากฏที่นี่พร้อมสถานะล่าสุดและปุ่มจัดการที่เกี่ยวข้อง"
          action={
            <LinkButton variant="outlined" href="/dashboard/submit">
              เริ่มฝากลงเรื่องแรก
            </LinkButton>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {submissions.map((submission) => (
            <Grid key={submission.id} size={12}>
              <DashboardSurface
                sx={{
                  p: { xs: 2, md: 2.5 },
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2.25,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: { xs: "100%", sm: 104 },
                    height: { xs: 210, sm: 148 },
                    bgcolor: "#333",
                    borderRadius: 1.2,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={submission.coverImage}
                    alt={submission.title}
                    fill
                    sizes="(max-width: 600px) 100vw, 104px"
                    style={{ objectFit: "cover" }}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", md: "center" },
                      flexDirection: { xs: "column", md: "row" },
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: dashboardTokens.text,
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                      >
                        {submission.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: dashboardTokens.textMuted, mt: 0.5 }}
                      >
                        ส่งเมื่อ{" "}
                        {new Date(submission.submittedAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <DashboardStatusBadge status={submission.status} />

                      {canEdit(submission.status) && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/dashboard/submit/${submission.id}`)
                          }
                          sx={{
                            ...(dashboardGhostButtonSx as any),
                            color: dashboardTokens.accent,
                          }}
                          title="แก้ไข"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}

                      {canDelete(submission.status) && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(submission)}
                          sx={{
                            ...(dashboardGhostButtonSx as any),
                            color: dashboardTokens.danger,
                          }}
                          title="ลบ"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.75, borderColor: dashboardTokens.border }} />

                  {submission.rejectionReason ? (
                    <Box
                      sx={{
                        p: 1.5,
                        ...dashboardInsetSurfaceSx,
                        bgcolor: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        mb: 1.25,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: dashboardTokens.danger,
                          fontWeight: 800,
                          mb: 0.5,
                        }}
                      >
                        เหตุผลที่ไม่ผ่าน
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#fca5a5" }}>
                        {submission.rejectionReason}
                      </Typography>
                    </Box>
                  ) : null}

                  {submission.status === "APPROVED" &&
                  submission.approvedMangaId ? (
                    <LinkButton
                      size="small"
                      href={`/${submission.slug || "#"}`}
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    >
                      เปิดหน้าที่เผยแพร่แล้ว
                    </LinkButton>
                  ) : null}
                </Box>
              </DashboardSurface>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: dashboardDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: dashboardTokens.text }}>
            คุณต้องการลบ <strong>{selectedSubmission?.title}</strong> ใช่หรือไม่?
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: dashboardTokens.textMuted }}
          >
            การลบนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={dashboardGhostButtonSx}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            startIcon={
              isDeleting ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : null
            }
            sx={{
              ...(dashboardSecondaryButtonSx as any),
              color: dashboardTokens.danger,
              borderColor: "rgba(239,68,68,0.24)",
            }}
          >
            {isDeleting ? "กำลังลบ..." : "ลบรายการ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
