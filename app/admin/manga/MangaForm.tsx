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
import NotificationModal from "../components/NotificationModal";

type MangaFormProps = {
  manga?: Manga & { tags: Tag[] };
  categories: Category[];
  tags: Tag[];
};

export default function MangaForm({ manga, categories, tags }: MangaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [createdMangaId, setCreatedMangaId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState(manga?.title || "");

    const [slug, setSlug] = useState(manga?.slug || "");
    const [description, setDescription] = useState(manga?.description || "");
    const [coverImage, setCoverImage] = useState(manga?.coverImage || "");
    const parsePagesToString = (p: unknown) => {
      if (!p) return "";
      if (Array.isArray(p)) return (p as string[]).join("\n");
      if (typeof p === "string") {
        try {
          const parsed = JSON.parse(p);
          if (Array.isArray(parsed)) return parsed.join("\n");
          return p;
        } catch {
          return p;
        }
      }
      return "";
    };

    const [pages, setPages] = useState(parsePagesToString(manga?.pages));
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pageFiles, setPageFiles] = useState<File[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [pageFilePreviews, setPageFilePreviews] = useState<string[]>([]);
    const [coverUrlPreview, setCoverUrlPreview] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState(manga?.categoryId || "");

    const [selectedTags, setSelectedTags] = useState<Tag[]>(manga?.tags || []);

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

    const handleAddCredit = () => {
      setCredits([...credits, { url: "", label: "", icon: "" }]);
    };

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
        console.error("Error fetching credit info:", error);
        // Optional: Show error toast
      }
    };

    // Generate object URL previews for selected files
    useEffect(() => {
      if (coverFile) {
        const url = URL.createObjectURL(coverFile);
        setCoverPreview(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setCoverPreview(null);
      }
    }, [coverFile]);

    useEffect(() => {
      // revoke previous
      pageFilePreviews.forEach((p) => URL.revokeObjectURL(p));
      if (pageFiles && pageFiles.length > 0) {
        const urls = pageFiles.map((f) => URL.createObjectURL(f));
        setPageFilePreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
      } else {
        setPageFilePreviews([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageFiles]);

    // try to preload coverImage URL (for relative /uploads or absolute URLs)
    useEffect(() => {
      if (coverPreview) {
        setCoverUrlPreview(null);
        return;
      }
      if (!coverImage) {
        setCoverUrlPreview(null);
        return;
      }
      let cancelled = false;
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setCoverUrlPreview(coverImage);
      };
      img.onerror = () => {
        if (!cancelled) setCoverUrlPreview(null);
      };
      img.src = coverImage;
      return () => {
        cancelled = true;
      };
    }, [coverImage, coverPreview]);

    const handleSubmitWithDraft = async (e: React.FormEvent, saveAsDraft: boolean) => {
      e.preventDefault();
      if (!title || (!coverImage && !coverFile)) {
        setError("Title and either Cover Image URL or Cover File are required.");
        return;
      }
      if (!slug) {
        setError("Slug is required.");
        return;
      }
      setIsSubmitting(true);
      setError("");
      const pagesArray = pages.split("\n").filter((p) => p.trim() !== "");
      let uploadedPageUrls: string[] = [];
      let uploadedCoverUrl: string | undefined;

      try {
        // Upload cover file if provided
        if (coverFile) {
          const fd = new FormData();
          fd.append("files", coverFile);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Failed to upload cover image");
          const json = await res.json();
          uploadedCoverUrl = json.urls && json.urls[0];
        }

        // Upload page files if any
        if (pageFiles && pageFiles.length > 0) {
          const fd = new FormData();
          for (const f of pageFiles) fd.append("files", f);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Failed to upload page files");
          const json = await res.json();
          uploadedPageUrls = json.urls || [];
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsSubmitting(false);
      
      // Show error modal
      setModalType('error');
      setModalTitle('Upload Failed');
      setModalMessage(err instanceof Error ? err.message : "Failed to upload files.");
      setModalOpen(true);
      return;
    }
    const selectedTagIds = selectedTags.map((t) => t.id);

    const finalPages = [...pagesArray, ...uploadedPageUrls];

    const body = {
      title,
      slug,
      description,
      coverImage: uploadedCoverUrl || coverImage,
      pages: finalPages,
      categoryId: categoryId || null,
      isHidden: saveAsDraft,

      selectedTags: selectedTagIds,
      authorCredits: JSON.stringify(credits),
    };
    const url = manga ? `/api/manga/${manga.id}` : "/api/manga";
    const method = manga ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || "Failed to save manga");
      }
      
      // Success
      const data = await response.json();
      setCreatedMangaId(data.id);
      
      setModalType('success');
      setModalTitle(manga ? 'Manga Updated' : 'Manga Created');
      setModalMessage(manga 
        ? `Successfully updated "${title}".` 
        : `Successfully created "${title}". It is now available in the library.`);
      setModalOpen(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(err instanceof Error ? err.message : "An unexpected error occurred while saving.");
      setModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (modalType === 'success') {
       // If it was a success, we might want to redirect or reset, but user can choose via buttons
       // Default behavior if they just click outside: do nothing or redirect?
       // Let's keep it open or let them choose. 
       // Actually, usually clicking outside closes it. 
       // If success, let's redirect to admin list if they close it without choosing?
       // Or maybe just stay there. Let's stay there.
    }
  };

  const handleGoToList = () => {
    setModalOpen(false);
    router.push("/admin");
    router.refresh();
  };

  const handleAddAnother = () => {
    setModalOpen(false);
    // Reset form if needed, or just keep it open. 
    // If we want to reset, we need to clear all states.
    // For now, let's just reload the page to clear everything for a fresh start
    window.location.reload(); 
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
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
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
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
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

              {/* Author Credits Section (Moved here or keep at bottom? User mockup said bottom section. Let's put it below General Info in the left column or full width below. Mockup said "Bottom Section". Let's put it full width below columns) */}
            </Grid>

            {/* Right Column: Media Assets */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717', height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Media Assets
                </Typography>
                
                {/* Cover Image */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>Cover Image</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Cover Image URL"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        fullWidth
                        size="small"
                        variant="filled"
                        InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ 
                          height: 100, 
                          borderStyle: 'dashed', 
                          borderColor: 'rgba(255,255,255,0.2)',
                          borderRadius: 1,
                          color: 'text.secondary',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        {coverFile ? coverFile.name : "Upload Cover File"}
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>(Click to browse)</Typography>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setCoverFile(e.target.files ? e.target.files[0] : null)}
                        />
                      </Button>
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                      {(coverPreview || coverUrlPreview) && (
                        <Box sx={{ position: 'relative', width: 140, borderRadius: 1, overflow: 'hidden', boxShadow: 3 }}>
                          <Box 
                            component="img" 
                            src={coverPreview || coverUrlPreview || ''} 
                            alt="Cover preview" 
                            sx={{ width: '100%', height: 'auto', display: 'block' }} 
                          />
                          {coverFile && (
                            <IconButton 
                              size="small" 
                              onClick={() => setCoverFile(null)}
                              sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                {/* Pages */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Pages</Typography>
                  <TextField
                    label="Page Image URLs (one per line)"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    variant="filled"
                    size="small"
                    InputProps={{ disableUnderline: true, sx: { borderRadius: 1, mb: 2 } }}
                    placeholder="https://..."
                  />
                  
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ 
                      height: 80, 
                      borderStyle: 'dashed', 
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 1,
                      color: 'text.secondary',
                      mb: 2
                    }}
                  >
                    Upload Page Files
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={(e) => setPageFiles(e.target.files ? Array.from(e.target.files) : [])}
                    />
                  </Button>

                  {/* Previews Grid */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1 }}>
                    {/* File Previews */}
                    {pageFilePreviews.map((src, i) => (
                      <Box key={`file-${i}`} sx={{ position: 'relative', aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', bgcolor: '#000' }}>
                        <Box component="img" src={src} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          bgcolor: 'rgba(0,0,0,0.6)', 
                          color: '#fff', 
                          fontSize: '0.75rem', 
                          textAlign: 'center',
                          py: 0.5
                        }}>
                          {i + 1}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newFiles = [...pageFiles];
                            newFiles.splice(i, 1);
                            setPageFiles(newFiles);
                          }}
                          sx={{ position: 'absolute', top: 2, right: 2, p: 0.5, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                    {/* URL Previews */}
                    {pages.split('\n').filter(Boolean).map((p, i) => (
                      <Box key={`url-${i}`} sx={{ position: 'relative', aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', bgcolor: '#000' }}>
                        <Box component="img" src={p} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          bgcolor: 'rgba(0,0,0,0.6)', 
                          color: '#fff', 
                          fontSize: '0.75rem', 
                          textAlign: 'center',
                          py: 0.5
                        }}>
                          {pageFilePreviews.length + i + 1}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Bottom: Author Credits */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#171717' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontSize: '1rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
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
                                    <IconButton onClick={() => handleFetchCreditInfo(index)} edge="end" disabled={!credit.url}>
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
                          <IconButton color="error" onClick={() => handleRemoveCredit(index)}>
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
        <NotificationModal
          open={modalOpen}
          onClose={handleCloseModal}
          type={modalType}
          title={modalTitle}
          message={modalMessage}
          primaryAction={modalType === 'success' ? {
            label: "Go to List",
            onClick: handleGoToList
          } : {
            label: "Close",
            onClick: handleCloseModal
          }}
          secondaryAction={modalType === 'success' && !manga ? {
            label: "Add Another",
            onClick: handleAddAnother
          } : undefined}
        />
      </>
    );
  }

