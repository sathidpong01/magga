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

type MangaFormProps = {
  manga?: Manga & { tags: Tag[] };
  categories: Category[];
  tags: Tag[];
};

export default function MangaForm({ manga, categories, tags }: MangaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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

        router.push("/admin");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {manga ? "Edit Manga" : "Create New Manga"}
        </Typography>
        <form onSubmit={(e) => handleSubmitWithDraft(e, false)}>
          <Grid container spacing={3}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Slug (URL)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                fullWidth
                required
                helperText={`Preview: /manga/${slug}`}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Generate from Title">
                        <IconButton
                          onClick={() => {
                            const newSlug = title
                              .toLowerCase()
                              .trim()
                              .replace(/[\s]+/g, "-")
                              .replace(/[^\w\-\u0E00-\u0E7F]+/g, "") // Keep Thai chars
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Cover Image URL"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                fullWidth
                required={!coverFile}
                type="text"
                helperText="Absolute URL or relative path (e.g. /uploads/xxxx.jpg)"
              />
            </Grid>
            <Grid item xs={12}>
              <input
                id="cover-file"
                type="file"
                accept="image/*"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoverFile(e.target.files ? e.target.files[0] : null)}
              />
              <Typography variant="caption" display="block">
                Optional: upload a cover image file (selected file overrides Cover Image URL on submit).
              </Typography>
              {coverPreview ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption">Cover preview (selected):</Typography>
                  <Box component="img" src={coverPreview} alt="cover preview" sx={{ display: 'block', width: 120, height: 160, objectFit: 'cover', mt: 1 }} />
                  <Button size="small" onClick={() => setCoverFile(null)} sx={{ mt: 1 }}>Remove</Button>
                </Box>
              ) : coverUrlPreview ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption">Current cover:</Typography>
                  <Box component="img" src={coverUrlPreview} alt="current cover" sx={{ display: 'block', width: 120, height: 160, objectFit: 'cover', mt: 1 }} />
                </Box>
              ) : null}
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Page Image URLs (one per line)"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                fullWidth
                multiline
                rows={8}
                placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg&#10;..."
              />
            </Grid>
            <Grid item xs={12}>
              <input
                id="page-files"
                type="file"
                accept="image/*"
                multiple
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPageFiles(e.target.files ? Array.from(e.target.files) : [])}
              />
              <Typography variant="caption" display="block">
                Optional: select multiple page image files to upload. They will be appended to the pages list.
              </Typography>
              {pageFilePreviews.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption">Selected page files preview:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {pageFilePreviews.map((src, i) => (
                      <Box key={i} sx={{ position: 'relative' }}>
                        <Box component="img" src={src} alt={`page ${i + 1}`} sx={{ width: 120, height: 160, objectFit: 'cover', display: 'block' }} />
                        <Button size="small" onClick={() => {
                          const newFiles = [...pageFiles];
                          newFiles.splice(i, 1);
                          setPageFiles(newFiles);
                        }}>
                          Remove
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Show preview for URLs entered in the textarea (pages as URLs) */}
              {pages && pages.split('\n').filter(Boolean).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption">Pages from URLs preview:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {pages.split('\n').filter(Boolean).map((p, i) => (
                      <Box key={i}>
                        <Box component="img" src={p} alt={`page url ${i + 1}`} sx={{ width: 120, height: 160, objectFit: 'cover', display: 'block' }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category"
                  value={categoryId ?? ""}
                  label="Category"
                  onChange={(e) => setCategoryId(e.target.value)}
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
                    variant="outlined"
                    label="Tags"
                    placeholder="Select tags"
                  />
                )}
              />
            </Grid>

            {/* Author Credits Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Author Credits
              </Typography>
              <Stack spacing={2}>
                {credits.map((credit, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="URL"
                          value={credit.url}
                          onChange={(e) => handleCreditChange(index, "url", e.target.value)}
                          fullWidth
                          size="small"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Auto-fetch Title & Icon">
                                  <span>
                                    <IconButton
                                      onClick={() => handleFetchCreditInfo(index)}
                                      edge="end"
                                      disabled={!credit.url}
                                    >
                                      <AutoFixHighIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Label (Name)"
                          value={credit.label}
                          onChange={(e) => handleCreditChange(index, "label", e.target.value)}
                          fullWidth
                          size="small"
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
                          />
                          {credit.icon && (
                            <Box
                              component="img"
                              src={credit.icon}
                              alt="icon"
                              sx={{ width: 32, height: 32, borderRadius: "50%" }}
                            />
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={2} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveCredit(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button variant="outlined" onClick={handleAddCredit} sx={{ alignSelf: "flex-start" }}>
                  Add Author Credit
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => router.push("/admin")}
                  disabled={isSubmitting}
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
                  >
                    Save as Draft
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? "Saving..." : manga ? "Update Manga" : "Create Manga"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    );
  }

