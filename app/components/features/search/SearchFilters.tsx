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
  ButtonBase,
  Autocomplete,
  Button,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, tags } from "@/db/schema";
import { maggaColors } from "@/lib/design-tokens";

type Category = InferSelectModel<typeof categories>;
type Tag = InferSelectModel<typeof tags>;
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
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
  const filterPanelId = useId();

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

  // Sync search input from URL search params
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== search) {
      setSearch(urlSearch);
      setInputValue(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (sort !== "added" ? 1 : 0) +
    selectedTags.length;

  return (
    <Box
      sx={{
        mb: 3.5,
        mx: "auto",
        position: "relative",
        width: "100%",
        maxWidth: 680,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, sm: 1.25 },
          backgroundColor: maggaColors.surface,
          border: "1px solid",
          borderColor: expanded ? maggaColors.archiveGoldBorder : maggaColors.border,
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:focus-within": {
            borderColor: maggaColors.archiveGoldBorder,
          },
        }}
      >
        {/* Main Bar: Search Input + Filters Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Search Autocomplete Input */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Autocomplete
              freeSolo
              options={searchResults}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.title
              }
              inputValue={inputValue}
              onInputChange={(_, newValue) => {
                setInputValue(newValue);
                setSearch(newValue);
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
                        sx={{ width: 40, height: 56, borderRadius: "6px" }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        option.authorName
                          ? `[${option.authorName}] ${option.title}`
                          : option.title
                      }
                      secondary={option.category || option.tags.slice(0, 30)}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          noWrap: true,
                          sx: { fontWeight: 500, color: maggaColors.textPrimary },
                        },
                        secondary: {
                          variant: "caption",
                          noWrap: true,
                          sx: { color: maggaColors.textMuted },
                        },
                      }}
                    />
                  </ListItem>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  id={searchInputId}
                  placeholder="ค้นหาชื่อเรื่องหรือนักวาด..."
                  variant="standard"
                  sx={{
                    "& input": {
                      py: 0.85,
                      fontSize: "0.88rem",
                      color: maggaColors.textPrimary,
                    },
                    "& .MuiInput-root": {
                      pl: 1,
                      "&::before, &::after": { display: "none" },
                    },
                    "& .MuiAutocomplete-inputRoot": {
                      minHeight: "38px",
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      disableUnderline: true,
                      startAdornment: (
                        <SearchIcon
                          sx={{
                            color: maggaColors.textMuted,
                            fontSize: "1.15rem",
                            mr: 1,
                          }}
                        />
                      ),
                    },
                    htmlInput: {
                      ...params.slotProps.htmlInput,
                      id: searchInputId,
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
          </Box>

          {/* Filters & tags Button (Tailspace Style) */}
          <ButtonBase
            aria-controls={filterPanelId}
            aria-expanded={expanded}
            aria-label={expanded ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง & แท็ก"}
            onClick={handleExpandClick}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: { xs: 1.25, sm: 1.75 },
              py: 0.85,
              borderRadius: "8px",
              bgcolor: expanded ? maggaColors.archiveGoldSoft : "rgba(255, 255, 255, 0.04)",
              border: "1px solid",
              borderColor: expanded ? maggaColors.archiveGoldBorder : "rgba(255, 255, 255, 0.08)",
              color: expanded ? maggaColors.archiveGold : maggaColors.textSecondary,
              fontSize: "0.825rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: maggaColors.archiveGoldSoft,
                borderColor: maggaColors.archiveGoldBorder,
                color: maggaColors.archiveGold,
              },
            }}
          >
            <FilterIcon sx={{ fontSize: "1rem" }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              ตัวกรอง & แท็ก
            </Box>
            {activeFilterCount > 0 && (
              <Box
                component="span"
                sx={{
                  bgcolor: maggaColors.archiveGold,
                  color: "#000",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </Box>
            )}
            <ExpandMoreIcon
              sx={{
                fontSize: "1.1rem",
                transition: "transform 0.2s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </ButtonBase>
        </Box>

        {/* Collapsible Panel for Category, Sort, Tags */}
        <Collapse in={expanded} id={filterPanelId}>
          <Box sx={{ pt: 2, pb: 0.5, px: 0.5, borderTop: "1px solid rgba(255, 255, 255, 0.06)", mt: 1.25 }}>
            <Grid container spacing={2}>
              {/* Category */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ color: maggaColors.textSecondary, fontSize: "0.8rem", fontWeight: 500 }}
                >
                  หมวดหมู่ (Category)
                </Typography>
                <TextField
                  select
                  fullWidth
                  id={categorySelectId}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  variant="standard"
                  sx={{
                    "& .MuiSelect-select": {
                      py: 0.65,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: maggaColors.textPrimary,
                    },
                    borderBottom: "1px solid",
                    borderColor: maggaColors.border,
                  }}
                  slotProps={{
                    input: { disableUnderline: true },
                    select: { id: `${categorySelectId}-select` },
                  }}
                >
                  <MenuItem value="all">ทั้งหมด (All)</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Sorting */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ color: maggaColors.textSecondary, fontSize: "0.8rem", fontWeight: 500 }}
                >
                  เรียงลำดับ (Sorting)
                </Typography>
                <TextField
                  select
                  fullWidth
                  id={sortSelectId}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  variant="standard"
                  sx={{
                    "& .MuiSelect-select": {
                      py: 0.65,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: maggaColors.textPrimary,
                    },
                    borderBottom: "1px solid",
                    borderColor: maggaColors.border,
                  }}
                  slotProps={{
                    input: { disableUnderline: true },
                    select: { id: `${sortSelectId}-select` },
                  }}
                >
                  <MenuItem value="updated">อัปเดตล่าสุด (Updated)</MenuItem>
                  <MenuItem value="added">เพิ่มล่าสุด (Added)</MenuItem>
                  <MenuItem value="az">ชื่อเรื่อง ก-ฮ (Title A-Z)</MenuItem>
                  <MenuItem value="random">สุ่มเรื่อง (Random)</MenuItem>
                </TextField>
              </Grid>

              {/* Tags */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ color: maggaColors.textSecondary, fontSize: "0.8rem", fontWeight: 500 }}
                >
                  แท็ก (Tags)
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
                      placeholder="เลือกแท็กที่ต้องการ..."
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...params.slotProps.input,
                          disableUnderline: true,
                        },
                        htmlInput: {
                          ...params.slotProps.htmlInput,
                          id: tagsInputId,
                        },
                      }}
                    />
                  )}
                  sx={{
                    borderBottom: "1px solid",
                    borderColor: maggaColors.border,
                    "& .MuiAutocomplete-inputRoot": {
                      py: 0.5,
                      flexWrap: "wrap",
                      gap: 0.5,
                      minHeight: "38px",
                      color: maggaColors.textPrimary,
                    },
                    "& .MuiAutocomplete-tag": {
                      margin: "2px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: maggaColors.textPrimary,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    },
                  }}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1.5,
                  mt: 0.5,
                }}
                size={12}
              >
                {(search || category !== "all" || selectedTags.length > 0 || sort !== "added") && (
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    size="small"
                    sx={{
                      borderRadius: "6px",
                      borderColor: maggaColors.border,
                      color: maggaColors.textSecondary,
                      fontSize: "0.8rem",
                      "&:hover": {
                        borderColor: maggaColors.archiveGold,
                        color: maggaColors.textPrimary,
                        bgcolor: maggaColors.archiveGoldSoft,
                      },
                    }}
                  >
                    ล้างตัวกรอง (Clear)
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
