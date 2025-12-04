import React, { useState } from 'react';
import { Box, Paper, Typography, LinearProgress, IconButton, Collapse, Badge, CircularProgress } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export type UploadFileStatus = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
};

type UploadProgressProps = {
  files: UploadFileStatus[];
  onCancel?: (id: string) => void;
};

export default function UploadProgress({ files, onCancel }: UploadProgressProps) {
  const [expanded, setExpanded] = useState(true);
  
  const uploadingCount = files.filter(f => f.status === 'uploading' || f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  
  if (files.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalProgress = files.reduce((acc, curr) => acc + curr.progress, 0) / files.length;

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 24, 
        right: 24, 
        zIndex: 1300,
        width: 360,
        maxWidth: 'calc(100vw - 48px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}
    >
      <Paper
        elevation={6}
        sx={{
          bgcolor: '#171717',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header / Minimized State */}
        <Box 
          onClick={() => setExpanded(!expanded)}
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            bgcolor: 'rgba(255,255,255,0.02)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative', display: 'flex' }}>
              <CircularProgressWithLabel value={totalProgress} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {uploadingCount > 0 ? 'Uploading files...' : 'Upload Complete'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completedCount} / {files.length} completed
                {errorCount > 0 && ` • ${errorCount} failed`}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <KeyboardArrowUpIcon />
          </IconButton>
        </Box>

        {/* Expanded List */}
        <Collapse in={expanded}>
          <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 2, pt: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
              {files.map((file) => (
                <Box key={file.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: 'rgba(255,255,255,0.05)',
                      color: '#fbbf24'
                    }}
                  >
                    <InsertDriveFileIcon fontSize="small" color="inherit" />
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" noWrap sx={{ fontSize: '0.85rem' }}>
                        {file.name}
                      </Typography>
                      {file.status === 'completed' ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                      ) : file.status === 'error' ? (
                        <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(file.progress)}%
                        </Typography>
                      )}
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={file.progress} 
                      sx={{ 
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: file.status === 'error' ? '#ef4444' : 
                                   file.status === 'completed' ? '#4ade80' : '#fbbf24',
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}

function CircularProgressWithLabel(props: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} size={32} thickness={5} sx={{ color: '#fbbf24' }} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
      </Box>
    </Box>
  );
}


