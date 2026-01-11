"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

type SortableItemProps = {
  id: string;
  preview?: string;
  src?: string; // Alias for preview
  index?: number; // Optional index prop
  onRemove: () => void;
};

export function SortableItem({
  id,
  preview,
  src,
  onRemove,
}: SortableItemProps) {
  const imageUrl = src || preview || ""; // Support both prop names
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: "relative",
        width: 120,
        height: 160,
        borderRadius: 1,
        overflow: "hidden",
        boxShadow: 2,
      }}
    >
      <Box
        component="img"
        src={imageUrl}
        alt="Page"
        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <Box
        {...attributes}
        {...listeners}
        sx={{
          position: "absolute",
          top: 4,
          left: 4,
          cursor: "grab",
          bgcolor: "rgba(0,0,0,0.6)",
          borderRadius: 1,
          p: 0.5,
        }}
      >
        <DragIndicatorIcon sx={{ color: "white", fontSize: 20 }} />
      </Box>
      <IconButton
        size="small"
        onClick={onRemove}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          bgcolor: "rgba(0,0,0,0.6)",
          "&:hover": { bgcolor: "rgba(220, 38, 38, 0.8)" },
        }}
      >
        <DeleteIcon fontSize="small" sx={{ color: "white" }} />
      </IconButton>
    </Box>
  );
}
