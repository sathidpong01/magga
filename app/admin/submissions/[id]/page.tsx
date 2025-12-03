"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
    tagIds: [] as string[],
    authorCredits: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Action State
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Approve Form
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [reviewNote, setReviewNote] = useState("");

  // Reject Form
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, catRes, tagRes] = await Promise.all([
          fetch(`/api/admin/submissions/${params.id}`),
          fetch('/api/categories'),
          fetch('/api/tags')
        ]);

        if (!subRes.ok) throw new Error("Failed to fetch submission");
        
        const subData = await subRes.json();
        setSubmission(subData);
        
        // Init edit form
        setEditForm({
          title: subData.title,
          slug: subData.slug || "",
          description: subData.description || "",
          categoryId: subData.categoryId || "",
          tagIds: subData.tags.map((t: any) => t.tagId),
          authorCredits: subData.authorCredits || "[]",
        });

        if (catRes.ok) setCategories(await catRes.json());
        if (tagRes.ok) setTags(await tagRes.json());

      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update");
      
      const updated = await res.json();
      setSubmission({ ...submission, ...updated }); // Basic update, might need full refetch for relations
      setIsEditing(false);
      // Refetch to get relations updated
      const subRes = await fetch(`/api/admin/submissions/${params.id}`);
      if (subRes.ok) setSubmission(await subRes.json());

    } catch (err) {
      alert("Failed to save changes");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${params.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote, publishImmediately }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      const data = await res.json();
      router.push(`/admin/submissions?status=APPROVED`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error approving");
    } finally {
      setActionLoading(false);
      setApproveOpen(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${params.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason, reviewNote }),
      });

      if (!res.ok) throw new Error("Failed to reject");

      router.push(`/admin/submissions?status=REJECTED`);
      router.refresh();
    } catch (err) {
      alert("Error rejecting");
    } finally {
      setActionLoading(false);
      setRejectOpen(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error || !submission) return <Box sx={{ p: 4 }}><Alert severity="error">{error || "Not found"}</Alert></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mb: 2 }}>
          Back to List
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {submission.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={submission.status} 
                color={
                  submission.status === 'APPROVED' ? 'success' : 
                  submission.status === 'REJECTED' ? 'error' : 
                  submission.status === 'UNDER_REVIEW' ? 'warning' : 'default'
                } 
              />
              <Typography variant="body2" color="text.secondary">
                Submitted on {new Date(submission.submittedAt).toLocaleString()}
              </Typography>
            </Stack>
          </Box>
          
          {submission.status !== 'APPROVED' && submission.status !== 'REJECTED' && (
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<CancelIcon />}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<CheckCircleIcon />}
                onClick={() => setApproveOpen(true)}
              >
                Approve
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Details & Edit */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#171717', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Submission Details</Typography>
              {!isEditing && submission.status === 'PENDING' && (
                <Button size="small" onClick={() => setIsEditing(true)}>Edit Details</Button>
              )}
            </Box>

            {isEditing ? (
              <Stack spacing={3}>
                <TextField 
                  label="Title" 
                  fullWidth 
                  value={editForm.title} 
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                />
                <TextField 
                  label="Slug" 
                  fullWidth 
                  value={editForm.slug} 
                  onChange={(e) => setEditForm({...editForm, slug: e.target.value})} 
                />
                <TextField 
                  label="Description" 
                  fullWidth 
                  multiline 
                  rows={3} 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                />
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editForm.categoryId}
                    label="Category"
                    onChange={(e) => setEditForm({...editForm, categoryId: e.target.value})}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Autocomplete
                  multiple
                  options={tags}
                  getOptionLabel={(option) => option.name}
                  value={tags.filter(t => editForm.tagIds.includes(t.id))}
                  onChange={(e, newValue) => setEditForm({...editForm, tagIds: newValue.map(v => v.id)})}
                  renderInput={(params) => <TextField {...params} label="Tags" />}
                />
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button variant="contained" onClick={handleSaveEdit} disabled={actionLoading}>Save Changes</Button>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography>{submission.description || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography>{submission.category?.name || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {submission.tags.map((t: any) => (
                      <Chip key={t.tagId} label={t.tag.name} size="small" />
                    ))}
                  </Box>
                </Box>
              </Stack>
            )}
          </Paper>

          {/* Pages Preview */}
          <Paper sx={{ p: 3, bgcolor: '#171717', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Pages Preview</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 2 }}>
              {JSON.parse(submission.pages as string).map((url: string, idx: number) => (
                <Box key={idx} sx={{ position: 'relative', paddingTop: '150%' }}>
                  <img 
                    src={url} 
                    alt={`Page ${idx + 1}`} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} 
                  />
                  <Box sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'rgba(0,0,0,0.7)', px: 1, borderRadius: '4px 0 4px 0', fontSize: 12 }}>
                    {idx + 1}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Submitter & Meta */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#171717', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Submitter Info</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar src={submission.user.image} alt={submission.user.name || ""} />
              <Box>
                <Typography variant="subtitle1">{submission.user.name || submission.user.username}</Typography>
                <Typography variant="body2" color="text.secondary">{submission.user.email}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Joined: {new Date(submission.user.createdAt).toLocaleDateString()}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: '#171717', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Cover Image</Typography>
            <Box 
              component="img" 
              src={submission.coverImage} 
              alt="Cover" 
              sx={{ width: '100%', borderRadius: 1 }} 
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Submission</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will create a new Manga record and publish it.
          </Typography>
          <FormControlLabel
            control={<Switch checked={publishImmediately} onChange={(e) => setPublishImmediately(e.target.checked)} />}
            label="Publish Immediately (Visible to public)"
          />
          <TextField
            label="Internal Review Note (Optional)"
            fullWidth
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={actionLoading}>
            Confirm Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Submission</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: 'error.main' }}>
            This will reject the submission. The user will see the reason.
          </Typography>
          <TextField
            label="Rejection Reason (Required)"
            fullWidth
            multiline
            rows={3}
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Internal Review Note (Optional)"
            fullWidth
            multiline
            rows={2}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error" disabled={actionLoading || !rejectionReason}>
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
