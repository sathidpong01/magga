import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type SortableItemProps = {
  id: string;
  src: string;
  index: number;
  onRemove: () => void;
};

export function SortableItem({ id, src, index, onRemove }: SortableItemProps) {
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
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        position: 'relative',
        aspectRatio: '2/3',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: '#000',
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        touchAction: 'none', // Important for mobile DnD
      }}
    >
      <Box
        component="img"
        src={src}
        alt={`Page ${index + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none', // Prevent image dragging interfering with DnD
        }}
      />
      
      {/* Number Badge */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          fontSize: '0.75rem',
          textAlign: 'center',
          py: 0.5,
          pointerEvents: 'none',
        }}
      >
        {index + 1}
      </Box>

      {/* Remove Button */}
      <IconButton
        aria-label="Remove page"
        onClick={(e) => {
          e.stopPropagation(); // Prevent drag start
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on touch
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          p: 1,
          bgcolor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.8)' },
        }}
      >
        <DeleteIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}
