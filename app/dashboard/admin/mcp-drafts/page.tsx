import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { draftFilters, readAdminDrafts } from '@/lib/mcp/admin-read';
import { isAdminRole } from '@/lib/session-utils';
import { publicReference } from '@/lib/mcp/drafts';
import styles from './page.module.css';
import RefreshButton from './RefreshButton';
import DecisionPanel from './DecisionPanel';
import NewAuthorSummary from './NewAuthorSummary';
import AuthorLinkSummary from './AuthorLinkSummary';
import TagSummary from './TagSummary';
import CategorySummary from './CategorySummary';

export const dynamic = 'force-dynamic';
const base = '/dashboard/admin/mcp-drafts';
const statuses: Record<string, string> = { pending: 'รอพิจารณา', applied: 'นำไปใช้แล้ว', rejected: 'ปฏิเสธแล้ว', approved: 'อนุมัติแล้ว', all: 'ทั้งหมด' };
const kinds: Record<string, string> = { manga_author: 'สร้างผู้แต่งและผูกกับเรื่อง', author_links: 'ลิงก์ผู้แต่ง', manga_tags: 'เพิ่มแท็กมังงะ', manga_metadata: 'ข้อมูลมังงะ' };
const fields: Record<string, string> = { profile_url: 'ลิงก์หลัก', social_links: 'ลิงก์โซเชียลที่เพิ่ม', title: 'ชื่อเรื่อง', author_id: 'ผู้แต่ง', category_id: 'หมวดหมู่', category_name: 'หมวดหมู่', tag_names: 'แท็กที่เพิ่ม' };
const date = (v: Date) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(v);
function Value({ value, names = {} }: { value: unknown; names?: Record<string, string> }) {
  if (value === null || value === undefined || value === '') return <span className={styles.muted}>ยังไม่มีค่า</span>;
  if (Array.isArray(value)) return value.length ? <ul className={styles.values}>{value.map((v, i) => <li key={i}><Value value={v} names={names} /></li>)}</ul> : <span className={styles.muted}>ไม่มีรายการ</span>;
  if (typeof value === 'string') {
    try { const url = publicReference(value); return <a href={url} target="_blank" rel="noopener noreferrer">{value} ↗</a>; } catch { /* Plain text for unsafe or non-URL values. */ }
    return <span>{names[value] ? `${names[value]} (${value})` : value}</span>;
  }
  return <span>{JSON.stringify(value)}</span>;
}
export default async function McpDraftsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session?.user.id || !isAdminRole(session) || session.user.banned || ('isBanned' in session.user && session.user.isBanned)) redirect(`/auth/signin?callbackUrl=${base}`);
  const filter = draftFilters(await searchParams);
  const result = await readAdminDrafts(db, session.user.id, filter).then(data => ({ data, failed: false as const })).catch(() => ({ data: null, failed: true as const }));
  const data = result.data;
  const d = data?.selected;
  const originalProposal = d?.payload && typeof d.payload === 'object' && !Array.isArray(d.payload) ? d.payload as Record<string, unknown> : {};
  const appliedProposal = d?.decisionPayload && typeof d.decisionPayload === 'object' && !Array.isArray(d.decisionPayload) ? d.decisionPayload as Record<string, unknown> : null;
  const shownProposal = d?.status === 'applied' && appliedProposal ? appliedProposal : originalProposal;
  const partiallyApplied = d?.status === 'applied' && appliedProposal !== null && JSON.stringify(appliedProposal) !== JSON.stringify(originalProposal);
  const href = (extra: Record<string, string>) => `${base}?${new URLSearchParams({ status: filter.status, page: String(filter.page), ...extra })}`;
  return <div className={styles.root}>
    <header className={styles.header}><div><h1>ข้อเสนอแก้ไขข้อมูล</h1></div><RefreshButton className={styles.button} /></header>
    <nav aria-label="กรองสถานะข้อเสนอ" className={styles.tabs}>{Object.entries(statuses).map(([key, label]) => <Link prefetch={false} key={key} href={`${base}?status=${key}`} aria-current={filter.status === key ? 'page' : undefined}>{label}</Link>)}</nav>
    {result.failed ? <section className={styles.empty} role="alert"><h2>โหลดข้อเสนอไม่ได้</h2><p>ตรวจสิทธิ์ผู้ดูแลและการเชื่อมต่อฐานข้อมูล แล้วลองโหลดอีกครั้ง</p></section> : <div className={styles.workspace}>
      <aside className={styles.list} aria-label="รายการข้อเสนอ"><h2>รายการข้อเสนอ <small>หน้า {filter.page}</small></h2>
        {!data?.rows.length && <p className={styles.empty}>ยังไม่มีข้อเสนอในสถานะนี้ ลองเลือก “ทั้งหมด” หรือสร้างข้อเสนอผ่าน Codex</p>}
        {data?.rows.map(row => <Link prefetch={false} className={styles.item} aria-current={d?.id === row.id ? 'true' : undefined} href={href({ draft: row.id })} key={row.id}><span className={styles.badge} data-status={row.status}>{statuses[row.status] ?? row.status}</span><strong>{row.targetName ?? 'ไม่พบข้อมูลเป้าหมาย'}</strong><span>{kinds[row.kind] ?? row.kind}</span><time>{date(row.createdAt)}</time></Link>)}
        <nav className={styles.pagination} aria-label="หน้ารายการ">{filter.page > 1 && <Link prefetch={false} href={href({ page: String(filter.page - 1) })}>← ก่อนหน้า</Link>}{data?.hasNext && <Link prefetch={false} href={href({ page: String(filter.page + 1) })}>ถัดไป →</Link>}</nav>
      </aside>
      <section className={styles.detail} aria-label="รายละเอียดข้อเสนอ">
        {!d ? <div className={styles.empty}><h2>{filter.id ? 'ไม่พบข้อเสนอที่ระบุ' : 'เลือกข้อเสนอเพื่อตรวจสอบ'}</h2><p>รายการจะแสดงข้อมูลจากฐานข้อมูลที่เว็บนี้เชื่อมต่ออยู่</p></div> : <>
          <div className={styles.detailTitle}><div><p className={styles.eyebrow}>{kinds[d.kind] ?? d.kind}</p><h2>{data?.targetName ?? 'ไม่พบข้อมูลเป้าหมาย'}</h2></div><span className={styles.badge} data-status={d.status}>{statuses[d.status] ?? d.status}</span></div>
          <h3>{d.status === 'pending' ? 'ผลหลังอนุมัติ' : d.status === 'applied' ? 'ข้อมูลที่นำไปใช้จริง' : 'ข้อเสนอที่พิจารณาแล้ว'}</h3>{d.status !== 'pending' && <p className={styles.muted}>{partiallyApplied ? 'อนุมัติบางส่วน รายการที่ไม่ได้เลือกไม่ได้ถูกบันทึก · ' : ''}เทียบกับข้อมูลปัจจุบัน</p>}
          {!data?.current && <p role="status">ไม่พบข้อมูลเป้าหมาย จึงเปรียบเทียบค่าปัจจุบันไม่ได้</p>}
          {d.kind === 'manga_author' ? <NewAuthorSummary proposal={shownProposal} hasAuthor={!!data?.current?.author_id} /> : d.kind === 'author_links' && data?.current ? <AuthorLinkSummary current={data.current} proposal={shownProposal} /> : d.kind === 'manga_tags' && data?.current ? <TagSummary current={data.current} proposal={shownProposal} /> : d.kind === 'manga_metadata' && data?.current && 'category_name' in shownProposal ? <CategorySummary current={data.current} proposal={shownProposal} /> : <div className={styles.comparison}><div className={styles.columnLabels}><span>รายการ / ค่าปัจจุบัน</span><span>{d.status === 'applied' ? 'ค่าที่นำไปใช้' : 'ค่าที่เสนอ'}</span></div>
            {Object.entries(shownProposal).filter(([key]) => key in fields).map(([key, value]) => <div className={styles.compareRow} key={key}><div><strong>{fields[key]}</strong><small>ปัจจุบัน</small><Value value={data?.current?.[key]} names={data?.referenceNames} /></div><div><small>{d.status === 'applied' ? 'นำไปใช้แล้ว' : 'ข้อเสนอ'}</small><Value value={value} names={data?.referenceNames} /></div></div>)}
          </div>}
          <details className={styles.existing}><summary>แหล่งอ้างอิง · ยังไม่ยืนยัน</summary>
          <ul className={styles.sources}>{Array.isArray(d.sources) && d.sources.map((source, i) => { const s = source && typeof source === 'object' ? source as Record<string, unknown> : {}; return <li key={i}><Value value={s.url} /><span className={styles.muted}>ยังไม่ยืนยันโดยระบบ · ความมั่นใจ {typeof s.confidence === 'number' ? `${Math.round(s.confidence * 100)}%` : 'ไม่ระบุ'}</span></li>; })}</ul>
          {Array.isArray(d.sources) && !d.sources.length && <p className={styles.muted}>ไม่ได้แนบแหล่งอ้างอิง</p>}
          </details>
          {data?.current && <DecisionPanel key={d.id} draftId={d.id} status={d.status} targetName={data.targetName ?? d.targetId} />}
          <details className={styles.existing}><summary>ประวัติและรายละเอียด</summary><p className={styles.id}>Draft <code>{d.id}</code></p><ol className={styles.history}><li><strong>สร้างข้อเสนอ</strong><span>{date(d.createdAt)} · {d.proposer ?? 'ผู้ดูแล'} / {d.client}</span></li><li><strong>สถานะล่าสุด: {statuses[d.status] ?? d.status}</strong><span>{date(d.updatedAt)}{data?.reviewer ? ` · ผู้พิจารณา ${data.reviewer}` : ''}</span></li></ol>
          {d.reviewNote && <p>หมายเหตุ: {d.reviewNote}</p>}</details>
        </>}
      </section>
    </div>}
  </div>;
}
