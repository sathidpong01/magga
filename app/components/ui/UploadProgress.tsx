import React from 'react';
import { Box, Paper, Typography, LinearProgress, IconButton } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

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
  const uploadingCount = files.filter(f => f.status === 'uploading' || f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  
  if (files.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        {uploadingCount > 0 
          ? `${uploadingCount} files uploading...` 
          : `${completedCount} files completed`}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {files.map((file) => (
          <Paper
            key={file.id}
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              bgcolor: '#171717',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <InsertDriveFileIcon sx={{ color: '#a3a3a3' }} />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSize(file.size)} • {
                        file.status === 'completed' ? 'Completed' :
                        file.status === 'error' ? 'Error' :
                        file.status === 'pending' ? 'Waiting...' :
                        `${Math.round(file.progress)}%`
                      }
                    </Typography>
                  </Box>
                  
                  {file.status === 'completed' ? (
                    <IconButton size="small" disabled sx={{ color: '#4ade80' }}>
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  ) : file.status === 'error' ? (
                    <IconButton size="small" disabled sx={{ color: '#ef4444' }}>
                      <ErrorIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    onCancel && (
                      <IconButton 
                        size="small" 
                        onClick={() => onCancel(file.id)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={file.progress} 
                    sx={{ 
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: file.status === 'error' ? '#ef4444' : 
                                 file.status === 'completed' ? '#4ade80' : '#8b5cf6',
                        borderRadius: 3,
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right', fontWeight: 600 }}>
                    {Math.round(file.progress)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
