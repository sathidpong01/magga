"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { Alert,Avatar,Box,Button,Checkbox,Chip,MenuItem,Paper,Table,TableBody,TableCell,TableContainer,TableHead,TablePagination,TableRow,TextField,Typography } from "@mui/material";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import { maggaColors,maggaRadii } from "@/lib/design-tokens";
import { Skeleton } from "@mui/material";
import { commentsColumns,moderationTableSx } from "@/app/components/dashboard/moderation-list-layout";
export interface AdminComment {
  id: string;
  content: string;
  imageUrl: string|null;
  voteScore: number;
  createdAt: string;
  status?: string;
  authorName?: string|null;
  guestPublicCode?: string|null;
  guestId?: string|null;
  guestIsBanned?: boolean;
  user: {
    id: string;
    name: string|null;
    username: string|null;
    image: string|null;
  };
  manga: { id: string; title: string; slug: string|null };
  parent: {
    id: string;
    content: string;
    user: { name: string|null; username: string|null };
  }|null;
}
export interface AdminCommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
interface Report {
  id: string;
  commentId: string;
  reason: string;
  status: string;
  createdAt: string;
  commentContent: string;
  mangaTitle: string;
}
const statusNames: Record<string,string>={
  published: "เผยแพร่",
  pending: "ยังไม่เผยแพร่ (ข้อมูลเดิม)",
  hidden: "ซ่อนอยู่ (ข้อมูลเดิม)",
  deleted: "ลบแล้ว",
};
export default function CommentsManager({
  initialComments,
  initialPagination,
  loading=false,
}: {
  initialComments: AdminComment[];
  initialPagination: AdminCommentsPagination;
  loading?: boolean;
}) {
  const activeRequest=useRef<AbortController|null>(null);
  const mutationLock=useRef(false);
  const loadedKey=useRef(
    JSON.stringify([initialPagination.page,initialPagination.limit,"",""]),
  );
  const [comments,setComments]=useState(initialComments);
  const [pagination,setPagination]=useState(initialPagination);
  const [search,setSearch]=useState("");
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [reports,setReports]=useState<Report[]>([]);
  const [reportsOpen,setReportsOpen]=useState(false);
  const [deleteIds,setDeleteIds]=useState<string[]>([]);
  const request=useCallback(async (url: string,init?: RequestInit) => {
    const response=await authFetch(url,init);
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"ทำรายการไม่ได้");
    return data;
  },[]);
  const load=useCallback(async () => {
    activeRequest.current?.abort();
    const controller=new AbortController();
    activeRequest.current=controller;
    setBusy(true);
    setError("");
    try {
      const params=new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        search: query,
        status,
      });
      const data=await request(`/api/admin/comments?${params}`,{
        signal: controller.signal,
      });
      if(controller.signal.aborted||activeRequest.current!==controller)
        return;
      loadedKey.current=JSON.stringify([
        pagination.page,
        pagination.limit,
        query,
        status,
      ]);
      setComments(data.comments);
      setPagination(data.pagination);
      setSelected([]);
      setDeleteIds([]);
    } catch(cause) {
      if(!controller.signal.aborted&&activeRequest.current===controller)
        setError(cause instanceof Error? cause.message:"โหลดไม่ได้");
    } finally {
      if(!controller.signal.aborted&&activeRequest.current===controller)
        setBusy(false);
    }
  },[pagination.page,pagination.limit,query,status,request]);
  useEffect(() => {
    const params=new URLSearchParams(location.search);
    setSearch(params.get("search")??"");
    setQuery(params.get("search")??"");
    setStatus(params.get("status")??"");
    const page=Number(params.get("page")),
      limit=Number(params.get("limit"));
    if(Number.isSafeInteger(page)&&page>0)
      setPagination((p) => ({ ...p,page,limit: limit===50? 50:20 }));
    return () => activeRequest.current?.abort();
  },[]);
  useEffect(() => {
    const key=JSON.stringify([
      pagination.page,
      pagination.limit,
      query,
      status,
    ]);
    if(loading||key===loadedKey.current) return;
    const params=new URLSearchParams(location.search);
    params.set("page",String(pagination.page));
    params.set("limit",String(pagination.limit));
    if(query) params.set("search",query);
    else params.delete("search");
    if(status) params.set("status",status);
    else params.delete("status");
    history.replaceState(history.state,"",location.pathname+"?"+params);
    setSelected([]);
    void load();
  },[load,loading,pagination.page,pagination.limit,query,status]);
  const moderate=async (action: string,ids=selected) => {
    if(!ids.length||mutationLock.current) return;
    mutationLock.current=true; activeRequest.current?.abort();
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/comments",{
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentIds: ids,
          action,
          reason: reason.trim()||undefined,
        }),
      });
      setNotice(
        action==="delete"
          ? "ลบความคิดเห็นและรูปแนบถาวรแล้ว"
          :"บันทึกการจัดการแล้ว",
      );
      setDeleteIds([]);
      await load();
    } catch(cause) {
      setError(cause instanceof Error? cause.message:"จัดการไม่ได้");
    } finally {
      mutationLock.current=false;
      setBusy(false);
    }
  };
  const loadReports=useCallback(async () => {
    setReportsOpen(true);
    setBusy(true);
    setError("");
    try {
      const data=await request("/api/admin/comment-reports?status=open");
      setReports(data.reports);
    } catch(cause) {
      setError(cause instanceof Error? cause.message:"โหลดรายงานไม่ได้");
    } finally {
      setBusy(false);
    }
  },[request]);
  useEffect(() => {
    if(!loading&&new URLSearchParams(location.search).get("reports")==="open")
      void loadReports();
  },[loadReports,loading]);
  const resolveReport=async (id: string,reportStatus: string) => {
    if(mutationLock.current) return; mutationLock.current=true;
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/comment-reports",{
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: [id],status: reportStatus }),
      });
      await loadReports();
    } catch(cause) {
      setError(cause instanceof Error? cause.message:"บันทึกรายงานไม่ได้");
    } finally {
      mutationLock.current=false;
      setBusy(false);
    }
  };
  return (
    <Box data-admin-list-ready={loading? undefined:true} aria-busy={loading||busy}>
      <Box component="fieldset" disabled={loading} sx={{ border: 0,m: 0,p: 0,minWidth: 0 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700,color: maggaColors.textPrimary,mb: 1 }}
        >
          จัดการความคิดเห็น
        </Typography>
        <Typography sx={{ mb: 3,color: maggaColors.textSecondary }}>
          ความคิดเห็นใหม่เผยแพร่ทันที การลบจะลบข้อความและรูปแนบถาวร
          โดยรักษาการตอบกลับไว้
        </Typography>
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: maggaColors.surface,
            borderRadius: `${maggaRadii.card}px`,
            backgroundImage: "none",
          }}
        >
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search);
              setPagination((previous) => ({ ...previous,page: 1 }));
            }}
            sx={{ display: "flex",gap: 1,flexWrap: "wrap",mb: 2 }}
          >
            <TextField
              label="ค้นหาเนื้อหา ผู้ใช้ หรือมังงะ"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              sx={{ flex: 1,minWidth: 180 }}
            />
            <Button type="submit" disabled={busy}>
              ค้นหา
            </Button>
            <TextField
              select
              label="สถานะ"
              slotProps={{ inputLabel: { shrink: true },select: { displayEmpty: true } }}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPagination((previous) => ({ ...previous,page: 1 }));
              }}
              size="small"
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {Object.entries(statusNames).map(([value,label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Button disabled={busy} onClick={() => void load()}>
              รีเฟรช
            </Button>
            <Button disabled={busy} onClick={() => void loadReports()}>
              ตรวจรายงาน
            </Button>
          </Box>
          <TextField
            fullWidth
            label="เหตุผลการจัดการ (บันทึกในประวัติ)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            size="small"
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              minHeight: 52,
              alignItems: "center",
            }}
          >
            <Typography variant="body2">
              เลือก {selected.length} รายการ
            </Typography>
            <Button
              color="error"
              disabled={busy||!selected.length}
              onClick={() => setDeleteIds(selected)}
            >
              ลบที่เลือก
            </Button>
          </Box>
          {deleteIds.length>0&&(
            <Alert severity="warning">
              ลบ {deleteIds.length} ความคิดเห็นนี้ถาวรหรือไม่?
              ข้อความและรูปแนบจะถูกลบทันทีและกู้คืนไม่ได้ การตอบกลับจะยังอยู่
              <Button
                disabled={busy}
                color="error"
                onClick={() => void moderate("delete",deleteIds)}
              >
                ยืนยันลบถาวร
              </Button>
              <Button disabled={busy} onClick={() => setDeleteIds([])}>
                ยกเลิก
              </Button>
            </Alert>
          )}
        </Paper>
        <Box aria-live="polite" sx={{ minHeight: 28 }}>
          {error&&<Alert severity="error">{error}</Alert>}
          {notice&&<Typography color="success.main">{notice}</Typography>}
          {busy&&<Typography>กำลังดำเนินการ...</Typography>}
        </Box>
        <TableContainer
          component={Paper}
          sx={{ bgcolor: maggaColors.surface,backgroundImage: "none" }}
        >
          <Table
            className="admin-work-table"
            size="small"
            aria-label="รายการความคิดเห็น"
            sx={moderationTableSx}
          >
            <colgroup>{commentsColumns.map((width,index) => <col key={index} style={{ width }} />)}</colgroup>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Checkbox
                    slotProps={{ input: { "aria-label": "เลือกทุกความคิดเห็นในหน้านี้" } }}
                    checked={
                      comments.length>0&&selected.length===comments.length
                    }
                    indeterminate={
                      selected.length>0&&selected.length<comments.length
                    }
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? comments.map((comment) => comment.id)
                          :[],
                      )
                    }
                  />
                </TableCell>
                {["ผู้เขียน","ความคิดเห็น","มังงะ","สถานะ","จัดการ"].map(
                  (label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading&&Array.from({ length: pagination.limit },(_,index) => (
                <TableRow key={index}>{["เลือก","ผู้เขียน","ความคิดเห็น","มังงะ","สถานะ","จัดการ"].map((label) => <TableCell key={label} data-label={label} sx={{ height: 88 }}><Skeleton variant="rounded" width="80%" height={label==="เลือก"? 24:32} /></TableCell>)}</TableRow>
              ))}
              {!loading&&!comments.length&&(
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6,textAlign: "center" }}>
                    ไม่พบความคิดเห็นในตัวกรองนี้
                  </TableCell>
                </TableRow>
              )}
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell data-label="เลือก">
                    <Checkbox
                      slotProps={{ input: { "aria-label": `เลือกความคิดเห็นของ ${comment.authorName||comment.user.name||"ผู้ใช้"}` } }}
                      checked={selected.includes(comment.id)}
                      onChange={(event) =>
                        setSelected((previous) =>
                          event.target.checked
                            ? [...previous,comment.id]
                            :previous.filter((id) => id!==comment.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell data-label="ผู้เขียน">
                    <Box sx={{ display: "flex",alignItems: "center",gap: 1 }}>
                      <Avatar
                        src={comment.user.image||undefined}
                        alt=""
                        sx={{ width: 32,height: 32 }}
                      />
                      {comment.authorName||
                        comment.user.name||
                        comment.user.username||
                        "ผู้เยี่ยมชม"}
                    </Box>
                    {comment.guestId&&(
                      <Typography variant="caption">
                        Guest #{comment.guestPublicCode}
                        {comment.guestIsBanned&&" · ถูกระงับ"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell
                    data-label="ความคิดเห็น"
                    sx={{
                      minWidth: 180,
                      overflowWrap: "anywhere",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {comment.parent&&(
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: maggaColors.textSecondary,
                        }}
                      >
                        ตอบกลับ: {comment.parent.content.slice(0,80)}
                      </Typography>
                    )}
                    {comment.content}
                    {comment.imageUrl&&(
                      <Box
                        component="a"
                        href={comment.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="เปิดรูปแนบ"
                      >
                        <Box
                          component="img"
                          src={comment.imageUrl}
                          loading="lazy"
                          alt="รูปแนบ"
                          sx={{
                            display: "block",
                            width: 100,
                            height: 100,
                            objectFit: "contain",
                            mt: 1,
                          }}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell data-label="มังงะ">
                    <Link href={`/${comment.manga.slug||comment.manga.id}`}>
                      {comment.manga.title}
                    </Link>
                  </TableCell>
                  <TableCell data-label="สถานะ">
                    <Chip
                      size="small"
                      label={statusNames[comment.status||"published"]}
                    sx={{ maxWidth: "100%", height: "auto", minHeight: 24, "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }}
                    />
                    <Typography variant="caption" sx={{ display: "block" }}>
                      {new Date(comment.createdAt).toLocaleString("th-TH")}
                    </Typography>
                  </TableCell>
                  <TableCell data-label="จัดการ">
                    {comment.status!=="deleted"&&(
                      <Button
                        disabled={busy}
                        color="error"
                        onClick={() => setDeleteIds([comment.id])}
                      >
                        ลบถาวร
                      </Button>
                    )}
                    {comment.guestId&&(
                      <Button
                        disabled={busy}
                        color={comment.guestIsBanned? "inherit":"error"}
                        onClick={() =>
                          void moderate(
                            comment.guestIsBanned? "unban-guest":"ban-guest",
                            [comment.id],
                          )
                        }
                      >
                        {comment.guestIsBanned? "ปลดระงับ guest":"ระงับ guest"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={pagination.total}
          page={Math.max(0,pagination.page-1)}
          rowsPerPage={pagination.limit}
          onPageChange={(_,page) =>
            setPagination((previous) => ({ ...previous,page: page+1 }))
          }
          onRowsPerPageChange={(event) =>
            setPagination((previous) => ({
              ...previous,
              page: 1,
              limit: Number(event.target.value),
            }))
          }
          rowsPerPageOptions={[20,50,100]}
          labelRowsPerPage="ต่อหน้า"
        />
        {reportsOpen&&(
          <Box id="admin-reports" sx={{ mt: 3 }}>
            <Typography variant="h6">รายงานที่รอตรวจ</Typography>
            {!reports.length&&(
              <Typography sx={{ py: 3 }}>ไม่มีรายงานที่รอตรวจ</Typography>
            )}
            {reports.map((report) => (
              <Box
                key={report.id}
                sx={{ py: 2,borderBottom: `1px solid ${maggaColors.border}` }}
              >
                <Typography>
                  {report.mangaTitle} · {report.reason}
                </Typography>
                <Typography
                  sx={{ whiteSpace: "pre-wrap",overflowWrap: "anywhere" }}
                >
                  {report.commentContent}
                </Typography>
                <Button
                  disabled={busy}
                  color="error"
                  onClick={() => {
                    setDeleteIds([report.commentId]);
                    window.scrollTo({ top: 0,behavior: "auto" });
                  }}
                >
                  ลบความคิดเห็นถาวร
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void resolveReport(report.id,"resolved")}
                >
                  ดำเนินการแล้ว
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void resolveReport(report.id,"dismissed")}
                >
                  ปิดรายงาน
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
