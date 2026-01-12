"use client";

import { useState, useEffect, useCallback, useId, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
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
import { Category, Tag } from "@prisma/client";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";

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
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "all"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "added");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Fuse.js search state
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isIndexLoading, setIsIndexLoading] = useState(false);

  // Lazy load search index only when user starts typing (2+ characters)
  // This defers the API call until needed, improving initial page load
  useEffect(() => {
    const fetchSearchIndex = async () => {
      if (isIndexLoading || searchIndex.length > 0) return;

      setIsIndexLoading(true);
      try {
        const res = await fetchWithRetry("/api/search", { retries: 2 });
        if (res.ok) {
          const data = await res.json();
          setSearchIndex(data);
        }
      } catch (error) {
        console.error("Failed to fetch search index:", error);
      } finally {
        setIsIndexLoading(false);
      }
    };

    // Only fetch when user types 2+ characters and index is empty
    if (inputValue.length >= 2 && searchIndex.length === 0) {
      fetchSearchIndex();
    }
  }, [inputValue, searchIndex.length, isIndexLoading]);

  // Create Fuse.js instance
  const fuse = useMemo(() => {
    return new Fuse(searchIndex, {
      keys: [
        { name: "title", weight: 2 },
        { name: "authorName", weight: 1.5 },
        { name: "description", weight: 0.5 },
        { name: "tags", weight: 1 },
        { name: "category", weight: 0.8 },
      ],
      threshold: 0.4, // Fuzzy tolerance (0 = exact, 1 = match anything)
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [searchIndex]);

  // Perform fuzzy search when input changes
  useEffect(() => {
    if (inputValue.length >= 2) {
      const results = fuse.search(inputValue, { limit: 10 });
      setSearchResults(results.map((r) => r.item));
    } else {
      setSearchResults([]);
    }
  }, [inputValue, fuse]);

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
    if (categoryId && categoryId !== "all")
      params.set("categoryId", categoryId);
    if (sort && sort !== "added") params.set("sort", sort);

    selectedTags.forEach((tag) => params.append("tags", tag.name)); // Use name instead of ID

    const queryString = params.toString();
    if (queryString) {
      router.push(`/?${queryString}`);
    } else {
      router.push("/");
    }
  }, [search, categoryId, sort, selectedTags, router]);

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
    setCategoryId("all");
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
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 4,
        mx: "auto", // Center the component
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        transition: "all 0.3s ease",
        width: expanded ? { xs: "100%", md: "42%" } : { xs: "100%", md: "21%" }, // Expand on click
        minWidth: "300px",
      }}
    >
      {/* Header / Collapsed View */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={handleExpandClick}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, fontSize: "0.85rem" }}
          >
            Filters and display
          </Typography>
          {!expanded && (
            <Box sx={{ display: "flex", gap: 2, color: "text.secondary" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <SortIcon fontSize="small" />
                <Typography variant="body2">
                  Order:{" "}
                  {sort === "updated"
                    ? "Updated"
                    : sort === "added"
                    ? "Added"
                    : "A-Z"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleExpandClick();
          }}
          aria-label={expanded ? "Collapse filters" : "Expand filters"}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded View */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {/* Smart Search with Fuse.js - Top, centered, full width */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
              >
                Smart Search
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
                    placeholder="พิมพ์ชื่อเรื่อง หรือ ชื่อผู้แต่ง..."
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

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
              >
                Category
              </Typography>
              <TextField
                select
                fullWidth
                id={categorySelectId}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Sorting */}
            <Grid item xs={12} sm={6}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
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
              </TextField>
            </Grid>

            {/* Tags - Full width to allow horizontal tag display */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                gutterBottom
                color="text.secondary"
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
                    placeholder={
                      selectedTags.length === 0 ? "Search for tag" : ""
                    }
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
                  },
                  "& .MuiAutocomplete-tag": {
                    margin: "2px",
                  },
                }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 2,
              }}
            >
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
