"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Category, Tag, Manga } from "@prisma/client";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import NotificationModal from "../components/NotificationModal";
import UploadModal from "../components/UploadModal";
import { SortableItem } from "../components/SortableItem";

// DnD Kit Imports
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

type MangaFormProps = {
  manga?: Manga & { tags: Tag[] };
  categories: Category[];
  tags: Tag[];
};

type PageItem = {
  id: string;
  type: 'url' | 'file';
  content: string | File;
  preview: string;
};

export default function MangaForm({ manga, categories, tags }: MangaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Modal State
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'pages'>('pages');

  // Form State
  const [title, setTitle] = useState(manga?.title || "");
  const [slug, setSlug] = useState(manga?.slug || "");
  const [description, setDescription] = useState(manga?.description || "");
  const [categoryId, setCategoryId] = useState(manga?.categoryId || "");
  const [selectedTags, setSelectedTags] = useState<Tag[]>(manga?.tags || []);

  // Unified Page State
  const [pageItems, setPageItems] = useState<PageItem[]>(() => {
    if (!manga?.pages) return [];
    let initialPages: string[] = [];
    if (Array.isArray(manga.pages)) initialPages = manga.pages as string[];
    else if (typeof manga.pages === 'string') {
      try {
        const parsed = JSON.parse(manga.pages);
        if (Array.isArray(parsed)) initialPages = parsed;
      } catch {
        initialPages = [];
      }
    }
    
    return initialPages.map((url, index) => ({
      id: `existing-${index}-${Date.now()}`,
      type: 'url',
      content: url,
      preview: url
    }));
  });

  // Cover State
  const [coverItem, setCoverItem] = useState<PageItem | null>(() => {
    if (manga?.coverImage) {
      return {
        id: 'cover-existing',
        type: 'url',
        content: manga.coverImage,
        preview: manga.coverImage
      };
    }
    return null;
  });

  // Author Credits State
  type AuthorCredit = { url: string; label: string; icon: string };
  const [credits, setCredits] = useState<AuthorCredit[]>(() => {
    if (!manga?.authorCredits) return [];
    try {
      return JSON.parse(manga.authorCredits);
    } catch {
      return [];
    }
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      // Replace existing cover
      if (coverItem?.type === 'file') {
        URL.revokeObjectURL(coverItem.preview);
      }
      setCoverItem(processedItems[0]); // Take only the first one for cover
    } else {
      // Append to pages
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pageItems.forEach(item => {
        if (item.type === 'file') URL.revokeObjectURL(item.preview);
      });
      if (coverItem?.type === 'file') URL.revokeObjectURL(coverItem.preview);
    };
  }, []);

  // Credit Handlers
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
  const handleFetchCreditInfo = async (index: number) => {
    const url = credits[index].url;
    if (!url) return;
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Failed to fetch metadata");
      const data = await res.json();
      const newCredits = [...credits];
      newCredits[index] = {
        ...newCredits[index],
        label: data.title || newCredits[index].label,
        icon: data.icon || newCredits[index].icon,
      };
      setCredits(newCredits);
    } catch (error) {

    }
  };

  const handleSubmitWithDraft = async (e: React.FormEvent, saveAsDraft: boolean) => {
    e.preventDefault();
    if (!title || !coverItem) {
      setError("Title and Cover Image are required.");
      return;
    }
    if (!slug) {
      setError("Slug is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Upload Cover if it's a file
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
      // We need to preserve order. We'll upload all files first, then reconstruct the array.
      // Optimization: Upload files in parallel or batch? 
      // Current API supports batch upload. Let's filter files, upload them, then map back.
      
      const fileItems = pageItems.filter(p => p.type === 'file');
      let uploadedFileUrls: string[] = [];
      
      if (fileItems.length > 0) {
        const fd = new FormData();
        fileItems.forEach(item => fd.append("files", item.content as File));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Failed to upload page files");
        const json = await res.json();
        uploadedFileUrls = json.urls;
      }

      // Reconstruct pages array in order
      let fileIndex = 0;
      const finalPages = pageItems.map(item => {
        if (item.type === 'url') return item.content as string;
        const url = uploadedFileUrls[fileIndex];
        fileIndex++;
        return url;
      });

      const selectedTagIds = selectedTags.map((t) => t.id);

      const body = {
        title,
        slug,
        description,
        coverImage: finalCoverUrl,
        pages: finalPages,
        categoryId: categoryId || null,
        isHidden: saveAsDraft,
        selectedTags: selectedTagIds,
        authorCredits: JSON.stringify(credits),
      };

      const url = manga ? `/api/manga/${manga.id}` : "/api/manga";
      const method = manga ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to save manga");
      }
      
      const data = await response.json();
      
      setNotificationType('success');
      setNotificationTitle(manga ? 'Manga Updated' : 'Manga Created');
      setNotificationMessage(manga 
        ? `Successfully updated "${title}".` 
        : `Successfully created "${title}".`);
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

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  const handleGoToList = () => {
    setNotificationOpen(false);
    router.push("/admin");
    router.refresh();
  };

  return (
    <>
      <Box component="form" onSubmit={(e) => handleSubmitWithDraft(e, false)}>
        <Grid container spacing={3}>
          {/* Header / Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              {manga ? "Edit Manga" : "Create New Manga"}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => router.push("/admin")}
                disabled={isSubmitting}
                sx={{ borderRadius: 1 }}
              >
                Cancel
              </Button>
              {!manga && (
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmitWithDraft(e, true);
                  }}
                  disabled={isSubmitting}
                  sx={{ borderRadius: 1, borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}
                >
                  Save Draft
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" aria-label="Saving..." /> : null}
                sx={{ 
                  borderRadius: 1, 
                  bgcolor: '#fbbf24', 
                  color: '#000',
                  '&:hover': { bgcolor: '#f59e0b' }
                }}
              >
                {isSubmitting ? "Saving..." : manga ? "Update Manga" : "Create Manga"}
              </Button>
            </Stack>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>
            </Grid>
          )}

          {/* Left Column: General Info */}
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
                    label="Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    fullWidth
                    required
                    variant="filled"
                    helperText={`Preview: /manga/${slug}`}
                    InputProps={{
                      disableUnderline: true,
                      sx: { borderRadius: 1 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Generate from Title">
                            <IconButton
                              aria-label="Generate slug"
                              onClick={() => {
                                const newSlug = title
                                  .toLowerCase()
                                  .trim()
                                  .replace(/[\s]+/g, "-")
                                  .replace(/[^\w\-\u0E00-\u0E7F]+/g, "")
                                  .replace(/\-\-+/g, "-");
                                setSlug(newSlug);
                              }}
                              edge="end"
                            >
                              <AutoFixHighIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={description ?? ""}
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
                      id="category"
                      value={categoryId ?? ""}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disableUnderline
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    id="tags-autocomplete"
                    options={tags}
                    getOptionLabel={(option) => option.name}
                    value={selectedTags}
                    onChange={(event, newValue) => {
                      setSelectedTags(newValue);
                    }}
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

          {/* Right Column: Media Assets */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717', height: '100%' }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                Media Assets
              </Typography>
              
              {/* Cover Image */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="h4" gutterBottom>Cover Image</Typography>
                
                {!coverItem ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setUploadTarget('cover');
                      setUploadModalOpen(true);
                    }}
                    sx={{ 
                      height: 120, 
                      borderStyle: 'dashed', 
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 1,
                      color: 'text.secondary',
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    <AddPhotoAlternateIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                    Add Cover Image
                  </Button>
                ) : (
                  <Box sx={{ position: 'relative', width: '100%', maxWidth: 200, margin: '0 auto', borderRadius: 1, overflow: 'hidden', boxShadow: 3 }}>
                    <Box 
                      component="img" 
                      src={coverItem.preview} 
                      alt="Cover preview" 
                      sx={{ width: '100%', height: 'auto', display: 'block' }} 
                    />
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
                  <Typography variant="subtitle1" component="h4">Pages ({pageItems.length})</Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => {
                      setUploadTarget('pages');
                      setUploadModalOpen(true);
                    }}
                    sx={{ color: '#fbbf24' }}
                  >
                    Add Pages
                  </Button>
                </Box>

                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={pageItems.map(p => p.id)} 
                    strategy={rectSortingStrategy}
                  >
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
                  <Box sx={{ 
                    p: 4, 
                    border: '1px dashed rgba(255,255,255,0.1)', 
                    borderRadius: 1, 
                    textAlign: 'center',
                    color: 'text.secondary'
                  }}>
                    <Typography variant="body2">No pages added yet.</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Bottom: Author Credits */}
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
                          InputProps={{ 
                            disableUnderline: true, 
                            sx: { borderRadius: 1 },
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Auto-fetch Title & Icon">
                                  <IconButton aria-label="Fetch credit info" onClick={() => handleFetchCreditInfo(index)} edge="end" disabled={!credit.url}>
                                    <AutoFixHighIcon />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            )
                          }}
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
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Icon URL"
                            value={credit.icon}
                            onChange={(e) => handleCreditChange(index, "icon", e.target.value)}
                            fullWidth
                            size="small"
                            variant="filled"
                            InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                          />
                          {credit.icon && (
                            <Box component="img" src={credit.icon} sx={{ width: 32, height: 32, borderRadius: "50%" }} />
                          )}
                        </Stack>
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
          label: "Go to List",
          onClick: handleGoToList
        } : {
          label: "Close",
          onClick: handleCloseNotification
        }}
      />
    </>
  );
}

