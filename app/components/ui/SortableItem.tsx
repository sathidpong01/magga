"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { TextField, Stack } from "@mui/material";
import { maggaColors } from "@/lib/design-tokens";

type SortableItemProps = {
  id: string;
  preview?: string;
  src?: string;
  index?: number;
  onRemove: () => void;
  onMove?: (index: number) => void;
  total?: number;
  onPreview?: () => void;
};

export function SortableItem({
  id,
  preview,
  src,
  index,
  onRemove,
  onMove,
  total,
  onPreview,
}: SortableItemProps) {
  const imageUrl = src || preview || "";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1,
    zIndex: isDragging ? 3 : "auto",
  };

  const stopEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 0.9,
        width: "100%",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      <IconButton
        {...attributes}
        {...listeners}
        aria-label={`ลากย้ายหน้า ${(index ?? 0) + 1}`}
        sx={{ touchAction: "none", alignSelf: "center", width: 44, height: 44 }}
      >
        <DragIndicatorIcon />
      </IconButton>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${maggaColors.border}`,
          bgcolor: maggaColors.surfaceMuted,
          boxShadow: isDragging
            ? "0 16px 34px rgba(0,0,0,0.34)"
            : "0 8px 18px rgba(0,0,0,0.24)",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          loading="lazy"
          alt={`Page ${typeof index === "number" ? index + 1 : ""}`}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
          }}
        />

        {onPreview ? (
          <IconButton
            size="small"
            aria-label={`Preview page ${typeof index === "number" ? index + 1 : ""}`}
            onClick={(event) => {
              stopEvent(event);
              onPreview();
            }}
            onPointerDown={stopEvent}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 44,
              height: 44,
              bgcolor: "rgba(0,0,0,0.58)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fafafa",
              "&:hover": { bgcolor: "rgba(0,0,0,0.78)" },
            }}
          >
            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : null}

        <IconButton
          size="small"
          aria-label={`Remove page ${typeof index === "number" ? index + 1 : ""}`}
          onClick={(event) => {
            stopEvent(event);
            onRemove();
          }}
          onPointerDown={stopEvent}
          sx={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 44,
            height: 44,
            bgcolor: "rgba(0,0,0,0.58)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fafafa",
            "&:hover": { bgcolor: "rgba(220, 38, 38, 0.82)" },
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {onMove && typeof index === "number" && total ? (
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", justifyContent: "center" }}
        >
          <IconButton
            aria-label={`ย้ายหน้า ${index + 1} ขึ้น`}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`ย้ายหน้า ${index + 1} ลง`}
            disabled={index === total - 1}
            onClick={() => onMove(index + 1)}
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
          <TextField
            label="ย้ายไปหน้า"
            type="number"
            size="small"
            defaultValue={index + 1}
            key={index}
            slotProps={{ htmlInput: { min: 1, max: total } }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const next = Number((event.target as HTMLInputElement).value);
                if (Number.isSafeInteger(next) && next >= 1 && next <= total)
                  onMove(next - 1);
              }
            }}
            sx={{ width: 100, mt: 1 }}
          />
        </Stack>
      ) : null}
      <Typography
        variant="caption"
        sx={{
          color: maggaColors.textMuted,
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        หน้า {typeof index === "number" ? index + 1 : "-"}
      </Typography>
    </Box>
  );
}
