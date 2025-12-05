"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function SearchFilters({ categories, tags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  // State for filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "added");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Initialize selected tags from URL
  useEffect(() => {
    const tagNames = searchParams.getAll("tags");
    
    // Deep compare to avoid infinite loop
    const currentTagNames = selectedTags.map(t => t.name).sort();
    const newTagNames = [...tagNames].sort();
    const isSame = currentTagNames.length === newTagNames.length && 
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
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
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
    setCategoryId("all");
    setSort("added");
    setSelectedTags([]);
    router.push("/");
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
            Filters and display
          </Typography>
          {!expanded && (
            <Box sx={{ display: "flex", gap: 2, color: "text.secondary" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <SortIcon fontSize="small" />
                <Typography variant="body2">
                  Order: {sort === "updated" ? "Updated" : sort === "added" ? "Added" : "A-Z"}
                </Typography>
              </Box>

            </Box>
          )}
        </Box>
        <IconButton 
          onClick={(e) => { e.stopPropagation(); handleExpandClick(); }}
          aria-label={expanded ? "Collapse filters" : "Expand filters"}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded View */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {/* Category */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Category
              </Typography>
              <TextField
                select
                fullWidth
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiSelect-select": { py: 0.75, fontSize: "0.85rem", fontWeight: 500 },
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
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Sorting
              </Typography>
              <TextField
                select
                fullWidth
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiSelect-select": { py: 0.75, fontSize: "0.85rem", fontWeight: 500 },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <MenuItem value="updated">Updated</MenuItem>
                <MenuItem value="added">Added</MenuItem>
                <MenuItem value="az">Title A-Z</MenuItem>
              </TextField>
            </Grid>

            {/* Search */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Search
              </Typography>
              <TextField
                fullWidth
                placeholder="Title or artist"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                sx={{
                  "& input": { py: 0.75, fontSize: "0.85rem" },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
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
                    variant="standard"
                    placeholder={selectedTags.length === 0 ? "Search for tag" : ""}
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                    }}
                  />
                )}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiAutocomplete-inputRoot": { py: 0.5 },
                }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
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
