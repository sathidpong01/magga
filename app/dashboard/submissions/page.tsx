"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Grid, Paper, Chip, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkButton from '@/app/components/ui/LinkButton';

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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/user/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubmission) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
        setDeleteDialogOpen(false);
        setSelectedSubmission(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete submission');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = (status: string) => {
    return status === 'PENDING' || status === 'DRAFT' || status === 'CHANGE_REQUESTED';
  };

  const canDelete = (status: string) => {
    return status === 'PENDING' || status === 'DRAFT';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">My Submissions</Typography>
        <LinkButton 
          variant="contained" 
          startIcon={<AddIcon />}
          href="/submit"
          sx={{ bgcolor: '#fbbf24', color: '#000', '&:hover': { bgcolor: '#f59e0b' } }}
        >
          New Submission
        </LinkButton>
      </Box>

      {submissions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>You haven't submitted any manga yet.</Typography>
          <LinkButton 
            variant="outlined" 
            href="/submit"
          >
            Submit your first manga
          </LinkButton>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {submissions.map((submission) => (
            <Grid item xs={12} key={submission.id}>
              <Paper sx={{ p: 2, bgcolor: '#171717', display: 'flex', gap: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ width: 80, height: 120, bgcolor: '#333', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={submission.coverImage} alt={submission.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6">{submission.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={submission.status} 
                        color={
                          submission.status === 'APPROVED' ? 'success' : 
                          submission.status === 'REJECTED' ? 'error' : 
                          submission.status === 'UNDER_REVIEW' ? 'warning' : 'default'
                        } 
                        size="small" 
                      />
                      
                      {/* Action Buttons */}
                      {canEdit(submission.status) && (
                        <IconButton 
                          size="small"
                          onClick={() => router.push(`/submit/edit/${submission.id}`)}
                          sx={{ 
                            color: '#fbbf24',
                            '&:hover': { bgcolor: 'rgba(251, 191, 36, 0.1)' }
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
                            color: '#ef4444',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                          }}
                          title="ลบ"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                  </Typography>
                  {submission.rejectionReason && (
                    <Paper sx={{ p: 1.5, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                      <Typography color="error" variant="body2">
                        <strong>Rejection Reason:</strong> {submission.rejectionReason}
                      </Typography>
                    </Paper>
                  )}
                  {submission.status === 'APPROVED' && submission.approvedMangaId && (
                    <LinkButton 
                      size="small" 
                      href={`/${submission.slug || '#'}`}
                      sx={{ mt: 1 }}
                    >
                      View Published Manga
                    </LinkButton>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }
        }}
      >
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบ <strong>{selectedSubmission?.title}</strong> ใช่หรือไม่?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            การลบนี้ไม่สามารถยกเลิกได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="inherit"
            disabled={isDeleting}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
