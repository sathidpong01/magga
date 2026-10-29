"use client";

import { useState,useEffect,useRef } from "react";
import { enrichUnchangedItem } from "@/lib/form-metadata";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { authors } from "@/db/schema";

type Author=InferSelectModel<typeof authors>;
import { Button,TextField,Typography,Paper,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,IconButton,Stack,Dialog,DialogActions,DialogContent,DialogContentText,DialogTitle,CircularProgress,Tooltip,Box,Avatar,Chip,InputAdornment } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useToast } from "@/app/contexts/ToastContext";
import { dashboardTokens,dashboardRadii,dashboardPrimaryButtonSx } from "@/app/components/dashboard/system";
import DirectoryTableHeader from "@/app/components/dashboard/DirectoryTableHeader";
import { maggaColors } from "@/lib/design-tokens";
import { authorSocialLinks,authorLinkLabel } from "@/lib/author-social-links";
import { directoryColumns,directoryTableSx } from "@/app/components/dashboard/directory-list-layout";

type SocialLink={
  url: string;
  label: string;
  icon: string;
};

type AuthorManagerProps={
  initialAuthors: Author[];
};

export default function AuthorManager({ initialAuthors }: AuthorManagerProps) {
  const router=useRouter();
  const [editorOpen,setEditorOpen]=useState(false);
  const [authors,setAuthors]=useState<Author[]>(initialAuthors);
  const { showSuccess,showError }=useToast();
  const [editingAuthor,setEditingAuthor]=useState<Author|null>(null);
  const [name,setName]=useState("");
  const [socialLinks,setSocialLinks]=useState<SocialLink[]>([
    { url: "",label: "",icon: "" },
  ]);
  const [isLoading,setIsLoading]=useState(false);
  const [isFetching,setIsFetching]=useState<number|null>(null);
  const [deleteDialogOpen,setDeleteDialogOpen]=useState(false);
  const [authorToDelete,setAuthorToDelete]=useState<Author|null>(null);
  const enrichmentGeneration=useRef(0);
  const savePending=useRef(false);

  useEffect(() => {
    setAuthors(initialAuthors);
  },[initialAuthors]);

  // Auto-fetch metadata from URL
  const handleAutoFetch=async (index: number) => {
    const link=socialLinks[index];
    if(!link.url) return;
    const generation=++enrichmentGeneration.current;

    setIsFetching(index);

    try {
      const res=await fetch(
        `/api/metadata?url=${encodeURIComponent(link.url)}`,
      );
      if(!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      const data=await res.json();

      if(generation!==enrichmentGeneration.current) return;
      setSocialLinks((current) => enrichUnchangedItem(current,link,data));
    } catch {
      if(generation===enrichmentGeneration.current)
        showError("ไม่สามารถดึงข้อมูลจาก URL นี้ได้");
    } finally {
      if(generation===enrichmentGeneration.current) setIsFetching(null);
    }
  };

  const addSocialLink=() => {
    setSocialLinks((current) => [...current,{ url: "",label: "",icon: "" }]);
  };

  const removeSocialLink=(index: number) => {
    if(socialLinks.length>1) {
      setSocialLinks((current) => current.filter((_,i) => i!==index));
    }
  };

  const updateSocialLink=(
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    setSocialLinks((current) =>
      current.map((link,i) =>
        i===index? { ...link,[field]: value }:link,
      ),
    );
  };

  const handleSubmit=async (e: React.FormEvent) => {
    e.preventDefault();
    if(savePending.current) return;
    savePending.current=true;
    enrichmentGeneration.current++;
    setIsFetching(null);
    setIsLoading(true);

    // Filter out empty links and prepare data
    const validLinks=socialLinks.filter((link) => link.url.trim()!=="");
    const profileUrl=validLinks.length>0? validLinks[0].url:null;

    const url=editingAuthor
      ? `/api/authors/${editingAuthor.id}`
      :"/api/authors";
    const method=editingAuthor? "PUT":"POST";

    try {
      const response=await fetch(url,{
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          profileUrl,
          socialLinks:
            validLinks.length>0? JSON.stringify(validLinks):null,
        }),
      });

      if(!response.ok) {
        const res=await response.json();
        throw new Error(res.error||"Save failed.");
      }

      showSuccess(
        editingAuthor? "อัปเดตผู้แต่งเรียบร้อย":"เพิ่มผู้แต่งเรียบร้อย",
      );
      resetForm();
      router.refresh();
    } catch(err) {
      showError(err instanceof Error? err.message:"เกิดข้อผิดพลาด");
    } finally {
      savePending.current=false;
      setIsLoading(false);
    }
  };

  const resetForm=() => {
    setEditorOpen(false);
    enrichmentGeneration.current++;
    setIsFetching(null);
    setName("");
    setSocialLinks([{ url: "",label: "",icon: "" }]);
    setEditingAuthor(null);
  };

  const handleEdit=(author: Author) => {
    if(savePending.current) return;
    setEditorOpen(true);
    enrichmentGeneration.current++;
    setIsFetching(null);
    setEditingAuthor(author);
    setName(author.name);

    const links=authorSocialLinks(author);
    setSocialLinks(links.length? links:[{ url: "",label: "",icon: "" }]);
  };

  const handleDeleteClick=(author: Author) => {
    setAuthorToDelete(author);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm=async () => {
    if(!authorToDelete) return;
    try {
      const response=await fetch(`/api/authors/${authorToDelete.id}`,{
        method: "DELETE",
      });
      if(!response.ok) throw new Error("Delete failed.");
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
      showSuccess("ลบผู้แต่งเรียบร้อย");
      router.refresh();
    } catch {
      showError("ไม่สามารถลบผู้แต่งได้");
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      {/* Form Section */}
      <Dialog
        open={editorOpen}
        onClose={() => {
          if(!isLoading) resetForm();
        }}
        fullWidth
        maxWidth="md"
        aria-labelledby="author-editor-title"
      >
        <DialogContent>
          <Paper
            sx={{
              p: 2.5,
              mb: 3,
              bgcolor: dashboardTokens.surface,
              borderRadius: 1.25,
              border: `1px solid ${dashboardTokens.border}`,
            }}
          >
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                id="author-editor-title"
                component="h2"
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#fafafa",
                  letterSpacing: "0.03em",
                }}
              >
                {editingAuthor? "แก้ไขผู้แต่ง":"เพิ่มผู้แต่ง"}
              </Typography>
              <Stack direction="row" spacing={1}>
                {editingAuthor&&(
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    disabled={isLoading}
                    sx={{
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "#a3a3a3",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      letterSpacing: "0",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.2)",
                        bgcolor: "rgba(255,255,255,0.02)",
                      },
                    }}
                  >
                    ยกเลิก
                  </Button>
                )}
                <Button
                  type="submit"
                  form="author-form"
                  variant="contained"
                  disabled={isLoading||!name}
                  startIcon={
                    isLoading? (
                      <CircularProgress size={18} sx={{ color: "#0f0f14" }} />
                    ):editingAuthor? (
                      <EditIcon />
                    ):(
                      <AddIcon />
                    )
                  }
                  sx={{
                    minWidth: 100,
                    ...dashboardPrimaryButtonSx,
                    borderRadius: dashboardRadii.button,
                  }}
                >
                  {editingAuthor? "บันทึกการแก้ไข":"เพิ่ม"}
                </Button>
              </Stack>
            </Stack>

            <form id="author-form" onSubmit={handleSubmit}>
              <Box
                component="fieldset"
                disabled={isLoading}
                sx={{ border: 0,p: 0,m: 0,minWidth: 0 }}
              >
                <Stack spacing={2.5}>
                  {/* Author Name only - icons come from social links */}
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="author-name"
                      variant="caption"
                      sx={{
                        color: dashboardTokens.textMuted,
                        mb: 0.5,
                        display: "block",
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "0.75rem",
                      }}
                    >
                      ชื่อผู้แต่ง *
                    </Typography>
                    <TextField
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      required
                      size="small"
                      id="author-name"
                      placeholder="ชื่อผู้แต่งหรือชื่อปากกา..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: dashboardTokens.surfaceMuted,
                          borderRadius: dashboardRadii.field,
                          "& fieldset": { borderColor: dashboardTokens.border },
                          "&.Mui-focused fieldset": {
                            borderColor: dashboardTokens.accent,
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Social Links Section */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      component="h3"
                      sx={{
                        color: "#a3a3a3",
                        mb: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        letterSpacing: "0",
                        fontSize: "0.75rem",
                      }}
                    >
                      ช่องทางโซเชียล
                    </Typography>

                    <Stack spacing={2}>
                      {socialLinks.map((link,index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2.5,
                            bgcolor: "rgba(255,255,255,0.01)",
                            borderRadius: 1.25,
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <Stack
                            direction={{ xs: "column",md: "row" }}
                            spacing={1.5}
                            sx={{
                              alignItems: "flex-end",
                            }}
                          >
                            <Box sx={{ flex: 2 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: maggaColors.textSecondary,
                                  mb: 0.5,
                                  display: "block",
                                }}
                              >
                                URL
                              </Typography>
                              <TextField
                                value={link.url}
                                onChange={(e) =>
                                  updateSocialLink(index,"url",e.target.value)
                                }
                                fullWidth
                                size="small"
                                placeholder="https://twitter.com/... หรือ pixiv.net/..."
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: dashboardTokens.surfaceMuted,
                                    borderRadius: dashboardRadii.field,
                                  },
                                }}
                                slotProps={{
                                  htmlInput: { "aria-label": `URL ช่องทาง ${index+1}` },
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <LinkIcon
                                          sx={{
                                            color: dashboardTokens.textMuted,
                                            fontSize: 18,
                                          }}
                                        />
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: dashboardTokens.textSoft,
                                  mb: 0.5,
                                  display: "block",
                                }}
                              >
                                ป้ายชื่อ
                              </Typography>
                              <TextField
                                value={link.label}
                                onChange={(e) =>
                                  updateSocialLink(
                                    index,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                fullWidth
                                size="small"
                                placeholder="ชื่อแสดง (เช่น Twitter)"
                                slotProps={{ htmlInput: { "aria-label": `ชื่อแสดงช่องทาง ${index+1}` } }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    bgcolor: dashboardTokens.surfaceMuted,
                                    borderRadius: dashboardRadii.field,
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: dashboardTokens.textSoft,
                                  mb: 0.5,
                                  display: "block",
                                }}
                              >
                                URL ไอคอน
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                  alignItems: "center",
                                }}
                              >
                                <TextField
                                  value={link.icon}
                                  onChange={(e) =>
                                    updateSocialLink(
                                      index,
                                      "icon",
                                      e.target.value,
                                    )
                                  }
                                  fullWidth
                                  size="small"
                                  placeholder="วาง URL ไอคอน"
                                  slotProps={{ htmlInput: { "aria-label": `URL ไอคอนช่องทาง ${index+1}` } }}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      bgcolor: dashboardTokens.surfaceMuted,
                                      borderRadius: dashboardRadii.field,
                                    },
                                  }}
                                />
                                {link.icon&&(
                                  <Avatar
                                    src={link.icon}
                                    alt=""
                                    sx={{ width: 28,height: 28 }}
                                  />
                                )}
                              </Stack>
                            </Box>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              sx={{ flexShrink: 0,pb: 0.5 }}
                            >
                              <Tooltip title="ดึงชื่อและไอคอนอัตโนมัติ" describeChild>
                                <Box component="span">
                                  <IconButton
                                    aria-label={`ดึงชื่อและไอคอนอัตโนมัติ ช่องทาง ${index+1}`}
                                    onClick={() => handleAutoFetch(index)}
                                    disabled={!link.url||isFetching===index}
                                    size="small"
                                    sx={{
                                      bgcolor: dashboardTokens.surfaceAlt,
                                      "&:hover": {
                                        bgcolor: dashboardTokens.surfaceMuted,
                                      },
                                      color: dashboardTokens.textMuted,
                                    }}
                                  >
                                    {isFetching===index? (
                                      <CircularProgress size={18} />
                                    ):(
                                      <AutoFixHighIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Box>
                              </Tooltip>
                              {socialLinks.length>1&&(
                                <Tooltip title="ลบช่องทางนี้">
                                  <IconButton
                                    onClick={() => removeSocialLink(index)}
                                    size="small"
                                    sx={{
                                      bgcolor: "rgba(239, 68, 68, 0.1)",
                                      "&:hover": {
                                        bgcolor: "#ef4444",
                                        color: "#fff",
                                      },
                                      color: "#ef4444",
                                      borderRadius: 1,
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>

                    <Button
                      onClick={addSocialLink}
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      sx={{
                        mt: 2,
                        borderColor: "rgba(255,255,255,0.1)",
                        color: dashboardTokens.accent,
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "0.75rem",
                        letterSpacing: "0",
                        borderRadius: dashboardRadii.button,
                        "&:hover": {
                          borderColor: dashboardTokens.accent,
                          bgcolor: dashboardTokens.accentSoft,
                        },
                      }}
                    >
                      เพิ่มช่องทาง
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </form>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button disabled={isLoading} onClick={resetForm}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
      {/* Authors List */}
      <Paper
        sx={{
          bgcolor: dashboardTokens.surface,
          borderRadius: 1.25,
          border: `1px solid ${dashboardTokens.border}`,
          overflow: "hidden",
        }}
      >
        <DirectoryTableHeader kind="authors" count={authors.length}>
          <Button startIcon={<AddIcon />} sx={dashboardPrimaryButtonSx} onClick={() => { resetForm(); setEditorOpen(true); }}>เพิ่มผู้แต่ง</Button>
        </DirectoryTableHeader>
        <TableContainer>
          <Table className="admin-work-table" sx={directoryTableSx} aria-label="รายการผู้แต่ง">
            <colgroup>{directoryColumns.authors.map((width,index) => <col key={index} style={{ width }} />)}</colgroup>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(0,0,0,0.2)" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#a3a3a3",
                    fontSize: "0.75rem",
                    letterSpacing: "0",
                  }}
                >
                  ชื่อ
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#a3a3a3",
                    fontSize: "0.75rem",
                    letterSpacing: "0",
                  }}
                >
                  ช่องทาง
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: "#a3a3a3",
                    fontSize: "0.75rem",
                    letterSpacing: "0",
                    width: 120,
                  }}
                >
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {authors.map((author) => {
                const links=authorSocialLinks(author);
                return (
                  <TableRow
                    key={author.id}
                    sx={{
                      "&:last-child td": { border: 0 },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                    }}
                  >
                    <TableCell data-label="ผู้แต่ง">
                      <Typography title={author.name} sx={{ fontWeight: 500,color: maggaColors.textPrimary,overflowWrap: "anywhere" }}>
                        {author.name}
                      </Typography>
                    </TableCell>
                    <TableCell data-label="ช่องทาง">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        useFlexGap
                        sx={{
                          flexWrap: "wrap",
                          gap: 0.5,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {links.length>0? (
                          links.map((link,i) => (
                            <Chip
                              key={i}
                              icon={
                                link.icon? (
                                  <Avatar
                                    src={link.icon}
                                    alt=""
                                    sx={{ width: 16,height: 16 }}
                                  />
                                ):(
                                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                                )
                              }
                              label={
                                authorLinkLabel(link)
                              }
                              size="small"
                              component="a"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              title={authorLinkLabel(link)}
                              sx={{
                                bgcolor: dashboardTokens.surfaceAlt,
                                color: dashboardTokens.textMuted,
                                "&:hover": {
                                  bgcolor: dashboardTokens.surfaceMuted,
                                  color: dashboardTokens.text,
                                },
                                borderRadius: 0.75,
                                maxWidth: "100%",
                                height: { xs: 44,md: 32 },
                                "& .MuiChip-label": { maxWidth: 220 },
                              }}
                            />
                          ))
                        ):(
                          <Typography variant="body2" sx={{ color: maggaColors.textSecondary }}>
                            ไม่มีข้อมูล
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell data-label="จัดการ" align="right">
                      <Tooltip title="แก้ไข">
                        <IconButton
                          onClick={() => handleEdit(author)}
                          aria-label={`แก้ไขผู้แต่ง ${author.name}`}
                          size="small"
                          sx={{
                            color: maggaColors.textSecondary,
                            "&:hover": { color: "#fafafa" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบผู้แต่ง">
                        <IconButton
                          onClick={() => handleDeleteClick(author)}
                          aria-label={`ลบผู้แต่ง ${author.name}`}
                          size="small"
                          sx={{
                            color: maggaColors.textSecondary,
                            "&:hover": { color: "#ef4444" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {authors.length===0&&(
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{ textAlign: "center",py: 6,color: maggaColors.textSecondary }}
                  >
                    ยังไม่มีผู้แต่ง กรุณาเพิ่มรายการแรกด้านบน
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: dashboardTokens.surface,
              color: "#fafafa",
              borderRadius: 1.25,
              border: `1px solid ${dashboardTokens.border}`,
              backgroundImage: "none",
              boxShadow: "none",
            },
          },
        }}
      >
        <DialogTitle
          sx={{ fontWeight: 700,letterSpacing: "0",fontSize: "1rem" }}
        >
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#d4d4d4",fontWeight: 600 }}>
            ต้องการลบผู้แต่ง &quot;{authorToDelete?.name}&quot; ใช่หรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5,bgcolor: "rgba(0,0,0,0.2)" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: "#a3a3a3",
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.75rem",
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              color: "#fff",
              fontWeight: 700,
              "&:hover": { bgcolor: "#dc2626" },
              px: 3,
            }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
