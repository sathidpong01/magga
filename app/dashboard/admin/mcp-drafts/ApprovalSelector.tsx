'use client';

import { Alert, Box, Button, Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material';
import { approvalSelectionIsValid, fullApprovalSelection, selectedItemCount, type ApprovalSelection, type DraftKind } from '@/lib/mcp/approval-selection';
import { readSocialLinks, socialLinkDetails } from '@/lib/social-link-details';
import SocialLinkLabel from './SocialLinkLabel';

const fieldLabels: Record<string, string> = {
  title: 'ชื่อเรื่อง',
  author_id: 'ผู้แต่ง',
  category_id: 'หมวดหมู่',
  category_name: 'หมวดหมู่',
  profile_url: 'ลิงก์หลัก',
};

function toggle(values: string[] | undefined, value: string, checked: boolean) {
  const current = values ?? [];
  return checked ? [...new Set([...current, value])] : current.filter(item => item !== value);
}

function Item({ checked, disabled = false, title, detail, onChange }: { checked: boolean; disabled?: boolean; title: React.ReactNode; detail?: React.ReactNode; onChange: (checked: boolean) => void }) {
  return <FormControlLabel
    sx={{ alignItems: 'flex-start', mx: 0, py: 0.75, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
    control={<Checkbox checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} sx={{ mt: -0.5 }} />}
    label={<Box sx={{ minWidth: 0 }}><Typography component="div" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{title}</Typography>{detail && <Typography component="div" variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{detail}</Typography>}</Box>}
  />;
}

export default function ApprovalSelector({ kind, proposal, selection, onChange }: { kind: DraftKind; proposal: Record<string, unknown>; selection: ApprovalSelection; onChange: (selection: ApprovalSelection) => void }) {
  const all = fullApprovalSelection(kind, proposal);
  const selected = selectedItemCount(selection);
  const total = selectedItemCount(all);
  const links = readSocialLinks(proposal.social_links).map(socialLinkDetails);
  const valid = approvalSelectionIsValid(kind, selection);

  return <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
      <Box><Typography sx={{ fontWeight: 700 }}>เลือกข้อมูลที่จะอนุมัติ</Typography><Typography variant="body2" color="text.secondary">เลือกแล้ว {selected} จาก {total} รายการ</Typography></Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}><Button size="small" onClick={() => onChange(all)}>เลือกทั้งหมด</Button><Button size="small" color="inherit" onClick={() => onChange(kind === 'manga_author' ? { fields: ['author'], social_link_urls: [] } : {})}>ล้าง</Button></Box>
    </Box>
    <FormGroup>
      {kind === 'manga_author' && <Item checked disabled title={`สร้างผู้แต่ง ${String(proposal.name ?? '')} และผูกกับเรื่อง`} detail="เป็นส่วนหลักที่แยกออกจากการสร้างผู้แต่งไม่ได้" onChange={() => {}} />}
      {kind === 'manga_tags' && (all.tag_names ?? []).map(name => <Item key={name.toLowerCase()} checked={selection.tag_names?.includes(name) ?? false} title={name} detail="เพิ่มแท็กนี้ โดยเก็บแท็กเดิม" onChange={checked => onChange({ ...selection, tag_names: toggle(selection.tag_names, name, checked) })} />)}
      {kind === 'manga_metadata' && (all.fields ?? []).map(field => <Item key={field} checked={selection.fields?.includes(field) ?? false} title={fieldLabels[field] ?? field} detail={String(proposal[field] ?? '')} onChange={checked => onChange({ ...selection, fields: toggle(selection.fields, field, checked) as ApprovalSelection['fields'] })} />)}
      {kind === 'author_links' && Object.hasOwn(proposal, 'profile_url') && <Item checked={selection.fields?.includes('profile_url') ?? false} title="ลิงก์หลัก" detail={String(proposal.profile_url ?? '')} onChange={checked => onChange({ ...selection, fields: toggle(selection.fields, 'profile_url', checked) as ApprovalSelection['fields'] })} />}
      {(kind === 'author_links' || kind === 'manga_author') && links.map(link => <Item key={link.url} checked={selection.social_link_urls?.includes(link.url) ?? false} title={<SocialLinkLabel link={link} />} detail={kind === 'manga_author' ? 'เพิ่มให้ผู้แต่งใหม่' : 'เพิ่มหรือแก้ไขช่องทางนี้'} onChange={checked => onChange({ ...selection, social_link_urls: toggle(selection.social_link_urls, link.url, checked) })} />)}
    </FormGroup>
    {!valid && <Alert severity="warning" sx={{ mt: 1.5 }}>เลือกอย่างน้อย 1 รายการเพื่ออนุมัติ</Alert>}
  </Box>;
}
