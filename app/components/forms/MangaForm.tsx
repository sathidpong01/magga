"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, tags, manga as mangaTable, authors } from "@/db/schema";

type Category = InferSelectModel<typeof categories>;
type Tag = InferSelectModel<typeof tags>;
type Manga = InferSelectModel<typeof mangaTable>;
type Author = InferSelectModel<typeof authors>;
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  createFilterOptions,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NotificationModal from "@/app/components/modals/NotificationModal";
import { SortableItem } from "@/app/components/ui/SortableItem";
import UploadProgress, {
  UploadFileStatus,
} from "@/app/components/ui/UploadProgress";
import { authFetch } from "@/lib/auth-fetch";
import { normalizeMangaPages } from "@/lib/manga-pages";
import { extractFirstUploadUrl } from "@/lib/upload-response";
import {
  DashboardPageHeader,
  DashboardSectionTitle,
  DashboardSurface,
  dashboardGhostButtonSx,
  dashboardInsetSurfaceSx,
  dashboardPrimaryButtonSx,
  dashboardSecondaryButtonSx,
  dashboardTextFieldSx,
  dashboardTokens,
} from "@/app/components/dashboard/system";
import { getMetadataChipSx } from "@/lib/metadata-chip-tone";

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
  const [previewPage, setPreviewPage] = useState<{ src: string; index: number } | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);

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
    const initialPages = normalizeMangaPages(manga?.pages);

    return initialPages.map((page, index) => ({
      id: `existing-${index}-${Date.now()}`,
      type: "url",
      content: page.url,
      preview: page.url,
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
  const pageItemsRef = useRef(pageItems);
  const coverItemRef = useRef(coverItem);

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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    pageItemsRef.current = pageItems;
  }, [pageItems]);

  useEffect(() => {
    coverItemRef.current = coverItem;
  }, [coverItem]);

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
      pageItemsRef.current.forEach((item) => {
        if (item.type === "file") URL.revokeObjectURL(item.preview);
      });
      if (coverItemRef.current?.type === "file") {
        URL.revokeObjectURL(coverItemRef.current.preview);
      }
    };
  }, []);

  const filledInputProps = {
    disableUnderline: true,
    sx: { borderRadius: 2 },
  };

  const filledFieldSx = dashboardTextFieldSx;
  const headerGhostButtonSx = {
    ...dashboardGhostButtonSx,
    color: dashboardTokens.text,
    border: "1px solid rgba(255,255,255,0.1)",
    bgcolor: "rgba(255,255,255,0.03)",
    px: 1.6,
    "&:hover": {
      color: dashboardTokens.text,
      bgcolor: "rgba(255,255,255,0.08)",
      borderColor: "rgba(255,255,255,0.16)",
    },
  };
  const headerSecondaryButtonSx = {
    ...dashboardSecondaryButtonSx,
    color: dashboardTokens.text,
    borderColor: "rgba(251,191,36,0.26)",
    bgcolor: "rgba(251,191,36,0.07)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
  };
  const headerPrimaryButtonSx = {
    ...dashboardPrimaryButtonSx,
    boxShadow: "0 12px 28px rgba(251,191,36,0.26)",
  };
  const mediaActionButtonSx = {
    color: dashboardTokens.text,
    borderColor: "rgba(251,191,36,0.24)",
    bgcolor: "rgba(251,191,36,0.08)",
    borderRadius: 1.4,
    fontWeight: 700,
    px: 1.4,
    "&:hover": {
      borderColor: "rgba(251,191,36,0.42)",
      bgcolor: "rgba(251,191,36,0.14)",
    },
  };

  const pageTitle = manga
    ? mode === "admin"
      ? "แก้ไขมังงะ"
      : "แก้ไขรายการฝากลง"
    : mode === "admin"
      ? "สร้างมังงะใหม่"
      : "ฝากลงมังงะ";

  const pageDescription =
    mode === "admin"
      ? "จัดการข้อมูลหลัก ปก เนื้อหา เมทาดาทา และลำดับหน้าของเรื่องให้พร้อมเผยแพร่"
      : "กรอกข้อมูลเรื่อง ปก หน้าอ่าน และรายละเอียดที่จำเป็นเพื่อส่งให้ทีมตรวจสอบ";

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
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลลิงก์ได้");
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
      if (!res.ok) throw new Error("ไม่สามารถสร้างแท็กได้");
      const newTag = await res.json();
      setAvailableTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag]);
    } catch (error) {
      console.error("Error creating tag:", error);
      setError("ไม่สามารถสร้างแท็กได้");
    }
  };

  const handleCreateCategory = async (inputValue: string) => {
    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputValue }),
      });
      if (!res.ok) throw new Error("ไม่สามารถสร้างหมวดหมู่ได้");
      const newCategory = await res.json();
      setAvailableCategories((prev) => [...prev, newCategory]);
      setCategoryId(newCategory.id);
    } catch (error) {
      console.error("Error creating category:", error);
      setError("ไม่สามารถสร้างหมวดหมู่ได้");
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
      setError("กรุณากรอกชื่อเรื่องและอัปโหลดรูปปก");
      return;
    }
    if (!slug) {
      setError("กรุณาระบุ slug ของเรื่อง");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const uploadedUrlMap: Record<string, string> = { ...uploadedUrls };

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

          if (!authorRes.ok) throw new Error("ไม่สามารถสร้างข้อมูลผู้แต่งได้");

          const newAuthor = await authorRes.json();
          finalAuthorId = newAuthor.id;

          // Update available authors list
          setAvailableAuthors((prev) => [...prev, newAuthor]);
        } catch (error) {
          throw new Error(
            `ไม่สามารถสร้างข้อมูลผู้แต่งได้: ${
              error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"
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
        if (!res.ok) throw new Error("ไม่สามารถอัปโหลดรูปปกได้");
        const json = await res.json();
        finalCoverUrl = extractFirstUploadUrl(json);
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
                  const url = extractFirstUploadUrl(response);
                  uploadedUrlMap[item.id] = url;
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
                  reject(new Error("รูปแบบข้อมูลตอบกลับไม่ถูกต้อง"));
                }
              } else {
                setUploadFiles((prev) =>
                  prev.map((f) =>
                    f.id === item.id ? { ...f, status: "error" } : f
                  )
                );
                reject(new Error("อัปโหลดไฟล์ไม่สำเร็จ"));
              }
            };

            xhr.onerror = () => {
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id ? { ...f, status: "error" } : f
                )
              );
              reject(new Error("เกิดปัญหาเครือข่ายระหว่างอัปโหลด"));
            };

            xhr.withCredentials = true;
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
          throw new Error("มีบางไฟล์อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
      }

      // Reconstruct pages array in order
      const finalPages = pageItems.map((item) => {
        if (item.type === "url") return item.content as string;
        return uploadedUrlMap[item.id] || uploadedUrls[item.id];
      });

      // Verify all pages have URLs
      if (finalPages.some((p) => !p)) {
        throw new Error("บางหน้าของเรื่องยังไม่มี URL กรุณาลองอัปโหลดใหม่");
      }

      const selectedTagIds = selectedTags.map((t) => t.id);

      const body =
        mode === "admin"
          ? {
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
            }
          : {
              title,
              slug,
              description,
              coverImage: finalCoverUrl,
              pages: finalPages,
              categoryId: categoryId || null,
              authorId: finalAuthorId,
              tagIds: selectedTagIds,
              status: "PENDING",
            };

      const endpoint =
        mode === "admin"
          ? manga
            ? `/api/manga/${manga.id}`
            : "/api/manga"
          : manga
            ? `/api/submissions/${manga.id}`
            : "/api/submissions";
      const method = manga ? "PUT" : "POST";

      const response = await authFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const res = await response.json();
        let errorMessage = res.error || "บันทึกรายการไม่สำเร็จ";

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
              errorMessage = "ข้อมูลไม่ผ่านการตรวจสอบ";
            }
          } else {
            errorMessage = JSON.stringify(errorMessage);
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setNotificationType("success");
      setNotificationTitle(
        manga
          ? mode === "admin"
            ? "อัปเดตมังงะสำเร็จ"
            : "อัปเดตรายการฝากลงสำเร็จ"
          : mode === "admin"
            ? "สร้างมังงะสำเร็จ"
            : "ส่งรายการฝากลงสำเร็จ"
      );
      setNotificationMessage(
        manga
          ? `อัปเดตรายการ "${title}" เรียบร้อยแล้ว`
          : mode === "admin"
            ? `สร้างรายการ "${title}" เรียบร้อยแล้ว`
            : `ส่ง "${title}" เข้าตรวจเรียบร้อยแล้ว`
      );
      setNotificationOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setNotificationType("error");
      setNotificationTitle("เกิดข้อผิดพลาด");
      setNotificationMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด"
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
          const url = extractFirstUploadUrl(response);
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

    xhr.withCredentials = true;
    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  const handleClosePreview = () => {
    setPreviewPage(null);
    setPreviewZoom(1);
  };

  const handleZoomIn = () => {
    setPreviewZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setPreviewZoom((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handlePreviewWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.deltaY < 0) {
      setPreviewZoom((prev) => Math.min(prev + 0.12, 3));
      return;
    }

    setPreviewZoom((prev) => Math.max(prev - 0.12, 0.75));
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
        <DashboardPageHeader
          eyebrow={mode === "admin" ? "CONTENT MANAGER" : "SUBMISSION"}
          title={pageTitle}
          description={pageDescription}
        >
          <Button
            variant="text"
            onClick={() => router.back()}
            disabled={isSubmitting}
            sx={headerGhostButtonSx}
          >
            ย้อนกลับ
          </Button>
          {!manga && mode === "admin" && (
            <Button
              variant="outlined"
              onClick={(e) => {
                e.preventDefault();
                handleSubmitWithDraft(e, true);
              }}
              disabled={isSubmitting}
              sx={headerSecondaryButtonSx}
            >
              บันทึกเป็นฉบับร่าง
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
            sx={headerPrimaryButtonSx}
          >
            {isSubmitting
              ? "กำลังบันทึก..."
              : manga
                ? mode === "admin"
                  ? "อัปเดตมังงะ"
                  : "อัปเดตรายการฝากลง"
                : mode === "admin"
                  ? "สร้างมังงะ"
                  : "ส่งรายการฝากลง"}
          </Button>
        </DashboardPageHeader>

        <Grid container spacing={3}>
          {error && (
<Grid  size={12}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  bgcolor: "rgba(239, 68, 68, 0.08)",
                  color: "#fecaca",
                  border: "1px solid rgba(239, 68, 68, 0.18)",
                }}
              >
                {error}
              </Alert>
            </Grid>
          )}

          {/* Left Column: General Info */}
<Grid   size={{ xs: 12, md: 7 }}>
            <DashboardSurface sx={{ minHeight: 600 }}>
              <DashboardSectionTitle
                title="ข้อมูลหลักของเรื่อง"
                description="ระบุชื่อ สลักก์ คำอธิบาย ผู้แต่ง หมวดหมู่ และแท็กให้ครบถ้วนก่อนส่งหรือเผยแพร่"
              />
                <Grid container spacing={3}>
<Grid  size={12}>
                  <TextField
                    label="ชื่อเรื่อง"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    required
                    variant="filled"
                    sx={filledFieldSx}
                    InputProps={filledInputProps}
                  />
                </Grid>
<Grid  size={12}>
                  <TextField
                    label="Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    fullWidth
                    required
                    variant="filled"
                    sx={filledFieldSx}
                    helperText={`ตัวอย่างลิงก์: /${slug || "your-slug"}`}
                    InputProps={{
                      ...filledInputProps,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="สร้างจากชื่อเรื่อง">
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
                              sx={{
                                color: "rgba(255,255,255,0.82)",
                                bgcolor: "transparent",
                                border: "none",
                                boxShadow: "none",
                                "&:hover": {
                                  bgcolor: "transparent",
                                  color: "#ffffff",
                                },
                              }}
                            >
                              <AutoFixHighIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
<Grid  size={12}>
                  <TextField
                    label="คำอธิบาย"
                    value={description ?? ""}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    variant="filled"
                    sx={filledFieldSx}
                    InputProps={filledInputProps}
                  />
                </Grid>
<Grid   size={{ xs: 12, md: 6 }}>
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
                          name: `เพิ่ม "${inputValue}"`,
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
                    slotProps={{
                      chip: {
                        sx: {
                          bgcolor: "rgba(251,191,36,0.14)",
                          color: "#f7e3a2",
                          border: "1px solid rgba(251,191,36,0.2)",
                          fontWeight: 600,
                          "& .MuiChip-deleteIcon": {
                            color: "rgba(247,227,162,0.72)",
                            "&:hover": {
                              color: dashboardTokens.accent,
                            },
                          },
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="ผู้แต่ง"
                        variant="filled"
                        placeholder="เลือกหรือสร้างผู้แต่ง"
                        sx={filledFieldSx}
                        InputProps={{
                          ...params.InputProps,
                          ...filledInputProps,
                        }}
                      />
                    )}
                  />
                </Grid>
<Grid   size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="ชื่อผู้แต่ง (Author Name for OG)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    fullWidth
                    variant="filled"
                    placeholder="เช่น Aokana, Doujin Circle"
                    helperText="สำหรับแสดงใน og:title เมื่อแชร์ลิงก์ (auto-filled from author)"
                    sx={filledFieldSx}
                    InputProps={filledInputProps}
                  />
                </Grid>

                {/* Author Credits - Show only when adding new author */}
                {pendingAuthorName && (
<Grid  size={12}>
                    <Box
                      sx={{
                        p: 2,
                        ...dashboardInsetSurfaceSx,
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
                            color: dashboardTokens.textMuted,
                            fontWeight: 700,
                          }}
                        >
                          เครดิตผู้แต่งและโซเชียลลิงก์
                        </Typography>
                        <Button
                          size="small"
                          onClick={handleAddCredit}
                          sx={dashboardGhostButtonSx}
                        >
                          เพิ่มเครดิต
                        </Button>
                      </Box>
                      {credits.length === 0 ? (
                        <Typography
                          variant="body2"
                          sx={{
                            color: dashboardTokens.textSoft,
                            textAlign: "center",
                            py: 2,
                          }}
                        >
                          ยังไม่มีเครดิตเพิ่มเติม
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {credits.map((credit, index) => (
                            <Box
                              key={index}
                              sx={{
                                p: 2,
                                ...dashboardInsetSurfaceSx,
                                bgcolor: "rgba(0,0,0,0.18)",
                              }}
                            >
                              <Grid container spacing={2}>
<Grid  size={12}>
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
                                    sx={filledFieldSx}
                                    InputProps={filledInputProps}
                                  />
                                    <Tooltip title="ดึงชื่อและไอคอนอัตโนมัติ">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleFetchCreditInfo(index)
                                          }
                                          disabled={!credit.url}
                                          sx={{
                                            color: "rgba(255,255,255,0.82)",
                                            bgcolor: "transparent",
                                            border: "none",
                                            boxShadow: "none",
                                            "&:hover": {
                                              bgcolor: "transparent",
                                              color: "#ffffff",
                                            },
                                          }}
                                        >
                                          <AutoFixHighIcon
                                            sx={{ fontSize: 20 }}
                                          />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="ลบเครดิต">
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
<Grid   size={{ xs: 12, sm: 6 }}>
                                  <TextField
                                    label="ชื่อที่จะแสดง"
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
                                    placeholder="เช่น Website, Twitter"
                                    size="small"
                                    sx={filledFieldSx}
                                    InputProps={filledInputProps}
                                  />
                                </Grid>
<Grid   size={{ xs: 12, sm: 6 }}>
                                  <TextField
                                    label="ลิงก์ไอคอน"
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
                                    sx={filledFieldSx}
                                    InputProps={filledInputProps}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                </Grid>
                )}

<Grid   size={{ xs: 12, md: 6 }}>
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
                          name: `เพิ่ม "${inputValue}"`,
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
                        label="หมวดหมู่"
                        variant="filled"
                        sx={filledFieldSx}
                        InputProps={{
                          ...params.InputProps,
                          ...filledInputProps,
                        }}
                      />
                    )}
                  />
                </Grid>
<Grid   size={{ xs: 12, md: 6 }}>
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
                          name: `เพิ่ม "${inputValue}"`,
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
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });

                        return (
                          <Chip
                            key={key ?? option.id}
                            label={option.name}
                            {...tagProps}
                            sx={{
                              ...getMetadataChipSx(option.name),
                              height: 30,
                              px: 0.25,
                              fontSize: "0.82rem",
                              textTransform: "none",
                            }}
                          />
                        );
                      })
                    }
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="filled"
                        label="แท็ก"
                        placeholder="เลือกหรือสร้างแท็ก"
                        sx={filledFieldSx}
                        InputProps={{
                          ...params.InputProps,
                          ...filledInputProps,
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DashboardSurface>
          </Grid>

          {/* Right Column: Media Assets */}
<Grid   size={{ xs: 12, md: 5 }}>
            <DashboardSurface sx={{ height: "100%" }}>
              <DashboardSectionTitle
                title="ไฟล์ภาพและลำดับหน้า"
                description="อัปโหลดรูปปก เพิ่มหน้าภาพ และจัดเรียงลำดับก่อนบันทึกหรือส่งตรวจ"
              />

              {/* Cover Image */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" component="h4" gutterBottom>
                  รูปปก
                </Typography>

                {!coverItem ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    component="label"
                    sx={{
                      height: 120,
                      borderStyle: "dashed",
                      borderColor: "rgba(251,191,36,0.22)",
                      borderRadius: 2,
                      color: dashboardTokens.text,
                      flexDirection: "column",
                      gap: 1,
                      cursor: "pointer",
                      ...mediaActionButtonSx,
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
                    อัปโหลดรูปปก
                  </Button>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 220,
                      margin: "0 auto",
                      borderRadius: 2.5,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 16px 30px rgba(0,0,0,0.24)",
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
                        color: "#fff",
                        bgcolor: "rgba(220,38,38,0.84)",
                        border: "1px solid rgba(254,202,202,0.22)",
                        "&:hover": { bgcolor: "rgba(185,28,28,0.96)" },
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
                    mb: 1.1,
                  }}
                >
                  <Typography variant="subtitle1" component="h4">
                    หน้าอ่าน ({pageItems.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddPhotoAlternateIcon />}
                    component="label"
                    sx={{
                      ...(mediaActionButtonSx as any),
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handlePagesUpload}
                    />
                    เพิ่มหน้า
                  </Button>
                </Box>

                {pageItems.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: dashboardTokens.textSoft,
                      mb: 1.8,
                    }}
                  >
                    ลากที่ภาพได้โดยตรงเพื่อจัดลำดับใหม่ กดไอคอนรูปตาเพื่อดูภาพเต็ม
                  </Typography>
                )}

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
                        p: 1.4,
                        borderRadius: 2.5,
                        border: "1px solid rgba(255,255,255,0.08)",
                        bgcolor: "rgba(255,255,255,0.02)",
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(118px, 1fr))",
                        gap: 1.6,
                        alignItems: "start",
                        maxHeight: { xs: "none", md: 620 },
                        overflowY: { xs: "visible", md: "auto" },
                      }}
                    >
                      {pageItems.map((item, index) => (
                        <SortableItem
                          key={item.id}
                          id={item.id}
                          src={item.preview}
                          index={index}
                          onRemove={() => handleRemovePage(item.id)}
                          onPreview={() =>
                            setPreviewPage({ src: item.preview, index })
                          }
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
                      borderRadius: 2,
                      textAlign: "center",
                      color: dashboardTokens.textMuted,
                    }}
                  >
                    <Typography variant="body2">ยังไม่มีหน้าภาพในรายการ</Typography>
                  </Box>
                )}
              </Box>
            </DashboardSurface>
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
                label: "ไปที่รายการ",
                onClick: handleGoToList,
              }
                : {
                label: "ปิด",
                onClick: handleCloseNotification,
              }
        }
      />

      <Dialog
        open={Boolean(previewPage)}
        onClose={handleClosePreview}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.82)",
            color: dashboardTokens.text,
            backgroundImage: "none",
            overflow: "hidden",
            boxShadow: "none",
          },
        }}
        slotProps={{
          backdrop: {
            sx: { bgcolor: "rgba(0,0,0,0.68)", backdropFilter: "blur(2px)" },
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            height: "100vh",
            overflow: "hidden",
            position: "relative",
            bgcolor: "rgba(0,0,0,0.78)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 18,
              left: 20,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.4,
              py: 0.9,
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.42)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography variant="body2" sx={{ color: dashboardTokens.text, fontWeight: 700 }}>
              {previewPage ? `หน้า ${previewPage.index + 1}` : ""}
            </Typography>
            <Typography variant="caption" sx={{ color: dashboardTokens.textSoft }}>
              {Math.round(previewZoom * 100)}%
            </Typography>
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: 18,
              right: 20,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "rgba(0,0,0,0.42)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              <ZoomOutRoundedIcon />
            </IconButton>
            <IconButton
              onClick={handleZoomIn}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "rgba(0,0,0,0.42)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fafafa",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              <ZoomInRoundedIcon />
            </IconButton>
            <IconButton
              onClick={handleClosePreview}
              sx={{
                width: 42,
                height: 42,
                bgcolor: "rgba(220,38,38,0.9)",
                border: "1px solid rgba(254,202,202,0.22)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(185,28,28,0.96)" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box
            onWheel={handlePreviewWheel}
            sx={{
              width: "100%",
              height: "100%",
              overflow: previewZoom > 1 ? "auto" : "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 2, md: 4 },
            }}
          >
            {previewPage ? (
              <Box
                component="img"
                src={previewPage.src}
                alt={`Preview page ${previewPage.index + 1}`}
                sx={{
                  display: "block",
                  width: previewZoom > 1 ? `${previewZoom * 100}%` : "auto",
                  maxWidth: previewZoom > 1 ? "none" : "100%",
                  maxHeight: previewZoom > 1 ? "none" : "100%",
                  height: "auto",
                  objectFit: "contain",
                  transform: previewZoom <= 1 ? `scale(${previewZoom})` : "none",
                  transformOrigin: "center center",
                }}
              />
            ) : null}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Floating Upload Progress */}
      {uploadFiles.length > 0 && (
        <UploadProgress files={uploadFiles} onRetry={handleRetryUpload} />
      )}
    </>
  );
}
