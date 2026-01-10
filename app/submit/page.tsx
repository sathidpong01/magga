"use client";

import { useState, useEffect } from "react";
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
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import NotificationModal from "../admin/components/NotificationModal";
import UploadModal from "../admin/components/UploadModal";
import { SortableItem } from "../admin/components/SortableItem";
import UploadProgress, {
  UploadFileStatus,
} from "../components/ui/UploadProgress";
import { useSession } from "next-auth/react";
import { submitManga, createAuthor } from "@/app/actions/submit";
import { createFilterOptions } from "@mui/material";

// DnD Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };
type Author = { id: string; name: string; profileUrl?: string | null; iconUrl?: string | null };

type PageItem = {
  id: string;
  type: "url" | "file";
  content: string | File;
  preview: string;
};

export default function SubmitMangaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const authorFilter = createFilterOptions<Author>();

  // Modal State
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success"
  );
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<"cover" | "pages">("pages");

  // Upload Progress State
  const [uploadFiles, setUploadFiles] = useState<UploadFileStatus[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // New Category/Tag State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Page State
  const [pageItems, setPageItems] = useState<PageItem[]>([]);

  // Cover State
  const [coverItem, setCoverItem] = useState<PageItem | null>(null);

  // Author Credits State
  type AuthorCredit = { url: string; label: string; icon: string };
  const [credits, setCredits] = useState<AuthorCredit[]>([]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin?callbackUrl=/submit");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes, authorRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
          fetch("/api/authors"),
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (tagRes.ok) setTags(await tagRes.json());
        if (authorRes.ok) setAuthors(await authorRes.json());
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

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

  const handleAddItems = (
    newItems: { type: "url" | "file"; content: string | File }[]
  ) => {
    const processedItems: PageItem[] = newItems.map((item, index) => ({
      id: `new-${Date.now()}-${index}`,
      type: item.type,
      content: item.content,
      preview:
        item.type === "file"
          ? URL.createObjectURL(item.content as File)
          : (item.content as string),
    }));

    if (uploadTarget === "cover") {
      if (coverItem?.type === "file") {
        URL.revokeObjectURL(coverItem.preview);
      }
      setCoverItem(processedItems[0]);
    } else {
      setPageItems((prev) => [...prev, ...processedItems]);
    }
  };

  const handleRemovePage = (id: string) => {
    setPageItems((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.type === "file") {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleRemoveCover = () => {
    if (coverItem?.type === "file") {
      URL.revokeObjectURL(coverItem.preview);
    }
    setCoverItem(null);
  };

  useEffect(() => {
    return () => {
      pageItems.forEach((item) => {
        if (item.type === "file") URL.revokeObjectURL(item.preview);
      });
      if (coverItem?.type === "file") URL.revokeObjectURL(coverItem.preview);
    };
  }, []);

  // Credit Handlers
  const handleAddCredit = () =>
    setCredits([...credits, { url: "", label: "", icon: "" }]);
  const handleRemoveCredit = (index: number) => {
    const newCredits = [...credits];
    newCredits.splice(index, 1);
    setCredits(newCredits);
  };
  const handleCreditChange = (
    index: number,
    field: keyof AuthorCredit,
    value: string
  ) => {
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
    } catch (error) {}
  };

  const handleCreateAuthor = async (inputValue: string) => {
    try {
      const result = await createAuthor(inputValue);
      if (result.error) throw new Error(result.error);
      if (result.author) {
        setAuthors((prev) => [...prev, result.author]);
        setSelectedAuthor(result.author);
      }
    } catch (error) {
      console.error("Error creating author:", error);
      setError("Failed to create author");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      // 1. Upload Cover
      let finalCoverUrl = "";
      if (coverItem.type === "file") {
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
      const fileItems = pageItems.filter((p) => p.type === "file");
      const filesToUpload = fileItems.filter((item) => !uploadedUrls[item.id]);

      if (filesToUpload.length > 0) {
        // Initialize progress state
        setUploadFiles((prev) => {
          const existing = new Map(prev.map((f) => [f.id, f]));
          const newFiles = filesToUpload.map((item) => ({
            id: item.id,
            name: (item.content as File).name,
            size: (item.content as File).size,
            progress: 0,
            status: "pending" as const,
          }));
          const merged = [...prev];
          newFiles.forEach((f) => {
            if (!existing.has(f.id)) merged.push(f);
          });
          return merged;
        });

        // Upload with XHR for progress tracking
        const uploadFile = (item: PageItem) => {
          return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const fd = new FormData();
            fd.append("files", item.content as File);

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                setUploadFiles((prev) =>
                  prev.map((f) =>
                    f.id === item.id
                      ? { ...f, progress, status: "uploading" }
                      : f
                  )
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  const url = response.urls[0];
                  setUploadedUrls((prev) => ({ ...prev, [item.id]: url }));
                  setUploadFiles((prev) =>
                    prev.map((f) =>
                      f.id === item.id
                        ? { ...f, progress: 100, status: "completed" }
                        : f
                    )
                  );
                  resolve();
                } catch (e) {
                  reject(new Error("Invalid response"));
                }
              } else {
                setUploadFiles((prev) =>
                  prev.map((f) =>
                    f.id === item.id ? { ...f, status: "error" } : f
                  )
                );
                reject(new Error("Upload failed"));
              }
            };

            xhr.onerror = () => {
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id ? { ...f, status: "error" } : f
                )
              );
              reject(new Error("Network error"));
            };

            xhr.open("POST", "/api/upload");
            xhr.send(fd);
          });
        };

        // Upload concurrently (3 at a time)
        const queue = [...filesToUpload];
        const activeUploads = new Set<Promise<void>>();
        const CONCURRENCY = 3;
        let hasErrors = false;

        while (queue.length > 0 || activeUploads.size > 0) {
          while (queue.length > 0 && activeUploads.size < CONCURRENCY) {
            const item = queue.shift()!;
            const promise = uploadFile(item)
              .then(() => {
                activeUploads.delete(promise);
              })
              .catch(() => {
                activeUploads.delete(promise);
                hasErrors = true;
              });
            activeUploads.add(promise);
          }
          if (activeUploads.size > 0) {
            await Promise.race(activeUploads);
          }
        }

        if (hasErrors) {
          throw new Error("Some files failed to upload. Please retry.");
        }
      }

      // Reconstruct pages with uploaded URLs
      const finalPages = pageItems.map((item) => {
        if (item.type === "url") return item.content as string;
        return uploadedUrls[item.id];
      });

      if (finalPages.some((p) => !p)) {
        throw new Error("Some pages are missing. Please retry uploading.");
      }

      const selectedTagIds = selectedTags.map((t) => t.id);

      // Handle new tags if any (simplified: assume only existing for now or handle in API)
      // For this implementation, we'll send IDs. If we want to support creating new tags on the fly,
      // we'd need to handle that. Let's assume user can only select existing or we send names.
      // The current API expects IDs.

      // Use Server Action instead of fetch
      const result = await submitManga({
        title,
        slug: slug || undefined,
        description,
        coverImage: finalCoverUrl,
        pages: finalPages as string[],
        categoryId: categoryId || null,
        authorId: selectedAuthor?.id || null,
        tagIds: selectedTagIds,
        authorCredits: JSON.stringify(credits),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setNotificationType("success");
      setNotificationTitle("Submission Received");
      setNotificationMessage(
        "Your manga has been submitted successfully and is pending review."
      );
      setNotificationOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setNotificationType("error");
      setNotificationTitle("Error");
      setNotificationMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setNotificationOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  const handleGoToDashboard = () => {
    setNotificationOpen(false);
    router.push("/dashboard/submissions");
  };

  if (status === "loading" || loadingData) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 8, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              Submit Manga
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Share your manga with the community. All submissions are reviewed
              before publishing.
            </Typography>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Left Column: General Info */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 1, bgcolor: "#171717" }}
            >
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  mb: 3,
                  fontSize: "1rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
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
                    InputProps={{
                      disableUnderline: true,
                      sx: { borderRadius: 1 },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Slug (Optional)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    fullWidth
                    variant="filled"
                    helperText={
                      slug
                        ? `Preview: /manga/${slug}`
                        : "Leave empty to auto-generate from title"
                    }
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    variant="filled"
                    InputProps={{
                      disableUnderline: true,
                      sx: { borderRadius: 1 },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="filled">
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                      labelId="category-select-label"
                      id="category"
                      value={categoryId}
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
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="filled"
                        label="Tags"
                        placeholder="Select tags"
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: { borderRadius: 1 },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    value={selectedAuthor}
                    onChange={(event, newValue) => {
                      if (typeof newValue === "string") {
                        handleCreateAuthor(newValue);
                      } else if (newValue && (newValue as any).inputValue) {
                        handleCreateAuthor((newValue as any).inputValue);
                      } else {
                        setSelectedAuthor(newValue);
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = authorFilter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some(
                        (option) => option.name.toLowerCase() === inputValue.toLowerCase()
                      );
                      if (inputValue !== "" && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `Add "${inputValue}"`,
                          id: "new-author",
                        } as any);
                      }
                      return filtered;
                    }}
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    id="author-autocomplete"
                    options={authors}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      if ((option as any).inputValue) return (option as any).inputValue;
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
                        label="Author"
                        variant="filled"
                        placeholder="Select or create author"
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: { borderRadius: 1 },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Column: Media Assets */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 1, bgcolor: "#171717", height: "100%" }}
            >
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  mb: 3,
                  fontSize: "1rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Media Assets
              </Typography>

              {/* Cover Image */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="h4" gutterBottom>
                  Cover Image *
                </Typography>

                {!coverItem ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setUploadTarget("cover");
                      setUploadModalOpen(true);
                    }}
                    sx={{
                      height: 120,
                      borderStyle: "dashed",
                      borderColor: "rgba(255,255,255,0.2)",
                      borderRadius: 1,
                      color: "text.secondary",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <AddPhotoAlternateIcon
                      sx={{ fontSize: 40, opacity: 0.5 }}
                    />
                    Add Cover Image
                  </Button>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 200,
                      margin: "0 auto",
                      borderRadius: 1,
                      overflow: "hidden",
                      boxShadow: 3,
                    }}
                  >
                    <Box
                      component="img"
                      src={coverItem.preview}
                      alt="Cover preview"
                      sx={{ width: "100%", height: "auto", display: "block" }}
                    />
                    <IconButton
                      aria-label="Remove cover image"
                      size="small"
                      onClick={handleRemoveCover}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(0,0,0,0.6)",
                        "&:hover": { bgcolor: "rgba(220, 38, 38, 0.8)" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Pages */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" component="h4">
                    Pages ({pageItems.length}) *
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => {
                      setUploadTarget("pages");
                      setUploadModalOpen(true);
                    }}
                    sx={{ color: "#fbbf24" }}
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
                    items={pageItems.map((p) => p.id)}
                    strategy={rectSortingStrategy}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(80px, 1fr))",
                        gap: 1,
                      }}
                    >
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
                  <Box
                    sx={{
                      p: 4,
                      border: "1px dashed rgba(255,255,255,0.1)",
                      borderRadius: 1,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body2">No pages added yet.</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Bottom: Author Credits */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 1, bgcolor: "#171717" }}
            >
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{
                  mb: 3,
                  fontSize: "1rem",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Author Credits
              </Typography>
              <Stack spacing={2}>
                {credits.map((credit, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          label="URL"
                          value={credit.url}
                          onChange={(e) =>
                            handleCreditChange(index, "url", e.target.value)
                          }
                          fullWidth
                          size="small"
                          variant="filled"
                          InputProps={{
                            disableUnderline: true,
                            sx: { borderRadius: 1 },
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Auto-fetch Title & Icon">
                                  <IconButton
                                    aria-label="Fetch credit info"
                                    onClick={() => handleFetchCreditInfo(index)}
                                    edge="end"
                                    disabled={!credit.url}
                                  >
                                    <AutoFixHighIcon />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Label"
                          value={credit.label}
                          onChange={(e) =>
                            handleCreditChange(index, "label", e.target.value)
                          }
                          fullWidth
                          size="small"
                          variant="filled"
                          InputProps={{
                            disableUnderline: true,
                            sx: { borderRadius: 1 },
                          }}
                        />
                      </Grid>
                      <Grid item xs={10} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Icon URL"
                            value={credit.icon}
                            onChange={(e) =>
                              handleCreditChange(index, "icon", e.target.value)
                            }
                            fullWidth
                            size="small"
                            variant="filled"
                            InputProps={{
                              disableUnderline: true,
                              sx: { borderRadius: 1 },
                            }}
                          />
                          {credit.icon && (
                            <Box
                              component="img"
                              src={credit.icon}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                              }}
                            />
                          )}
                        </Stack>
                      </Grid>
                      <Grid
                        item
                        xs={2}
                        sm={1}
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <IconButton
                          aria-label="Remove credit"
                          color="error"
                          onClick={() => handleRemoveCredit(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  onClick={handleAddCredit}
                  sx={{
                    alignSelf: "flex-start",
                    borderRadius: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "text.secondary",
                  }}
                >
                  Add Author Credit
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Submit Button */}
          <Grid
            item
            xs={12}
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
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
              variant="contained"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
              sx={{
                borderRadius: 1,
                bgcolor: "#fbbf24",
                color: "#000",
                px: 4,
                py: 1.5,
                "&:hover": { bgcolor: "#f59e0b" },
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Manga"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onAdd={handleAddItems}
        title={uploadTarget === "cover" ? "Set Cover Image" : "Add Pages"}
        multiple={uploadTarget === "pages"}
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notificationOpen}
        onClose={handleCloseNotification}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        primaryAction={
          notificationType === "success"
            ? {
                label: "Go to Dashboard",
                onClick: handleGoToDashboard,
              }
            : {
                label: "Close",
                onClick: handleCloseNotification,
              }
        }
      />

      {/* Upload Progress Indicator */}
      <UploadProgress files={uploadFiles} />
    </Container>
  );
}
