// Example: Form component with validation, loading states, and error handling
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import type { Category } from "@prisma/client";

interface MangaFormProps {
  categories: Category[];
  initialData?: {
    id?: string;
    title: string;
    description: string;
    categoryId: string;
  };
}

export default function MangaForm({ categories, initialData }: MangaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!formData.title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (!formData.categoryId) {
      setError("Please select a category");
      setLoading(false);
      return;
    }

    try {
      const url = initialData?.id
        ? `/api/manga/${initialData.id}`
        : "/api/manga";

      const method = initialData?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save manga");
      }

      const result = await response.json();

      // Navigate to the manga detail page
      router.push(`/manga/${result.id}`);
      router.refresh();
    } catch (err) {
      console.error("Form submission error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        required
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        disabled={loading}
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        disabled={loading}
        margin="normal"
      />

      <FormControl fullWidth margin="normal" required>
        <InputLabel>Category</InputLabel>
        <Select
          name="categoryId"
          value={formData.categoryId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
          }
          disabled={loading}
          label="Category"
        >
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Saving..." : "Save"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
