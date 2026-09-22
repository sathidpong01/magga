'use client';
import { useState } from 'react';
import { authorAction } from './AuthorLinkSummary';
import { tagAction } from './TagSummary';
import { categoryAction } from './CategorySummary';
import ApprovalSelector from './ApprovalSelector';
import { approvalSelectionIsValid, fullApprovalSelection, selectedItemCount, type ApprovalSelection, type DraftKind } from '@/lib/mcp/approval-selection';
import { useRouter } from 'next/navigation';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Checkbox, FormControlLabel, Typography, Box } from '@mui/material';

type Review = { draft_id: string; kind: DraftKind; status: string; proposal: Record<string, unknown>; current: Record<string, unknown>; sources: {url: string; confidence: number}[]; review_token: string };
export default function DecisionPanel({ draftId, targetName, status }: { draftId: string; targetName: string; status: string }) {
  const router = useRouter();
  const [action, setAction] = useState<'apply' | 'reject' | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [selection, setSelection] = useState<ApprovalSelection>({});
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [cachePending, setCachePending] = useState(false);
  async function open(next: 'apply' | 'reject') {
    setAction(next); setReview(null); setSelection({}); setChecked(false); setError(''); setBusy(true); setResult('');
    try {
      const response = await fetch(`/api/admin/mcp-drafts/${draftId}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.status !== 'pending') throw new Error('ข้อเสนอนี้ถูกพิจารณาแล้ว กรุณาโหลดข้อมูลล่าสุด');
      setReview(data);
      if (next === 'apply') setSelection(fullApprovalSelection(data.kind, data.proposal));
    } catch (e) { setError(e instanceof Error ? e.message : 'โหลดข้อเสนอไม่ได้'); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!review || !action || !checked || busy || (action === 'apply' && !approvalSelectionIsValid(review.kind, selection))) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/mcp-drafts/${draftId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, review_token: review.review_token, confirm: true, ...(action === 'apply' ? { selection } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCachePending(!!data.cache_refresh_pending);
      setResult(action === 'apply' ? 'อนุมัติและนำข้อมูลที่เลือกไปใช้แล้ว' : 'ปฏิเสธข้อเสนอแล้ว ข้อมูลเดิมยังคงอยู่');
      setAction(null); setReview(null); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'ไม่ทราบผลการบันทึก กรุณาโหลดข้อมูลล่าสุดก่อนทำซ้ำ'); setChecked(false); }
    finally { setBusy(false); }
  }
  const isCategory = review?.kind === 'manga_metadata' && typeof review.proposal.category_name === 'string';
  const applyLabel = review?.kind === 'manga_author' ? 'สร้างผู้แต่งและผูกกับเรื่อง' : review?.kind === 'author_links' ? authorAction(review.proposal) : review?.kind === 'manga_tags' ? tagAction(review.current, review.proposal) : isCategory ? categoryAction(review.current) : 'บันทึกข้อเสนอ';
  const validSelection = review ? approvalSelectionIsValid(review.kind, selection) : false;
  const selectedCount = selectedItemCount(selection);
  if (status !== 'pending' && !result) return null;
  return <Box sx={{ my: 3 }}>
    {result && <Alert severity={cachePending ? 'warning' : 'success'} sx={{ mb: 2 }}>{result}{cachePending ? ' แต่การรีเฟรช cache ยังไม่สำเร็จ ข้อมูลในฐานข้อมูลถูกบันทึกแล้ว' : ''}</Alert>}
    {status === 'pending' && <>
    <Typography sx={{ mb: 2, color: 'text.secondary' }}>อนุมัติแล้วจะบันทึกข้อมูลจริง</Typography>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}><Button variant="contained" disabled={busy || !!result} onClick={() => open('apply')}>ตรวจและอนุมัติ</Button><Button variant="outlined" color="error" disabled={busy || !!result} onClick={() => open('reject')}>ปฏิเสธข้อเสนอ</Button></Box></>}
    <Dialog open={action !== null} onClose={() => { if (!busy) { setAction(null); setReview(null); } }} fullWidth maxWidth="sm" aria-labelledby="draft-decision-title">
      <DialogTitle id="draft-decision-title">{action === 'apply' ? applyLabel : 'ปฏิเสธข้อเสนอ'} · {targetName}</DialogTitle>
      <DialogContent dividers>
        {busy && !review && <Typography role="status">กำลังอ่านข้อมูลล่าสุด…</Typography>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {review && <>
          {action === 'reject' ? <Typography sx={{ mb: 2 }}>ปฏิเสธข้อเสนอนี้ ข้อมูลเดิมคงอยู่</Typography> : <>
          <ApprovalSelector kind={review.kind} proposal={review.proposal} selection={selection} onChange={setSelection} />
          <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>แหล่งอ้างอิงยังไม่ยืนยัน · บันทึกข้อมูลจริงเมื่อยืนยัน</Typography>
          </>}
          <FormControlLabel control={<Checkbox checked={checked} disabled={busy} onChange={e => setChecked(e.target.checked)} />} label={action === 'apply' ? 'ตรวจข้อมูลที่เลือกแล้ว' : 'ยืนยันปฏิเสธข้อเสนอนี้'} />
        </>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => {setAction(null);setReview(null);}}>ยกเลิก</Button><Button variant="contained" color={action === 'reject' ? 'error' : 'primary'} disabled={!review || !checked || busy || (action === 'apply' && !validSelection)} onClick={confirm}>{busy ? 'กำลังดำเนินการ…' : action === 'apply' ? `ยืนยันที่เลือก (${selectedCount})` : 'ยืนยันปฏิเสธ'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
