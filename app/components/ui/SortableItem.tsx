"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton, TextField, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { maggaColors, maggaRadii, maggaShadows } from "@/lib/design-tokens";

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
        width: "100%",
        maxWidth: 240,
        justifySelf: "center",
        borderRadius: `${maggaRadii.card}px`,
        border: `1px solid ${maggaColors.border}`,
        overflow: "hidden",
        bgcolor: maggaColors.surfaceElevated,
        boxShadow: isDragging ? maggaShadows.cardHoverLift : "none",
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          overflow: "hidden",
          bgcolor: maggaColors.surfaceMuted,
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
              bgcolor: maggaColors.surface,
              border: `1px solid ${maggaColors.border}`,
              color: maggaColors.textPrimary,
              "&:hover": { bgcolor: maggaColors.surfaceElevated },
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
            bgcolor: maggaColors.surface,
            border: `1px solid ${maggaColors.border}`,
            color: maggaColors.textPrimary,
            "&:hover": { bgcolor: maggaColors.dangerRed },
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", minHeight: 44, borderTop: `1px solid ${maggaColors.border}` }}>
        <Tooltip title="ลากเพื่อจัดลำดับ">
          <IconButton
            {...attributes}
            {...listeners}
            aria-label={`ลากย้ายหน้า ${(index ?? 0) + 1}`}
            sx={{ touchAction: "none", width: 44, height: 44, cursor: isDragging ? "grabbing" : "grab" }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {onMove && typeof index === "number" && total ? (
          <>
            <Tooltip title="เลขหน้า · กด Enter เพื่อย้าย">
              <TextField
                type="number"
                size="small"
                defaultValue={index + 1}
                key={index}
                slotProps={{ htmlInput: { min: 1, max: total, "aria-label": `ย้ายหน้า ${index + 1} ไปหน้า` } }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const input = event.currentTarget.querySelector("input");
                    const next = Number(input?.value);
                    if (Number.isSafeInteger(next) && next >= 1 && next <= total)
                      onMove(next - 1);
                  }
                }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  "& .MuiOutlinedInput-root": { height: 44, borderRadius: 0, bgcolor: "transparent" },
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    bgcolor: maggaColors.archiveGoldSoft,
                    boxShadow: `inset 0 0 0 1px ${maggaColors.archiveGold}`,
                  },
                  "& fieldset": { border: 0 },
                  "& input": { textAlign: "center", p: 0.5, fontSize: "0.85rem", fontWeight: 700 },
                }}
              />
            </Tooltip>
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
          </>
        ) : null}
      </Box>
    </Box>
  );
}
