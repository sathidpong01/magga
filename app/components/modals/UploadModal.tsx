"use client";

import { useState } from "react";
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
  Stack,
} from "@mui/material";

type UploadModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: { type: "url" | "file"; content: string | File }[]) => void;
  target: "cover" | "pages";
};

export default function UploadModal({
  open,
  onClose,
  onSubmit,
  target,
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [urls, setUrls] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmit = () => {
    if (activeTab === "url") {
      const urlList = urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      const items = urlList.map((url) => ({
        type: "url" as const,
        content: url,
      }));
      onSubmit(items);
    } else {
      const items = selectedFiles.map((file) => ({
        type: "file" as const,
        content: file,
      }));
      onSubmit(items);
    }
    setUrls("");
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Upload {target === "cover" ? "Cover Image" : "Pages"}
      </DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Upload Files" value="file" />
          <Tab label="Enter URLs" value="url" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {activeTab === "file" ? (
            <Stack spacing={2}>
              <Button variant="contained" component="label">
                Choose Files
                <input
                  type="file"
                  hidden
                  multiple={target === "pages"}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                />
              </Button>
              {selectedFiles.length > 0 && (
                <Box>Selected: {selectedFiles.length} file(s)</Box>
              )}
            </Stack>
          ) : (
            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder="Enter image URLs (one per line)"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            (activeTab === "url" && !urls.trim()) ||
            (activeTab === "file" && selectedFiles.length === 0)
          }
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
