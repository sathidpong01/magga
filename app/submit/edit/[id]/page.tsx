"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  InputAdornment,
  Tooltip,
  Container,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import NotificationModal from "@/app/admin/components/NotificationModal";
import UploadModal from "@/app/admin/components/UploadModal";
import { SortableItem } from "@/app/admin/components/SortableItem";
import UploadProgress, { UploadFileStatus } from "@/app/components/ui/UploadProgress";
import { useSession } from "next-auth/react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

type PageItem = {
  id: string;
  type: 'url' | 'file';
  content: string | File;
  preview: string;
};

type AuthorCredit = { url: string; label: string; icon: string };

export default function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal State
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'pages'>('pages');
  
  // Upload Progress State
  const [uploadFiles, setUploadFiles] = useState<UploadFileStatus[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [pageItems, setPageItems] = useState<PageItem[]>([]);
  const [coverItem, setCoverItem] = useState<PageItem | null>(null);
  const [credits, setCredits] = useState<AuthorCredit[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState("");

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin?callbackUrl=/dashboard/submissions");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/tags')
        ]);
        
        if (catRes.ok) setCategories(await catRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}`);
        if (!res.ok) {
          if (res.status === 403) {
            router.push("/dashboard/submissions");
            return;
          }
          throw new Error("Failed to fetch submission");
        }
        
        const data = await res.json();
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setDescription(data.description || "");
        setCategoryId(data.categoryId || "");
        setSelectedTags(data.tags || []);
        setSubmissionStatus(data.status);
        
        // Set cover
        if (data.coverImage) {
          setCoverItem({
            id: 'cover-existing',
            type: 'url',
            content: data.coverImage,
            preview: data.coverImage
          });
        }
        
        // Set pages
        if (data.pages && Array.isArray(data.pages)) {
          setPageItems(data.pages.map((url: string, index: number) => ({
            id: `existing-${index}-${Date.now()}`,
            type: 'url',
            content: url,
            preview: url
          })));
        }
        
        // Set credits
        if (data.authorCredits) {
          try {
            setCredits(JSON.parse(data.authorCredits));
          } catch {}
        }
        
      } catch (err) {
        console.error("Failed to fetch submission:", err);
        setError("Failed to load submission");
      } finally {
        setLoadingSubmission(false);
      }
    };
    
    if (session && submissionId) {
      fetchSubmission();
    }
  }, [session, submissionId, router]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPageItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddItems = (newItems: { type: 'url' | 'file'; content: string | File }[]) => {
    const processedItems: PageItem[] = newItems.map((item, index) => ({
      id: `new-${Date.now()}-${index}`,
      type: item.type,
      content: item.content,
      preview: item.type === 'file' 
        ? URL.createObjectURL(item.content as File)
        : item.content as string
    }));

    if (uploadTarget === 'cover') {
      if (coverItem?.type === 'file') {
        URL.revokeObjectURL(coverItem.preview);
      }
      setCoverItem(processedItems[0]);
    } else {
      setPageItems(prev => [...prev, ...processedItems]);
    }
  };

  const handleRemovePage = (id: string) => {
    setPageItems(prev => {
      const item = prev.find(p => p.id === id);
      if (item?.type === 'file') {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleRemoveCover = () => {
    if (coverItem?.type === 'file') {
      URL.revokeObjectURL(coverItem.preview);
    }
    setCoverItem(null);
  };

  const handleAddCredit = () => setCredits([...credits, { url: "", label: "", icon: "" }]);
  const handleRemoveCredit = (index: number) => {
    const newCredits = [...credits];
    newCredits.splice(index, 1);
    setCredits(newCredits);
  };
  const handleCreditChange = (index: number, field: keyof AuthorCredit, value: string) => {
    const newCredits = [...credits];
    newCredits[index] = { ...newCredits[index], [field]: value };
    setCredits(newCredits);
  };

  const handleSubmit = async (e: React.FormEvent, submitForReview: boolean = false) => {
    e.preventDefault();
    if (!title || !coverItem) {
      setError("Title and Cover Image are required.");
      return;
    }
    if (pageItems.length === 0) {
      setError("At least one page is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Upload Cover if file
      let finalCoverUrl = "";
      if (coverItem.type === 'file') {
        const fd = new FormData();
        fd.append("files", coverItem.content as File);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Failed to upload cover image");
        const json = await res.json();
        finalCoverUrl = json.urls[0];
      } else {
        finalCoverUrl = coverItem.content as string;
      }

      // 2. Upload Page Files
      const fileItems = pageItems.filter(p => p.type === 'file');
      const filesToUpload = fileItems.filter(item => !uploadedUrls[item.id]);

      if (filesToUpload.length > 0) {
        setUploadFiles(prev => {
          const existing = new Map(prev.map(f => [f.id, f]));
          const newFiles = filesToUpload.map(item => ({
            id: item.id,
            name: (item.content as File).name,
            size: (item.content as File).size,
            progress: 0,
            status: 'pending' as const
          }));
          const merged = [...prev];
          newFiles.forEach(f => {
            if (!existing.has(f.id)) merged.push(f);
          });
          return merged;
        });

        const uploadFile = (item: PageItem) => {
          return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const fd = new FormData();
            fd.append("files", item.content as File);

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                setUploadFiles(prev => prev.map(f => 
                  f.id === item.id ? { ...f, progress, status: 'uploading' } : f
                ));
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  const url = response.urls[0];
                  setUploadedUrls(prev => ({ ...prev, [item.id]: url }));
                  setUploadFiles(prev => prev.map(f => 
                    f.id === item.id ? { ...f, progress: 100, status: 'completed' } : f
                  ));
                  resolve();
                } catch (e) {
                  reject(new Error('Invalid response'));
                }
              } else {
                setUploadFiles(prev => prev.map(f => 
                  f.id === item.id ? { ...f, status: 'error' } : f
                ));
                reject(new Error('Upload failed'));
              }
            };

            xhr.onerror = () => {
              setUploadFiles(prev => prev.map(f => 
                f.id === item.id ? { ...f, status: 'error' } : f
              ));
              reject(new Error('Network error'));
            };

            xhr.open("POST", "/api/upload");
            xhr.send(fd);
          });
        };

        for (const item of filesToUpload) {
          await uploadFile(item);
        }
      }

      const finalPages = pageItems.map(item => {
        if (item.type === 'url') return item.content as string;
        return uploadedUrls[item.id];
      });

      if (finalPages.some(p => !p)) {
        throw new Error("Some pages are missing. Please retry uploading.");
      }

      const selectedTagIds = selectedTags.map((t) => t.id);

      const body = {
        title,
        description,
        coverImage: finalCoverUrl,
        pages: finalPages,
        categoryId: categoryId || null,
        tagIds: selectedTagIds,
        authorCredits: JSON.stringify(credits),
        status: submitForReview ? "PENDING" : "DRAFT",
      };

      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to update submission");
      }
      
      setNotificationType('success');
      setNotificationTitle(submitForReview ? 'Submitted for Review' : 'Saved');
      setNotificationMessage(submitForReview 
        ? 'Your submission has been sent for review.' 
        : 'Your changes have been saved.');
      setNotificationOpen(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setNotificationType('error');
      setNotificationTitle('Error');
      setNotificationMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      setNotificationOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => setNotificationOpen(false);
  const handleGoToDashboard = () => {
    setNotificationOpen(false);
    router.push("/dashboard/submissions");
  };

  if (status === "loading" || loadingData || loadingSubmission) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const canEdit = submissionStatus === 'PENDING' || submissionStatus === 'DRAFT' || submissionStatus === 'CHANGE_REQUESTED';

  if (!canEdit) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">ไม่สามารถแก้ไข submission ในสถานะนี้ได้</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box component="form" onSubmit={(e) => handleSubmit(e, false)}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Edit Submission
            </Typography>
            <Typography variant="body1" color="text.secondary">
              แก้ไขรายละเอียด submission ของคุณ
            </Typography>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>
            </Grid>
          )}

          {/* General Info */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717' }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                General Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    required
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    variant="filled"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="filled">
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disableUnderline
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={tags}
                    getOptionLabel={(option) => option.name}
                    value={selectedTags}
                    onChange={(event, newValue) => setSelectedTags(newValue)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="filled"
                        label="Tags"
                        placeholder="Select tags"
                        InputProps={{ ...params.InputProps, disableUnderline: true, sx: { borderRadius: 1 } }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Media Assets */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717', height: '100%' }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                Media Assets
              </Typography>
              
              {/* Cover Image */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="h4" gutterBottom>Cover Image *</Typography>
                
                {!coverItem ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => { setUploadTarget('cover'); setUploadModalOpen(true); }}
                    sx={{ height: 120, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 1, color: 'text.secondary', flexDirection: 'column', gap: 1 }}
                  >
                    <AddPhotoAlternateIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                    Add Cover Image
                  </Button>
                ) : (
                  <Box sx={{ position: 'relative', width: '100%', maxWidth: 200, margin: '0 auto', borderRadius: 1, overflow: 'hidden', boxShadow: 3 }}>
                    <Box component="img" src={coverItem.preview} alt="Cover preview" sx={{ width: '100%', height: 'auto', display: 'block' }} />
                    <IconButton 
                      aria-label="Remove cover image"
                      size="small" 
                      onClick={handleRemoveCover}
                      sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.8)' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Pages */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" component="h4">Pages ({pageItems.length}) *</Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => { setUploadTarget('pages'); setUploadModalOpen(true); }}
                    sx={{ color: '#fbbf24' }}
                  >
                    Add Pages
                  </Button>
                </Box>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pageItems.map(p => p.id)} strategy={rectSortingStrategy}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1 }}>
                      {pageItems.map((item, index) => (
                        <SortableItem 
                          key={item.id} 
                          id={item.id} 
                          src={item.preview} 
                          index={index}
                          onRemove={() => handleRemovePage(item.id)}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>

                {pageItems.length === 0 && (
                  <Box sx={{ p: 4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 1, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">No pages added yet.</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Author Credits */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717' }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                Author Credits
              </Typography>
              <Stack spacing={2}>
                {credits.map((credit, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="URL"
                          value={credit.url}
                          onChange={(e) => handleCreditChange(index, "url", e.target.value)}
                          fullWidth
                          size="small"
                          variant="filled"
                          InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Label"
                          value={credit.label}
                          onChange={(e) => handleCreditChange(index, "label", e.target.value)}
                          fullWidth
                          size="small"
                          variant="filled"
                          InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={10} sm={3}>
                        <TextField
                          label="Icon URL"
                          value={credit.icon}
                          onChange={(e) => handleCreditChange(index, "icon", e.target.value)}
                          fullWidth
                          size="small"
                          variant="filled"
                          InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={2} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton aria-label="Remove credit" color="error" onClick={() => handleRemoveCredit(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button 
                  variant="outlined" 
                  onClick={handleAddCredit} 
                  sx={{ alignSelf: "flex-start", borderRadius: 1, borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary' }}
                >
                  Add Author Credit
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Submit Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="text"
              color="inherit"
              onClick={() => router.push("/dashboard/submissions")}
              disabled={isSubmitting}
              sx={{ borderRadius: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outlined"
              disabled={isSubmitting}
              sx={{ borderRadius: 1, borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary' }}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                borderRadius: 1, 
                bgcolor: '#fbbf24', 
                color: '#000',
                px: 4,
                py: 1.5,
                '&:hover': { bgcolor: '#f59e0b' }
              }}
            >
              {isSubmitting ? "Saving..." : "Submit for Review"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onAdd={handleAddItems}
        title={uploadTarget === 'cover' ? "Set Cover Image" : "Add Pages"}
        multiple={uploadTarget === 'pages'}
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notificationOpen}
        onClose={handleCloseNotification}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        primaryAction={notificationType === 'success' ? {
          label: "Go to Dashboard",
          onClick: handleGoToDashboard
        } : {
          label: "Close",
          onClick: handleCloseNotification
        }}
      />

      {/* Upload Progress */}
      <UploadProgress files={uploadFiles} />
    </Container>
  );
}
