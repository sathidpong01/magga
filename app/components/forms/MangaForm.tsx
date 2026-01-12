"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Category, Tag, Manga, Author } from "@prisma/client";
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
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import NotificationModal from "@/app/components/modals/NotificationModal";
import { SortableItem } from "@/app/components/ui/SortableItem";
import UploadProgress, {
  UploadFileStatus,
} from "@/app/components/ui/UploadProgress";
import { authFetch } from "@/lib/auth-fetch";

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

type MangaFormProps = {
  manga?: Manga & { tags: Tag[]; author?: Author | null };
  mode: "admin" | "submission";
};

type PageItem = {
  id: string;
  type: "url" | "file";
  content: string | File;
  preview: string;
};

export default function MangaForm({ manga, mode }: MangaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadFiles, setUploadFiles] = useState<UploadFileStatus[]>([]);
  // Keep track of uploaded URLs to avoid re-uploading
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});

  // Data from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Modal State
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState<"success" | "error">(
    "success"
  );
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Form State
  const [title, setTitle] = useState(manga?.title || "");
  const [slug, setSlug] = useState(manga?.slug || "");
  const [description, setDescription] = useState(manga?.description || "");
  const [authorName, setAuthorName] = useState(
    (manga as any)?.authorName || ""
  ); // ชื่อผู้แต่ง
  const [categoryId, setCategoryId] = useState(manga?.categoryId || "");
  const [selectedTags, setSelectedTags] = useState<Tag[]>(manga?.tags || []);

  // Local state for options to allow immediate updates
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [availableAuthors, setAvailableAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(
    manga?.author || null
  );
  // Pending author name - will be created on form submit
  const [pendingAuthorName, setPendingAuthorName] = useState<string>("");

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes, authorRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
          fetch("/api/authors"),
        ]);

        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(cats);
          setAvailableCategories(cats);
        }
        if (tagRes.ok) {
          const tagsData = await tagRes.json();
          setTags(tagsData);
          setAvailableTags(tagsData);
        }
        if (authorRes.ok) {
          const authorsData = await authorRes.json();
          setAuthors(authorsData);
          setAvailableAuthors(authorsData);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const filter = createFilterOptions<Tag>();
  const categoryFilter = createFilterOptions<Category>();
  const authorFilter = createFilterOptions<Author>();

  // Unified Page State
  const [pageItems, setPageItems] = useState<PageItem[]>(() => {
    if (!manga?.pages) return [];
    let initialPages: string[] = [];
    if (Array.isArray(manga.pages)) initialPages = manga.pages as string[];
    else if (typeof manga.pages === "string") {
      try {
        const parsed = JSON.parse(manga.pages);
        if (Array.isArray(parsed)) initialPages = parsed;
      } catch {
        initialPages = [];
      }
    }

    return initialPages.map((url, index) => ({
      id: `existing-${index}-${Date.now()}`,
      type: "url",
      content: url,
      preview: url,
    }));
  });

  // Cover State
  const [coverItem, setCoverItem] = useState<PageItem | null>(() => {
    if (manga?.coverImage) {
      return {
        id: "cover-existing",
        type: "url",
        content: manga.coverImage,
        preview: manga.coverImage,
      };
    }
    return null;
  });

  // Author Credits State (uses socialLinks from Author model)
  type AuthorCredit = { url: string; label: string; icon: string };
  const [credits, setCredits] = useState<AuthorCredit[]>(() => {
    if (!manga?.author?.socialLinks) return [];
    try {
      return JSON.parse(manga.author.socialLinks);
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

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke old preview if exists
    if (coverItem?.type === "file") {
      URL.revokeObjectURL(coverItem.preview);
    }

    setCoverItem({
      id: `cover-${Date.now()}`,
      type: "file",
      content: file,
      preview: URL.createObjectURL(file),
    });
  };

  const handlePagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: PageItem[] = Array.from(files).map((file, index) => ({
      id: `page-${Date.now()}-${index}`,
      type: "file",
      content: file,
      preview: URL.createObjectURL(file),
    }));

    setPageItems((prev) => [...prev, ...newItems]);
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

  // Cleanup object URLs on unmount
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
      const res = await authFetch(
        `/api/metadata?url=${encodeURIComponent(url)}`
      );
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

  const handleCreateTag = async (inputValue: string) => {
    try {
      const res = await authFetch("/api/tags", {
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
      const res = await authFetch("/api/categories", {
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

  const handleCreateAuthor = async (inputValue: string) => {
    // Don't create author yet - just mark as pending
    // Author will be created during form submit with credits
    setPendingAuthorName(inputValue);
    setSelectedAuthor(null);

    // Always auto-fill authorName for OG
    setAuthorName(inputValue);
  };

  const handleSubmitWithDraft = async (
    e: React.FormEvent,
    saveAsDraft: boolean
  ) => {
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
      // 0. Create pending author if exists (with credits)
      let finalAuthorId = selectedAuthor?.id || null;

      if (pendingAuthorName) {
        try {
          const authorBody: any = { name: pendingAuthorName };

          // Add socialLinks if credits exist
          if (credits.length > 0) {
            authorBody.socialLinks = JSON.stringify(credits);
          }

          const authorRes = await authFetch("/api/authors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(authorBody),
          });

          if (!authorRes.ok) throw new Error("Failed to create author");

          const newAuthor = await authorRes.json();
          finalAuthorId = newAuthor.id;

          // Update available authors list
          setAvailableAuthors((prev) => [...prev, newAuthor]);
        } catch (error) {
          throw new Error(
            `Failed to create author: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // 1. Upload Cover if it's a file
      let finalCoverUrl = "";
      if (coverItem.type === "file") {
        const fd = new FormData();
        fd.append("files", coverItem.content as File);
        const res = await authFetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Failed to upload cover image");
        const json = await res.json();
        finalCoverUrl = json.urls[0];
      } else {
        finalCoverUrl = coverItem.content as string;
      }

      // 2. Upload Page Files with Progress
      const fileItems = pageItems.filter((p) => p.type === "file");

      // Filter out files that are already uploaded
      const filesToUpload = fileItems.filter((item) => !uploadedUrls[item.id]);

      if (filesToUpload.length > 0) {
        // Initialize progress state for NEW files only
        // But we want to keep the state of already uploaded files if they exist in uploadFiles
        setUploadFiles((prev) => {
          const existing = new Map(prev.map((f) => [f.id, f]));

          const newFiles = filesToUpload.map((item) => ({
            id: item.id,
            name: (item.content as File).name,
            size: (item.content as File).size,
            progress: 0,
            status: "pending" as const,
          }));

          // Merge: keep existing (if any), add new
          const merged = [...prev];
          newFiles.forEach((f) => {
            if (!existing.has(f.id)) {
              merged.push(f);
            } else {
              // Reset status if it was error
              const idx = merged.findIndex((x) => x.id === f.id);
              if (idx !== -1) merged[idx] = f;
            }
          });
          return merged;
        });

        // Upload Queue Logic
        const queue = [...filesToUpload];
        const activeUploads = new Set<Promise<void>>();
        const CONCURRENCY = 3;
        let hasUploadErrors = false;

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

        // Process queue
        while (queue.length > 0 || activeUploads.size > 0) {
          while (queue.length > 0 && activeUploads.size < CONCURRENCY) {
            const item = queue.shift()!;
            const promise = uploadFile(item)
              .then(() => {
                activeUploads.delete(promise);
              })
              .catch((err) => {
                activeUploads.delete(promise);
                hasUploadErrors = true;
                console.error(`Failed to upload ${item.id}:`, err);
                // Do NOT throw here, let other files continue
              });
            activeUploads.add(promise);
          }

          if (activeUploads.size > 0) {
            await Promise.race(activeUploads);
          }
        }

        if (hasUploadErrors) {
          throw new Error("Some files failed to upload. Please retry them.");
        }
      }

      // Reconstruct pages array in order
      const finalPages = pageItems.map((item) => {
        if (item.type === "url") return item.content as string;
        // Check both the local state and the ref/state we just updated
        return uploadedUrls[item.id];
      });

      // Verify all pages have URLs
      if (finalPages.some((p) => !p)) {
        throw new Error("Some pages are missing URLs. Please retry uploading.");
      }

      const selectedTagIds = selectedTags.map((t) => t.id);

      const body = {
        title,
        slug,
        description,
        coverImage: finalCoverUrl,
        pages: finalPages,
        categoryId: categoryId || null,
        authorId: finalAuthorId,
        isHidden: saveAsDraft,
        selectedTags: selectedTagIds,
        authorName: authorName || null,
      };

      const endpoint =
        mode === "admin"
          ? manga
            ? `/api/manga/${manga.id}`
            : "/api/manga"
          : "/api/submissions";
      const method = manga ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const res = await response.json();
        let errorMessage = res.error || "Failed to save manga";

        if (typeof errorMessage === "object") {
          // Handle Zod flattened error
          if (errorMessage.fieldErrors) {
            const fields = Object.keys(errorMessage.fieldErrors);
            if (fields.length > 0) {
              // Get the first error message from the first field
              errorMessage = `${fields[0]}: ${
                errorMessage.fieldErrors[fields[0]][0]
              }`;
            } else if (
              errorMessage.formErrors &&
              errorMessage.formErrors.length > 0
            ) {
              errorMessage = errorMessage.formErrors[0];
            } else {
              errorMessage = "Validation failed";
            }
          } else {
            errorMessage = JSON.stringify(errorMessage);
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setNotificationType("success");
      setNotificationTitle(manga ? "Manga Updated" : "Manga Created");
      setNotificationMessage(
        manga
          ? `Successfully updated "${title}".`
          : `Successfully created "${title}".`
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

  const handleRetryUpload = (fileId: string) => {
    // Reset status to pending for this file
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "pending", progress: 0 } : f
      )
    );

    // Trigger submit again - it will filter and pick up pending/failed files
    // We can't easily trigger the full form submit from here without the event object
    // But we can just trigger the upload logic if we extracted it.
    // For simplicity, let's just ask the user to click "Save" again,
    // OR we can try to re-run the submit logic if we had access to it.
    // Better UX: The user clicks "Retry" on the file, we could just try to upload THAT file immediately.

    const item = pageItems.find((p) => p.id === fileId);
    if (!item || item.type !== "file") return;

    // Simple single file upload retry
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("files", item.content as File);

    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "uploading", progress: 0 } : f
      )
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress, status: "uploading" } : f
          )
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const url = response.urls[0];
          setUploadedUrls((prev) => ({ ...prev, [fileId]: url }));
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, progress: 100, status: "completed" } : f
            )
          );
        } catch (e) {
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f))
          );
        }
      } else {
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f))
        );
      }
    };

    xhr.onerror = () => {
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "error" } : f))
      );
    };

    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  const handleGoToList = () => {
    setNotificationOpen(false);
    router.push(
      mode === "admin" ? "/dashboard/admin/manga" : "/dashboard/submissions"
    );
    router.refresh();
  };

  return (
    <>
      <Box component="form" onSubmit={(e) => handleSubmitWithDraft(e, false)}>
        <Grid container spacing={3}>
          {/* Header / Actions */}
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              {manga
                ? "Edit Manga"
                : mode === "admin"
                ? "Create New Manga"
                : "Submit Manga"}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="text"
                color="inherit"
                onClick={() => router.back()}
                disabled={isSubmitting}
                sx={{ borderRadius: 1 }}
              >
                Cancel
              </Button>
              {!manga && mode === "admin" && (
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmitWithDraft(e, true);
                  }}
                  disabled={isSubmitting}
                  sx={{
                    borderRadius: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "text.secondary",
                  }}
                >
                  Save Draft
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                      aria-label="Saving..."
                    />
                  ) : null
                }
                sx={{
                  borderRadius: 1,
                  bgcolor: "#fbbf24",
                  color: "#000",
                  "&:hover": { bgcolor: "#f59e0b" },
                }}
              >
                {isSubmitting
                  ? "Saving..."
                  : manga
                  ? "Update Manga"
                  : mode === "admin"
                  ? "Create Manga"
                  : "Submit"}
              </Button>
            </Stack>
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
              sx={{ p: 3, borderRadius: 1, bgcolor: "#171717", minHeight: 600 }}
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
                    InputProps={{
                      disableUnderline: true,
                      sx: { borderRadius: 1 },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    value={
                      pendingAuthorName
                        ? ({ id: "pending", name: pendingAuthorName } as Author)
                        : selectedAuthor
                    }
                    onChange={(event, newValue) => {
                      if (typeof newValue === "string") {
                        handleCreateAuthor(newValue);
                      } else if (newValue && (newValue as any).inputValue) {
                        handleCreateAuthor((newValue as any).inputValue);
                      } else {
                        setSelectedAuthor(newValue);
                        setPendingAuthorName(""); // Clear pending when selecting existing
                        // Always auto-fill authorName for OG
                        if (newValue) {
                          setAuthorName(newValue.name);
                        } else {
                          setAuthorName(""); // Clear if deselected
                        }
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = authorFilter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some(
                        (option) =>
                          option.name.toLowerCase() === inputValue.toLowerCase()
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
                    options={availableAuthors}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      if ((option as any).inputValue)
                        return (option as any).inputValue;
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
                <Grid item xs={12} md={6}>
                  <TextField
                    label="ชื่อผู้แต่ง (Author Name for OG)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    fullWidth
                    variant="filled"
                    placeholder="เช่น Aokana, Doujin Circle"
                    helperText="สำหรับแสดงใน og:title เมื่อแชร์ลิงก์ (auto-filled from author)"
                    InputProps={{
                      disableUnderline: true,
                      sx: { borderRadius: 1 },
                    }}
                  />
                </Grid>

                {/* Author Credits - Show only when adding new author */}
                {pendingAuthorName && (
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            fontSize: "0.75rem",
                          }}
                        >
                          Author Credits (Social Links)
                        </Typography>
                        <Button
                          size="small"
                          onClick={handleAddCredit}
                          sx={{
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            color: "#fbbf24",
                          }}
                        >
                          + Add Credit
                        </Button>
                      </Box>
                      {credits.length === 0 ? (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.disabled",
                            textAlign: "center",
                            py: 2,
                          }}
                        >
                          No credits added yet
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {credits.map((credit, index) => (
                            <Paper
                              key={index}
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 1,
                                bgcolor: "rgba(0,0,0,0.2)",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      alignItems: "center",
                                    }}
                                  >
                                    <TextField
                                      label="URL"
                                      value={credit.url}
                                      onChange={(e) =>
                                        handleCreditChange(
                                          index,
                                          "url",
                                          e.target.value
                                        )
                                      }
                                      fullWidth
                                      variant="filled"
                                      placeholder="https://example.com"
                                      size="small"
                                      InputProps={{
                                        disableUnderline: true,
                                        sx: { borderRadius: 1 },
                                      }}
                                    />
                                    <Tooltip title="Auto-fetch title and icon">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleFetchCreditInfo(index)
                                          }
                                          disabled={!credit.url}
                                          sx={{
                                            bgcolor: "rgba(251,191,36,0.1)",
                                            "&:hover": {
                                              bgcolor: "rgba(251,191,36,0.2)",
                                            },
                                          }}
                                        >
                                          <AutoFixHighIcon
                                            sx={{ fontSize: 20 }}
                                          />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Remove credit">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleRemoveCredit(index)
                                        }
                                        sx={{
                                          bgcolor: "rgba(239,68,68,0.1)",
                                          "&:hover": {
                                            bgcolor: "rgba(239,68,68,0.2)",
                                          },
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 20 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    label="Label"
                                    value={credit.label}
                                    onChange={(e) =>
                                      handleCreditChange(
                                        index,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    fullWidth
                                    variant="filled"
                                    placeholder="e.g., Website, Twitter"
                                    size="small"
                                    InputProps={{
                                      disableUnderline: true,
                                      sx: { borderRadius: 1 },
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    label="Icon URL"
                                    value={credit.icon}
                                    onChange={(e) =>
                                      handleCreditChange(
                                        index,
                                        "icon",
                                        e.target.value
                                      )
                                    }
                                    fullWidth
                                    variant="filled"
                                    placeholder="https://example.com/icon.png"
                                    size="small"
                                    InputProps={{
                                      disableUnderline: true,
                                      sx: { borderRadius: 1 },
                                    }}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    value={
                      availableCategories.find((c) => c.id === categoryId) ||
                      null
                    }
                    onChange={(event, newValue) => {
                      if (typeof newValue === "string") {
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
                      const isExisting = options.some(
                        (option) => option.name === inputValue
                      );
                      if (inputValue !== "" && !isExisting) {
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
                      if (typeof option === "string") {
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
                        InputProps={{
                          ...params.InputProps,
                          disableUnderline: true,
                          sx: { borderRadius: 1 },
                        }}
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
                      if (typeof option === "string") return option;
                      if ((option as any).inputValue)
                        return (option as any).inputValue;
                      return option.name;
                    }}
                    value={selectedTags}
                    onChange={(event, newValue) => {
                      // Filter out any string values or special "Add" options and handle creation
                      const processedTags: Tag[] = [];

                      newValue.forEach((item) => {
                        if (typeof item === "string") {
                          handleCreateTag(item);
                        } else if ((item as any).inputValue) {
                          handleCreateTag((item as any).inputValue);
                        } else {
                          processedTags.push(item as Tag);
                        }
                      });

                      // Update state only with valid existing tags
                      // New tags will be added via handleCreateTag
                      const validTags = newValue.filter(
                        (t) => !(t as any).inputValue && typeof t !== "string"
                      ) as Tag[];
                      setSelectedTags(validTags);
                    }}
                    filterOptions={(options, params) => {
                      const filtered = filter(options, params);
                      const { inputValue } = params;
                      const isExisting = options.some(
                        (option) =>
                          option.name.toLowerCase() === inputValue.toLowerCase()
                      );
                      if (inputValue !== "" && !isExisting) {
                        filtered.push({
                          inputValue,
                          name: `Add "${inputValue}"`,
                          id: "new-tag",
                        } as any);
                      }
                      return filtered;
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
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
                  Cover Image
                </Typography>

                {!coverItem ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    component="label"
                    sx={{
                      height: 120,
                      borderStyle: "dashed",
                      borderColor: "rgba(255,255,255,0.2)",
                      borderRadius: 1,
                      color: "text.secondary",
                      flexDirection: "column",
                      gap: 1,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleCoverUpload}
                    />
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
                    Pages ({pageItems.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddPhotoAlternateIcon />}
                    component="label"
                    sx={{ color: "#fbbf24", cursor: "pointer" }}
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handlePagesUpload}
                    />
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
        </Grid>
      </Box>

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
                label: "Go to List",
                onClick: handleGoToList,
              }
            : {
                label: "Close",
                onClick: handleCloseNotification,
              }
        }
      />

      {/* Floating Upload Progress */}
      {uploadFiles.length > 0 && (
        <UploadProgress files={uploadFiles} onRetry={handleRetryUpload} />
      )}
    </>
  );
}
