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
  IconButton,
} from "@mui/material";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, tags } from "@/db/schema";
import { maggaColors } from "@/lib/design-tokens";
import { buildSearchFilterUrl, normalizeMangaSort } from "@/lib/manga-query";

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
  coverImage: string;
  authorName: string;
  category: string;
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

  const urlKey = searchParams.toString();
  const currentAuthor = searchParams.get("author");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState<string>(normalizeMangaSort(searchParams.get("sort")));
  const [selectedTags, setSelectedTags] = useState<Tag[]>(() => tags.filter((tag) => searchParams.getAll("tags").includes(tag.name)));
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [inputValue, setInputValue] = useState(searchParams.get("search") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const suggestionController = useRef<AbortController | null>(null);
  const suggestionGeneration = useRef(0);
  const composing = useRef(false);
  const lastNavigation = useRef<string | null>(null);

  // The URL is authoritative on initial load and browser Back/Forward.
  useEffect(() => {
    const params = new URLSearchParams(urlKey);
    setSearch(params.get("search") || "");
    setInputValue(params.get("search") || "");
    setCategory(params.get("category") || "all");
    setSort(normalizeMangaSort(params.get("sort")));
    setSelectedTags(tags.filter((tag) => params.getAll("tags").includes(tag.name)));
    lastNavigation.current = null;
  }, [urlKey, tags]);

  // Draft typing fetches suggestions only; a committed search changes the page.
  useEffect(() => {
    const generation = ++suggestionGeneration.current;
    const controller = new AbortController();
    suggestionController.current = controller;
    const query = inputValue.trim();
    setSearchError(false);
    setSearchResults([]);
    setIsSearching(false);
    if (query.length < 2) return () => controller.abort();
    const timer = setTimeout(async () => {
      if (controller.signal.aborted || generation !== suggestionGeneration.current) return;
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.slice(0, 200))}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (!controller.signal.aborted && generation === suggestionGeneration.current) {
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!controller.signal.aborted && generation === suggestionGeneration.current) setSearchError(true);
      } finally {
        if (!controller.signal.aborted && generation === suggestionGeneration.current) setIsSearching(false);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [inputValue]);

  const navigate = useCallback((url: string) => {
    suggestionGeneration.current++;
    suggestionController.current?.abort();
    setIsSearching(false);
    setSearchResults([]);
    if (lastNavigation.current === url) return;
    lastNavigation.current = url;
    router.push(url);
  }, [router]);

  const applyFilters = useCallback((overrides: { search?: string; category?: string; sort?: string; tags?: Tag[] } = {}) => {
    const nextSearch = overrides.search ?? search;
    setSearch(nextSearch);
    navigate(buildSearchFilterUrl({
      search: nextSearch,
      category: overrides.category ?? category,
      sort: overrides.sort ?? sort,
      tagNames: (overrides.tags ?? selectedTags).map((tag) => tag.name),
      author: currentAuthor,
    }));
  }, [search, category, sort, selectedTags, currentAuthor, navigate]);

  const commitSearch = () => {
    if (!composing.current) applyFilters({ search: inputValue });
  };
  const handleClearFilters = () => {
    setSearch(""); setInputValue(""); setCategory("all"); setSort("added"); setSelectedTags([]);
    navigate("/");
  };
  const handleExpandClick = () => setExpanded((value) => !value);

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
              value={null}
              filterOptions={(options) => options}
              loading={isSearching}
              loadingText="กำลังค้นหา..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && (composing.current || event.nativeEvent.isComposing)) {
                  (event as typeof event & { defaultMuiPrevented: boolean }).defaultMuiPrevented = true;
                  event.preventDefault();
                } else if (event.key === "Enter" && !inputValue.trim()) {
                  (event as typeof event & { defaultMuiPrevented: boolean }).defaultMuiPrevented = true;
                  event.preventDefault();
                  commitSearch();
                }
              }}
              sx={{ "& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator": { minWidth: 44, minHeight: 44 } }}
              options={searchResults}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.title
              }
              inputValue={inputValue}
              onInputChange={(_, newValue, reason) => {
                if (reason === "input" || reason === "clear") setInputValue(newValue);
              }}
              onChange={(_, newValue) => {
                if (composing.current) return;
                if (typeof newValue === "string") applyFilters({ search: newValue });
                else if (newValue) navigate(`/${encodeURIComponent(newValue.slug)}`);
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
                      secondary={option.category || ""}
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
                  onCompositionStart={() => { composing.current = true; }}
                  onCompositionEnd={() => { composing.current = false; }}
                  placeholder={
                    currentAuthor
                      ? `ค้นหาในผลงานของ ${currentAuthor}...`
                      : "ค้นหาชื่อเรื่องหรือนักวาด..."
                  }
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
                      "&:focus-within": {
                        outline: `2px solid ${maggaColors.archiveGoldHover}`,
                        outlineOffset: "2px",
                        borderRadius: "4px",
                      },
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
                searchError ? "ค้นหาไม่สำเร็จ กรุณาลองใหม่" : inputValue.length >= 2
                  ? "ไม่พบผลลัพธ์"
                  : "พิมพ์อย่างน้อย 2 ตัวอักษร"
              }
            />
          </Box>

          <IconButton aria-label="ค้นหา" onClick={commitSearch} sx={{ color: maggaColors.archiveGold, minWidth: 44, minHeight: 44 }}>
            <SearchIcon />
          </IconButton>
          {/* Filters & tags Button (Tailspace Style) */}
          <ButtonBase
            aria-controls={filterPanelId}
            aria-expanded={expanded}
            aria-label={expanded ? "ซ่อนตัวกรอง" : "เปิดตัวกรอง & แท็ก"}
            onClick={handleExpandClick}
            sx={{
              minHeight: 44,
              "&.Mui-focusVisible": {
                outline: `2px solid ${maggaColors.archiveGoldHover}`,
                outlineOffset: "3px",
              },
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
                  onChange={(e) => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }}
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
                  onChange={(e) => { setSort(e.target.value); applyFilters({ sort: e.target.value }); }}
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
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => { setSelectedTags(newValue); applyFilters({ tags: newValue }); }}
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
