import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function NotificationModal({
  open,
  onClose,
  type,
  title,
  message,
  primaryAction,
  secondaryAction,
}: NotificationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#171717',
          color: '#fafafa',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {type === 'success' ? (
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 28 }} />
        ) : (
          <ErrorOutlineIcon color="error" sx={{ fontSize: 28 }} />
        )}
        {title}
      </DialogTitle>
      <DialogContent>
        {type === 'error' ? (
           <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2' }}>
             {message}
           </Alert>
        ) : (
          <Typography variant="body1" sx={{ color: '#d4d4d4' }}>
            {message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outlined"
            color="inherit"
            sx={{ color: '#a3a3a3', borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            variant="contained"
            color={type === 'success' ? 'success' : 'error'}
            autoFocus
          >
            {primaryAction.label}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
