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
  const [sort, setSort] = useState(searchParams.get("sort") || "updated");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Initialize selected tags from URL
  useEffect(() => {
    const tagIds = searchParams.getAll("tagIds");
    if (tagIds.length > 0) {
      const foundTags = tags.filter((tag) => tagIds.includes(tag.id));
      setSelectedTags(foundTags);
    }
  }, [searchParams, tags]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    if (sort) params.set("sort", sort);
    selectedTags.forEach((tag) => params.append("tagIds", tag.id));

    router.push(`/?${params.toString()}`);
  }, [search, categoryId, sort, selectedTags, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 500);
    return () => clearTimeout(timer);
  }, [applyFilters]);

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
        width: expanded ? { xs: "100%", md: "60%" } : { xs: "100%", md: "30%" }, // Expand on click
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
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
        <IconButton onClick={(e) => { e.stopPropagation(); handleExpandClick(); }}>
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
                  "& .MuiSelect-select": { py: 1, fontSize: "1.1rem", fontWeight: 500 },
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
                  "& .MuiSelect-select": { py: 1, fontSize: "1.1rem", fontWeight: 500 },
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
                  "& input": { py: 1, fontSize: "1.1rem" },
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


          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
}
