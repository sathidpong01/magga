"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useToast } from "@/app/contexts/ToastContext";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PollHelp from "./PollHelp";
import { maggaColors, maggaRadii } from "@/lib/design-tokens";
import { authFetch } from "@/lib/auth-fetch";
import { parsePollInput } from "@/lib/polls/validation";
import { fromBangkokInput, toBangkokInput } from "@/lib/polls/time";
import {
  resultsLabels,
  type AdminPoll,
  type PollInput,
} from "@/lib/polls/types";

type Option = PollInput["options"][number] & { imageUrl?: string | null };
type Manga = { id: string; title: string; coverImage: string | null };
const newOption = (): Option => ({
  id: crypto.randomUUID(),
  label: "",
  assetId: null,
  mangaId: null,
});
function initialInput(poll?: AdminPoll): PollInput {
  return poll
    ? {
        title: poll.title,
        description: poll.description,
        coverAssetId: poll.coverAssetId,
        visibility: poll.visibility,
        resultsVisibility: poll.resultsVisibility,
        security: poll.security,
        requireCaptcha: poll.requireCaptcha,
        minChoices: poll.minChoices,
        maxChoices: poll.maxChoices,
        allowChange: poll.allowChange,
        showCount: poll.showCount,
        showOnHome: poll.showOnHome,
        pinned: poll.pinned,
        startsAt: poll.startsAt,
        endsAt: poll.endsAt,
        options: poll.options.map(({ id, label, assetId, mangaId }) => ({
          id,
          label,
          assetId,
          mangaId,
        })),
      }
    : {
        title: "",
        description: "",
        coverAssetId: null,
        visibility: "public",
        resultsVisibility: "after_vote",
        security: "standard",
        requireCaptcha: true,
        minChoices: 1,
        maxChoices: 1,
        allowChange: false,
        showCount: true,
        showOnHome: true,
        pinned: false,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        options: [newOption(), newOption()],
      };
}
export default function PollForm({
  initial,
  onSaved,
  onDirtyChange,
}: {
  initial?: AdminPoll;
  onSaved?: (poll: AdminPoll) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const { showError } = useToast();
  const [input, setInput] = useState(() => initialInput(initial));
  const [options, setOptions] = useState<Option[]>(
    () => initial?.options ?? input.options,
  );
  const [cover, setCover] = useState(initial?.coverImageUrl ?? null);
  const [start, setStart] = useState(toBangkokInput(input.startsAt));
  const [end, setEnd] = useState(toBangkokInput(input.endsAt));
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [mangaSearch, setMangaSearch] = useState("");
  const [manga, setManga] = useState<Manga[]>([]);

  const [showDescription, setShowDescription] = useState(
    Boolean(initial?.description),
  );
  const [showMangaSearch, setShowMangaSearch] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  useEffect(() => {
    if (message) showError(message);
  }, [message, showError]);
  const version = useRef(initial?.version ?? 0);
  const activeSave = useRef(false);
  useEffect(() => {
    if (!initial || dirty || activeSave.current) return;
    version.current = initial.version;
    setInput(initialInput(initial));
    setOptions(initial.options);
    setCover(initial.coverImageUrl);
    setStart(toBangkokInput(initial.startsAt));
    setEnd(toBangkokInput(initial.endsAt));
  }, [initial, dirty]);
  useEffect(() => {
    onDirtyChange?.(dirty || Boolean(uploading) || saving);
  }, [dirty, uploading, saving, onDirtyChange]);
  const locked = Boolean(
    initial && (initial.total ?? 0) + initial.excluded > 0,
  );
  const archived = initial?.status === "archived";
  const edit = <K extends keyof PollInput>(key: K, value: PollInput[K]) => {
    setInput((old) => ({ ...old, [key]: value }));
    setMessage("");
    setDirty(true);
    setSaved("");
  };
  function optionChange(index: number, update: Partial<Option>) {
    setOptions((old) =>
      old.map((o, i) => (i === index ? { ...o, ...update } : o)),
    );
    setDirty(true);
    setSaved("");
  }
  function move(index: number, change: number) {
    setOptions((old) => {
      const next = [...old];
      [next[index], next[index + change]] = [next[index + change], next[index]];
      return next;
    });
    setDirty(true);
  }
  function dropOption(source: string, target: string) {
    if (locked || source === target) return;
    setOptions((old) => {
      const from = old.findIndex((o) => o.id === source);
      const to = old.findIndex((o) => o.id === target);
      if (from < 0 || to < 0) return old;
      const next = [...old];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDirty(true);
  }
  async function upload(file: File, target: string) {
    setUploading(target);
    setMessage("");
    try {
      if (file.size > 3 * 1024 * 1024)
        throw new Error("รูปภาพต้องมีขนาดไม่เกิน 3 MB");
      const body = new FormData();
      body.append("file", file);
      const response = await authFetch("/api/admin/polls/upload", {
        method: "POST",
        body,
      });
      const asset = await response.json();
      if (!response.ok) throw new Error(asset.error);
      if (target === "cover") {
        edit("coverAssetId", asset.id);
        setCover(asset.url);
      } else {
        setOptions((old) =>
          old.map((option) =>
            option.id === target
              ? {
                  ...option,
                  assetId: asset.id,
                  mangaId: null,
                  imageUrl: asset.url,
                }
              : option,
          ),
        );
        setDirty(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(null);
    }
  }
  const formValue = (): PollInput =>
    parsePollInput({
      ...input,
      options: options.map(({ id, label, assetId, mangaId }) => ({
        id,
        label,
        assetId,
        mangaId,
      })),
      startsAt:
        initial && start === toBangkokInput(initial.startsAt)
          ? initial.startsAt
          : fromBangkokInput(start),
      endsAt:
        initial && end === toBangkokInput(initial.endsAt)
          ? initial.endsAt
          : fromBangkokInput(end),
    });
  const current = useRef({ formValue, onSaved, dirty });
  useEffect(() => {
    current.current = { formValue, onSaved, dirty };
  });
  async function save(automatic = false) {
    if (activeSave.current) return;
    let value: PollInput;
    try {
      value = current.current.formValue();
    } catch (error) {
      if (!automatic)
        setMessage(error instanceof Error ? error.message : "กรุณาตรวจข้อมูล");
      return;
    }
    activeSave.current = true;
    setSaving(true);
    setMessage("");
    const snapshot = JSON.stringify(value);
    try {
      const response = await authFetch(
        initial ? `/api/admin/polls/${initial.id}` : "/api/admin/polls",
        {
          method: initial ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            initial ? { input: value, version: version.current } : value,
          ),
        },
      );
      const poll = await response.json();
      if (!response.ok) throw new Error(poll.error);
      version.current = poll.version;
      let unchanged = false;
      try {
        unchanged = JSON.stringify(current.current.formValue()) === snapshot;
      } catch {
        /* Still editing an incomplete field. */
      }
      if (unchanged) {
        setDirty(false);
        setSaved("บันทึกแล้ว");
      }
      current.current.onSaved?.(poll);
      if (!initial) router.replace(`/dashboard/admin/polls/${poll.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      activeSave.current = false;
      setSaving(false);
    }
  }
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (
      !initial ||
      initial.status !== "draft" ||
      !dirty ||
      uploading ||
      message
    )
      return;
    const timer = setTimeout(() => void saveRef.current(true), 1800);
    return () => clearTimeout(timer);
  }, [initial, input, options, start, end, dirty, uploading, message]);
  useEffect(() => {
    if (mangaSearch.trim().length < 2) {
      setManga([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(mangaSearch.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error();
        setManga(await response.json());
      } catch {
        if (!controller.signal.aborted) showError("ค้นหาไม่ได้ กรุณาลองใหม่");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mangaSearch, showError]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty || uploading) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty, uploading]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };
  const sectionSx = {
    py: 1.5,
    borderBottom: `1px solid ${maggaColors.border}`,
  };
  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1fr) 270px" },
        gap: 2,
        alignItems: "start",
        "& .MuiTextField-root .MuiInputBase-input": { py: 1.25 },
        "& .MuiFormControlLabel-root .MuiTypography-root": {
          fontSize: "0.875rem",
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {locked && (
          <Alert severity="info" sx={{ mb: 1 }}>
            มีบัตรโหวตแล้ว ล็อกคำถามและกติกา{" "}
            <PollHelp text="แก้คำอธิบาย เวลาปิด และการแสดงผลได้ หากต้องการเปลี่ยนคำถามหรือตัวเลือก ให้ทำสำเนาโพล" />
          </Alert>
        )}
        <Box
          component="fieldset"
          disabled={Boolean(archived)}
          sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
        >
          <Box sx={sectionSx}>
            <TextField
              size="small"
              label="ชื่อโพล"
              value={input.title}
              onChange={(e) => edit("title", e.target.value)}
              fullWidth
              required
              disabled={locked}
              slotProps={{ htmlInput: { maxLength: 160 } }}
            />
            {showDescription && (
              <TextField
                label="คำอธิบาย (ไม่บังคับ)"
                value={input.description}
                onChange={(e) => edit("description", e.target.value)}
                fullWidth
                multiline
                minRows={2}
                size="small"
                sx={{ mt: 1.5 }}
                slotProps={{ htmlInput: { maxLength: 4000 } }}
              />
            )}
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 0.5, alignItems: "center", flexWrap: "wrap" }}
            >
              <Button
                size="small"
                onClick={() => setShowDescription((value) => !value)}
              >
                {showDescription ? "ซ่อนคำอธิบาย" : "เพิ่มคำอธิบาย"}
              </Button>
              <Button
                component="label"
                disabled={locked || Boolean(uploading)}
                sx={{ width: 104, flexShrink: 0 }}
                size="small"
              >
                {uploading === "cover" ? "กำลังอัปโหลด…" : "ภาพประกอบ"}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file, "cover");
                    e.target.value = "";
                  }}
                />
              </Button>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {cover && (
                  <Image
                    src={cover}
                    alt="ภาพประกอบ"
                    fill
                    sizes="32px"
                    style={{ objectFit: "contain" }}
                  />
                )}
              </Box>
              <Button
                disabled={locked || !cover}
                sx={{ minWidth: 84 }}
                onClick={() => {
                  edit("coverAssetId", null);
                  setCover(null);
                }}
              >
                นำภาพออก
              </Button>
            </Stack>
          </Box>
          <Box sx={sectionSx}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
              >
                ตัวเลือก ({options.length})
              </Typography>
              <PollHelp text="เพิ่มได้ 2–30 ตัวเลือก ใช้ข้อความ รูป JPEG/PNG/WebP ไม่เกิน 3 MB หรือปกมังงะในระบบ ลากจุดด้านซ้ายหรือใช้ปุ่มขึ้นลงเพื่อจัดลำดับ" />
            </Box>
            <Stack spacing={1}>
              {options.map((option, index) => (
                <Box
                  key={option.id}
                  onDragOver={(e) => {
                    if (
                      !locked &&
                      e.dataTransfer.types.includes(
                        "application/x-magga-poll-option",
                      )
                    )
                      e.preventDefault();
                  }}
                  onDrop={(e) => {
                    const source = e.dataTransfer.getData(
                      "application/x-magga-poll-option",
                    );
                    if (source) {
                      e.preventDefault();
                      dropOption(source, option.id);
                    }
                  }}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0,1fr)",
                    gap: 1,
                    alignItems: "start",
                    pb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      color: maggaColors.textSecondary,
                      display: "flex",
                      alignItems: "center",
                      pt: 0.5,
                      minWidth: 20,
                    }}
                  >
                    <Typography>{index + 1}</Typography>
                    <Box
                      component="span"
                      aria-hidden="true"
                      title="ลากเพื่อจัดลำดับ หรือใช้ปุ่มขึ้นลง"
                      draggable={!locked}
                      onDragStart={(e) =>
                        e.dataTransfer.setData(
                          "application/x-magga-poll-option",
                          option.id,
                        )
                      }
                      sx={{
                        cursor: locked ? "default" : "grab",
                        display: "inline-block",
                        p: 0.5,
                      }}
                    >
                      ⠿
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 0,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "40px minmax(0,1fr)",
                        md: "40px minmax(0,1fr) auto",
                      },
                      gridTemplateAreas: {
                        xs: '"image input" "image controls"',
                        md: '"image input controls"',
                      },
                      gap: 0.5,
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      size="small"
                      sx={{ gridArea: "input" }}
                      label={`ตัวเลือกที่ ${index + 1}`}
                      value={option.label}
                      onChange={(e) =>
                        optionChange(index, { label: e.target.value })
                      }
                      fullWidth
                      required
                      disabled={locked}
                      slotProps={{ htmlInput: { maxLength: 120 } }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "center",
                        gap: 0,
                        gridArea: "controls",
                        "& .MuiIconButton-root": { width: 32, height: 32 },
                        "& .MuiButton-root": {
                          minWidth: 48,
                          px: 0.75,
                          fontSize: "0.75rem",
                        },
                      }}
                    >
                      <Button
                        component="label"
                        size="small"
                        disabled={locked || Boolean(uploading)}
                        sx={{
                          width: 84,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                          minHeight: 44,
                        }}
                      >
                        {uploading === option.id
                          ? "กำลังอัปโหลด…"
                          : option.imageUrl
                            ? "เปลี่ยนรูป"
                            : "เพิ่มรูป"}
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void upload(file, option.id);
                            e.target.value = "";
                          }}
                        />
                      </Button>
                      <IconButton
                        size="small"
                        aria-label={`นำรูปตัวเลือก ${index + 1} ออก`}
                        disabled={locked || !option.imageUrl}
                        onClick={() =>
                          optionChange(index, {
                            assetId: null,
                            mangaId: null,
                            imageUrl: null,
                          })
                        }
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        aria-label={`เลื่อนตัวเลือก ${index + 1} ขึ้น`}
                        disabled={locked || index === 0}
                        onClick={() => move(index, -1)}
                        size="small"
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`เลื่อนตัวเลือก ${index + 1} ลง`}
                        disabled={locked || index === options.length - 1}
                        onClick={() => move(index, 1)}
                        size="small"
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={`ลบตัวเลือก ${index + 1}`}
                        disabled={locked || options.length <= 2}
                        onClick={() => {
                          setOptions((old) =>
                            old.filter((o) => o.id !== option.id),
                          );
                          setDirty(true);
                        }}
                        size="small"
                        sx={{ ml: "auto" }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box
                      sx={{
                        position: "relative",
                        width: 40,
                        height: 54,
                        gridArea: "image",
                        bgcolor: maggaColors.surfaceElevated,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {option.imageUrl ? (
                        <Image
                          src={option.imageUrl}
                          alt={`รูปตัวเลือกที่ ${index + 1}`}
                          fill
                          sizes="40px"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <ImageOutlinedIcon
                          sx={{ fontSize: 18, color: maggaColors.textMuted }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
            <Button
              startIcon={<AddIcon />}
              disabled={locked || options.length >= 30}
              onClick={() => {
                setOptions((old) => [...old, newOption()]);
                setDirty(true);
              }}
              sx={{ mt: 1 }}
            >
              เพิ่มตัวเลือก
            </Button>
            {!locked && (
              <Button
                size="small"
                onClick={() => setShowMangaSearch((value) => !value)}
              >
                เลือกมังงะในระบบ
              </Button>
            )}
            {!locked && showMangaSearch && (
              <Box sx={{ mt: 1 }}>
                <Autocomplete<Manga>
                  options={manga}
                  value={null}
                  inputValue={mangaSearch}
                  onInputChange={(_, value) => setMangaSearch(value)}
                  getOptionLabel={(item) => item.title}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  filterOptions={(items) => items}
                  disabled={options.length >= 30}
                  noOptionsText={
                    mangaSearch.trim().length < 2
                      ? "พิมพ์อย่างน้อย 2 ตัวอักษร"
                      : "ไม่พบมังงะ"
                  }
                  onChange={(_, item) => {
                    if (!item) return;
                    setOptions((old) => [
                      ...old.filter(
                        (o) => o.label.trim() || o.assetId || o.mangaId,
                      ),
                      {
                        ...newOption(),
                        label: item.title.slice(0, 120),
                        mangaId: item.id,
                        imageUrl: item.coverImage,
                      },
                    ]);
                    setDirty(true);
                    setMangaSearch("");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="เพิ่มจากมังงะในระบบ"
                      placeholder="ค้นหาชื่ออย่างน้อย 2 ตัวอักษร"
                      size="small"
                    />
                  )}
                />
              </Box>
            )}
          </Box>
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              bgcolor: "transparent",
              backgroundImage: "none",
              "&:before": { display: "none" },
              borderBottom: `1px solid ${maggaColors.border}`,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 0,
                minHeight: 52,
                "& .MuiAccordionSummary-content": {
                  my: 1,
                  flexDirection: "column",
                },
              }}
            >
              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
              >
                กติกาและการแสดงผล
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เลือก {input.maxChoices} ข้อ ·{" "}
                {resultsLabels[input.resultsVisibility]} ·{" "}
                {input.security === "ip"
                  ? "จำกัด IP"
                  : input.security === "members"
                    ? "เฉพาะสมาชิก"
                    : "ป้องกันมาตรฐาน"}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{ px: 0, pb: 1.5, "& .MuiTextField-root": { my: 0.5 } }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="เลือกอย่างน้อย (ข้อ)"
                  type="number"
                  value={input.minChoices}
                  onChange={(e) => edit("minChoices", Number(e.target.value))}
                  disabled={locked}
                  slotProps={{ htmlInput: { min: 1, max: 30 } }}
                />
                <TextField
                  label="เลือกได้สูงสุด (ข้อ)"
                  type="number"
                  value={input.maxChoices}
                  onChange={(e) => edit("maxChoices", Number(e.target.value))}
                  disabled={locked}
                  slotProps={{ htmlInput: { min: 1, max: options.length } }}
                />
                <TextField
                  select
                  slotProps={{
                    select: { MenuProps: { disableScrollLock: true } },
                  }}
                  label="การป้องกันโหวตซ้ำ"
                  value={input.security}
                  onChange={(e) =>
                    edit("security", e.target.value as PollInput["security"])
                  }
                  disabled={locked}
                >
                  <MenuItem value="standard">มาตรฐาน: จดจำผู้เยี่ยมชม</MenuItem>
                  <MenuItem value="ip">เข้มงวด: หนึ่งบัตรต่อ IP</MenuItem>
                  <MenuItem value="members">เฉพาะสมาชิกที่เข้าสู่ระบบ</MenuItem>
                </TextField>
                <TextField
                  select
                  slotProps={{
                    select: { MenuProps: { disableScrollLock: true } },
                  }}
                  label="เปิดเผยผลโหวต"
                  value={input.resultsVisibility}
                  onChange={(e) =>
                    edit(
                      "resultsVisibility",
                      e.target.value as PollInput["resultsVisibility"],
                    )
                  }
                >
                  {Object.entries(resultsLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  slotProps={{
                    select: { MenuProps: { disableScrollLock: true } },
                  }}
                  label="การเข้าถึงโพล"
                  value={input.visibility}
                  onChange={(e) =>
                    edit(
                      "visibility",
                      e.target.value as PollInput["visibility"],
                    )
                  }
                >
                  <MenuItem value="public">สาธารณะ</MenuItem>
                  <MenuItem value="unlisted">
                    ไม่แสดงในรายการ (เข้าผ่านลิงก์)
                  </MenuItem>
                </TextField>
              </Box>
              {input.security === "ip" && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ผู้ใช้ที่อยู่บน Wi-Fi เดียวกันอาจโหวตได้เพียงคนเดียว
                </Alert>
              )}
              <Stack sx={{ mt: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={input.requireCaptcha}
                        onChange={(e) =>
                          edit("requireCaptcha", e.target.checked)
                        }
                      />
                    }
                    label="ยืนยันผู้โหวตด้วย CAPTCHA"
                  />
                  <PollHelp text="แนะนำให้เปิดเมื่อใช้งานจริง ต้องตั้งค่า Turnstile ก่อน หากปิด ระบบยังจดจำสิทธิ์โหวตและจำกัดความถี่ แต่ต้านบอตได้น้อยลง แก้การตั้งค่านี้ได้แม้มีคนโหวตแล้ว" />
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={input.allowChange}
                      onChange={(e) => edit("allowChange", e.target.checked)}
                      disabled={locked}
                    />
                  }
                  label="เปลี่ยนคำตอบได้ก่อนปิดโพล"
                />
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={input.showCount}
                        onChange={(e) => edit("showCount", e.target.checked)}
                      />
                    }
                    label="แสดงจำนวนบัตรโหวต"
                  />
                  <PollHelp text="แสดงยอดบัตรทั้งหมดได้ แม้ผลคะแนนแต่ละตัวเลือกยังถูกซ่อน" />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={input.showOnHome}
                        onChange={(e) => edit("showOnHome", e.target.checked)}
                      />
                    }
                    label="แสดงบนหน้าหลัก"
                  />
                  <PollHelp text="แสดงเฉพาะโพลสาธารณะที่เปิดอยู่ เมื่อไม่มีโพล ส่วนนี้จะยุบหายโดยไม่เว้นพื้นที่ว่าง" />
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={input.pinned}
                      onChange={(e) => edit("pinned", e.target.checked)}
                    />
                  }
                  label="ให้โพลนี้ขึ้นก่อนบนหน้าหลัก"
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
          <Box sx={sectionSx}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
              >
                ช่วงเวลา (เวลาไทย)
              </Typography>
              <PollHelp text="ใช้เวลาไทย UTC+7 หากเวลาเปิดผ่านไปแล้ว จะเปิดทันทีที่เผยแพร่ ระบบปิดรับโหวตตามเวลาเซิร์ฟเวอร์" />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <TextField
                type="datetime-local"
                label="เปิดรับโหวต"
                size="small"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setDirty(true);
                }}
                disabled={locked}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                type="datetime-local"
                label="ปิดรับโหวต"
                size="small"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setDirty(true);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
              py: 1.5,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={saving || Boolean(uploading)}
              sx={{
                minHeight: 44,
                minWidth: 156,
                flexShrink: 0,
                bgcolor: maggaColors.archiveGold,
                color: maggaColors.background,
                "&:hover": { bgcolor: maggaColors.archiveGoldHover },
              }}
            >
              {saving
                ? "กำลังบันทึก…"
                : initial
                  ? "บันทึกการแก้ไข"
                  : "สร้างฉบับร่าง"}
            </Button>
            <Button
              size="small"
              onClick={() => setShowPreview((value) => !value)}
              sx={{ display: { xs: "inline-flex", lg: "none" } }}
            >
              {showPreview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
            </Button>
            <Typography
              variant="caption"
              role="status"
              color="text.secondary"
              sx={{
                minHeight: 40,
                width: 164,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {saving
                ? "กำลังบันทึก…"
                : saved ||
                  (dirty
                    ? "มีการแก้ไขที่ยังไม่บันทึก"
                    : initial?.status === "draft"
                      ? "บันทึกฉบับร่างอัตโนมัติ"
                      : "")}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        component="aside"
        sx={{
          position: { lg: "sticky" },
          display: { xs: showPreview ? "block" : "none", lg: "block" },
          height: 480,
          maxHeight: { lg: "calc(100vh - 96px)" },
          overflowY: "auto",
          top: 24,
          minWidth: 0,
          bgcolor: maggaColors.surface,
          border: `1px solid ${maggaColors.border}`,
          borderRadius: `${maggaRadii.card}px`,
          p: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: maggaColors.textSecondary }}
        >
          ตัวอย่างโพล
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          title={input.title}
          sx={{
            overflowWrap: "anywhere",
            height: 60,
            lineHeight: "30px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {input.title || "ชื่อโพลของคุณ"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            height: 48,
            lineHeight: "24px",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {input.description}
        </Typography>
        <Box
          sx={{
            position: "relative",
            height: 96,
            mt: 1,
            bgcolor: maggaColors.surfaceElevated,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
          }}
        >
          {cover ? (
            <Image
              src={cover}
              alt="ตัวอย่างภาพประกอบ"
              fill
              sizes="270px"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <ImageOutlinedIcon sx={{ color: maggaColors.textMuted }} />
          )}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          เลือกได้สูงสุด {input.maxChoices} ข้อ
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 1,
            mt: 1,
          }}
        >
          {options.map((option, index) => (
            <Box key={option.id} sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  aspectRatio: "3 / 4",
                  position: "relative",
                  bgcolor: maggaColors.surfaceElevated,
                  borderRadius: `${maggaRadii.card}px`,
                }}
              >
                {option.imageUrl && (
                  <Image
                    src={option.imageUrl}
                    alt=""
                    fill
                    sizes="120px"
                    style={{ objectFit: "contain" }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                title={option.label}
                sx={{
                  display: "block",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  minHeight: 24,
                }}
              >
                {index + 1}. {option.label || "ชื่อตัวเลือก"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
