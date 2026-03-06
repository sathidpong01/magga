"use client";

import { useState, useEffect, useCallback, useId, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Collapse,
  IconButton,
  Autocomplete,
  Button,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, tags } from "@/db/schema";

type Category = InferSelectModel<typeof categories>;
type Tag = InferSelectModel<typeof tags>;
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FilterIcon from "@mui/icons-material/Tune";

type Props = {
  categories: Category[];
  tags: Tag[];
};

type SearchItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  authorName: string;
  category: string;
  tags: string;
};

export default function SearchFilters({ categories, tags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  // Generate stable IDs to prevent hydration mismatch
  const categorySelectId = useId();
  const sortSelectId = useId();
  const searchInputId = useId();
  const tagsInputId = useId();

  // State for filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "added");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Server-side search state (Fuse.js runs on server, client only receives results)
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced server-side search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (inputValue.length < 2) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(inputValue)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSearchResults(data);
          }
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  // Initialize selected tags from URL
  useEffect(() => {
    const tagNames = searchParams.getAll("tags");

    // Deep compare to avoid infinite loop
    const currentTagNames = selectedTags.map((t) => t.name).sort();
    const newTagNames = [...tagNames].sort();
    const isSame =
      currentTagNames.length === newTagNames.length &&
      currentTagNames.every((name, index) => name === newTagNames[index]);

    if (isSame) return;

    if (tagNames.length > 0) {
      const foundTags = tags.filter((tag) => tagNames.includes(tag.name));
      setSelectedTags(foundTags);
    } else {
      setSelectedTags([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tags]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    // Only add params if they differ from defaults
    if (search.trim() !== "") params.set("search", search);
    if (category && category !== "all")
      params.set("category", category);
    if (sort && sort !== "added") params.set("sort", sort);

    selectedTags.forEach((tag) => params.append("tags", tag.name)); // Use name instead of ID

    const queryString = params.toString();
    if (queryString) {
      router.push(`/?${queryString}`);
    } else {
      router.push("/");
    }
  }, [search, category, sort, selectedTags, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);
    return () => clearTimeout(timer);
  }, [applyFilters]);

  const handleClearFilters = () => {
    setSearch("");
    setInputValue("");
    setCategory("all");
    setSort("added");
    setSelectedTags([]);
    router.push("/");
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleSelectResult = (item: SearchItem | null) => {
    if (item) {
      router.push(`/${item.slug}`);
    }
  };

  return (
    <Box sx={{ mb: 4, mx: "auto", position: "relative", width: expanded ? { xs: "100%", md: "42%" } : { xs: "60%", md: "21%" } }}>
      <Paper
        elevation={0}
        sx={{
          p: expanded ? 2 : 1.5,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          transition: "all 0.3s ease",
          minWidth: expanded ? "300px" : "auto",
        }}
      >
        {/* Header / Collapsed View - Compact single row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "space-between" : "center",
            cursor: "pointer",
            py: 0.5,
            width: "100%",
            gap: expanded ? 0 : 2,
          }}
          onClick={handleExpandClick}
        >
          {!expanded && (
            <>
              <FilterIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{ 
                  fontWeight: 500, 
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                Filter, display, tags
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandClick();
                }}
                aria-label={expanded ? "Collapse filters" : "Expand filters"}
                sx={{ p: 0.5 }}
              >
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </>
          )}
          {expanded && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <FilterIcon fontSize="small" sx={{ color: "text.secondary" }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, fontSize: "0.8rem" }}
                >
                  Filter, display, tags
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandClick();
                }}
                aria-label={expanded ? "Collapse filters" : "Expand filters"}
                sx={{ p: 0.5 }}
              >
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </>
          )}
        </Box>

      {/* Expanded View */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Row 1: Category and Sorting */}
            {/* Category */}
<Grid   size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
                sx={{ fontSize: "0.85rem" }}
              >
                Category
              </Typography>
              <TextField
                select
                fullWidth
                id={categorySelectId}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                SelectProps={{ id: `${categorySelectId}-select` }}
                sx={{
                  "& .MuiSelect-select": {
                    py: 0.75,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Sorting */}
<Grid   size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
                sx={{ fontSize: "0.85rem" }}
              >
                Sorting
              </Typography>
              <TextField
                select
                fullWidth
                id={sortSelectId}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                SelectProps={{ id: `${sortSelectId}-select` }}
                sx={{
                  "& .MuiSelect-select": {
                    py: 0.75,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <MenuItem value="updated">Updated</MenuItem>
                <MenuItem value="added">Added</MenuItem>
                <MenuItem value="az">Title A-Z</MenuItem>
                <MenuItem value="random">Random</MenuItem>
              </TextField>
            </Grid>

            {/* Row 2: Search and Tags */}
            {/* Search */}
<Grid   size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
                sx={{ fontSize: "0.85rem" }}
              >
                Search
              </Typography>
              <Autocomplete
                freeSolo
                options={searchResults}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.title
                }
                inputValue={inputValue}
                onInputChange={(_, newValue) => {
                  setInputValue(newValue);
                  setSearch(newValue); // Also update filter search
                }}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    handleSelectResult(newValue);
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <ListItem key={key} {...otherProps} sx={{ gap: 1.5 }}>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar
                          src={option.coverImage}
                          alt={option.title}
                          variant="rounded"
                          sx={{ width: 40, height: 56 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          option.authorName
                            ? `[${option.authorName}] ${option.title}`
                            : option.title
                        }
                        secondary={option.category || option.tags.slice(0, 30)}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 500,
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          noWrap: true,
                        }}
                      />
                    </ListItem>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    id={searchInputId}
                    placeholder="Title or artist"
                    variant="standard"
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                      startAdornment: (
                        <SearchIcon color="action" sx={{ mr: 1 }} />
                      ),
                    }}
                    inputProps={{
                      ...params.inputProps,
                      id: searchInputId,
                    }}
                    sx={{
                      "& input": { py: 0.75, fontSize: "0.85rem" },
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "& .MuiAutocomplete-inputRoot": {
                        minHeight: "40px",
                      },
                    }}
                  />
                )}
                noOptionsText={
                  inputValue.length >= 2
                    ? "ไม่พบผลลัพธ์"
                    : "พิมพ์อย่างน้อย 2 ตัวอักษร"
                }
              />
            </Grid>

            {/* Tags */}
<Grid   size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
                sx={{ fontSize: "0.85rem" }}
              >
                Tags
              </Typography>
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={(option) => option.name}
                value={selectedTags}
                onChange={(_, newValue) => setSelectedTags(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    id={tagsInputId}
                    variant="standard"
                    placeholder="Search for tag"
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                    }}
                    inputProps={{
                      ...params.inputProps,
                      id: tagsInputId,
                    }}
                  />
                )}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiAutocomplete-inputRoot": {
                    py: 0.5,
                    flexWrap: "wrap",
                    gap: 0.5,
                    minHeight: "40px",
                  },
                  "& .MuiAutocomplete-tag": {
                    margin: "2px",
                  },
                }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 1,
              }}
              size={12}
            >
              {(search || category !== "all" || selectedTags.length > 0 || sort !== "added") && (
                <Button variant="outlined" onClick={handleClearFilters} size="small">
                  Clear
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Collapse>
      </Paper>
    </Box>
  );
}
