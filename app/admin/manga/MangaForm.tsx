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
  createFilterOptions,
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
import UploadProgress, { UploadFileStatus } from "@/app/components/ui/UploadProgress";

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
  const [uploadFiles, setUploadFiles] = useState<UploadFileStatus[]>([]);
  
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
  
  // Local state for options to allow immediate updates
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(categories);

  const filter = createFilterOptions<Tag>();
  const categoryFilter = createFilterOptions<Category>();

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

  const handleCreateTag = async (inputValue: string) => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputValue }),
      });
      if (!res.ok) throw new Error("Failed to create tag");
      const newTag = await res.json();
      setAvailableTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag]);
    } catch (error) {
      console.error("Error creating tag:", error);
      setError("Failed to create tag");
    }
  };

  const handleCreateCategory = async (inputValue: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputValue }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const newCategory = await res.json();
      setAvailableCategories((prev) => [...prev, newCategory]);
      setCategoryId(newCategory.id);
    } catch (error) {
      console.error("Error creating category:", error);
      setError("Failed to create category");
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

      // 2. Upload Page Files with Progress
      const fileItems = pageItems.filter(p => p.type === 'file');
      let uploadedFileUrls: Record<string, string> = {}; // Map id -> url

      if (fileItems.length > 0) {
        // Initialize progress state
        const initialStatus: UploadFileStatus[] = fileItems.map(item => ({
          id: item.id,
          name: (item.content as File).name,
          size: (item.content as File).size,
          progress: 0,
          status: 'pending'
        }));
        setUploadFiles(initialStatus);

        // Upload Queue Logic
        const queue = [...fileItems];
        const activeUploads = new Set<Promise<void>>();
        const CONCURRENCY = 3;

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
                  uploadedFileUrls[item.id] = response.urls[0];
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

        // Process queue
        while (queue.length > 0 || activeUploads.size > 0) {
          while (queue.length > 0 && activeUploads.size < CONCURRENCY) {
            const item = queue.shift()!;
            const promise = uploadFile(item).then(() => {
              activeUploads.delete(promise);
            }).catch((err) => {
              activeUploads.delete(promise);
              throw err; // Re-throw to stop process? Or continue? Let's stop on error.
            });
            activeUploads.add(promise);
          }
          
          if (activeUploads.size > 0) {
            await Promise.race(activeUploads);
          }
        }
      }

      // Reconstruct pages array in order
      const finalPages = pageItems.map(item => {
        if (item.type === 'url') return item.content as string;
        return uploadedFileUrls[item.id];
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
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717', minHeight: 600 }}>
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
                  <Autocomplete
                    value={availableCategories.find((c) => c.id === categoryId) || null}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        handleCreateCategory(newValue);
                      } else if (newValue && (newValue as any).inputValue) {
                        // Create a new value from the user input
                        handleCreateCategory((newValue as any).inputValue);
                      } else {
                        setCategoryId(newValue?.id || "");
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = categoryFilter(options, params);
                      const { inputValue } = params;
                      // Suggest the creation of a new value
                      const isExisting = options.some((option) => option.name === inputValue);
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `Add "${inputValue}"`,
                          id: "new-category",
                        } as any);
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    id="category-autocomplete"
                    options={availableCategories}
                    getOptionLabel={(option) => {
                      // Value selected with enter, right from the input
                      if (typeof option === 'string') {
                        return option;
                      }
                      // Add "xxx" option created dynamically
                      if ((option as any).inputValue) {
                        return (option as any).inputValue;
                      }
                      // Regular option
                      return option.name;
                    }}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li key={key} {...optionProps}>
                          {option.name}
                        </li>
                      );
                    }}
                    freeSolo
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Category" 
                        variant="filled"
                        InputProps={{ ...params.InputProps, disableUnderline: true, sx: { borderRadius: 1 } }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    id="tags-autocomplete"
                    options={availableTags}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      if ((option as any).inputValue) return (option as any).inputValue;
                      return option.name;
                    }}
                    value={selectedTags}
                    onChange={(event, newValue) => {
                      // Filter out any string values or special "Add" options and handle creation
                      const processedTags: Tag[] = [];
                      
                      newValue.forEach((item) => {
                        if (typeof item === 'string') {
                          handleCreateTag(item);
                        } else if ((item as any).inputValue) {
                          handleCreateTag((item as any).inputValue);
                        } else {
                          processedTags.push(item as Tag);
                        }
                      });
                      
                      // Update state only with valid existing tags
                      // New tags will be added via handleCreateTag
                      const validTags = newValue.filter(t => !(t as any).inputValue && typeof t !== 'string') as Tag[];
                      setSelectedTags(validTags);
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some((option) => option.name.toLowerCase() === inputValue.toLowerCase());
                      if (inputValue !== '' && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `Add "${inputValue}"`,
                          id: "new-tag",
                        } as any);
                      }
                      return filtered;
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li key={key} {...optionProps}>
                          {option.name}
                        </li>
                      );
                    }}
                    freeSolo
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



// ... (in render, inside Media Assets Paper)
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

                {/* Upload Progress */}
                {uploadFiles.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <UploadProgress files={uploadFiles} />
                  </Box>
                )}

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

