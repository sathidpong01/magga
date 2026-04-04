"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

type SortableItemProps = {
  id: string;
  preview?: string;
  src?: string;
  index?: number;
  onRemove: () => void;
  onPreview?: () => void;
};

export function SortableItem({
  id,
  preview,
  src,
  index,
  onRemove,
  onPreview,
}: SortableItemProps) {
  const imageUrl = src || preview || "";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

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
      {...attributes}
      {...listeners}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 0.9,
        width: "100%",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "#101010",
          boxShadow: isDragging
            ? "0 16px 34px rgba(0,0,0,0.34)"
            : "0 8px 18px rgba(0,0,0,0.24)",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={`Page ${typeof index === "number" ? index + 1 : ""}`}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
        />

        {onPreview ? (
          <IconButton
            size="small"
            onClick={(event) => {
              stopEvent(event);
              onPreview();
            }}
            onPointerDown={stopEvent}
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 28,
              height: 28,
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
          onClick={(event) => {
            stopEvent(event);
            onRemove();
          }}
          onPointerDown={stopEvent}
          sx={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 28,
            height: 28,
            bgcolor: "rgba(0,0,0,0.58)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fafafa",
            "&:hover": { bgcolor: "rgba(220, 38, 38, 0.82)" },
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "#bdbdbd",
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
