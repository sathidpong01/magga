import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';

type UploadModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (items: { type: 'url' | 'file'; content: string | File }[]) => void;
  title?: string;
  multiple?: boolean;
};

export default function UploadModal({ open, onClose, onAdd, title = "Add Pages", multiple = true }: UploadModalProps) {
  const [tab, setTab] = useState(0);
  const [urls, setUrls] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleUrlSubmit = () => {
    if (!urls.trim()) return;
    const urlList = urls.split('\n').filter(u => u.trim());
    const items = urlList.map(url => ({ type: 'url' as const, content: url.trim() }));
    onAdd(items);
    handleClose();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    const validFiles = fileList.filter(f => f.type.startsWith('image/'));
    
    if (validFiles.length > 0) {
      const items = validFiles.map(file => ({ type: 'file' as const, content: file }));
      onAdd(items);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrls("");
    setTab(0);
    onClose();
  };

  // Drag and Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: { 
          width: '100%',
          maxWidth: 700,
          bgcolor: '#171717', 
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 1
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        {title}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="secondary">
            <Tab icon={<LinkIcon />} iconPosition="start" label="Image URL" />
            <Tab icon={<CloudUploadIcon />} iconPosition="start" label="Upload File" />
          </Tabs>
        </Box>

        {tab === 0 ? (
          <Box>
            <TextField
              autoFocus
              multiline={multiple}
              rows={multiple ? 4 : 1}
              fullWidth
              placeholder={multiple ? "https://example.com/image1.jpg\nhttps://example.com/image2.jpg" : "https://example.com/image.jpg"}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              variant="filled"
              label={multiple ? "Enter Image URLs (one per line)" : "Enter Image URL"}
              InputProps={{ disableUnderline: true, sx: { borderRadius: 1 } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Supported formats: JPG, PNG, WEBP, GIF
            </Typography>
          </Box>
        ) : (
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? '#fbbf24' : 'rgba(255,255,255,0.2)',
              borderRadius: 1,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            component="label"
          >
            <input
              type="file"
              hidden
              multiple={multiple}
              accept="image/*"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <CloudUploadIcon sx={{ fontSize: 48, color: dragActive ? '#fbbf24' : 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom color={dragActive ? '#fbbf24' : 'text.primary'}>
              {dragActive ? "Drop files here" : "Drag & Drop files here"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        {tab === 0 && (
          <Button 
            onClick={handleUrlSubmit} 
            variant="contained" 
            disabled={!urls.trim()}
            sx={{ bgcolor: '#fbbf24', color: 'black', '&:hover': { bgcolor: '#f59e0b' } }}
          >
            Add {multiple ? "Images" : "Image"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
